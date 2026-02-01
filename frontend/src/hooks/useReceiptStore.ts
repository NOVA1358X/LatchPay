import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { publicClient } from '../lib/viem';
import { addresses } from '../config/constants';

// ReceiptStore ABI
const RECEIPT_STORE_ABI = [
  {
    type: 'function',
    name: 'getReceipt',
    inputs: [{ name: 'paymentId', type: 'bytes32' }],
    outputs: [
      { name: 'requestHash', type: 'bytes32' },
      { name: 'responseHash', type: 'bytes32' },
      { name: 'storedAt', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'hasReceipt',
    inputs: [{ name: 'paymentId', type: 'bytes32' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'ReceiptStored',
    inputs: [
      { name: 'paymentId', type: 'bytes32', indexed: true },
      { name: 'requestHash', type: 'bytes32', indexed: false },
      { name: 'responseHash', type: 'bytes32', indexed: false },
    ],
  },
] as const;

export interface Receipt {
  paymentId: string;
  requestHash: string;
  responseHash: string;
  storedAt: number;
}

export function useReceipt(paymentId: string | undefined) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['receipt', paymentId],
    queryFn: async (): Promise<Receipt | null> => {
      if (!paymentId) return null;

      const receiptStoreAddress = addresses.ReceiptStore;
      if (!receiptStoreAddress || receiptStoreAddress === '0x0000000000000000000000000000000000000000') {
        return null;
      }

      try {
        // Check if receipt exists
        const hasReceipt = await publicClient.readContract({
          address: receiptStoreAddress,
          abi: RECEIPT_STORE_ABI,
          functionName: 'hasReceipt',
          args: [paymentId as `0x${string}`],
        });

        if (!hasReceipt) return null;

        // Get receipt data
        const [requestHash, responseHash, storedAt] = await publicClient.readContract({
          address: receiptStoreAddress,
          abi: RECEIPT_STORE_ABI,
          functionName: 'getReceipt',
          args: [paymentId as `0x${string}`],
        });

        return {
          paymentId,
          requestHash,
          responseHash,
          storedAt: Number(storedAt),
        };
      } catch (err) {
        console.error('Failed to fetch receipt:', err);
        return null;
      }
    },
    enabled: !!paymentId && addresses.ReceiptStore !== '0x0000000000000000000000000000000000000000',
  });

  return {
    receipt: data,
    isLoading,
    error,
  };
}

// Hook to verify delivery proof
export function useVerifyDelivery() {
  const verifyDelivery = useCallback(async (
    paymentId: string,
    expectedRequestHash: string,
    expectedResponseHash: string
  ): Promise<{ valid: boolean; receipt: Receipt | null }> => {
    const receiptStoreAddress = addresses.ReceiptStore;
    if (!receiptStoreAddress || receiptStoreAddress === '0x0000000000000000000000000000000000000000') {
      return { valid: false, receipt: null };
    }

    try {
      const hasReceipt = await publicClient.readContract({
        address: receiptStoreAddress,
        abi: RECEIPT_STORE_ABI,
        functionName: 'hasReceipt',
        args: [paymentId as `0x${string}`],
      });

      if (!hasReceipt) {
        return { valid: false, receipt: null };
      }

      const [requestHash, responseHash, storedAt] = await publicClient.readContract({
        address: receiptStoreAddress,
        abi: RECEIPT_STORE_ABI,
        functionName: 'getReceipt',
        args: [paymentId as `0x${string}`],
      });

      const receipt: Receipt = {
        paymentId,
        requestHash,
        responseHash,
        storedAt: Number(storedAt),
      };

      // Verify hashes match
      const valid = 
        requestHash.toLowerCase() === expectedRequestHash.toLowerCase() &&
        responseHash.toLowerCase() === expectedResponseHash.toLowerCase();

      return { valid, receipt };
    } catch (err) {
      console.error('Failed to verify delivery:', err);
      return { valid: false, receipt: null };
    }
  }, []);

  return { verifyDelivery };
}
