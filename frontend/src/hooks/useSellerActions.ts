import { useState, useCallback } from 'react';
import { useWalletClient } from 'wagmi';
import { parseUnits, keccak256, toBytes } from 'viem';
import { useQueryClient } from '@tanstack/react-query';
import addresses from '../config/addresses.137.json';
import { ENDPOINT_REGISTRY_ABI, BOND_VAULT_ABI, ERC20_ABI } from '../lib/contracts';
import { USDC_ADDRESS } from '../config/constants';
import { publicClient } from '../lib/viem';

interface EndpointData {
  metadataURI: string;
  pricePerCall: string; // Human-readable USDC (e.g., "0.10")
  category: string;
  disputeWindowSeconds: number;
  requiredBond: string; // Human-readable USDC
}

export function useSellerActions() {
  const { data: walletClient } = useWalletClient();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const registryAddress = addresses.EndpointRegistry as `0x${string}`;
  const bondVaultAddress = addresses.SellerBondVault as `0x${string}`;

  // Register a new endpoint
  const registerEndpoint = useCallback(async (data: EndpointData) => {
    if (!walletClient) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      const priceWei = parseUnits(data.pricePerCall, 6);
      const bondWei = parseUnits(data.requiredBond, 6);

      const hash = await walletClient.writeContract({
        address: registryAddress,
        abi: ENDPOINT_REGISTRY_ABI,
        functionName: 'registerEndpoint',
        args: [
          data.metadataURI,
          priceWei,
          data.category as `0x${string}`,
          BigInt(data.disputeWindowSeconds),
          bondWei,
        ] as const,
      } as any);

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      // Calculate endpoint ID
      const endpointId = keccak256(
        toBytes(`${walletClient.account.address}:${data.metadataURI}`)
      );

      queryClient.invalidateQueries({ queryKey: ['sellerEndpoints'] });
      queryClient.invalidateQueries({ queryKey: ['endpoints'] });

      return { hash, endpointId, receipt };
    } catch (err: any) {
      const error = new Error(err.message || 'Failed to register endpoint');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [walletClient, publicClient, registryAddress, queryClient]);

  // Update endpoint
  const updateEndpoint = useCallback(async (
    endpointId: `0x${string}`,
    data: Partial<EndpointData>
  ) => {
    if (!walletClient) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      const hash = await walletClient.writeContract({
        address: registryAddress,
        abi: ENDPOINT_REGISTRY_ABI,
        functionName: 'updateEndpoint',
        args: [
          endpointId,
          data.metadataURI || '',
          data.pricePerCall ? parseUnits(data.pricePerCall, 6) : 0n,
          data.disputeWindowSeconds ? BigInt(data.disputeWindowSeconds) : 0n,
        ] as const,
      } as any);

      await publicClient.waitForTransactionReceipt({ hash });
      queryClient.invalidateQueries({ queryKey: ['sellerEndpoints'] });

      return hash;
    } catch (err: any) {
      const error = new Error(err.message || 'Failed to update endpoint');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [walletClient, publicClient, registryAddress, queryClient]);

  // Deactivate endpoint
  const deactivateEndpoint = useCallback(async (endpointId: `0x${string}`) => {
    if (!walletClient) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);

    try {
      const hash = await walletClient.writeContract({
        address: registryAddress,
        abi: ENDPOINT_REGISTRY_ABI,
        functionName: 'deactivateEndpoint',
        args: [endpointId],
      });

      await publicClient.waitForTransactionReceipt({ hash });
      queryClient.invalidateQueries({ queryKey: ['sellerEndpoints'] });

      return hash;
    } finally {
      setIsLoading(false);
    }
  }, [walletClient, publicClient, registryAddress, queryClient]);

  // Reactivate endpoint
  const reactivateEndpoint = useCallback(async (endpointId: `0x${string}`) => {
    if (!walletClient) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);

    try {
      const hash = await walletClient.writeContract({
        address: registryAddress,
        abi: ENDPOINT_REGISTRY_ABI,
        functionName: 'reactivateEndpoint',
        args: [endpointId],
      } as any);

      await publicClient.waitForTransactionReceipt({ hash });
      queryClient.invalidateQueries({ queryKey: ['sellerEndpoints'] });

      return hash;
    } finally {
      setIsLoading(false);
    }
  }, [walletClient, publicClient, registryAddress, queryClient]);

  // Deposit bond
  const depositBond = useCallback(async (amount: string) => {
    if (!walletClient) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);

    try {
      const amountWei = parseUnits(amount, 6);

      // Check and approve USDC
      const allowance = await publicClient.readContract({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [walletClient.account.address, bondVaultAddress],
      }) as bigint;

      if (allowance < amountWei) {
        const approveHash = await walletClient.writeContract({
          address: USDC_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [bondVaultAddress, amountWei * 2n],
        });
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
      }

      const hash = await walletClient.writeContract({
        address: bondVaultAddress,
        abi: BOND_VAULT_ABI,
        functionName: 'deposit',
        args: [amountWei],
      });

      await publicClient.waitForTransactionReceipt({ hash });
      queryClient.invalidateQueries({ queryKey: ['sellerBond'] });

      return hash;
    } finally {
      setIsLoading(false);
    }
  }, [walletClient, publicClient, bondVaultAddress, queryClient]);

  // Request bond withdrawal
  const requestWithdrawal = useCallback(async (amount: string) => {
    if (!walletClient) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);

    try {
      const amountWei = parseUnits(amount, 6);

      const hash = await walletClient.writeContract({
        address: bondVaultAddress,
        abi: BOND_VAULT_ABI,
        functionName: 'withdraw',
        args: [amountWei],
      } as any);

      await publicClient.waitForTransactionReceipt({ hash });
      queryClient.invalidateQueries({ queryKey: ['sellerBond'] });

      return hash;
    } finally {
      setIsLoading(false);
    }
  }, [walletClient, publicClient, bondVaultAddress, queryClient]);

  // Execute withdrawal (after lock period)
  const executeWithdrawal = useCallback(async (amount: string) => {
    if (!walletClient) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    const amountWei = parseUnits(amount, 6);

    try {
      const hash = await walletClient.writeContract({
        address: bondVaultAddress,
        abi: BOND_VAULT_ABI,
        functionName: 'withdraw',
        args: [amountWei],
      } as any);

      await publicClient.waitForTransactionReceipt({ hash });
      queryClient.invalidateQueries({ queryKey: ['sellerBond'] });

      return hash;
    } finally {
      setIsLoading(false);
    }
  }, [walletClient, publicClient, bondVaultAddress, queryClient]);

  return {
    registerEndpoint,
    updateEndpoint,
    deactivateEndpoint,
    reactivateEndpoint,
    depositBond,
    requestWithdrawal,
    executeWithdrawal,
    isLoading,
    error,
  };
}
