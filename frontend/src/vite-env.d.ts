/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DYNAMIC_ENV_ID: string;
  readonly VITE_DEFAULT_CHAIN_ID: string;
  readonly VITE_PUBLIC_POLYGON_RPC_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
