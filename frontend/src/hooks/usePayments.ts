import { useQuery } from '@tanstack/react-query';
import { publicClient } from '../lib/viem';
import { EscrowVaultABI, getContractAddress } from '../lib/contracts';
import { addresses } from '../config/constants';

export interface Payment {
  paymentId: string;
  endpointId: string;
  buyer: string;
  seller: string;
  amount: bigint;
  openedAt: bigint;
  deliveredAt: bigint;
  disputeWindowEnds: bigint;
  status: number;
  buyerNoteHash: string;
  deliveryHash: string;
  responseMetaHash: string;
  evidenceHash: string;
}

export function useBuyerPayments(buyerAddress: string | undefined) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['buyerPayments', buyerAddress],
    queryFn: async (): Promise<Payment[]> => {
      if (!buyerAddress) return [];
      
      const escrowAddress = getContractAddress('EscrowVault');
      if (!escrowAddress || escrowAddress === '0x') {
        return [];
      }

      try {
        const paymentIds = await publicClient.readContract({
          address: escrowAddress,
          abi: EscrowVaultABI,
          functionName: 'getBuyerPayments',
          args: [buyerAddress as `0x${string}`],
        }) as `0x${string}`[];

        const payments = await Promise.all(
          paymentIds.map(async (paymentId) => {
            const data = await publicClient.readContract({
              address: escrowAddress,
              abi: EscrowVaultABI,
              functionName: 'getPayment',
              args: [paymentId],
            }) as any;

            return {
              paymentId: data.paymentId,
              endpointId: data.endpointId,
              buyer: data.buyer,
              seller: data.seller,
              amount: data.amount,
              openedAt: data.openedAt,
              deliveredAt: data.deliveredAt,
              disputeWindowEnds: data.disputeWindowEnds,
              status: Number(data.status),
              buyerNoteHash: data.buyerNoteHash,
              deliveryHash: data.deliveryHash,
              responseMetaHash: data.responseMetaHash,
              evidenceHash: data.evidenceHash,
            };
          })
        );

        return payments;
      } catch (err) {
        console.error('Error fetching buyer payments:', err);
        return [];
      }
    },
    enabled: !!buyerAddress && !!addresses.EscrowVault,
  });

  return {
    payments: data || [],
    isLoading,
    error,
    refetch,
  };
}

export function useSellerPayments(sellerAddress: string | undefined) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['sellerPayments', sellerAddress],
    queryFn: async (): Promise<Payment[]> => {
      if (!sellerAddress) return [];
      
      const escrowAddress = getContractAddress('EscrowVault');
      if (!escrowAddress || escrowAddress === '0x') {
        return [];
      }

      try {
        const paymentIds = await publicClient.readContract({
          address: escrowAddress,
          abi: EscrowVaultABI,
          functionName: 'getSellerPayments',
          args: [sellerAddress as `0x${string}`],
        }) as `0x${string}`[];

        const payments = await Promise.all(
          paymentIds.map(async (paymentId) => {
            const data = await publicClient.readContract({
              address: escrowAddress,
              abi: EscrowVaultABI,
              functionName: 'getPayment',
              args: [paymentId],
            }) as any;

            return {
              paymentId: data.paymentId,
              endpointId: data.endpointId,
              buyer: data.buyer,
              seller: data.seller,
              amount: data.amount,
              openedAt: data.openedAt,
              deliveredAt: data.deliveredAt,
              disputeWindowEnds: data.disputeWindowEnds,
              status: Number(data.status),
              buyerNoteHash: data.buyerNoteHash,
              deliveryHash: data.deliveryHash,
              responseMetaHash: data.responseMetaHash,
              evidenceHash: data.evidenceHash,
            };
          })
        );

        return payments;
      } catch (err) {
        console.error('Error fetching seller payments:', err);
        return [];
      }
    },
    enabled: !!sellerAddress && !!addresses.EscrowVault,
  });

  return {
    payments: data || [],
    isLoading,
    error,
    refetch,
  };
}

export function usePayment(paymentId: string | undefined) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['payment', paymentId],
    queryFn: async (): Promise<Payment | null> => {
      if (!paymentId) return null;
      
      const escrowAddress = getContractAddress('EscrowVault');
      if (!escrowAddress || escrowAddress === '0x') {
        return null;
      }

      try {
        const data = await publicClient.readContract({
          address: escrowAddress,
          abi: EscrowVaultABI,
          functionName: 'getPayment',
          args: [paymentId as `0x${string}`],
        }) as any;

        return {
          paymentId: data.paymentId,
          endpointId: data.endpointId,
          buyer: data.buyer,
          seller: data.seller,
          amount: data.amount,
          openedAt: data.openedAt,
          deliveredAt: data.deliveredAt,
          disputeWindowEnds: data.disputeWindowEnds,
          status: Number(data.status),
          buyerNoteHash: data.buyerNoteHash,
          deliveryHash: data.deliveryHash,
          responseMetaHash: data.responseMetaHash,
          evidenceHash: data.evidenceHash,
        };
      } catch (err) {
        console.error('Error fetching payment:', err);
        return null;
      }
    },
    enabled: !!paymentId && !!addresses.EscrowVault,
  });

  return {
    payment: data,
    isLoading,
    error,
  };
}
