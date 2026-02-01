import { addresses } from '../config/constants';

// EndpointRegistry ABI
export const EndpointRegistryABI = [
  {
    type: 'event',
    name: 'EndpointRegistered',
    inputs: [
      { name: 'endpointId', type: 'bytes32', indexed: true },
      { name: 'seller', type: 'address', indexed: true },
      { name: 'metadataURI', type: 'string', indexed: false },
      { name: 'pricePerCall', type: 'uint256', indexed: false },
      { name: 'category', type: 'bytes32', indexed: true },
    ],
  },
  {
    type: 'event',
    name: 'EndpointUpdated',
    inputs: [
      { name: 'endpointId', type: 'bytes32', indexed: true },
      { name: 'metadataURI', type: 'string', indexed: false },
      { name: 'pricePerCall', type: 'uint256', indexed: false },
      { name: 'disputeWindowSeconds', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'EndpointDeactivated',
    inputs: [{ name: 'endpointId', type: 'bytes32', indexed: true }],
  },
  {
    type: 'event',
    name: 'EndpointReactivated',
    inputs: [{ name: 'endpointId', type: 'bytes32', indexed: true }],
  },
  {
    type: 'function',
    name: 'registerEndpoint',
    inputs: [
      { name: 'metadataURI', type: 'string' },
      { name: 'pricePerCall', type: 'uint256' },
      { name: 'category', type: 'bytes32' },
      { name: 'disputeWindowSeconds', type: 'uint256' },
      { name: 'requiredBond', type: 'uint256' },
    ],
    outputs: [{ name: 'endpointId', type: 'bytes32' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'updateEndpoint',
    inputs: [
      { name: 'endpointId', type: 'bytes32' },
      { name: 'metadataURI', type: 'string' },
      { name: 'pricePerCall', type: 'uint256' },
      { name: 'disputeWindowSeconds', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'deactivateEndpoint',
    inputs: [{ name: 'endpointId', type: 'bytes32' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getEndpoint',
    inputs: [{ name: 'endpointId', type: 'bytes32' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'seller', type: 'address' },
          { name: 'metadataURI', type: 'string' },
          { name: 'pricePerCall', type: 'uint256' },
          { name: 'category', type: 'bytes32' },
          { name: 'disputeWindowSeconds', type: 'uint256' },
          { name: 'requiredBond', type: 'uint256' },
          { name: 'active', type: 'bool' },
          { name: 'createdAt', type: 'uint256' },
          { name: 'updatedAt', type: 'uint256' },
          { name: 'totalCalls', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getAllEndpointIds',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getSellerEndpoints',
    inputs: [{ name: 'seller', type: 'address' }],
    outputs: [{ name: '', type: 'bytes32[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'isValidEndpoint',
    inputs: [{ name: 'endpointId', type: 'bytes32' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
] as const;

// EscrowVault ABI
export const EscrowVaultABI = [
  {
    type: 'event',
    name: 'PaymentOpened',
    inputs: [
      { name: 'paymentId', type: 'bytes32', indexed: true },
      { name: 'endpointId', type: 'bytes32', indexed: true },
      { name: 'buyer', type: 'address', indexed: true },
      { name: 'seller', type: 'address', indexed: false },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'disputeWindowEnds', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'Delivered',
    inputs: [
      { name: 'paymentId', type: 'bytes32', indexed: true },
      { name: 'deliveryHash', type: 'bytes32', indexed: false },
      { name: 'responseMetaHash', type: 'bytes32', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'Released',
    inputs: [
      { name: 'paymentId', type: 'bytes32', indexed: true },
      { name: 'seller', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'fee', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'Refunded',
    inputs: [
      { name: 'paymentId', type: 'bytes32', indexed: true },
      { name: 'buyer', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'Disputed',
    inputs: [
      { name: 'paymentId', type: 'bytes32', indexed: true },
      { name: 'buyer', type: 'address', indexed: true },
      { name: 'evidenceHash', type: 'bytes32', indexed: false },
    ],
  },
  {
    type: 'function',
    name: 'openPayment',
    inputs: [
      { name: 'endpointId', type: 'bytes32' },
      { name: 'maxPrice', type: 'uint256' },
      { name: 'buyerNoteHash', type: 'bytes32' },
    ],
    outputs: [{ name: 'paymentId', type: 'bytes32' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'markDeliveredWithSellerSig',
    inputs: [
      { name: 'paymentId', type: 'bytes32' },
      { name: 'deliveryHash', type: 'bytes32' },
      { name: 'responseMetaHash', type: 'bytes32' },
      { name: 'sellerSig', type: 'bytes' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'dispute',
    inputs: [
      { name: 'paymentId', type: 'bytes32' },
      { name: 'evidenceHash', type: 'bytes32' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'release',
    inputs: [{ name: 'paymentId', type: 'bytes32' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'refund',
    inputs: [{ name: 'paymentId', type: 'bytes32' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getPayment',
    inputs: [{ name: 'paymentId', type: 'bytes32' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'paymentId', type: 'bytes32' },
          { name: 'endpointId', type: 'bytes32' },
          { name: 'buyer', type: 'address' },
          { name: 'seller', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'openedAt', type: 'uint256' },
          { name: 'deliveredAt', type: 'uint256' },
          { name: 'disputeWindowEnds', type: 'uint256' },
          { name: 'status', type: 'uint8' },
          { name: 'buyerNoteHash', type: 'bytes32' },
          { name: 'deliveryHash', type: 'bytes32' },
          { name: 'responseMetaHash', type: 'bytes32' },
          { name: 'evidenceHash', type: 'bytes32' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getBuyerPayments',
    inputs: [{ name: 'buyer', type: 'address' }],
    outputs: [{ name: '', type: 'bytes32[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getSellerPayments',
    inputs: [{ name: 'seller', type: 'address' }],
    outputs: [{ name: '', type: 'bytes32[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getDomainSeparator',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'view',
  },
] as const;

// SellerBondVault ABI
export const SellerBondVaultABI = [
  {
    type: 'event',
    name: 'BondDeposited',
    inputs: [
      { name: 'seller', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'newTotal', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'BondWithdrawn',
    inputs: [
      { name: 'seller', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'remaining', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'BondSlashed',
    inputs: [
      { name: 'seller', type: 'address', indexed: true },
      { name: 'paymentId', type: 'bytes32', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'reason', type: 'string', indexed: false },
    ],
  },
  {
    type: 'function',
    name: 'deposit',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'withdraw',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getBond',
    inputs: [{ name: 'seller', type: 'address' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'amount', type: 'uint256' },
          { name: 'lockedUntil', type: 'uint256' },
          { name: 'activePayments', type: 'uint256' },
          { name: 'totalSlashed', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'hasSufficientBond',
    inputs: [
      { name: 'seller', type: 'address' },
      { name: 'requiredAmount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
] as const;

// USDC ABI (ERC20)
export const USDCABI = [
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'allowance',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'decimals',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
  },
] as const;

// ReceiptStore ABI
export const ReceiptStoreABI = [
  {
    type: 'function',
    name: 'getReceipt',
    inputs: [{ name: 'paymentId', type: 'bytes32' }],
    outputs: [
      { name: 'requestHash', type: 'bytes32' },
      { name: 'responseHash', type: 'bytes32' },
      { name: 'storedAt', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'hasReceipt',
    inputs: [{ name: 'paymentId', type: 'bytes32' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'storeReceipt',
    inputs: [
      { name: 'paymentId', type: 'bytes32' },
      { name: 'requestHash', type: 'bytes32' },
      { name: 'responseHash', type: 'bytes32' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    name: 'ReceiptStored',
    inputs: [
      { name: 'paymentId', type: 'bytes32', indexed: true },
      { name: 'requestHash', type: 'bytes32', indexed: false },
      { name: 'responseHash', type: 'bytes32', indexed: false },
    ],
  },
] as const;

// Aliased exports for compatibility
export const ENDPOINT_REGISTRY_ABI = EndpointRegistryABI;
export const ESCROW_ABI = EscrowVaultABI;
export const BOND_VAULT_ABI = SellerBondVaultABI;
export const RECEIPT_STORE_ABI = ReceiptStoreABI;
export const ERC20_ABI = USDCABI;

// Contract addresses
export const getContractAddress = (contractName: keyof typeof addresses) => {
  return addresses[contractName] as `0x${string}`;
};
