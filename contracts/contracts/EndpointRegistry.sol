// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title EndpointRegistry
 * @author LatchPay
 * @notice Registry for API endpoints with pricing, bonds, and dispute parameters
 * @dev Sellers register endpoints; the escrow contract references this registry
 */
contract EndpointRegistry is Ownable, ReentrancyGuard {
    // ============ Structs ============

    struct Endpoint {
        address seller;
        string metadataURI;
        uint256 pricePerCall;
        bytes32 category;
        uint256 disputeWindowSeconds;
        uint256 requiredBond;
        bool active;
        uint256 createdAt;
        uint256 updatedAt;
        uint256 totalCalls;
    }

    // ============ State Variables ============

    /// @notice Mapping from endpointId to Endpoint data
    mapping(bytes32 => Endpoint) public endpoints;

    /// @notice Array of all endpoint IDs for enumeration
    bytes32[] public endpointIds;

    /// @notice Mapping from seller to their endpoint IDs
    mapping(address => bytes32[]) public sellerEndpoints;

    /// @notice Counter for generating unique endpoint IDs
    uint256 private _endpointCounter;

    /// @notice Reference to the SellerBondVault contract
    address public bondVault;

    /// @notice Reference to the EscrowVault contract (authorized to call incrementCalls)
    address public escrowVault;

    // ============ Events ============

    event EndpointRegistered(
        bytes32 indexed endpointId,
        address indexed seller,
        string metadataURI,
        uint256 pricePerCall,
        bytes32 indexed category
    );

    event EndpointUpdated(
        bytes32 indexed endpointId,
        string metadataURI,
        uint256 pricePerCall,
        uint256 disputeWindowSeconds
    );

    event EndpointDeactivated(bytes32 indexed endpointId);
    event EndpointReactivated(bytes32 indexed endpointId);
    event BondVaultUpdated(address indexed newBondVault);
    event EscrowVaultUpdated(address indexed newEscrowVault);
    event EndpointCallIncremented(bytes32 indexed endpointId, uint256 newTotal);

    // ============ Errors ============

    error EndpointNotFound();
    error NotEndpointOwner();
    error EndpointAlreadyActive();
    error EndpointNotActive();
    error InvalidPrice();
    error InvalidDisputeWindow();
    error InsufficientBond();
    error ZeroAddress();
    error EmptyMetadataURI();
    error NotAuthorized();

    // ============ Constructor ============

    constructor() Ownable(msg.sender) {}

    // ============ External Functions ============

    /**
     * @notice Register a new API endpoint
     * @param metadataURI IPFS/Arweave URI for endpoint metadata
     * @param pricePerCall Price in USDC base units (6 decimals)
     * @param category Category identifier (e.g., keccak256("AI"), keccak256("DATA"))
     * @param disputeWindowSeconds Time window for disputes after delivery
     * @param requiredBond Minimum bond amount seller must have deposited
     * @return endpointId The unique identifier for the endpoint
     */
    function registerEndpoint(
        string calldata metadataURI,
        uint256 pricePerCall,
        bytes32 category,
        uint256 disputeWindowSeconds,
        uint256 requiredBond
    ) external nonReentrant returns (bytes32 endpointId) {
        if (bytes(metadataURI).length == 0) revert EmptyMetadataURI();
        if (pricePerCall == 0) revert InvalidPrice();
        if (disputeWindowSeconds < 1 hours || disputeWindowSeconds > 30 days) {
            revert InvalidDisputeWindow();
        }

        // Generate unique endpoint ID
        endpointId = keccak256(
            abi.encodePacked(msg.sender, block.timestamp, _endpointCounter++)
        );

        endpoints[endpointId] = Endpoint({
            seller: msg.sender,
            metadataURI: metadataURI,
            pricePerCall: pricePerCall,
            category: category,
            disputeWindowSeconds: disputeWindowSeconds,
            requiredBond: requiredBond,
            active: true,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            totalCalls: 0
        });

        endpointIds.push(endpointId);
        sellerEndpoints[msg.sender].push(endpointId);

        emit EndpointRegistered(
            endpointId,
            msg.sender,
            metadataURI,
            pricePerCall,
            category
        );
    }

    /**
     * @notice Update an existing endpoint
     * @param endpointId The endpoint to update
     * @param metadataURI New metadata URI
     * @param pricePerCall New price per call
     * @param disputeWindowSeconds New dispute window
     */
    function updateEndpoint(
        bytes32 endpointId,
        string calldata metadataURI,
        uint256 pricePerCall,
        uint256 disputeWindowSeconds
    ) external nonReentrant {
        Endpoint storage endpoint = endpoints[endpointId];
        if (endpoint.seller == address(0)) revert EndpointNotFound();
        if (endpoint.seller != msg.sender) revert NotEndpointOwner();
        if (bytes(metadataURI).length == 0) revert EmptyMetadataURI();
        if (pricePerCall == 0) revert InvalidPrice();
        if (disputeWindowSeconds < 1 hours || disputeWindowSeconds > 30 days) {
            revert InvalidDisputeWindow();
        }

        endpoint.metadataURI = metadataURI;
        endpoint.pricePerCall = pricePerCall;
        endpoint.disputeWindowSeconds = disputeWindowSeconds;
        endpoint.updatedAt = block.timestamp;

        emit EndpointUpdated(
            endpointId,
            metadataURI,
            pricePerCall,
            disputeWindowSeconds
        );
    }

    /**
     * @notice Deactivate an endpoint (can be reactivated)
     * @param endpointId The endpoint to deactivate
     */
    function deactivateEndpoint(bytes32 endpointId) external {
        Endpoint storage endpoint = endpoints[endpointId];
        if (endpoint.seller == address(0)) revert EndpointNotFound();
        if (endpoint.seller != msg.sender) revert NotEndpointOwner();
        if (!endpoint.active) revert EndpointNotActive();

        endpoint.active = false;
        endpoint.updatedAt = block.timestamp;

        emit EndpointDeactivated(endpointId);
    }

    /**
     * @notice Reactivate a deactivated endpoint
     * @param endpointId The endpoint to reactivate
     */
    function reactivateEndpoint(bytes32 endpointId) external {
        Endpoint storage endpoint = endpoints[endpointId];
        if (endpoint.seller == address(0)) revert EndpointNotFound();
        if (endpoint.seller != msg.sender) revert NotEndpointOwner();
        if (endpoint.active) revert EndpointAlreadyActive();

        endpoint.active = true;
        endpoint.updatedAt = block.timestamp;

        emit EndpointReactivated(endpointId);
    }

    /**
     * @notice Increment total calls for an endpoint (only EscrowVault)
     * @param endpointId The endpoint to increment
     */
    function incrementCalls(bytes32 endpointId) external {
        if (msg.sender != escrowVault) revert NotAuthorized();
        Endpoint storage endpoint = endpoints[endpointId];
        if (endpoint.seller == address(0)) revert EndpointNotFound();
        
        endpoint.totalCalls++;
        
        emit EndpointCallIncremented(endpointId, endpoint.totalCalls);
    }

    /**
     * @notice Set the bond vault address
     * @param _bondVault Address of the SellerBondVault contract
     */
    function setBondVault(address _bondVault) external onlyOwner {
        if (_bondVault == address(0)) revert ZeroAddress();
        bondVault = _bondVault;
        emit BondVaultUpdated(_bondVault);
    }

    /**
     * @notice Set the escrow vault address (authorized to call incrementCalls)
     * @param _escrowVault Address of the EscrowVault contract
     */
    function setEscrowVault(address _escrowVault) external onlyOwner {
        if (_escrowVault == address(0)) revert ZeroAddress();
        escrowVault = _escrowVault;
        emit EscrowVaultUpdated(_escrowVault);
    }

    // ============ View Functions ============

    /**
     * @notice Get full endpoint data
     * @param endpointId The endpoint to query
     * @return Endpoint struct
     */
    function getEndpoint(bytes32 endpointId) external view returns (Endpoint memory) {
        return endpoints[endpointId];
    }

    /**
     * @notice Get all endpoint IDs
     * @return Array of endpoint IDs
     */
    function getAllEndpointIds() external view returns (bytes32[] memory) {
        return endpointIds;
    }

    /**
     * @notice Get endpoints by seller
     * @param seller The seller address
     * @return Array of endpoint IDs
     */
    function getSellerEndpoints(address seller) external view returns (bytes32[] memory) {
        return sellerEndpoints[seller];
    }

    /**
     * @notice Get total number of endpoints
     * @return Count of registered endpoints
     */
    function getEndpointCount() external view returns (uint256) {
        return endpointIds.length;
    }

    /**
     * @notice Check if endpoint exists and is active
     * @param endpointId The endpoint to check
     * @return isValid True if endpoint exists and is active
     */
    function isValidEndpoint(bytes32 endpointId) external view returns (bool) {
        Endpoint storage endpoint = endpoints[endpointId];
        return endpoint.seller != address(0) && endpoint.active;
    }

    /**
     * @notice Get endpoint seller
     * @param endpointId The endpoint to query
     * @return seller address
     */
    function getEndpointSeller(bytes32 endpointId) external view returns (address) {
        return endpoints[endpointId].seller;
    }

    /**
     * @notice Get endpoint price
     * @param endpointId The endpoint to query
     * @return price per call in USDC base units
     */
    function getEndpointPrice(bytes32 endpointId) external view returns (uint256) {
        return endpoints[endpointId].pricePerCall;
    }

    /**
     * @notice Get endpoint dispute window
     * @param endpointId The endpoint to query
     * @return dispute window in seconds
     */
    function getDisputeWindow(bytes32 endpointId) external view returns (uint256) {
        return endpoints[endpointId].disputeWindowSeconds;
    }
}
