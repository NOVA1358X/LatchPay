import { createPublicClient, http, fallback, type PublicClient } from 'viem';
import { polygon } from 'viem/chains';

// Multiple public RPCs with automatic fallback — no API key required
export const POLYGON_RPCS = [
  'https://polygon.llamarpc.com',
  'https://polygon-bor-rpc.publicnode.com',
  'https://1rpc.io/matic',
  'https://polygon-rpc.com',
];

export const publicClient: PublicClient = createPublicClient({
  chain: polygon,
  transport: fallback(POLYGON_RPCS.map((url) => http(url))),
});

export function getPublicClient(): PublicClient {
  return publicClient;
}
