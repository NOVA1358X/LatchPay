import { ReactNode } from 'react';
import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core';
import { EthereumWalletConnectors } from '@dynamic-labs/ethereum';
import { DynamicWagmiConnector } from '@dynamic-labs/wagmi-connector';
import { WagmiProvider, createConfig, http, fallback } from 'wagmi';
import { polygon } from 'wagmi/chains';
import { POLYGON_RPCS } from '../lib/viem';

const DYNAMIC_ENV_ID = import.meta.env.VITE_DYNAMIC_ENVIRONMENT_ID || import.meta.env.VITE_DYNAMIC_ENV_ID || '85e1739c-adfe-4bf2-99ee-60e6bca200ab';

// Create wagmi config for Polygon Mainnet (Chain ID: 137)
const wagmiConfig = createConfig({
  chains: [polygon],
  multiInjectedProviderDiscovery: false,
  transports: {
    [polygon.id]: fallback(POLYGON_RPCS.map((url) => http(url))),
  },
});

interface Web3ProviderProps {
  children: ReactNode;
}

export function Web3Provider({ children }: Web3ProviderProps) {
  return (
    <DynamicContextProvider
      settings={{
        environmentId: DYNAMIC_ENV_ID,
        walletConnectors: [EthereumWalletConnectors],
        initialAuthenticationMode: 'connect-only',
        overrides: {
          evmNetworks: [
            {
              chainId: 137,
              networkId: 137,
              name: 'Polygon',
              iconUrls: ['https://app.dynamic.xyz/assets/networks/polygon.svg'],
              nativeCurrency: {
                name: 'MATIC',
                symbol: 'MATIC',
                decimals: 18,
              },
              rpcUrls: ['https://polygon.llamarpc.com', 'https://polygon-bor-rpc.publicnode.com', 'https://polygon-rpc.com'],
              blockExplorerUrls: ['https://polygonscan.com'],
            },
          ],
        },
      }}
    >
      <WagmiProvider config={wagmiConfig}>
        <DynamicWagmiConnector>
          {children}
        </DynamicWagmiConnector>
      </WagmiProvider>
    </DynamicContextProvider>
  );
}
