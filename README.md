# 🔐 LatchPay

<div align="center">

![LatchPay Banner](https://img.shields.io/badge/LatchPay-Web3%20API%20Payments-8247E5?style=for-the-badge&logo=ethereum&logoColor=white)

**Trust-Minimized Pay-Per-Use API Micropayments on Polygon PoS**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636.svg?logo=solidity)](https://docs.soliditylang.org/)
[![Polygon](https://img.shields.io/badge/Network-Polygon%20PoS-8247E5.svg?logo=polygon)](https://polygon.technology/)
[![React](https://img.shields.io/badge/React-18.2-61DAFB.svg?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.1-646CFF.svg?logo=vite)](https://vitejs.dev/)

[Live Demo](https://latchpay.vercel.app) • [Documentation](#-documentation) • [Smart Contracts](#-smart-contracts) • [API Reference](#-api-reference)

</div>

---

## 🌟 What is LatchPay?

LatchPay is a **decentralized payment protocol** that enables API providers to monetize their services with **trustless micropayments**. Using the HTTP 402 "Payment Required" status code and smart contract escrow, LatchPay creates a seamless pay-per-use experience for Web3 APIs.

### 💡 The Problem

Traditional API monetization has significant issues:
- **Subscription Lock-in**: Users pay for capacity they don't use
- **Trust Requirements**: Buyers must trust sellers to deliver after payment
- **High Fees**: Credit card processing makes micropayments impractical
- **No Guarantees**: No recourse if API doesn't deliver as promised

### ✨ The Solution

LatchPay solves these with:
- **Pay-Per-Call**: Only pay for what you use, down to fractions of a cent
- **Escrow Protection**: Funds locked until cryptographic proof of delivery
- **Near-Zero Fees**: Polygon's low gas (~$0.001-0.01 per tx)
- **Dispute Resolution**: Time-limited window to challenge bad service
- **Seller Bonds**: Economic security via slashable collateral

---

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           LatchPay Protocol                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────┐    HTTP 402     ┌──────────┐    Register    ┌───────────┐ │
│  │          │ ◄────────────── │          │ ──────────────▶│ Endpoint  │ │
│  │  Buyer   │                 │  Seller  │                │ Registry  │ │
│  │  Client  │ ───────────────▶│   API    │                └───────────┘ │
│  │          │   Paid Request  │          │                              │
│  └────┬─────┘                 └────┬─────┘                              │
│       │                            │                                     │
│       │ Open Escrow                │ Confirm Delivery                    │
│       │                            │                                     │
│       ▼                            ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                        Polygon PoS Network                       │    │
│  │  ┌───────────┐  ┌──────────────┐  ┌───────────┐  ┌───────────┐  │    │
│  │  │  Escrow   │  │ SellerBond   │  │  Receipt  │  │   USDC    │  │    │
│  │  │   Vault   │  │    Vault     │  │   Store   │  │  Token    │  │    │
│  │  └───────────┘  └──────────────┘  └───────────┘  └───────────┘  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Payment Flow

```
┌─────────┐                                           ┌─────────┐
│  BUYER  │                                           │ SELLER  │
└────┬────┘                                           └────┬────┘
     │                                                     │
     │  1. HTTP Request (no payment)                       │
     │ ──────────────────────────────────────────────────▶ │
     │                                                     │
     │  2. HTTP 402 Payment Required                       │
     │     {price, escrowAddress, endpointId}              │
     │ ◀────────────────────────────────────────────────── │
     │                                                     │
     │  3. Approve USDC + Open Escrow                      │
     │ ──────────────────┐                                 │
     │                   ▼                                 │
     │            ┌─────────────┐                          │
     │            │   Escrow    │                          │
     │            │    Vault    │                          │
     │            └─────────────┘                          │
     │                                                     │
     │  4. Retry Request + X-Payment-Id header             │
     │ ──────────────────────────────────────────────────▶ │
     │                                                     │
     │  5. Response + EIP-712 Delivery Proof               │
     │ ◀────────────────────────────────────────────────── │
     │                                                     │
     │            ┌─────────────┐                          │
     │            │  24h Dispute│                          │
     │            │   Window    │                          │
     │            └──────┬──────┘                          │
     │                   │                                 │
     │                   ▼                                 │
     │            ┌─────────────┐                          │
     │            │   Funds     │ ─────────────────────────│
     │            │  Released   │                          │
     │            └─────────────┘                          │
     │                                                     │
```

---

## 🔷 Why Polygon?

LatchPay is deployed on **Polygon PoS** for several key advantages:

| Feature | Benefit |
|---------|---------|
| **⚡ Fast Finality** | ~2 second block times for instant payments |
| **💰 Low Gas Fees** | $0.001-0.01 per transaction vs $5-50 on Ethereum |
| **🏦 Native USDC** | Circle's official USDC deployment (not bridged) |
| **🔒 EVM Compatible** | Full Solidity support with battle-tested tooling |
| **🌐 Ecosystem** | Large DeFi ecosystem and wallet support |
| **📈 Scalability** | 7,000+ TPS handles high-volume API calls |

### Gas Cost Comparison

| Action | Polygon | Ethereum |
|--------|---------|----------|
| Open Escrow | ~$0.005 | ~$15 |
| Confirm Delivery | ~$0.003 | ~$10 |
| Register Endpoint | ~$0.01 | ~$20 |

---

## 📜 Smart Contracts

### Deployed Addresses (Polygon Mainnet)

| Contract | Address | Description |
|----------|---------|-------------|
| **EndpointRegistry** | `0xB949Eb2167CD7669e688B292924829364698d158` | API endpoint registry |
| **EscrowVault** | `0xE15194bac21572E14dAEf4e1f3762083957375F4` | Payment escrow |
| **SellerBondVault** | `0xf00035923C1A85E146de312E55ABe9270F7Bb702` | Seller collateral |
| **ReceiptStore** | `0xb11e66d9a63DC8206DAaFD7037c6730a09A360C7` | On-chain receipts |
| **USDC** | `0x3c499c542cef5e3811e1192ce70d8cc03d5c3359` | Circle's native USDC |

### Contract Details

#### 🏪 EndpointRegistry
Manages API endpoint listings with metadata, pricing, and discovery.

**Features:**
- Register/update API endpoints
- Set per-call pricing in USDC
- Define dispute windows
- Category-based discovery
- Active/inactive status management

**Key Functions:**
```solidity
function registerEndpoint(
    string metadataURI,
    uint256 pricePerCall,
    bytes32 category,
    uint256 disputeWindowSeconds,
    uint256 requiredBond
) returns (bytes32 endpointId)

function getEndpoint(bytes32 endpointId) returns (Endpoint)
function getAllEndpointIds() returns (bytes32[])
function getSellerEndpoints(address seller) returns (bytes32[])
```

#### 🔒 EscrowVault
Holds buyer payments in escrow until delivery is proven.

**Features:**
- USDC escrow with atomic operations
- EIP-712 typed signature verification
- Time-locked dispute windows
- Automatic release after window expires
- Refund mechanism for failed deliveries

**Key Functions:**
```solidity
function openEscrow(
    bytes32 endpointId,
    bytes32 requestHash,
    uint256 amount
) returns (bytes32 paymentId)

function confirmDelivery(
    bytes32 paymentId,
    bytes32 responseHash,
    bytes sellerSignature
)

function claimPayment(bytes32 paymentId)
function refund(bytes32 paymentId)
```

#### 🛡️ SellerBondVault
Manages seller collateral with rule-based slashing.

**Features:**
- USDC bond deposits
- 7-day minimum lock period
- Slashing for proven misbehavior
- Active payment tracking
- Withdrawal restrictions during active payments

**Key Functions:**
```solidity
function deposit(uint256 amount)
function withdraw(uint256 amount)
function slash(address seller, bytes32 paymentId, uint256 amount, string reason)
```

#### 📋 ReceiptStore
Immutable on-chain storage for delivery receipts.

**Features:**
- Permanent receipt storage
- Request/response hash verification
- Timestamp tracking
- Public verifiability

---

## 🖥️ Frontend Application

### Pages & Features

#### 🏠 Landing Page (`/`)
- Hero section with value proposition
- Feature highlights
- How it works explanation
- Featured API endpoints
- Call-to-action buttons

#### 🛒 Marketplace (`/marketplace`)
- Browse all registered API endpoints
- Filter by category (AI, Data, Compute, Storage, Oracle)
- Search functionality
- Price and rating display
- Quick-buy actions

#### 📊 Endpoint Details (`/endpoint/:id`)
- Full endpoint documentation
- Pricing information
- Seller reputation
- Usage examples
- Direct purchase flow

#### 💼 Buyer Dashboard (`/buyer`)
- Payment history
- Active escrows
- Dispute management
- Receipt downloads
- Usage analytics

#### 🏪 Seller Dashboard (`/seller`)
- Register new endpoints
- Manage existing endpoints
- View earnings
- Bond management
- Payment tracking

#### 🔍 Polygon Explorer (`/explorer`)
- Real-time blockchain data
- Transaction search
- Contract interactions
- Network statistics

#### 📚 Documentation (`/docs`)
- Integration guides
- API reference
- Smart contract docs
- SDK documentation

#### ⚙️ Settings (`/settings`)
- Wallet management
- Network switching
- Theme preferences
- Notification settings

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | React 18 + TypeScript |
| **Build** | Vite 5.1 |
| **Styling** | TailwindCSS 3.4 |
| **Web3** | wagmi + viem |
| **Wallet** | Dynamic.xyz SDK |
| **State** | TanStack Query |
| **Animation** | Framer Motion |
| **Routing** | React Router 6 |

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.x
- npm >= 9.x
- MetaMask or compatible wallet
- MATIC for gas fees
- USDC for payments

### Installation

```bash
# Clone repository
git clone https://github.com/NOVA1358X/LatchPay.git
cd LatchPay

# Install contract dependencies
cd contracts
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Configuration

**contracts/.env:**
```env
PRIVATE_KEY=your_deployer_private_key
ALCHEMY_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY
POLYGONSCAN_API_KEY=your_polygonscan_key
```

**frontend/.env:**
```env
VITE_DYNAMIC_ENVIRONMENT_ID=your_dynamic_env_id
VITE_ALCHEMY_API_KEY=your_alchemy_key

# Contract Addresses (already deployed)
VITE_ENDPOINT_REGISTRY_ADDRESS=0xB949Eb2167CD7669e688B292924829364698d158
VITE_ESCROW_VAULT_ADDRESS=0xE15194bac21572E14dAEf4e1f3762083957375F4
VITE_SELLER_BOND_VAULT_ADDRESS=0xf00035923C1A85E146de312E55ABe9270F7Bb702
VITE_RECEIPT_STORE_ADDRESS=0xb11e66d9a63DC8206DAaFD7037c6730a09A360C7
```

### Run Development Server

```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
cd frontend
npm run build
```

---

## ☁️ Vercel Deployment

### Deploy to Vercel

1. **Connect Repository**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Select the `frontend` folder as root directory

2. **Configure Build**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Set Environment Variables**

| Variable | Description |
|----------|-------------|
| `VITE_DYNAMIC_ENVIRONMENT_ID` | Dynamic.xyz environment ID |
| `VITE_ALCHEMY_API_KEY` | Alchemy API key for RPC |
| `VITE_ENDPOINT_REGISTRY_ADDRESS` | EndpointRegistry contract |
| `VITE_ESCROW_VAULT_ADDRESS` | EscrowVault contract |
| `VITE_SELLER_BOND_VAULT_ADDRESS` | SellerBondVault contract |
| `VITE_RECEIPT_STORE_ADDRESS` | ReceiptStore contract |
| `OPENAI_API_KEY` | (Optional) For AI endpoints |

4. **Deploy**
   - Click Deploy
   - Wait for build to complete
   - Access your live site!

---

## 📡 API Integration

### HTTP 402 Flow

```javascript
// 1. Make initial request
const response = await fetch('https://api.example.com/paid/endpoint', {
  method: 'POST',
  body: JSON.stringify({ data: 'your request' })
});

// 2. Handle 402 response
if (response.status === 402) {
  const paymentInfo = await response.json();
  // { price, endpointId, escrowAddress }
  
  // 3. Open escrow payment
  const paymentId = await openEscrow(paymentInfo);
  
  // 4. Retry with payment
  const paidResponse = await fetch('https://api.example.com/paid/endpoint', {
    method: 'POST',
    headers: {
      'X-Payment-Id': paymentId
    },
    body: JSON.stringify({ data: 'your request' })
  });
  
  // 5. Get response with delivery proof
  const result = await paidResponse.json();
  // { data, proof: { responseHash, signature } }
}
```

### SDK Example

```typescript
import { LatchPayClient } from '@latchpay/sdk';

const client = new LatchPayClient({
  rpcUrl: 'https://polygon-rpc.com',
  signer: yourWalletSigner
});

// Pay and call in one step
const result = await client.payAndCall({
  endpoint: 'https://api.example.com/paid/summarize',
  method: 'POST',
  body: { text: 'Long text to summarize...' }
});

console.log(result.data); // API response
console.log(result.receipt); // On-chain receipt
```

---

## 🔒 Security

### Trust Model

| Component | Trust Level | Notes |
|-----------|-------------|-------|
| Polygon Network | Medium | Trust validators for consensus |
| Smart Contracts | Trustless | Code is law, verified on-chain |
| Delivery Proofs | Trustless | EIP-712 cryptographic signatures |
| Arbitrator | Trusted | Only for dispute resolution |

### Protections

**For Buyers:**
- ✅ Funds in escrow until delivery proven
- ✅ Dispute window before release
- ✅ Seller bond slashing for misbehavior
- ✅ Refund mechanism for failed deliveries

**For Sellers:**
- ✅ Cryptographic delivery proofs
- ✅ Automatic release after dispute window
- ✅ Bond protects against false disputes
- ✅ On-chain receipts as evidence

---

## 📊 Project Stats

- **Lines of Solidity:** ~1,500
- **Lines of TypeScript:** ~8,000
- **Smart Contracts:** 4
- **Frontend Pages:** 8
- **React Components:** 30+
- **Custom Hooks:** 10+

---

## 🛣️ Roadmap

### Phase 1 ✅ (Current)
- [x] Core smart contracts
- [x] Frontend application
- [x] Polygon mainnet deployment
- [x] Basic marketplace

### Phase 2 (Q2 2026)
- [ ] SDK release
- [ ] Multi-chain support
- [ ] Advanced analytics
- [ ] API templates

### Phase 3 (Q3 2026)
- [ ] Decentralized arbitration
- [ ] Subscription models
- [ ] Rate limiting
- [ ] CDN integration

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md).

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- [Polygon](https://polygon.technology/) - Scalable blockchain infrastructure
- [Circle](https://circle.com/) - USDC stablecoin
- [Dynamic](https://dynamic.xyz/) - Wallet authentication
- [OpenZeppelin](https://openzeppelin.com/) - Smart contract libraries
- [Viem](https://viem.sh/) - TypeScript Ethereum library

---

<div align="center">

**Built with 💜 for the decentralized web**

[Website](https://latchpay.vercel.app) • [Twitter](https://twitter.com/latchpay) • [Discord](https://discord.gg/latchpay)

</div>
