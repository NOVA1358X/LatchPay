import { useQuery } from '@tanstack/react-query';
import { publicClient } from '../lib/viem';
import { addresses } from '../config/constants';
import { ReputationEngineABI } from '../lib/contracts';

export interface SellerReputation {
  totalDeliveries: number;
  successfulDeliveries: number;
  totalDisputes: number;
  disputesLost: number;
  totalRefunds: number;
  totalVolumeUSD6: bigint;
  lastActivityAt: number;
  registeredAt: number;
  reputationScore: number; // 0-10000 bps
}

export interface BuyerReputation {
  totalPayments: number;
  totalDisputes: number;
  disputesWon: number;
  totalSpentUSD6: bigint;
  lastActivityAt: number;
  registeredAt: number;
  reputationScore: number; // 0-10000 bps
}

/**
 * Hook to get seller reputation data
 */
export function useSellerReputation(sellerAddress: string | undefined) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['sellerReputation', sellerAddress],
    queryFn: async (): Promise<SellerReputation | null> => {
      if (!sellerAddress) return null;

      const reputationAddress = addresses.ReputationEngine;
      if (!reputationAddress || reputationAddress === '0x0000000000000000000000000000000000000000') {
        return null;
      }

      try {
        // Get score data
        const scoreData = await publicClient.readContract({
          address: reputationAddress,
          abi: ReputationEngineABI,
          functionName: 'getSellerScore',
          args: [sellerAddress as `0x${string}`],
        }) as any;

        // Get composite score
        const score = await publicClient.readContract({
          address: reputationAddress,
          abi: ReputationEngineABI,
          functionName: 'getSellerReputationScore',
          args: [sellerAddress as `0x${string}`],
        }) as bigint;

        return {
          totalDeliveries: Number(scoreData.totalDeliveries),
          successfulDeliveries: Number(scoreData.successfulDeliveries),
          totalDisputes: Number(scoreData.totalDisputes),
          disputesLost: Number(scoreData.disputesLost),
          totalRefunds: Number(scoreData.totalRefunds),
          totalVolumeUSD6: scoreData.totalVolumeUSD6,
          lastActivityAt: Number(scoreData.lastActivityAt),
          registeredAt: Number(scoreData.registeredAt),
          reputationScore: Number(score),
        };
      } catch (err) {
        console.error('Failed to fetch seller reputation:', err);
        return null;
      }
    },
    enabled: !!sellerAddress && addresses.ReputationEngine !== '0x0000000000000000000000000000000000000000',
  });

  return {
    reputation: data,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to get buyer reputation data
 */
export function useBuyerReputation(buyerAddress: string | undefined) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['buyerReputation', buyerAddress],
    queryFn: async (): Promise<BuyerReputation | null> => {
      if (!buyerAddress) return null;

      const reputationAddress = addresses.ReputationEngine;
      if (!reputationAddress || reputationAddress === '0x0000000000000000000000000000000000000000') {
        return null;
      }

      try {
        const scoreData = await publicClient.readContract({
          address: reputationAddress,
          abi: ReputationEngineABI,
          functionName: 'getBuyerScore',
          args: [buyerAddress as `0x${string}`],
        }) as any;

        const score = await publicClient.readContract({
          address: reputationAddress,
          abi: ReputationEngineABI,
          functionName: 'getBuyerReputationScore',
          args: [buyerAddress as `0x${string}`],
        }) as bigint;

        return {
          totalPayments: Number(scoreData.totalPayments),
          totalDisputes: Number(scoreData.totalDisputes),
          disputesWon: Number(scoreData.disputesWon),
          totalSpentUSD6: scoreData.totalSpentUSD6,
          lastActivityAt: Number(scoreData.lastActivityAt),
          registeredAt: Number(scoreData.registeredAt),
          reputationScore: Number(score),
        };
      } catch (err) {
        console.error('Failed to fetch buyer reputation:', err);
        return null;
      }
    },
    enabled: !!buyerAddress && addresses.ReputationEngine !== '0x0000000000000000000000000000000000000000',
  });

  return {
    reputation: data,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to get top sellers leaderboard
 */
export function useTopSellers() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['topSellers'],
    queryFn: async (): Promise<{ address: string; score: number }[]> => {
      const reputationAddress = addresses.ReputationEngine;
      if (!reputationAddress || reputationAddress === '0x0000000000000000000000000000000000000000') {
        return [];
      }

      try {
        const sellers = await publicClient.readContract({
          address: reputationAddress,
          abi: ReputationEngineABI,
          functionName: 'getTopSellers',
        }) as `0x${string}`[];

        // Get scores for all sellers
        const results = await Promise.all(
          sellers.map(async (seller) => {
            const score = await publicClient.readContract({
              address: reputationAddress,
              abi: ReputationEngineABI,
              functionName: 'getSellerReputationScore',
              args: [seller],
            }) as bigint;

            return {
              address: seller,
              score: Number(score),
            };
          })
        );

        // Sort by score descending
        return results.sort((a, b) => b.score - a.score);
      } catch (err) {
        console.error('Failed to fetch top sellers:', err);
        return [];
      }
    },
    enabled: addresses.ReputationEngine !== '0x0000000000000000000000000000000000000000',
    staleTime: 60000, // 1 minute
  });

  return {
    topSellers: data || [],
    isLoading,
    error,
    refetch,
  };
}
