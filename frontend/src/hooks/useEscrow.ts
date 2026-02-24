import { useState, useCallback } from 'react';
import { useWalletClient } from 'wagmi';
import { parseUnits, keccak256, toBytes } from 'viem';
import { useQueryClient } from '@tanstack/react-query';
import addresses from '../config/addresses.137.json';
import { ESCROW_ABI, ERC20_ABI } from '../lib/contracts';
import { USDC_ADDRESS } from '../config/constants';
import { publicClient } from '../lib/viem';

interface UseEscrowOptions {
  onSuccess?: (paymentId: string) => void;
  onError?: (error: Error) => void;
}

export function useEscrow(options: UseEscrowOptions = {}) {
  const { data: walletClient } = useWalletClient();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const escrowAddress = addresses.EscrowVault as `0x${string}`;

  // Check USDC allowance
  const checkAllowance = useCallback(async (owner: `0x${string}`, _amount: bigint) => {
    if (!walletClient) return 0n;
    
    const allowance = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [owner, escrowAddress],
    });
    
    return allowance as bigint;
  }, [publicClient, escrowAddress]);

  // Approve USDC spending
  const approveUSDC = useCallback(async (amount: bigint) => {
    if (!walletClient) throw new Error('Wallet not connected');

    const hash = await walletClient.writeContract({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [escrowAddress, amount],
    });

    if (true) {
      await publicClient.waitForTransactionReceipt({ hash });
    }

    return hash;
  }, [walletClient, publicClient, escrowAddress]);

  // Open a payment in escrow
  const openPayment = useCallback(async (
    endpointId: `0x${string}`,
    amount: string, // USDC amount in human-readable format (e.g., "0.10")
    buyerNote?: string
  ) => {
    if (!walletClient) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      const amountWei = parseUnits(amount, 6); // USDC has 6 decimals
      
      // Create proper bytes32 buyerNoteHash
      const buyerNoteHash = buyerNote 
        ? keccak256(toBytes(buyerNote))
        : keccak256(toBytes(`payment-${Date.now()}`));
      
      // Check allowance
      const currentAllowance = await checkAllowance(
        walletClient.account.address,
        amountWei
      );

      // Approve if needed
      if (currentAllowance < amountWei) {
        await approveUSDC(amountWei * 2n); // Approve 2x for future payments
      }

      // Open payment with correct args: (endpointId, maxPrice, buyerNoteHash)
      const hash = await walletClient.writeContract({
        address: escrowAddress,
        abi: ESCROW_ABI,
        functionName: 'openPayment',
        args: [endpointId, amountWei, buyerNoteHash],
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['buyerPayments'] });

      options.onSuccess?.(hash);
      return { hash, receipt };
    } catch (err: any) {
      const error = new Error(err.message || 'Failed to open payment');
      setError(error);
      options.onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [walletClient, publicClient, escrowAddress, checkAllowance, approveUSDC, queryClient, options]);

  // Release payment (after dispute window)
  const releasePayment = useCallback(async (paymentId: `0x${string}`) => {
    if (!walletClient) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      const hash = await walletClient.writeContract({
        address: escrowAddress,
        abi: ESCROW_ABI,
        functionName: 'release',
        args: [paymentId],
      });

      await publicClient.waitForTransactionReceipt({ hash });
      queryClient.invalidateQueries({ queryKey: ['sellerPayments'] });
      
      return hash;
    } catch (err: any) {
      const error = new Error(err.message || 'Failed to release payment');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [walletClient, publicClient, escrowAddress, queryClient]);

  // Dispute payment
  const disputePayment = useCallback(async (paymentId: `0x${string}`, reason: string) => {
    if (!walletClient) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Convert reason string to bytes32 evidence hash
      const evidenceHash = keccak256(toBytes(reason));

      const hash = await walletClient.writeContract({
        address: escrowAddress,
        abi: ESCROW_ABI,
        functionName: 'dispute',
        args: [paymentId, evidenceHash],
      });

      await publicClient.waitForTransactionReceipt({ hash });
      queryClient.invalidateQueries({ queryKey: ['buyerPayments'] });
      
      return hash;
    } catch (err: any) {
      const error = new Error(err.message || 'Failed to dispute payment');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [walletClient, publicClient, escrowAddress, queryClient]);

  // Refund payment (when delivery deadline passed)
  const refundPayment = useCallback(async (paymentId: `0x${string}`) => {
    if (!walletClient) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      const hash = await walletClient.writeContract({
        address: escrowAddress,
        abi: ESCROW_ABI,
        functionName: 'refund',
        args: [paymentId],
      });

      await publicClient.waitForTransactionReceipt({ hash });
      queryClient.invalidateQueries({ queryKey: ['buyerPayments'] });
      
      return hash;
    } catch (err: any) {
      const error = new Error(err.message || 'Failed to refund payment');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [walletClient, publicClient, escrowAddress, queryClient]);

  return {
    openPayment,
    releasePayment,
    disputePayment,
    refundPayment,
    approveUSDC,
    checkAllowance,
    isLoading,
    error,
  };
}

// Hook for sellers to mark delivery
export function useSellerDelivery() {
  const { data: walletClient } = useWalletClient();
    const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const escrowAddress = addresses.EscrowVault as `0x${string}`;

  const markDelivered = useCallback(async (
    paymentId: `0x${string}`,
    requestHash: `0x${string}`,
    responseHash: `0x${string}`,
    signature: `0x${string}`
  ) => {
    if (!walletClient) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);

    try {
      const hash = await walletClient.writeContract({
        address: escrowAddress,
        abi: ESCROW_ABI,
        functionName: 'markDeliveredWithSellerSig',
        args: [paymentId, requestHash, responseHash, signature],
      });

      await publicClient.waitForTransactionReceipt({ hash });
      queryClient.invalidateQueries({ queryKey: ['sellerPayments'] });
      
      return hash;
    } finally {
      setIsLoading(false);
    }
  }, [walletClient, publicClient, escrowAddress, queryClient]);

  return { markDelivered, isLoading };
}
