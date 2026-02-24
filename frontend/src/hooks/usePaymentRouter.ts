import { useState, useCallback } from 'react';
import { useWalletClient } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { addresses } from '../config/constants';
import { PaymentRouterABI } from '../lib/contracts';
import { publicClient } from '../lib/viem';

interface BatchPaymentParams {
  endpointId: bigint;
  seller: `0x${string}`;
  amount: bigint;
  buyerNoteHash: `0x${string}`;
}

interface RevenueSplit {
  recipients: `0x${string}`[];
  sharesBps: number[];
  active: boolean;
}

export function usePaymentRouter() {
  const { data: walletClient } = useWalletClient();
  const queryClient = useQueryClient();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const routerAddress = addresses.PaymentRouter;

  /**
   * Open multiple payments in a single transaction
   */
  const batchOpenPayments = useCallback(
    async (payments: BatchPaymentParams[]) => {
      if (!walletClient) throw new Error('Wallet not connected');
      if (!routerAddress || routerAddress === '0x0000000000000000000000000000000000000000') {
        throw new Error('PaymentRouter not deployed');
      }

      setIsLoading(true);
      setError(null);

      try {
        const endpointIds = payments.map((p) => p.endpointId);
        const sellers = payments.map((p) => p.seller);
        const amounts = payments.map((p) => p.amount);
        const noteHashes = payments.map((p) => p.buyerNoteHash);

        const hash = await walletClient.writeContract({
          address: routerAddress,
          abi: PaymentRouterABI,
          functionName: 'batchOpenPayments',
          args: [endpointIds, sellers, amounts, noteHashes],
        } as any);
        if (true) { await publicClient.waitForTransactionReceipt({ hash });
        }

        queryClient.invalidateQueries({ queryKey: ['payments'] });
        queryClient.invalidateQueries({ queryKey: ['escrow'] });

        return hash;
      } catch (err: any) {
        const msg = err?.shortMessage || err?.message || 'Batch payment failed';
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [walletClient, publicClient, routerAddress, queryClient]
  );

  /**
   * Set a revenue split for a seller
   */
  const setRevenueSplit = useCallback(
    async (seller: `0x${string}`, recipients: `0x${string}`[], sharesBps: number[]) => {
      if (!walletClient) throw new Error('Wallet not connected');
      if (!routerAddress || routerAddress === '0x0000000000000000000000000000000000000000') {
        throw new Error('PaymentRouter not deployed');
      }

      setIsLoading(true);
      setError(null);

      try {
        const hash = await walletClient.writeContract({
          address: routerAddress,
          abi: PaymentRouterABI,
          functionName: 'setRevenueSplit',
          args: [seller, recipients, sharesBps.map((s) => BigInt(s))],
        } as any);
        if (true) { await publicClient.waitForTransactionReceipt({ hash });
        }

        return hash;
      } catch (err: any) {
        const msg = err?.shortMessage || err?.message || 'Set revenue split failed';
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [walletClient, publicClient, routerAddress]
  );

  /**
   * Remove a revenue split
   */
  const removeRevenueSplit = useCallback(
    async (seller: `0x${string}`) => {
      if (!walletClient) throw new Error('Wallet not connected');
      if (!routerAddress || routerAddress === '0x0000000000000000000000000000000000000000') {
        throw new Error('PaymentRouter not deployed');
      }

      setIsLoading(true);
      setError(null);

      try {
        const hash = await walletClient.writeContract({
          address: routerAddress,
          abi: PaymentRouterABI,
          functionName: 'removeRevenueSplit',
          args: [seller],
        } as any);
        if (true) { await publicClient.waitForTransactionReceipt({ hash });
        }

        return hash;
      } catch (err: any) {
        const msg = err?.shortMessage || err?.message || 'Remove split failed';
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [walletClient, publicClient, routerAddress]
  );

  /**
   * Execute accumulated split balance
   */
  const executeSplit = useCallback(
    async (seller: `0x${string}`) => {
      if (!walletClient) throw new Error('Wallet not connected');
      if (!routerAddress || routerAddress === '0x0000000000000000000000000000000000000000') {
        throw new Error('PaymentRouter not deployed');
      }

      setIsLoading(true);
      setError(null);

      try {
        const hash = await walletClient.writeContract({
          address: routerAddress,
          abi: PaymentRouterABI,
          functionName: 'executeSplit',
          args: [seller],
        } as any);
        if (true) { await publicClient.waitForTransactionReceipt({ hash });
        }

        return hash;
      } catch (err: any) {
        const msg = err?.shortMessage || err?.message || 'Execute split failed';
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [walletClient, publicClient, routerAddress]
  );

  /**
   * Withdraw accumulated split balance
   */
  const withdrawSplitBalance = useCallback(async () => {
    if (!walletClient) throw new Error('Wallet not connected');
    if (!routerAddress || routerAddress === '0x0000000000000000000000000000000000000000') {
      throw new Error('PaymentRouter not deployed');
    }

    setIsLoading(true);
    setError(null);

    try {
      const hash = await walletClient.writeContract({
        address: routerAddress,
        abi: PaymentRouterABI,
        functionName: 'withdrawSplitBalance',
        args: [],
      } as any);
        if (true) { await publicClient.waitForTransactionReceipt({ hash });
      }

      return hash;
    } catch (err: any) {
      const msg = err?.shortMessage || err?.message || 'Withdraw failed';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [walletClient, publicClient, routerAddress]);

  /**
   * Convenience: route payment and open it
   */
  const routeAndPay = useCallback(
    async (
      endpointId: bigint,
      seller: `0x${string}`,
      amount: bigint,
      buyerNoteHash: `0x${string}`
    ) => {
      if (!walletClient) throw new Error('Wallet not connected');
      if (!routerAddress || routerAddress === '0x0000000000000000000000000000000000000000') {
        throw new Error('PaymentRouter not deployed');
      }

      setIsLoading(true);
      setError(null);

      try {
        const hash = await walletClient.writeContract({
          address: routerAddress,
          abi: PaymentRouterABI,
          functionName: 'routeAndPay',
          args: [endpointId, seller, amount, buyerNoteHash],
        } as any);
        if (true) { await publicClient.waitForTransactionReceipt({ hash });
        }

        queryClient.invalidateQueries({ queryKey: ['payments'] });
        queryClient.invalidateQueries({ queryKey: ['escrow'] });

        return hash;
      } catch (err: any) {
        const msg = err?.shortMessage || err?.message || 'Route and pay failed';
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [walletClient, publicClient, routerAddress, queryClient]
  );

  /**
   * Get revenue split info for a seller
   */
  const getRevenueSplit = useCallback(
    async (seller: `0x${string}`): Promise<RevenueSplit | null> => {
      if (!routerAddress || routerAddress === '0x0000000000000000000000000000000000000000') {
        return null;
      }

      try {
        const data = await publicClient.readContract({
          address: routerAddress,
          abi: PaymentRouterABI,
          functionName: 'getRevenueSplit',
          args: [seller],
        }) as any;

        return {
          recipients: data.recipients || data[0],
          sharesBps: (data.sharesBps || data[1]).map((s: bigint) => Number(s)),
          active: data.active ?? data[2],
        };
      } catch {
        return null;
      }
    },
    [routerAddress]
  );

  return {
    batchOpenPayments,
    setRevenueSplit,
    removeRevenueSplit,
    executeSplit,
    withdrawSplitBalance,
    routeAndPay,
    getRevenueSplit,
    isLoading,
    error,
  };
}
