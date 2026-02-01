import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createPublicClient, http, parseAbi, keccak256, toBytes } from 'viem';
import { polygon } from 'viem/chains';

// Contract addresses - update after deployment
const ESCROW_VAULT = process.env.ESCROW_VAULT_ADDRESS || '0x0000000000000000000000000000000000000000';
const ENDPOINT_ID = process.env.ECHO_ENDPOINT_ID || '0x0000000000000000000000000000000000000000000000000000000000000000';
const SELLER_ADDRESS = process.env.SELLER_ADDRESS || '0x0000000000000000000000000000000000000000';
const PRICE_PER_CALL = process.env.ECHO_PRICE || '100000'; // 0.10 USDC (6 decimals)
const USDC_ADDRESS = '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359';

// Minimal ABI for payment verification
const ESCROW_ABI = parseAbi([
  'function payments(bytes32) view returns (bytes32 endpointId, address buyer, address seller, uint256 amount, uint64 deliveredAt, uint64 releaseAfter, uint8 state)',
]);

const client = createPublicClient({
  chain: polygon,
  transport: http(process.env.ALCHEMY_RPC_URL),
});

interface PaymentInfo {
  endpointId: string;
  buyer: string;
  seller: string;
  amount: bigint;
  deliveredAt: bigint;
  releaseAfter: bigint;
  state: number;
}

async function verifyPayment(paymentId: `0x${string}`): Promise<PaymentInfo | null> {
  try {
    const result = await client.readContract({
      address: ESCROW_VAULT as `0x${string}`,
      abi: ESCROW_ABI,
      functionName: 'payments',
      args: [paymentId],
    });

    const [endpointId, buyer, seller, amount, deliveredAt, releaseAfter, state] = result as any[];
    
    return {
      endpointId,
      buyer,
      seller,
      amount,
      deliveredAt,
      releaseAfter,
      state,
    };
  } catch (error) {
    console.error('Payment verification failed:', error);
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get payment proof from header
  const paymentId = req.headers['x-payment-id'] as string;

  // If no payment ID, return 402 with payment instructions
  if (!paymentId) {
    return res.status(402).json({
      error: 'Payment Required',
      protocol: 'latchpay-402',
      version: '1.0',
      payment: {
        escrowVault: ESCROW_VAULT,
        endpointId: ENDPOINT_ID,
        seller: SELLER_ADDRESS,
        amount: PRICE_PER_CALL,
        token: USDC_ADDRESS,
        tokenSymbol: 'USDC',
        tokenDecimals: 6,
        network: 'polygon',
        chainId: 137,
      },
      instructions: {
        step1: 'Approve USDC spending to EscrowVault address',
        step2: 'Call EscrowVault.openPayment(endpointId, amount, nonce)',
        step3: 'Retry request with X-Payment-Id header set to paymentId',
      },
    });
  }

  // Verify payment on-chain
  const payment = await verifyPayment(paymentId as `0x${string}`);

  if (!payment) {
    return res.status(402).json({
      error: 'Invalid payment ID',
      message: 'Payment not found on-chain',
    });
  }

  // Verify payment state (0 = OPEN, 1 = DELIVERED)
  if (payment.state !== 0 && payment.state !== 1) {
    return res.status(402).json({
      error: 'Payment not valid',
      message: 'Payment has been disputed, released, or refunded',
      state: payment.state,
    });
  }

  // Verify endpoint ID matches
  if (payment.endpointId.toLowerCase() !== ENDPOINT_ID.toLowerCase()) {
    return res.status(402).json({
      error: 'Wrong endpoint',
      message: 'Payment was made for a different endpoint',
    });
  }

  // Verify payment amount
  if (payment.amount < BigInt(PRICE_PER_CALL)) {
    return res.status(402).json({
      error: 'Insufficient payment',
      required: PRICE_PER_CALL,
      received: payment.amount.toString(),
    });
  }

  // === PAYMENT VERIFIED - Execute API Logic ===

  try {
    const { message } = req.body || {};

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing or invalid "message" field in request body',
      });
    }

    // Simple echo with timestamp
    const response = {
      success: true,
      echo: message,
      timestamp: new Date().toISOString(),
      paymentId,
      meta: {
        endpoint: '/api/paid/echo',
        price: `${Number(PRICE_PER_CALL) / 1e6} USDC`,
        network: 'Polygon Mainnet',
      },
    };

    // Create delivery proof hashes (would be signed by seller in production)
    const requestHash = keccak256(toBytes(JSON.stringify(req.body)));
    const responseHash = keccak256(toBytes(JSON.stringify(response)));

    // Add proof headers
    res.setHeader('X-LatchPay-Request-Hash', requestHash);
    res.setHeader('X-LatchPay-Response-Hash', responseHash);
    res.setHeader('X-LatchPay-Payment-Id', paymentId);

    return res.status(200).json(response);
  } catch (error: any) {
    console.error('Echo API error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
}
