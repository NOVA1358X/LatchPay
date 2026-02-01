import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { useWalletClient, usePublicClient } from 'wagmi';
import { parseUnits } from 'viem';
import { publicClient } from '../lib/viem';
import { EndpointRegistryABI, getContractAddress } from '../lib/contracts';
import { addresses, CATEGORIES } from '../config/constants';

export interface Endpoint {
  id: string;
  endpointId: string;
  seller: string;
  metadataURI: string;
  pricePerCall: bigint;
  category: string;
  disputeWindowSeconds: bigint;
  requiredBond: bigint;
  active: boolean;
  createdAt: bigint;
  updatedAt: bigint;
  totalCalls: bigint;
}

export function useEndpoints() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['endpoints'],
    queryFn: async (): Promise<Endpoint[]> => {
      const registryAddress = getContractAddress('EndpointRegistry');
      
      // Skip if not deployed
      if (!registryAddress || registryAddress === '0x') {
        return [];
      }

      try {
        // Get all endpoint IDs
        const endpointIds = await publicClient.readContract({
          address: registryAddress,
          abi: EndpointRegistryABI,
          functionName: 'getAllEndpointIds',
        }) as `0x${string}`[];

        // Fetch each endpoint's data
        const endpoints = await Promise.all(
          endpointIds.map(async (endpointId) => {
            const data = await publicClient.readContract({
              address: registryAddress,
              abi: EndpointRegistryABI,
              functionName: 'getEndpoint',
              args: [endpointId],
            }) as any;

            return {
              id: endpointId,
              endpointId,
              seller: data.seller,
              metadataURI: data.metadataURI,
              pricePerCall: data.pricePerCall,
              category: data.category,
              disputeWindowSeconds: data.disputeWindowSeconds,
              requiredBond: data.requiredBond,
              active: data.active,
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
              totalCalls: data.totalCalls,
            };
          })
        );

        return endpoints.filter((e) => e.active);
      } catch (err) {
        console.error('Error fetching endpoints:', err);
        return [];
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!addresses.EndpointRegistry,
  });

  return {
    endpoints: data || [],
    isLoading,
    error,
    refetch,
  };
}

export function useEndpoint(endpointId: string | undefined) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['endpoint', endpointId],
    queryFn: async (): Promise<Endpoint | null> => {
      if (!endpointId) return null;
      
      const registryAddress = getContractAddress('EndpointRegistry');
      if (!registryAddress || registryAddress === '0x') {
        return null;
      }

      try {
        const data = await publicClient.readContract({
          address: registryAddress,
          abi: EndpointRegistryABI,
          functionName: 'getEndpoint',
          args: [endpointId as `0x${string}`],
        }) as any;

        return {
          id: endpointId,
          endpointId,
          seller: data.seller,
          metadataURI: data.metadataURI,
          pricePerCall: data.pricePerCall,
          category: data.category,
          disputeWindowSeconds: data.disputeWindowSeconds,
          requiredBond: data.requiredBond,
          active: data.active,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          totalCalls: data.totalCalls,
        };
      } catch (err) {
        console.error('Error fetching endpoint:', err);
        return null;
      }
    },
    enabled: !!endpointId && !!addresses.EndpointRegistry,
  });

  return {
    endpoint: data,
    isLoading,
    error,
  };
}

export function useSellerEndpoints(sellerAddress: string | undefined) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['sellerEndpoints', sellerAddress],
    queryFn: async (): Promise<Endpoint[]> => {
      if (!sellerAddress) return [];
      
      const registryAddress = getContractAddress('EndpointRegistry');
      if (!registryAddress || registryAddress === '0x') {
        return [];
      }

      try {
        const endpointIds = await publicClient.readContract({
          address: registryAddress,
          abi: EndpointRegistryABI,
          functionName: 'getSellerEndpoints',
          args: [sellerAddress as `0x${string}`],
        }) as `0x${string}`[];

        const endpoints = await Promise.all(
          endpointIds.map(async (endpointId) => {
            const data = await publicClient.readContract({
              address: registryAddress,
              abi: EndpointRegistryABI,
              functionName: 'getEndpoint',
              args: [endpointId],
            }) as any;

            return {
              id: endpointId,
              endpointId,
              seller: data.seller,
              metadataURI: data.metadataURI,
              pricePerCall: data.pricePerCall,
              category: data.category,
              disputeWindowSeconds: data.disputeWindowSeconds,
              requiredBond: data.requiredBond,
              active: data.active,
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
              totalCalls: data.totalCalls,
            };
          })
        );

        return endpoints;
      } catch (err) {
        console.error('Error fetching seller endpoints:', err);
        return [];
      }
    },
    enabled: !!sellerAddress && !!addresses.EndpointRegistry,
  });

  return {
    endpoints: data || [],
    isLoading,
    error,
    refetch,
  };
}

// Hook for registering a new endpoint
export function useRegisterEndpoint() {
  const { data: walletClient } = useWalletClient();
  const wagmiPublicClient = usePublicClient();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const registerEndpoint = useCallback(async (params: {
    metadataURI: string;
    pricePerCall: string; // in USDC (e.g., "0.01")
    category: string; // category key like "ai", "data", etc.
    disputeWindowHours: number;
  }) => {
    if (!walletClient || !wagmiPublicClient) {
      throw new Error('Wallet not connected');
    }

    const registryAddress = getContractAddress('EndpointRegistry');
    if (!registryAddress || registryAddress === '0x') {
      throw new Error('EndpointRegistry not deployed');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Convert price to USDC units (6 decimals)
      const priceWei = parseUnits(params.pricePerCall, 6);
      
      // Convert hours to seconds
      const disputeWindowSeconds = BigInt(params.disputeWindowHours * 3600);
      
      // Get category bytes32 - map category key to hex
      const categoryMap: Record<string, `0x${string}`> = {
        ai: CATEGORIES.AI,
        data: CATEGORIES.DATA,
        compute: CATEGORIES.COMPUTE,
        storage: CATEGORIES.STORAGE,
        oracle: CATEGORIES.ORACLE,
      };
      const categoryBytes = categoryMap[params.category] || CATEGORIES.AI;
      
      // Get account
      const [account] = await walletClient.getAddresses();
      
      // Required bond (0 for now, can be made configurable)
      const requiredBond = BigInt(0);

      // Simulate the transaction first
      // Contract signature: registerEndpoint(string metadataURI, uint256 pricePerCall, bytes32 category, uint256 disputeWindowSeconds, uint256 requiredBond)
      const { request } = await wagmiPublicClient.simulateContract({
        address: registryAddress,
        abi: EndpointRegistryABI,
        functionName: 'registerEndpoint',
        args: [params.metadataURI, priceWei, categoryBytes, disputeWindowSeconds, requiredBond],
        account,
      });

      // Send the transaction
      const hash = await walletClient.writeContract(request);

      // Wait for confirmation
      const receipt = await wagmiPublicClient.waitForTransactionReceipt({ hash });

      if (receipt.status === 'reverted') {
        throw new Error('Transaction reverted');
      }

      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['endpoints'] });
      queryClient.invalidateQueries({ queryKey: ['sellerEndpoints'] });

      return { hash };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to register endpoint');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [walletClient, wagmiPublicClient, queryClient]);

  return {
    registerEndpoint,
    isLoading,
    error,
  };
}
