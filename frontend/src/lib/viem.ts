import { createPublicClient, http, type PublicClient } from 'viem';
import { polygon } from 'viem/chains';

const RPC_URL = import.meta.env.VITE_PUBLIC_POLYGON_RPC_URL || 'https://polygon-rpc.com/';

export const publicClient: PublicClient = createPublicClient({
  chain: polygon,
  transport: http(RPC_URL),
});

export function getPublicClient(): PublicClient {
  return publicClient;
}
