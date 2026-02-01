/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DYNAMIC_ENV_ID: string;
  readonly VITE_DEFAULT_CHAIN_ID: string;
  readonly VITE_PUBLIC_POLYGON_RPC_URL: string;
  readonly VITE_ALCHEMY_API_KEY: string;
  readonly VITE_BLOCK_SCAN_FROM: string;
  readonly VITE_ENDPOINT_REGISTRY_ADDRESS: string;
  readonly VITE_ESCROW_VAULT_ADDRESS: string;
  readonly VITE_SELLER_BOND_VAULT_ADDRESS: string;
  readonly VITE_RECEIPT_STORE_ADDRESS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
