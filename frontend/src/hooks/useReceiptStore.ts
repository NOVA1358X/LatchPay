import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { publicClient } from '../lib/viem';
import { addresses } from '../config/constants';
import { ReceiptStoreABI } from '../lib/contracts';

export interface Receipt {
  paymentId: string;
  endpointId: string;
  buyer: string;
  seller: string;
  deliveryHash: string;
  responseMetaHash: string;
  timestamp: number;
  amount: bigint;
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
        const exists = await publicClient.readContract({
          address: receiptStoreAddress,
          abi: ReceiptStoreABI,
          functionName: 'receiptExists',
          args: [paymentId as `0x${string}`],
        });

        if (!exists) return null;

        // Get receipt data - returns full Receipt struct
        const data = await publicClient.readContract({
          address: receiptStoreAddress,
          abi: ReceiptStoreABI,
          functionName: 'getReceipt',
          args: [paymentId as `0x${string}`],
        }) as any;

        return {
          paymentId: data.paymentId,
          endpointId: data.endpointId,
          buyer: data.buyer,
          seller: data.seller,
          deliveryHash: data.deliveryHash,
          responseMetaHash: data.responseMetaHash,
          timestamp: Number(data.timestamp),
          amount: data.amount,
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
    expectedDeliveryHash: string,
    expectedResponseMetaHash: string
  ): Promise<{ valid: boolean; receipt: Receipt | null }> => {
    const receiptStoreAddress = addresses.ReceiptStore;
    if (!receiptStoreAddress || receiptStoreAddress === '0x0000000000000000000000000000000000000000') {
      return { valid: false, receipt: null };
    }

    try {
      const exists = await publicClient.readContract({
        address: receiptStoreAddress,
        abi: ReceiptStoreABI,
        functionName: 'receiptExists',
        args: [paymentId as `0x${string}`],
      });

      if (!exists) {
        return { valid: false, receipt: null };
      }

      const data = await publicClient.readContract({
        address: receiptStoreAddress,
        abi: ReceiptStoreABI,
        functionName: 'getReceipt',
        args: [paymentId as `0x${string}`],
      }) as any;

      const receipt: Receipt = {
        paymentId: data.paymentId,
        endpointId: data.endpointId,
        buyer: data.buyer,
        seller: data.seller,
        deliveryHash: data.deliveryHash,
        responseMetaHash: data.responseMetaHash,
        timestamp: Number(data.timestamp),
        amount: data.amount,
      };

      // Verify hashes match
      const valid = 
        data.deliveryHash.toLowerCase() === expectedDeliveryHash.toLowerCase() &&
        data.responseMetaHash.toLowerCase() === expectedResponseMetaHash.toLowerCase();

      return { valid, receipt };
    } catch (err) {
      console.error('Failed to verify delivery:', err);
      return { valid: false, receipt: null };
    }
  }, []);

  return { verifyDelivery };
}
