import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useWalletClient, usePublicClient } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { publicClient } from '../lib/viem';
import { addresses, USDC_ADDRESS } from '../config/constants';
import { ERC20_ABI } from '../lib/contracts';

// SellerBondVault ABI - bonds mapping returns a struct with (amount, lockedUntil, activePayments, totalSlashed)
const SELLER_BOND_VAULT_ABI = [
  {
    type: 'function',
    name: 'bonds',
    inputs: [{ name: 'seller', type: 'address' }],
    outputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'lockedUntil', type: 'uint256' },
      { name: 'activePayments', type: 'uint256' },
      { name: 'totalSlashed', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'deposit',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'withdraw',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'usdc',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'BondDeposited',
    inputs: [
      { name: 'seller', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'newTotal', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'BondWithdrawn',
    inputs: [
      { name: 'seller', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'remaining', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'BondSlashed',
    inputs: [
      { name: 'seller', type: 'address', indexed: true },
      { name: 'paymentId', type: 'bytes32', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'reason', type: 'string', indexed: false },
    ],
  },
] as const;

export interface BondInfo {
  bondAmount: bigint;
  bondAmountFormatted: string;
  activePayments: number;
  lockedUntil: number;
  totalSlashed: number;
  canWithdraw: boolean;
}

export function useSellerBond(sellerAddress: string | undefined) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['sellerBond', sellerAddress],
    queryFn: async (): Promise<BondInfo | null> => {
      if (!sellerAddress) return null;

      const bondVaultAddress = addresses.SellerBondVault;
      if (!bondVaultAddress || bondVaultAddress === '0x0000000000000000000000000000000000000000') {
        return null;
      }

      try {
        // bonds mapping returns: (amount, lockedUntil, activePayments, totalSlashed)
        const bondData = await publicClient.readContract({
          address: bondVaultAddress,
          abi: SELLER_BOND_VAULT_ABI,
          functionName: 'bonds',
          args: [sellerAddress as `0x${string}`],
        }) as [bigint, bigint, bigint, bigint];

        const [amount, lockedUntil, activePayments, totalSlashed] = bondData;
        const now = BigInt(Math.floor(Date.now() / 1000));

        return {
          bondAmount: amount,
          bondAmountFormatted: formatUnits(amount, 6),
          activePayments: Number(activePayments),
          lockedUntil: Number(lockedUntil),
          totalSlashed: Number(totalSlashed),
          canWithdraw: Number(activePayments) === 0 && lockedUntil <= now,
        };
      } catch (err) {
        console.error('Failed to fetch bond info:', err);
        return null;
      }
    },
    enabled: !!sellerAddress && addresses.SellerBondVault !== '0x0000000000000000000000000000000000000000',
  });

  return {
    bondInfo: data,
    isLoading,
    error,
    refetch,
  };
}

export function useBondActions() {
  const { data: walletClient } = useWalletClient();
  const wagmiPublicClient = usePublicClient();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const bondVaultAddress = addresses.SellerBondVault;

  // Deposit bond
  const depositBond = useCallback(async (amount: string) => {
    if (!walletClient || !wagmiPublicClient) {
      throw new Error('Wallet not connected');
    }

    if (bondVaultAddress === '0x0000000000000000000000000000000000000000') {
      throw new Error('Bond vault not deployed');
    }

    setIsLoading(true);
    setError(null);

    try {
      const amountWei = parseUnits(amount, 6);

      // Check and approve USDC
      const allowance = await wagmiPublicClient.readContract({
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
        await wagmiPublicClient.waitForTransactionReceipt({ hash: approveHash });
      }

      // Deposit
      const hash = await walletClient.writeContract({
        address: bondVaultAddress,
        abi: SELLER_BOND_VAULT_ABI,
        functionName: 'deposit',
        args: [amountWei],
      });

      await wagmiPublicClient.waitForTransactionReceipt({ hash });
      queryClient.invalidateQueries({ queryKey: ['sellerBond'] });

      return hash;
    } catch (err: any) {
      const error = new Error(err.message || 'Failed to deposit bond');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [walletClient, wagmiPublicClient, bondVaultAddress, queryClient]);

  // Withdraw bond
  const withdrawBond = useCallback(async (amount: string) => {
    if (!walletClient || !wagmiPublicClient) {
      throw new Error('Wallet not connected');
    }

    if (bondVaultAddress === '0x0000000000000000000000000000000000000000') {
      throw new Error('Bond vault not deployed');
    }

    setIsLoading(true);
    setError(null);

    try {
      const amountWei = parseUnits(amount, 6);

      const hash = await walletClient.writeContract({
        address: bondVaultAddress,
        abi: SELLER_BOND_VAULT_ABI,
        functionName: 'withdraw',
        args: [amountWei],
      });

      await wagmiPublicClient.waitForTransactionReceipt({ hash });
      queryClient.invalidateQueries({ queryKey: ['sellerBond'] });

      return hash;
    } catch (err: any) {
      const error = new Error(err.message || 'Failed to withdraw bond');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [walletClient, wagmiPublicClient, bondVaultAddress, queryClient]);

  return {
    depositBond,
    withdrawBond,
    isLoading,
    error,
  };
}
