// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

import "./EndpointRegistry.sol";

/**
 * @title EscrowVault
 * @author LatchPay
 * @notice Escrow contract for API micropayments with EIP-712 delivery proofs
 * @dev Handles payment escrow, delivery verification, disputes, and fund release
 */
contract EscrowVault is Ownable, ReentrancyGuard, EIP712 {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;

    // ============ Enums ============

    enum PaymentStatus {
        Pending,      // Payment opened, awaiting delivery
        Delivered,    // Delivery proof submitted
        Released,     // Funds released to seller
        Refunded,     // Funds refunded to buyer
        Disputed      // Under dispute
    }

    // ============ Structs ============

    struct Payment {
        bytes32 paymentId;
        bytes32 endpointId;
        address buyer;
        address seller;
        uint256 amount;
        uint256 openedAt;
        uint256 deliveredAt;
        uint256 disputeWindowEnds;
        PaymentStatus status;
        bytes32 buyerNoteHash;
        bytes32 deliveryHash;
        bytes32 responseMetaHash;
        bytes32 evidenceHash;
    }

    // ============ Constants ============

    /// @notice EIP-712 typehash for DeliveryCommitment
    bytes32 public constant DELIVERY_TYPEHASH = keccak256(
        "DeliveryCommitment(bytes32 paymentId,bytes32 deliveryHash,bytes32 responseMetaHash,uint256 timestamp)"
    );

    /// @notice Maximum protocol fee (5%)
    uint256 public constant MAX_PROTOCOL_FEE_BPS = 500;

    /// @notice Basis points denominator
    uint256 public constant BPS_DENOMINATOR = 10000;

    // ============ State Variables ============

    /// @notice USDC token contract
    IERC20 public immutable usdc;

    /// @notice Endpoint registry contract
    EndpointRegistry public immutable registry;

    /// @notice Protocol fee in basis points
    uint256 public protocolFeeBps;

    /// @notice Address receiving protocol fees
    address public feeRecipient;

    /// @notice Accumulated protocol fees
    uint256 public accumulatedFees;

    /// @notice Mapping from paymentId to Payment
    mapping(bytes32 => Payment) public payments;

    /// @notice Array of all payment IDs
    bytes32[] public paymentIds;

    /// @notice Buyer's payments
    mapping(address => bytes32[]) public buyerPayments;

    /// @notice Seller's payments
    mapping(address => bytes32[]) public sellerPayments;

    /// @notice Payment counter for unique IDs
    uint256 private _paymentCounter;

    /// @notice Delivery deadline (24 hours by default)
    uint256 public deliveryDeadline = 24 hours;

    // ============ Events ============

    event PaymentOpened(
        bytes32 indexed paymentId,
        bytes32 indexed endpointId,
        address indexed buyer,
        address seller,
        uint256 amount,
        uint256 disputeWindowEnds
    );

    event Delivered(
        bytes32 indexed paymentId,
        bytes32 deliveryHash,
        bytes32 responseMetaHash,
        uint256 timestamp
    );

    event Released(
        bytes32 indexed paymentId,
        address indexed seller,
        uint256 amount,
        uint256 fee
    );

    event Refunded(
        bytes32 indexed paymentId,
        address indexed buyer,
        uint256 amount
    );

    event Disputed(
        bytes32 indexed paymentId,
        address indexed buyer,
        bytes32 evidenceHash
    );

    event DisputeResolved(
        bytes32 indexed paymentId,
        bool buyerWins,
        uint256 amount
    );

    event FeesWithdrawn(address indexed recipient, uint256 amount);
    event ProtocolFeeUpdated(uint256 newFeeBps);
    event FeeRecipientUpdated(address indexed newRecipient);
    event DeliveryDeadlineUpdated(uint256 newDeadline);

    // ============ Errors ============

    error InvalidEndpoint();
    error EndpointNotActive();
    error InsufficientAllowance();
    error PaymentNotFound();
    error InvalidStatus();
    error NotBuyer();
    error NotSeller();
    error DisputeWindowActive();
    error DisputeWindowExpired();
    error InvalidSignature();
    error InvalidAmount();
    error FeeTooHigh();
    error ZeroAddress();
    error DeliveryDeadlinePassed();
    error DeliveryDeadlineNotPassed();

    // ============ Constructor ============

    constructor(
        address _usdc,
        address _registry,
        uint256 _protocolFeeBps,
        address _feeRecipient
    ) Ownable(msg.sender) EIP712("LatchPay", "1") {
        if (_usdc == address(0)) revert ZeroAddress();
        if (_registry == address(0)) revert ZeroAddress();
        if (_feeRecipient == address(0)) revert ZeroAddress();
        if (_protocolFeeBps > MAX_PROTOCOL_FEE_BPS) revert FeeTooHigh();

        usdc = IERC20(_usdc);
        registry = EndpointRegistry(_registry);
        protocolFeeBps = _protocolFeeBps;
        feeRecipient = _feeRecipient;
    }

    // ============ External Functions ============

    /**
     * @notice Open a new payment escrow
     * @param endpointId The endpoint being paid for
     * @param maxPrice Maximum price buyer is willing to pay
     * @param buyerNoteHash Hash of buyer's request note
     * @return paymentId Unique payment identifier
     */
    function openPayment(
        bytes32 endpointId,
        uint256 maxPrice,
        bytes32 buyerNoteHash
    ) external nonReentrant returns (bytes32 paymentId) {
        // Validate endpoint
        if (!registry.isValidEndpoint(endpointId)) revert InvalidEndpoint();
        
        EndpointRegistry.Endpoint memory endpoint = registry.getEndpoint(endpointId);
        if (!endpoint.active) revert EndpointNotActive();
        if (endpoint.pricePerCall > maxPrice) revert InvalidAmount();

        uint256 amount = endpoint.pricePerCall;

        // Check allowance
        if (usdc.allowance(msg.sender, address(this)) < amount) {
            revert InsufficientAllowance();
        }

        // Generate unique payment ID
        paymentId = keccak256(
            abi.encodePacked(
                msg.sender,
                endpointId,
                block.timestamp,
                _paymentCounter++
            )
        );

        // Calculate dispute window end
        uint256 disputeWindowEnds = block.timestamp + endpoint.disputeWindowSeconds + deliveryDeadline;

        // Store payment
        payments[paymentId] = Payment({
            paymentId: paymentId,
            endpointId: endpointId,
            buyer: msg.sender,
            seller: endpoint.seller,
            amount: amount,
            openedAt: block.timestamp,
            deliveredAt: 0,
            disputeWindowEnds: disputeWindowEnds,
            status: PaymentStatus.Pending,
            buyerNoteHash: buyerNoteHash,
            deliveryHash: bytes32(0),
            responseMetaHash: bytes32(0),
            evidenceHash: bytes32(0)
        });

        paymentIds.push(paymentId);
        buyerPayments[msg.sender].push(paymentId);
        sellerPayments[endpoint.seller].push(paymentId);

        // Transfer USDC to escrow
        usdc.safeTransferFrom(msg.sender, address(this), amount);

        emit PaymentOpened(
            paymentId,
            endpointId,
            msg.sender,
            endpoint.seller,
            amount,
            disputeWindowEnds
        );
    }

    /**
     * @notice Mark payment as delivered with seller's EIP-712 signature
     * @param paymentId The payment to mark as delivered
     * @param deliveryHash Hash of delivered content
     * @param responseMetaHash Hash of response metadata
     * @param sellerSig Seller's EIP-712 signature
     */
    function markDeliveredWithSellerSig(
        bytes32 paymentId,
        bytes32 deliveryHash,
        bytes32 responseMetaHash,
        bytes memory sellerSig
    ) external nonReentrant {
        Payment storage payment = payments[paymentId];
        if (payment.buyer == address(0)) revert PaymentNotFound();
        if (payment.status != PaymentStatus.Pending) revert InvalidStatus();
        if (block.timestamp > payment.openedAt + deliveryDeadline) {
            revert DeliveryDeadlinePassed();
        }

        // Verify seller signature
        bytes32 structHash = keccak256(
            abi.encode(
                DELIVERY_TYPEHASH,
                paymentId,
                deliveryHash,
                responseMetaHash,
                block.timestamp
            )
        );
        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = digest.recover(sellerSig);

        if (signer != payment.seller) revert InvalidSignature();

        // Update payment
        payment.status = PaymentStatus.Delivered;
        payment.deliveredAt = block.timestamp;
        payment.deliveryHash = deliveryHash;
        payment.responseMetaHash = responseMetaHash;

        // Update dispute window to start from delivery
        EndpointRegistry.Endpoint memory endpoint = registry.getEndpoint(payment.endpointId);
        payment.disputeWindowEnds = block.timestamp + endpoint.disputeWindowSeconds;

        // Increment endpoint call count
        registry.incrementCalls(payment.endpointId);

        emit Delivered(paymentId, deliveryHash, responseMetaHash, block.timestamp);
    }

    /**
     * @notice Dispute a payment (buyer only, within dispute window)
     * @param paymentId The payment to dispute
     * @param evidenceHash Hash of dispute evidence
     */
    function dispute(bytes32 paymentId, bytes32 evidenceHash) external nonReentrant {
        Payment storage payment = payments[paymentId];
        if (payment.buyer == address(0)) revert PaymentNotFound();
        if (msg.sender != payment.buyer) revert NotBuyer();
        if (payment.status != PaymentStatus.Delivered) revert InvalidStatus();
        if (block.timestamp > payment.disputeWindowEnds) revert DisputeWindowExpired();

        payment.status = PaymentStatus.Disputed;
        payment.evidenceHash = evidenceHash;

        emit Disputed(paymentId, msg.sender, evidenceHash);
    }

    /**
     * @notice Release funds to seller (after dispute window if not disputed)
     * @param paymentId The payment to release
     */
    function release(bytes32 paymentId) external nonReentrant {
        Payment storage payment = payments[paymentId];
        if (payment.buyer == address(0)) revert PaymentNotFound();
        if (payment.status != PaymentStatus.Delivered) revert InvalidStatus();
        if (block.timestamp < payment.disputeWindowEnds) revert DisputeWindowActive();

        // Calculate fee
        uint256 fee = (payment.amount * protocolFeeBps) / BPS_DENOMINATOR;
        uint256 sellerAmount = payment.amount - fee;

        payment.status = PaymentStatus.Released;
        accumulatedFees += fee;

        // Transfer to seller
        usdc.safeTransfer(payment.seller, sellerAmount);

        emit Released(paymentId, payment.seller, sellerAmount, fee);
    }

    /**
     * @notice Refund buyer if delivery deadline passed without delivery
     * @param paymentId The payment to refund
     */
    function refund(bytes32 paymentId) external nonReentrant {
        Payment storage payment = payments[paymentId];
        if (payment.buyer == address(0)) revert PaymentNotFound();
        if (payment.status != PaymentStatus.Pending) revert InvalidStatus();
        if (block.timestamp <= payment.openedAt + deliveryDeadline) {
            revert DeliveryDeadlineNotPassed();
        }

        payment.status = PaymentStatus.Refunded;

        // Transfer back to buyer
        usdc.safeTransfer(payment.buyer, payment.amount);

        emit Refunded(paymentId, payment.buyer, payment.amount);
    }

    /**
     * @notice Resolve a dispute (simplified: buyer wins = refund, otherwise release)
     * @dev In production, this would involve an arbitration mechanism
     * @param paymentId The disputed payment
     * @param buyerWins Whether the buyer wins the dispute
     */
    function resolveDispute(bytes32 paymentId, bool buyerWins) external onlyOwner nonReentrant {
        Payment storage payment = payments[paymentId];
        if (payment.buyer == address(0)) revert PaymentNotFound();
        if (payment.status != PaymentStatus.Disputed) revert InvalidStatus();

        if (buyerWins) {
            payment.status = PaymentStatus.Refunded;
            usdc.safeTransfer(payment.buyer, payment.amount);
            emit DisputeResolved(paymentId, true, payment.amount);
        } else {
            uint256 fee = (payment.amount * protocolFeeBps) / BPS_DENOMINATOR;
            uint256 sellerAmount = payment.amount - fee;
            
            payment.status = PaymentStatus.Released;
            accumulatedFees += fee;
            usdc.safeTransfer(payment.seller, sellerAmount);
            emit DisputeResolved(paymentId, false, sellerAmount);
        }
    }

    /**
     * @notice Withdraw accumulated protocol fees
     */
    function withdrawProtocolFees() external nonReentrant {
        uint256 amount = accumulatedFees;
        if (amount == 0) revert InvalidAmount();

        accumulatedFees = 0;
        usdc.safeTransfer(feeRecipient, amount);

        emit FeesWithdrawn(feeRecipient, amount);
    }

    // ============ Admin Functions ============

    /**
     * @notice Update protocol fee
     * @param newFeeBps New fee in basis points
     */
    function setProtocolFee(uint256 newFeeBps) external onlyOwner {
        if (newFeeBps > MAX_PROTOCOL_FEE_BPS) revert FeeTooHigh();
        protocolFeeBps = newFeeBps;
        emit ProtocolFeeUpdated(newFeeBps);
    }

    /**
     * @notice Update fee recipient
     * @param newRecipient New fee recipient address
     */
    function setFeeRecipient(address newRecipient) external onlyOwner {
        if (newRecipient == address(0)) revert ZeroAddress();
        feeRecipient = newRecipient;
        emit FeeRecipientUpdated(newRecipient);
    }

    /**
     * @notice Update delivery deadline
     * @param newDeadline New deadline in seconds
     */
    function setDeliveryDeadline(uint256 newDeadline) external onlyOwner {
        deliveryDeadline = newDeadline;
        emit DeliveryDeadlineUpdated(newDeadline);
    }

    // ============ View Functions ============

    /**
     * @notice Get payment details
     * @param paymentId The payment to query
     * @return Payment struct
     */
    function getPayment(bytes32 paymentId) external view returns (Payment memory) {
        return payments[paymentId];
    }

    /**
     * @notice Get all payment IDs
     * @return Array of payment IDs
     */
    function getAllPaymentIds() external view returns (bytes32[] memory) {
        return paymentIds;
    }

    /**
     * @notice Get buyer's payments
     * @param buyer The buyer address
     * @return Array of payment IDs
     */
    function getBuyerPayments(address buyer) external view returns (bytes32[] memory) {
        return buyerPayments[buyer];
    }

    /**
     * @notice Get seller's payments
     * @param seller The seller address
     * @return Array of payment IDs
     */
    function getSellerPayments(address seller) external view returns (bytes32[] memory) {
        return sellerPayments[seller];
    }

    /**
     * @notice Get total payment count
     * @return Number of payments
     */
    function getPaymentCount() external view returns (uint256) {
        return paymentIds.length;
    }

    /**
     * @notice Get EIP-712 domain separator
     * @return Domain separator hash
     */
    function getDomainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    /**
     * @notice Get delivery commitment hash for signing
     * @param paymentId Payment ID
     * @param deliveryHash Hash of delivered content
     * @param responseMetaHash Hash of response metadata
     * @param timestamp Delivery timestamp
     * @return Typed data hash to sign
     */
    function getDeliveryCommitmentHash(
        bytes32 paymentId,
        bytes32 deliveryHash,
        bytes32 responseMetaHash,
        uint256 timestamp
    ) external view returns (bytes32) {
        bytes32 structHash = keccak256(
            abi.encode(
                DELIVERY_TYPEHASH,
                paymentId,
                deliveryHash,
                responseMetaHash,
                timestamp
            )
        );
        return _hashTypedDataV4(structHash);
    }
}
