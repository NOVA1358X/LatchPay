// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ReputationEngine
 * @author LatchPay
 * @notice On-chain reputation scoring for sellers and buyers
 * @dev Tracks delivery success, disputes, refunds and computes composite scores
 *      Score formula: (successRate * 7000) + (lowDisputeRate * 2000) + (volumeBonus * 1000) in BPS
 */
contract ReputationEngine is Ownable {
    // ============ Structs ============

    struct SellerScore {
        uint256 totalDeliveries;
        uint256 successfulDeliveries;
        uint256 totalDisputes;
        uint256 disputesLost;
        uint256 totalRefunds;
        uint256 totalVolumeUSD6; // Total volume in USDC (6 decimals)
        uint256 lastActivityAt;
        uint256 registeredAt;
    }

    struct BuyerScore {
        uint256 totalPayments;
        uint256 totalDisputes;
        uint256 disputesWon;
        uint256 totalSpentUSD6; // Total spent in USDC (6 decimals)
        uint256 lastActivityAt;
        uint256 registeredAt;
    }

    // ============ State Variables ============

    /// @notice Mapping from seller address to their score
    mapping(address => SellerScore) public sellerScores;

    /// @notice Mapping from buyer address to their score
    mapping(address => BuyerScore) public buyerScores;

    /// @notice Authorized EscrowVault address
    address public escrowVault;

    /// @notice Basis points denominator
    uint256 public constant BPS_DENOMINATOR = 10000;

    /// @notice Max volume for bonus calculation (1000 USDC)
    uint256 public constant MAX_VOLUME_FOR_BONUS = 1000 * 1e6;

    /// @notice Top sellers leaderboard (up to 50)
    address[] public topSellers;
    uint256 public constant MAX_LEADERBOARD = 50;

    // ============ Events ============

    event DeliveryRecorded(
        bytes32 indexed paymentId,
        address indexed seller,
        address indexed buyer
    );

    event DisputeRecorded(
        bytes32 indexed paymentId,
        address indexed seller,
        address indexed buyer,
        bool buyerWon
    );

    event RefundRecorded(
        bytes32 indexed paymentId,
        address indexed seller,
        address indexed buyer
    );

    event EscrowVaultUpdated(address indexed newEscrowVault);
    event LeaderboardUpdated(uint256 totalSellers);

    // ============ Errors ============

    error NotAuthorized();
    error ZeroAddress();

    // ============ Constructor ============

    constructor() Ownable(msg.sender) {}

    // ============ Modifiers ============

    modifier onlyEscrowOrOwner() {
        if (msg.sender != escrowVault && msg.sender != owner()) revert NotAuthorized();
        _;
    }

    // ============ External Functions ============

    /**
     * @notice Record a successful delivery
     * @param paymentId Payment identifier
     * @param seller Seller address
     * @param buyer Buyer address
     */
    function recordDelivery(
        bytes32 paymentId,
        address seller,
        address buyer
    ) external onlyEscrowOrOwner {
        SellerScore storage ss = sellerScores[seller];
        ss.totalDeliveries++;
        ss.successfulDeliveries++;
        ss.lastActivityAt = block.timestamp;
        if (ss.registeredAt == 0) ss.registeredAt = block.timestamp;

        BuyerScore storage bs = buyerScores[buyer];
        bs.totalPayments++;
        bs.lastActivityAt = block.timestamp;
        if (bs.registeredAt == 0) bs.registeredAt = block.timestamp;

        _updateLeaderboard(seller);

        emit DeliveryRecorded(paymentId, seller, buyer);
    }

    /**
     * @notice Record a dispute outcome
     * @param paymentId Payment identifier
     * @param seller Seller address
     * @param buyer Buyer address
     * @param buyerWon Whether the buyer won the dispute
     */
    function recordDispute(
        bytes32 paymentId,
        address seller,
        address buyer,
        bool buyerWon
    ) external onlyEscrowOrOwner {
        SellerScore storage ss = sellerScores[seller];
        ss.totalDisputes++;
        if (buyerWon) {
            ss.disputesLost++;
        }
        ss.lastActivityAt = block.timestamp;
        if (ss.registeredAt == 0) ss.registeredAt = block.timestamp;

        BuyerScore storage bs = buyerScores[buyer];
        bs.totalDisputes++;
        if (buyerWon) {
            bs.disputesWon++;
        }
        bs.lastActivityAt = block.timestamp;
        if (bs.registeredAt == 0) bs.registeredAt = block.timestamp;

        _updateLeaderboard(seller);

        emit DisputeRecorded(paymentId, seller, buyer, buyerWon);
    }

    /**
     * @notice Record a refund (delivery timeout)
     * @param paymentId Payment identifier
     * @param seller Seller address
     * @param buyer Buyer address
     */
    function recordRefund(
        bytes32 paymentId,
        address seller,
        address buyer
    ) external onlyEscrowOrOwner {
        SellerScore storage ss = sellerScores[seller];
        ss.totalRefunds++;
        ss.totalDeliveries++; // Count as attempted delivery
        ss.lastActivityAt = block.timestamp;
        if (ss.registeredAt == 0) ss.registeredAt = block.timestamp;

        BuyerScore storage bs = buyerScores[buyer];
        bs.totalPayments++;
        bs.lastActivityAt = block.timestamp;
        if (bs.registeredAt == 0) bs.registeredAt = block.timestamp;

        _updateLeaderboard(seller);

        emit RefundRecorded(paymentId, seller, buyer);
    }

    /**
     * @notice Set escrow vault address
     * @param _escrowVault Address of EscrowVault contract
     */
    function setEscrowVault(address _escrowVault) external onlyOwner {
        if (_escrowVault == address(0)) revert ZeroAddress();
        escrowVault = _escrowVault;
        emit EscrowVaultUpdated(_escrowVault);
    }

    // ============ View Functions ============

    /**
     * @notice Get seller's composite reputation score (0-10000 BPS)
     * @param seller Seller address
     * @return score Composite score in basis points
     * @dev Formula: (successRate * 7000) + (lowDisputeRate * 2000) + (volumeBonus * 1000)
     */
    function getSellerReputationScore(address seller) external view returns (uint256 score) {
        SellerScore storage ss = sellerScores[seller];
        
        if (ss.totalDeliveries == 0) return 0;

        // Success rate component (70% weight): successful deliveries / total deliveries
        uint256 successRate = (ss.successfulDeliveries * BPS_DENOMINATOR) / ss.totalDeliveries;
        uint256 successComponent = (successRate * 7000) / BPS_DENOMINATOR;

        // Low dispute rate component (20% weight): inverse of dispute rate
        uint256 disputeRate = ss.totalDeliveries > 0
            ? (ss.disputesLost * BPS_DENOMINATOR) / ss.totalDeliveries
            : 0;
        uint256 lowDisputeRate = disputeRate >= BPS_DENOMINATOR ? 0 : BPS_DENOMINATOR - disputeRate;
        uint256 disputeComponent = (lowDisputeRate * 2000) / BPS_DENOMINATOR;

        // Volume bonus component (10% weight): capped at MAX_VOLUME_FOR_BONUS
        uint256 volumeRatio = ss.totalVolumeUSD6 >= MAX_VOLUME_FOR_BONUS
            ? BPS_DENOMINATOR
            : (ss.totalVolumeUSD6 * BPS_DENOMINATOR) / MAX_VOLUME_FOR_BONUS;
        uint256 volumeComponent = (volumeRatio * 1000) / BPS_DENOMINATOR;

        score = successComponent + disputeComponent + volumeComponent;
    }

    /**
     * @notice Get buyer's reputation score (0-10000 BPS)
     * @param buyer Buyer address
     * @return score Composite score in basis points
     */
    function getBuyerReputationScore(address buyer) external view returns (uint256 score) {
        BuyerScore storage bs = buyerScores[buyer];

        if (bs.totalPayments == 0) return 0;

        // Fair buyer component (80%): low false dispute rate
        uint256 falseDisputeRate = bs.totalDisputes > 0
            ? ((bs.totalDisputes - bs.disputesWon) * BPS_DENOMINATOR) / bs.totalPayments
            : 0;
        uint256 fairBuyerRate = falseDisputeRate >= BPS_DENOMINATOR ? 0 : BPS_DENOMINATOR - falseDisputeRate;
        uint256 fairComponent = (fairBuyerRate * 8000) / BPS_DENOMINATOR;

        // Activity component (20%): based on total payments
        uint256 activityRatio = bs.totalPayments >= 100
            ? BPS_DENOMINATOR
            : (bs.totalPayments * BPS_DENOMINATOR) / 100;
        uint256 activityComponent = (activityRatio * 2000) / BPS_DENOMINATOR;

        score = fairComponent + activityComponent;
    }

    /**
     * @notice Get seller's full score data
     * @param seller Seller address
     * @return SellerScore struct
     */
    function getSellerScore(address seller) external view returns (SellerScore memory) {
        return sellerScores[seller];
    }

    /**
     * @notice Get buyer's full score data
     * @param buyer Buyer address
     * @return BuyerScore struct
     */
    function getBuyerScore(address buyer) external view returns (BuyerScore memory) {
        return buyerScores[buyer];
    }

    /**
     * @notice Get the top sellers leaderboard
     * @return Array of seller addresses sorted by score (best first)
     */
    function getTopSellers() external view returns (address[] memory) {
        return topSellers;
    }

    /**
     * @notice Get leaderboard length
     * @return Number of sellers in leaderboard
     */
    function getLeaderboardLength() external view returns (uint256) {
        return topSellers.length;
    }

    // ============ Internal Functions ============

    /**
     * @notice Update the top sellers leaderboard
     * @param seller Seller to potentially add/reorder
     */
    function _updateLeaderboard(address seller) internal {
        // Check if seller is already in the leaderboard
        bool found = false;
        uint256 sellerIndex = 0;
        for (uint256 i = 0; i < topSellers.length; i++) {
            if (topSellers[i] == seller) {
                found = true;
                sellerIndex = i;
                break;
            }
        }

        // If not found and leaderboard isn't full, add
        if (!found && topSellers.length < MAX_LEADERBOARD) {
            topSellers.push(seller);
            found = true;
            sellerIndex = topSellers.length - 1;
        }

        // If not found and leaderboard is full, check if new seller beats the worst
        if (!found) {
            uint256 worstScore = type(uint256).max;
            uint256 worstIndex = 0;
            for (uint256 i = 0; i < topSellers.length; i++) {
                uint256 s = this.getSellerReputationScore(topSellers[i]);
                if (s < worstScore) {
                    worstScore = s;
                    worstIndex = i;
                }
            }
            uint256 newScore = this.getSellerReputationScore(seller);
            if (newScore > worstScore) {
                topSellers[worstIndex] = seller;
            }
        }

        emit LeaderboardUpdated(topSellers.length);
    }
}
