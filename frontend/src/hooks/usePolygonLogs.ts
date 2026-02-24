import { useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { parseAbiItem } from 'viem';
import { publicClient } from '../lib/viem';
import addresses from '../config/addresses.137.json';
import { ESCROW_ABI } from '../lib/contracts';

// Scan from deployment block to capture all historical events
const DEPLOYMENT_BLOCK = BigInt(addresses.deploymentBlock || 83419504);

export interface LogEvent {
  eventName: string;
  transactionHash: string;
  blockNumber: number;
  address: string;
  args: Record<string, any>;
}

interface UsePolygonLogsOptions {
  eventType?: string;
  buyer?: string;
  seller?: string;
  endpointId?: string;
}

// Event signatures for filtering
const eventSignatures: Record<string, string> = {
  PaymentOpened: 'PaymentOpened(bytes32,bytes32,address,address,uint256)',
  Delivered: 'Delivered(bytes32,address,bytes32,bytes32)',
  Released: 'Released(bytes32)',
  Disputed: 'Disputed(bytes32,address,string)',
  Refunded: 'Refunded(bytes32)',
  EndpointRegistered: 'EndpointRegistered(bytes32,address,string,uint256)',
};

export function usePolygonLogs(options: UsePolygonLogsOptions = {}) {
  const { data: blockNumber } = useQuery({
    queryKey: ['blockNumber'],
    queryFn: async () => {
      return await publicClient.getBlockNumber();
    },
    refetchInterval: 12000, // ~1 block
  });

  const {
    data: logs,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['polygonLogs', options.eventType, blockNumber?.toString()],
    queryFn: async () => {
      if (!blockNumber) return [];
      
      // Scan from deployment block to capture all events since contract was deployed
      const startBlock = DEPLOYMENT_BLOCK;

      const escrowAddress = addresses.EscrowVault as `0x${string}`;
      const registryAddress = addresses.EndpointRegistry as `0x${string}`;

      // Skip if addresses are placeholders
      if (escrowAddress.startsWith('0x0000000000')) {
        return [];
      }

      const fetchedLogs: LogEvent[] = [];

      // Fetch logs based on event type filter
      const eventsToFetch = options.eventType
        ? [options.eventType]
        : Object.keys(eventSignatures);

      for (const eventName of eventsToFetch) {
        try {
          const contractAddress = eventName === 'EndpointRegistered'
            ? registryAddress
            : escrowAddress;

          const eventSig = eventSignatures[eventName];
          if (!eventSig) continue;

          const rawLogs = await publicClient.getLogs({
            address: contractAddress,
            event: parseAbiItem(`event ${eventSig}`) as any,
            fromBlock: startBlock,
            toBlock: 'latest',
          });

          for (const log of rawLogs) {
            fetchedLogs.push({
              eventName,
              transactionHash: log.transactionHash,
              blockNumber: Number(log.blockNumber),
              address: log.address,
              args: (log as any).args as Record<string, any>,
            });
          }
        } catch (err) {
          console.warn(`Failed to fetch ${eventName} logs:`, err);
        }
      }

      // Sort by block number descending
      fetchedLogs.sort((a, b) => b.blockNumber - a.blockNumber);

      return fetchedLogs;
    },
    enabled: !!blockNumber,
    staleTime: 10000,
  });

  const hasMore = false; // Simplified - could implement pagination

  const loadMore = useCallback(() => {
    // Could implement loading older blocks
  }, []);

  return {
    logs: logs ?? [],
    isLoading,
    error,
    refetch,
    hasMore,
    loadMore,
  };
}

// Hook for watching new events in real-time
export function useWatchEvents(callback: (event: LogEvent) => void) {
  useEffect(() => {
    const escrowAddress = addresses.EscrowVault as `0x${string}`;
    
    if (escrowAddress.startsWith('0x0000000000')) {
      return;
    }

    const unwatch = publicClient.watchContractEvent({
      address: escrowAddress,
      abi: ESCROW_ABI,
      onLogs: (logs) => {
        for (const log of logs) {
          callback({
            eventName: log.eventName ?? 'Unknown',
            transactionHash: log.transactionHash,
            blockNumber: Number(log.blockNumber),
            address: log.address,
            args: log.args as Record<string, any>,
          });
        }
      },
    });

    return () => {
      unwatch();
    };
  }, [callback]);
}
