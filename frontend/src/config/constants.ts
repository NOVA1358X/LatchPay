// Network constants
export const POLYGON_CHAIN_ID = 137;
export const USDC_ADDRESS = '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359' as `0x${string}`;
export const USDC_DECIMALS = 6;

// Default RPC URL
export const DEFAULT_RPC_URL = import.meta.env.VITE_PUBLIC_POLYGON_RPC_URL || 'https://polygon-rpc.com/';

// Load deployed addresses - env vars take priority over JSON file
import addressesJson from './addresses.137.json';

// Contract addresses - use env vars first, then JSON file as fallback
export const addresses = {
  chainId: POLYGON_CHAIN_ID,
  usdc: USDC_ADDRESS,
  EndpointRegistry: (import.meta.env.VITE_ENDPOINT_REGISTRY_ADDRESS || addressesJson.EndpointRegistry || '0x0000000000000000000000000000000000000000') as `0x${string}`,
  EscrowVault: (import.meta.env.VITE_ESCROW_VAULT_ADDRESS || addressesJson.EscrowVault || '0x0000000000000000000000000000000000000000') as `0x${string}`,
  SellerBondVault: (import.meta.env.VITE_SELLER_BOND_VAULT_ADDRESS || addressesJson.SellerBondVault || '0x0000000000000000000000000000000000000000') as `0x${string}`,
  ReceiptStore: (import.meta.env.VITE_RECEIPT_STORE_ADDRESS || addressesJson.ReceiptStore || '0x0000000000000000000000000000000000000000') as `0x${string}`,
  ReputationEngine: (import.meta.env.VITE_REPUTATION_ENGINE_ADDRESS || (addressesJson as any).ReputationEngine || '0x0000000000000000000000000000000000000000') as `0x${string}`,
  PaymentRouter: (import.meta.env.VITE_PAYMENT_ROUTER_ADDRESS || (addressesJson as any).PaymentRouter || '0x0000000000000000000000000000000000000000') as `0x${string}`,
  deploymentBlock: parseInt(import.meta.env.VITE_BLOCK_SCAN_FROM || '0') || addressesJson.deploymentBlock || 0,
};

// Validate addresses are set
export const isContractsDeployed = () => {
  return (
    addresses.EndpointRegistry !== '0x0000000000000000000000000000000000000000' &&
    addresses.EscrowVault !== '0x0000000000000000000000000000000000000000' &&
    addresses.SellerBondVault !== '0x0000000000000000000000000000000000000000' &&
    addresses.ReceiptStore !== '0x0000000000000000000000000000000000000000'
  );
};

// Category hashes (must match contract)
export const CATEGORIES = {
  AI: '0x4149000000000000000000000000000000000000000000000000000000000000' as `0x${string}`,
  DATA: '0x4441544100000000000000000000000000000000000000000000000000000000' as `0x${string}`,
  COMPUTE: '0x434f4d5055544500000000000000000000000000000000000000000000000000' as `0x${string}`,
  STORAGE: '0x53544f5241474500000000000000000000000000000000000000000000000000' as `0x${string}`,
  ORACLE: '0x4f5241434c450000000000000000000000000000000000000000000000000000' as `0x${string}`,
} as const;

export const CATEGORY_LABELS: Record<string, string> = {
  [CATEGORIES.AI]: 'AI',
  [CATEGORIES.DATA]: 'Data',
  [CATEGORIES.COMPUTE]: 'Compute',
  [CATEGORIES.STORAGE]: 'Storage',
  [CATEGORIES.ORACLE]: 'Oracle',
};
