// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ReceiptStore
 * @author LatchPay
 * @notice Immutable store for delivery receipt commitments
 * @dev Simplifies indexing and public verification of delivery proofs
 */
contract ReceiptStore is Ownable {
    // ============ Structs ============

    struct Receipt {
        bytes32 paymentId;
        bytes32 endpointId;
        address buyer;
        address seller;
        bytes32 deliveryHash;
        bytes32 responseMetaHash;
        uint256 timestamp;
        uint256 amount;
    }

    // ============ State Variables ============

    /// @notice Mapping from paymentId to Receipt
    mapping(bytes32 => Receipt) public receipts;

    /// @notice Array of all receipt payment IDs
    bytes32[] public receiptIds;

    /// @notice Authorized escrow vault address
    address public escrowVault;

    // ============ Events ============

    event ReceiptStored(
        bytes32 indexed paymentId,
        bytes32 indexed endpointId,
        address indexed buyer,
        address seller,
        bytes32 deliveryHash,
        bytes32 responseMetaHash,
        uint256 amount
    );

    event EscrowVaultUpdated(address indexed newEscrowVault);

    // ============ Errors ============

    error NotAuthorized();
    error ReceiptAlreadyExists();
    error ReceiptNotFound();
    error ZeroAddress();

    // ============ Constructor ============

    constructor() Ownable(msg.sender) {}

    // ============ External Functions ============

    /**
     * @notice Store a new receipt (only escrow vault)
     * @param paymentId Payment identifier
     * @param endpointId Endpoint identifier
     * @param buyer Buyer address
     * @param seller Seller address
     * @param deliveryHash Hash of delivered content
     * @param responseMetaHash Hash of response metadata
     * @param amount Payment amount
     */
    function storeReceipt(
        bytes32 paymentId,
        bytes32 endpointId,
        address buyer,
        address seller,
        bytes32 deliveryHash,
        bytes32 responseMetaHash,
        uint256 amount
    ) external {
        if (msg.sender != escrowVault && msg.sender != owner()) revert NotAuthorized();
        if (receipts[paymentId].timestamp != 0) revert ReceiptAlreadyExists();

        receipts[paymentId] = Receipt({
            paymentId: paymentId,
            endpointId: endpointId,
            buyer: buyer,
            seller: seller,
            deliveryHash: deliveryHash,
            responseMetaHash: responseMetaHash,
            timestamp: block.timestamp,
            amount: amount
        });

        receiptIds.push(paymentId);

        emit ReceiptStored(
            paymentId,
            endpointId,
            buyer,
            seller,
            deliveryHash,
            responseMetaHash,
            amount
        );
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
     * @notice Get receipt by payment ID
     * @param paymentId Payment identifier
     * @return Receipt struct
     */
    function getReceipt(bytes32 paymentId) external view returns (Receipt memory) {
        if (receipts[paymentId].timestamp == 0) revert ReceiptNotFound();
        return receipts[paymentId];
    }

    /**
     * @notice Check if receipt exists
     * @param paymentId Payment identifier
     * @return True if receipt exists
     */
    function receiptExists(bytes32 paymentId) external view returns (bool) {
        return receipts[paymentId].timestamp != 0;
    }

    /**
     * @notice Get all receipt IDs
     * @return Array of payment IDs
     */
    function getAllReceiptIds() external view returns (bytes32[] memory) {
        return receiptIds;
    }

    /**
     * @notice Get total receipt count
     * @return Number of receipts
     */
    function getReceiptCount() external view returns (uint256) {
        return receiptIds.length;
    }

    /**
     * @notice Verify a receipt's delivery hash
     * @param paymentId Payment identifier
     * @param deliveryHash Expected delivery hash
     * @return True if hashes match
     */
    function verifyDeliveryHash(bytes32 paymentId, bytes32 deliveryHash) external view returns (bool) {
        return receipts[paymentId].deliveryHash == deliveryHash;
    }
}
