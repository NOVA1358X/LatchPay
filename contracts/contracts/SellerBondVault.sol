// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title SellerBondVault
 * @author LatchPay
 * @notice Vault for seller bonds with rule-based slashing
 * @dev Sellers deposit bonds to meet endpoint requirements; slashing only via defined rules
 */
contract SellerBondVault is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ Structs ============

    struct Bond {
        uint256 amount;
        uint256 lockedUntil;
        uint256 activePayments;
        uint256 totalSlashed;
    }

    struct SlashRecord {
        bytes32 paymentId;
        uint256 amount;
        uint256 timestamp;
        string reason;
    }

    // ============ State Variables ============

    /// @notice USDC token contract
    IERC20 public immutable usdc;

    /// @notice Mapping from seller to their bond
    mapping(address => Bond) public bonds;

    /// @notice Mapping from seller to slash records
    mapping(address => SlashRecord[]) public slashRecords;

    /// @notice Escrow vault address (can call slash)
    address public escrowVault;

    /// @notice Minimum lock period after deposit (7 days)
    uint256 public constant MIN_LOCK_PERIOD = 7 days;

    /// @notice Maximum slash percentage (50%)
    uint256 public constant MAX_SLASH_BPS = 5000;

    /// @notice Basis points denominator
    uint256 public constant BPS_DENOMINATOR = 10000;

    // ============ Events ============

    event BondDeposited(address indexed seller, uint256 amount, uint256 newTotal);
    event BondWithdrawn(address indexed seller, uint256 amount, uint256 remaining);
    event BondSlashed(
        address indexed seller,
        bytes32 indexed paymentId,
        uint256 amount,
        string reason
    );
    event EscrowVaultUpdated(address indexed newEscrowVault);
    event ActivePaymentIncremented(address indexed seller, uint256 count);
    event ActivePaymentDecremented(address indexed seller, uint256 count);

    // ============ Errors ============

    error ZeroAddress();
    error ZeroAmount();
    error InsufficientBond();
    error BondLocked();
    error ActivePaymentsExist();
    error NotAuthorized();
    error SlashExceedsMax();
    error SlashExceedsBond();

    // ============ Constructor ============

    constructor(address _usdc) Ownable(msg.sender) {
        if (_usdc == address(0)) revert ZeroAddress();
        usdc = IERC20(_usdc);
    }

    // ============ External Functions ============

    /**
     * @notice Deposit bond amount
     * @param amount Amount to deposit
     */
    function deposit(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();

        Bond storage bond = bonds[msg.sender];
        bond.amount += amount;
        bond.lockedUntil = block.timestamp + MIN_LOCK_PERIOD;

        usdc.safeTransferFrom(msg.sender, address(this), amount);

        emit BondDeposited(msg.sender, amount, bond.amount);
    }

    /**
     * @notice Withdraw bond amount
     * @param amount Amount to withdraw
     */
    function withdraw(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();

        Bond storage bond = bonds[msg.sender];
        if (bond.amount < amount) revert InsufficientBond();
        if (block.timestamp < bond.lockedUntil) revert BondLocked();
        if (bond.activePayments > 0) revert ActivePaymentsExist();

        bond.amount -= amount;

        usdc.safeTransfer(msg.sender, amount);

        emit BondWithdrawn(msg.sender, amount, bond.amount);
    }

    /**
     * @notice Slash seller's bond (only escrow vault or owner)
     * @param seller Seller to slash
     * @param paymentId Related payment ID
     * @param slashBps Slash amount in basis points
     * @param reason Reason for slashing
     */
    function slash(
        address seller,
        bytes32 paymentId,
        uint256 slashBps,
        string calldata reason
    ) external nonReentrant {
        if (msg.sender != escrowVault && msg.sender != owner()) revert NotAuthorized();
        if (slashBps > MAX_SLASH_BPS) revert SlashExceedsMax();

        Bond storage bond = bonds[seller];
        uint256 slashAmount = (bond.amount * slashBps) / BPS_DENOMINATOR;
        
        if (slashAmount > bond.amount) revert SlashExceedsBond();

        bond.amount -= slashAmount;
        bond.totalSlashed += slashAmount;

        slashRecords[seller].push(SlashRecord({
            paymentId: paymentId,
            amount: slashAmount,
            timestamp: block.timestamp,
            reason: reason
        }));

        // Send slashed funds to owner (could be a treasury or burn)
        usdc.safeTransfer(owner(), slashAmount);

        emit BondSlashed(seller, paymentId, slashAmount, reason);
    }

    /**
     * @notice Increment active payments for a seller
     * @param seller Seller address
     */
    function incrementActivePayments(address seller) external {
        if (msg.sender != escrowVault) revert NotAuthorized();
        bonds[seller].activePayments++;
        emit ActivePaymentIncremented(seller, bonds[seller].activePayments);
    }

    /**
     * @notice Decrement active payments for a seller
     * @param seller Seller address
     */
    function decrementActivePayments(address seller) external {
        if (msg.sender != escrowVault) revert NotAuthorized();
        if (bonds[seller].activePayments > 0) {
            bonds[seller].activePayments--;
        }
        emit ActivePaymentDecremented(seller, bonds[seller].activePayments);
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
     * @notice Get seller's bond details
     * @param seller Seller address
     * @return Bond struct
     */
    function getBond(address seller) external view returns (Bond memory) {
        return bonds[seller];
    }

    /**
     * @notice Get seller's slash records
     * @param seller Seller address
     * @return Array of SlashRecords
     */
    function getSlashRecords(address seller) external view returns (SlashRecord[] memory) {
        return slashRecords[seller];
    }

    /**
     * @notice Check if seller has sufficient bond
     * @param seller Seller address
     * @param requiredAmount Required bond amount
     * @return True if bond is sufficient
     */
    function hasSufficientBond(address seller, uint256 requiredAmount) external view returns (bool) {
        return bonds[seller].amount >= requiredAmount;
    }

    /**
     * @notice Get seller's available (unlocked) bond
     * @param seller Seller address
     * @return Available amount
     */
    function getAvailableBond(address seller) external view returns (uint256) {
        Bond storage bond = bonds[seller];
        if (block.timestamp < bond.lockedUntil || bond.activePayments > 0) {
            return 0;
        }
        return bond.amount;
    }
}
