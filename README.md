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

[Live Demo](https://latch-pay-r.vercel.app) • [Documentation](#-documentation) • [Smart Contracts](#-smart-contracts) • [API Reference](#-api-reference)

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
- **On-Chain Reputation**: Composite reputation scoring for sellers & buyers
- **Batch Payments & Revenue Splits**: Advanced routing via PaymentRouter

---

## 🏗️ Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                            LatchPay Protocol (Wave 6)                        │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────┐    HTTP 402     ┌──────────┐    Register    ┌───────────────┐  │
│  │          │ ◄────────────── │          │ ──────────────▶│   Endpoint    │  │
│  │  Buyer   │                 │  Seller  │                │   Registry    │  │
│  │  Client  │ ───────────────▶│   API    │                └───────────────┘  │
│  │          │   Paid Request  │          │                                   │
│  └────┬─────┘                 └────┬─────┘                                   │
│       │                            │                                          │
│       │ Open Escrow                │ Confirm Delivery                         │
│       │                            │                                          │
│       ▼                            ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐     │
│  │                         Polygon PoS Network                          │     │
│  │                                                                      │     │
│  │  ┌────────────┐  ┌──────────────┐  ┌────────────┐  ┌─────────────┐  │     │
│  │  │   Escrow   │  │  SellerBond  │  │  Receipt   │  │  Reputation │  │     │
│  │  │   Vault    │  │    Vault     │  │   Store    │  │   Engine    │  │     │
│  │  └────────────┘  └──────────────┘  └────────────┘  └─────────────┘  │     │
│  │                                                                      │     │
│  │  ┌────────────┐  ┌──────────────┐                                    │     │
│  │  │  Payment   │  │    USDC      │                                    │     │
│  │  │   Router   │  │   Token      │                                    │     │
│  │  └────────────┘  └──────────────┘                                    │     │
│  └──────────────────────────────────────────────────────────────────────┘     │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
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
     │            │  Dispute    │  ← Configurable window   │
     │            │   Window    │                          │
     │            └──────┬──────┘                          │
     │                   │                                 │
     │                   ▼                                 │
     │  ┌─────────────┐     ┌──────────────────┐          │
     │  │   Funds     │────▶│ Reputation Score  │          │
     │  │  Released   │     │    Updated        │          │
     │  └─────────────┘     └──────────────────┘          │
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

### Deployed Addresses (Polygon Mainnet — Block 83419504)

| Contract | Address | Description |
|----------|---------|-------------|
| **EndpointRegistry** | `0xe6B482BD271E02BD4CF9c58a895ac1e721aBdf04` | API endpoint registry |
| **EscrowVault** | `0xadb05512B6a2FD89Dfc01bC6f2276f0ceCCEAfB5` | Payment escrow with EIP-712 proofs |
| **SellerBondVault** | `0x648F2A0d86B998a76FaD2e454D9909CDd37f5A8e` | Seller collateral & slashing |
| **ReceiptStore** | `0xCF314A60a395e0bfd1E09108d6bA1cdB17D8Bf16` | Immutable on-chain receipts |
| **ReputationEngine** | `0xa5b5FC4F47aacDaf86404754CE15EB48a4dEdCe6` | On-chain reputation scoring |
| **PaymentRouter** | `0x6b0f731bBF78D2FF9538F0B44e7589B62C209964` | Batch payments & revenue splits |
| **USDC** | `0x3c499c542cef5e3811e1192ce70d8cc03d5c3359` | Circle's native USDC |

> **Deployer:** `0xd8518e143f594D05f8e0e4401dfF7a2387aA2b1d`  
> **Deployed:** 2026-02-24 — All contracts verified on PolygonScan

### Contract Details

#### 🏪 EndpointRegistry
Manages API endpoint listings with metadata, pricing, and discovery.

**Features:**
- Register/update API endpoints with JSON metadata URI
- Set per-call pricing in USDC (6 decimals)
- Define configurable dispute windows
- Category-based discovery (AI, Data, Compute, Storage, Oracle)
- Active/inactive status management
- Call counter incremented automatically by EscrowVault

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
Holds buyer payments in escrow until delivery is proven via EIP-712 signatures.

**Features:**
- USDC escrow with atomic operations
- EIP-712 typed signature verification for delivery proofs
- Configurable dispute windows per endpoint
- Automatic release after dispute window expires
- Refund mechanism for failed deliveries
- Integrates with ReputationEngine for score updates
- Stores receipts in ReceiptStore on delivery confirmation

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

function releasePayment(bytes32 paymentId)
function refund(bytes32 paymentId)
```

#### 🛡️ SellerBondVault
Manages seller collateral with rule-based slashing.

**Features:**
- USDC bond deposits
- 7-day minimum lock period
- Slashing for proven misbehavior (max 50%)
- Active payment tracking
- Withdrawal restrictions during active escrows
- Slash records with reason strings

**Key Functions:**
```solidity
function deposit(uint256 amount)
function withdraw(uint256 amount)
function slash(address seller, bytes32 paymentId, uint256 amount, string reason)
```

#### 📋 ReceiptStore
Immutable on-chain storage for delivery receipts.

**Features:**
- Permanent receipt storage per payment
- Delivery hash + response metadata hash
- Timestamp and amount tracking
- Public verifiability for auditing

#### ⭐ ReputationEngine
On-chain reputation scoring for sellers and buyers.

**Features:**
- Composite score formula: `(successRate × 70%) + (lowDisputeRate × 20%) + (volumeBonus × 10%)`
- Tracks deliveries, disputes, refunds, and USDC volume
- Separate seller and buyer scoring
- Top-50 seller leaderboard
- Score queries callable by any contract or frontend

**Key Functions:**
```solidity
function getSellerCompositeScore(address seller) returns (uint256)
function getBuyerCompositeScore(address buyer) returns (uint256)
function getTopSellers() returns (address[])
```

#### 🔀 PaymentRouter
Advanced payment routing for batch operations and revenue sharing.

**Features:**
- Batch `openEscrow` calls (up to 10 per tx)
- Configurable revenue splits (up to 5 recipients per seller)
- Split balance accumulation and withdrawal
- Convenience wrapper around EscrowVault

**Key Functions:**
```solidity
function batchOpenEscrow(BatchPaymentParams[] params) returns (BatchPaymentResult[])
function configureRevenueSplit(address[] recipients, uint256[] sharesBps)
function withdrawSplitBalance()
```

---

## 🖥️ Frontend Application

### Pages & Features

#### 🏠 Landing Page (`/`)
- Hero section with value proposition
- Feature highlights with animated cards
- How it works step-by-step
- Featured API endpoints from marketplace
- Call-to-action buttons

#### 🛒 Marketplace (`/marketplace`)
- Browse all registered API endpoints
- Filter by category (AI, Data, Compute, Storage, Oracle)
- Smart name extraction from metadata URI
- Price display in USDC
- Quick-buy actions

#### 📊 Endpoint Details (`/endpoint/:id`)
- Full endpoint metadata display
- Pricing information with USDC amounts
- Seller reputation score
- Direct purchase flow with USDC approval
- Responsive layout for long metadata URIs

#### 💼 Buyer Dashboard (`/buyer`)
- Payment history with real-time status tracking
- Active escrows with "Awaiting Delivery" status
- Release button (appears when dispute window expires)
- Dispute management
- Receipt verification

#### 🏪 Seller Dashboard (`/seller`)
- Register new endpoints with metadata URI
- Manage existing endpoints (activate/deactivate)
- View earnings and claimed payments
- Bond management (deposit/withdraw)
- Delivery confirmation with EIP-712 signatures

#### 🔍 Polygon Explorer (`/explorer`)
- Full historical event scanning from deployment block
- EndpointRegistered, EscrowOpened, DeliveryConfirmed events
- Transaction hash + address linking to PolygonScan
- Real-time network statistics

#### 📚 Documentation (`/docs`)
- Integration guides
- API reference
- Smart contract docs
- Metadata JSON examples

#### ⚙️ Settings (`/settings`)
- Wallet management
- Network switching
- Theme preferences

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | React 18 + TypeScript |
| **Build** | Vite 5.1 |
| **Styling** | TailwindCSS 3.4 |
| **Web3** | wagmi 3.4 + viem 2.45 |
| **Wallet** | Dynamic.xyz SDK |
| **State** | TanStack Query |
| **Animation** | Framer Motion |
| **Routing** | React Router 6 |
| **RPC** | Multi-RPC fallback (no API key needed) |

### RPC Configuration

LatchPay uses a **multi-RPC fallback transport** — no API keys required:

```
publicnode → 1rpc → quiknode → polygon-rpc
```

If one provider is down, the next is tried automatically. Both the standalone `publicClient` (used in hooks) and the wallet provider share this fallback configuration.

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.x
- npm >= 9.x
- MetaMask or compatible wallet
- POL (MATIC) for gas fees
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
POLYGONSCAN_API_KEY=your_polygonscan_key
```

**frontend/.env:**
```env
VITE_DYNAMIC_ENV_ID=your_dynamic_environment_id
VITE_DEFAULT_CHAIN_ID=137
```

> **Note:** Contract addresses are loaded automatically from `src/config/addresses.137.json` — no address environment variables needed. RPC uses public endpoints with automatic fallback — no API keys required.

### Run Development Server

```bash
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

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
   - Add `.npmrc` with `legacy-peer-deps=true` (already included)

3. **Set Environment Variables**

| Variable | Description |
|----------|-------------|
| `VITE_DYNAMIC_ENV_ID` | Dynamic.xyz environment ID |
| `VITE_DEFAULT_CHAIN_ID` | `137` (Polygon Mainnet) |

> Contract addresses are built-in via `addresses.137.json`. Multi-RPC fallback uses public endpoints — no API keys needed.

4. **Deploy**
   - Click Deploy
   - Wait for build to complete
   - Access your live site!

**Live:** [https://latch-pay-r.vercel.app](https://latch-pay-r.vercel.app)

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

### Metadata JSON Format

Endpoints use JSON metadata hosted at a URI. Example:

```json
{
  "name": "AI Text Summarizer",
  "description": "Summarizes long text using GPT-4",
  "category": "ai",
  "version": "1.0.0",
  "endpoint": "https://api.example.com/summarize",
  "method": "POST",
  "pricing": { "perCall": "0.10", "currency": "USDC" },
  "sla": { "maxLatency": "5s", "uptime": "99.5%" }
}
```

See the `metadata/` folder for more examples.

---

## 🔒 Security

### Trust Model

| Component | Trust Level | Notes |
|-----------|-------------|-------|
| Polygon Network | Medium | Trust validators for consensus |
| Smart Contracts | Trustless | Code is law, verified on PolygonScan |
| Delivery Proofs | Trustless | EIP-712 cryptographic signatures |
| Reputation | Trustless | Computed from on-chain data |
| Arbitrator | Trusted | Only for dispute resolution |

### Protections

**For Buyers:**
- ✅ Funds in escrow until delivery proven
- ✅ Configurable dispute window before release
- ✅ Seller bond slashing for misbehavior
- ✅ Refund mechanism for failed deliveries
- ✅ On-chain reputation visibility

**For Sellers:**
- ✅ EIP-712 cryptographic delivery proofs
- ✅ Automatic release after dispute window
- ✅ Bond protects against false disputes
- ✅ On-chain receipts as immutable evidence
- ✅ Reputation score rewards good behavior

---

## 📊 Project Stats

- **Smart Contracts:** 6 (Solidity 0.8.20)
- **Lines of Solidity:** ~2,000
- **Lines of TypeScript:** ~9,000
- **Frontend Pages:** 8
- **Custom Hooks:** 9
- **React Components:** 30+
- **Deployment Block:** 83,419,504

---

## 🛣️ Roadmap

### Wave 1-6 ✅ (Complete)
- [x] Core smart contracts (EndpointRegistry, EscrowVault, SellerBondVault, ReceiptStore)
- [x] ReputationEngine — on-chain reputation scoring with leaderboard
- [x] PaymentRouter — batch payments and revenue splits
- [x] Frontend application with 8 pages
- [x] Polygon mainnet deployment (all 6 contracts)
- [x] Multi-RPC fallback transport (no API keys)
- [x] Category-based marketplace with filtering
- [x] Full historical event explorer
- [x] Buyer payment release flow
- [x] Dynamic.xyz wallet integration
- [x] Vercel production deployment

### Next Phases
- [ ] SDK release (`@latchpay/sdk`)
- [ ] Multi-chain support (Base, Arbitrum)
- [ ] Advanced analytics dashboard
- [ ] API endpoint templates
- [ ] Decentralized arbitration
- [ ] Subscription payment models
- [ ] Rate limiting integration
- [ ] CDN & edge caching

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

- [Polygon](https://polygon.technology/) — Scalable blockchain infrastructure
- [Circle](https://circle.com/) — USDC stablecoin
- [Dynamic](https://dynamic.xyz/) — Wallet authentication
- [OpenZeppelin](https://openzeppelin.com/) — Smart contract libraries
- [Viem](https://viem.sh/) — TypeScript Ethereum library
- [wagmi](https://wagmi.sh/) — React hooks for Ethereum

---

<div align="center">

**Built with 💜 for the decentralized web**

[Website](https://latch-pay-r.vercel.app) • [GitHub](https://github.com/NOVA1358X/LatchPay)

</div>
