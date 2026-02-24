// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./EscrowVault.sol";

/**
 * @title PaymentRouter
 * @author LatchPay
 * @notice Advanced payment routing: batch payments, revenue splits, and convenience wrappers
 * @dev Enables batch openPayment calls and configurable seller revenue splits
 */
contract PaymentRouter is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ Structs ============

    struct RevenueSplit {
        address[] recipients;
        uint256[] sharesBps; // Must sum to 10000
        bool active;
    }

    struct BatchPaymentResult {
        bytes32 paymentId;
        bool success;
    }

    // ============ State Variables ============

    /// @notice USDC token contract
    IERC20 public immutable usdc;

    /// @notice EscrowVault contract
    EscrowVault public immutable escrowVault;

    /// @notice Mapping from seller to their revenue split config
    mapping(address => RevenueSplit) public revenueSplits;

    /// @notice Accumulated split balances (recipient => amount)
    mapping(address => uint256) public splitBalances;

    /// @notice Basis points denominator
    uint256 public constant BPS_DENOMINATOR = 10000;

    /// @notice Max recipients in a split
    uint256 public constant MAX_SPLIT_RECIPIENTS = 5;

    /// @notice Max batch size
    uint256 public constant MAX_BATCH_SIZE = 10;

    // ============ Events ============

    event BatchPaymentExecuted(
        address indexed buyer,
        uint256 totalPayments,
        uint256 successCount,
        uint256 totalAmount
    );

    event RevenueSplitConfigured(
        address indexed seller,
        address[] recipients,
        uint256[] sharesBps
    );

    event RevenueSplitRemoved(address indexed seller);

    event SplitExecuted(
        address indexed seller,
        uint256 totalAmount,
        uint256 recipientCount
    );

    event SplitWithdrawn(
        address indexed recipient,
        uint256 amount
    );

    event RouteAndPayExecuted(
        bytes32 indexed paymentId,
        address indexed buyer,
        bytes32 indexed endpointId,
        uint256 amount
    );

    // ============ Errors ============

    error ZeroAddress();
    error InvalidSplitConfig();
    error SharesMustSum10000();
    error TooManyRecipients();
    error BatchTooLarge();
    error EmptyBatch();
    error NoSplitConfigured();
    error NothingToWithdraw();
    error InsufficientBalance();

    // ============ Constructor ============

    constructor(address _usdc, address _escrowVault) Ownable(msg.sender) {
        if (_usdc == address(0)) revert ZeroAddress();
        if (_escrowVault == address(0)) revert ZeroAddress();
        usdc = IERC20(_usdc);
        escrowVault = EscrowVault(_escrowVault);
    }

    // ============ External Functions ============

    /**
     * @notice Execute multiple payments in a single transaction
     * @param endpointIds Array of endpoint IDs to pay
     * @param maxPrices Array of max prices (in USDC base units)
     * @param buyerNoteHashes Array of buyer note hashes
     * @return results Array of payment results
     */
    function batchOpenPayments(
        bytes32[] calldata endpointIds,
        uint256[] calldata maxPrices,
        bytes32[] calldata buyerNoteHashes
    ) external nonReentrant returns (BatchPaymentResult[] memory results) {
        uint256 len = endpointIds.length;
        if (len == 0) revert EmptyBatch();
        if (len > MAX_BATCH_SIZE) revert BatchTooLarge();
        if (len != maxPrices.length || len != buyerNoteHashes.length) revert InvalidSplitConfig();

        results = new BatchPaymentResult[](len);

        // Calculate total amount needed
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < len; i++) {
            totalAmount += maxPrices[i];
        }

        // Transfer total USDC from buyer to this contract
        usdc.safeTransferFrom(msg.sender, address(this), totalAmount);

        // Approve escrow vault
        usdc.approve(address(escrowVault), totalAmount);

        uint256 successCount = 0;
        uint256 usedAmount = 0;

        for (uint256 i = 0; i < len; i++) {
            try escrowVault.openPayment(endpointIds[i], maxPrices[i], buyerNoteHashes[i]) returns (bytes32 paymentId) {
                results[i] = BatchPaymentResult({
                    paymentId: paymentId,
                    success: true
                });
                successCount++;
                usedAmount += maxPrices[i];
            } catch {
                results[i] = BatchPaymentResult({
                    paymentId: bytes32(0),
                    success: false
                });
            }
        }

        // Refund unused USDC
        if (usedAmount < totalAmount) {
            usdc.safeTransfer(msg.sender, totalAmount - usedAmount);
        }

        emit BatchPaymentExecuted(msg.sender, len, successCount, usedAmount);
    }

    /**
     * @notice Configure revenue split for a seller
     * @param recipients Array of recipient addresses
     * @param sharesBps Array of share percentages in basis points (must sum to 10000)
     */
    function setRevenueSplit(
        address[] calldata recipients,
        uint256[] calldata sharesBps
    ) external {
        if (recipients.length == 0) revert InvalidSplitConfig();
        if (recipients.length > MAX_SPLIT_RECIPIENTS) revert TooManyRecipients();
        if (recipients.length != sharesBps.length) revert InvalidSplitConfig();

        // Validate shares sum to 10000
        uint256 totalShares = 0;
        for (uint256 i = 0; i < sharesBps.length; i++) {
            if (recipients[i] == address(0)) revert ZeroAddress();
            totalShares += sharesBps[i];
        }
        if (totalShares != BPS_DENOMINATOR) revert SharesMustSum10000();

        revenueSplits[msg.sender] = RevenueSplit({
            recipients: recipients,
            sharesBps: sharesBps,
            active: true
        });

        emit RevenueSplitConfigured(msg.sender, recipients, sharesBps);
    }

    /**
     * @notice Remove revenue split configuration
     */
    function removeRevenueSplit() external {
        delete revenueSplits[msg.sender];
        emit RevenueSplitRemoved(msg.sender);
    }

    /**
     * @notice Execute a revenue split on received funds
     * @param seller The seller whose split config to apply
     * @param amount The amount to split (in USDC base units)
     * @dev Seller must send USDC to this contract first, then call executeSplit
     */
    function executeSplit(address seller, uint256 amount) external nonReentrant {
        RevenueSplit storage split = revenueSplits[seller];
        if (!split.active) revert NoSplitConfigured();

        // Transfer USDC from caller
        usdc.safeTransferFrom(msg.sender, address(this), amount);

        // Distribute to split recipients
        for (uint256 i = 0; i < split.recipients.length; i++) {
            uint256 share = (amount * split.sharesBps[i]) / BPS_DENOMINATOR;
            splitBalances[split.recipients[i]] += share;
        }

        emit SplitExecuted(seller, amount, split.recipients.length);
    }

    /**
     * @notice Withdraw accumulated split balance
     */
    function withdrawSplitBalance() external nonReentrant {
        uint256 balance = splitBalances[msg.sender];
        if (balance == 0) revert NothingToWithdraw();

        splitBalances[msg.sender] = 0;
        usdc.safeTransfer(msg.sender, balance);

        emit SplitWithdrawn(msg.sender, balance);
    }

    /**
     * @notice Convenience: open a single payment and route through this contract
     * @param endpointId Endpoint to pay
     * @param maxPrice Maximum price
     * @param buyerNoteHash Hash of buyer's request note
     * @return paymentId The payment identifier
     */
    function routeAndPay(
        bytes32 endpointId,
        uint256 maxPrice,
        bytes32 buyerNoteHash
    ) external nonReentrant returns (bytes32 paymentId) {
        // Transfer USDC from buyer
        usdc.safeTransferFrom(msg.sender, address(this), maxPrice);
        usdc.approve(address(escrowVault), maxPrice);

        paymentId = escrowVault.openPayment(endpointId, maxPrice, buyerNoteHash);

        emit RouteAndPayExecuted(paymentId, msg.sender, endpointId, maxPrice);
    }

    // ============ View Functions ============

    /**
     * @notice Get revenue split configuration for a seller
     * @param seller Seller address
     * @return recipients Array of recipient addresses
     * @return sharesBps Array of shares in basis points
     * @return active Whether split is active
     */
    function getRevenueSplit(address seller) external view returns (
        address[] memory recipients,
        uint256[] memory sharesBps,
        bool active
    ) {
        RevenueSplit storage split = revenueSplits[seller];
        return (split.recipients, split.sharesBps, split.active);
    }

    /**
     * @notice Get pending split balance for an address
     * @param recipient Recipient address
     * @return balance Pending USDC balance
     */
    function getSplitBalance(address recipient) external view returns (uint256) {
        return splitBalances[recipient];
    }
}
