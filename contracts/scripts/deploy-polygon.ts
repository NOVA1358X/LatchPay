import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import "dotenv/config";

/**
 * LatchPay Wave 6 Deployment Script for Polygon Mainnet
 * 
 * Deploys 6 contracts:
 * 1. EndpointRegistry
 * 2. SellerBondVault
 * 3. EscrowVault
 * 4. ReceiptStore
 * 5. ReputationEngine
 * 6. PaymentRouter
 *
 * SAFETY SWITCHES:
 * - MAINNET_DEPLOY=YES required
 * - CONFIRM_DEPLOY=YES required for actual broadcast
 * - chainId must be 137
 */

const USDC_POLYGON = process.env.USDC_POLYGON || "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359";
const PROTOCOL_FEE_BPS = 100; // 1% protocol fee

interface DeploymentAddresses {
  chainId: number;
  usdc: string;
  EndpointRegistry: string;
  EscrowVault: string;
  SellerBondVault: string;
  ReceiptStore: string;
  ReputationEngine: string;
  PaymentRouter: string;
  deploymentBlock: number;
  deployedAt: string;
  deployer: string;
}

async function main() {
  console.log("\n🔒 LatchPay Wave 6 Deployment Script");
  console.log("=".repeat(50));

  // Safety Check 1: Environment Variables
  const MAINNET_DEPLOY = process.env.MAINNET_DEPLOY;
  const CONFIRM_DEPLOY = process.env.CONFIRM_DEPLOY;

  if (MAINNET_DEPLOY !== "YES") {
    console.log("\n⚠️  MAINNET_DEPLOY is not set to YES");
    console.log("   Set MAINNET_DEPLOY=YES in .env to enable mainnet deployment");
    console.log("   Running in simulation mode (local fork)...\n");
  }

  // Safety Check 2: Chain ID
  const chainId = Number((await ethers.provider.getNetwork()).chainId);
  console.log(`\n📡 Connected to chain ID: ${chainId}`);

  if (chainId !== 137 && MAINNET_DEPLOY === "YES") {
    throw new Error(`❌ Chain ID mismatch! Expected 137 (Polygon), got ${chainId}`);
  }

  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log(`👛 Deployer address: ${deployer.address}`);

  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  const balanceInMatic = ethers.formatEther(balance);
  console.log(`💰 Deployer balance: ${balanceInMatic} MATIC`);

  if (MAINNET_DEPLOY === "YES" && parseFloat(balanceInMatic) < 0.5) {
    throw new Error("❌ Insufficient MATIC for deployment. Need at least 0.5 MATIC");
  }

  // Print deployment summary
  console.log("\n📋 Deployment Summary:");
  console.log("-".repeat(50));
  console.log(`   Network: ${chainId === 137 ? "Polygon Mainnet" : "Local Fork"}`);
  console.log(`   USDC Address: ${USDC_POLYGON}`);
  console.log(`   Protocol Fee: ${PROTOCOL_FEE_BPS / 100}%`);
  console.log(`   Fee Recipient: ${deployer.address}`);
  console.log(`   Contracts: 6 (Registry, Escrow, BondVault, Receipts, Reputation, Router)`);
  console.log("-".repeat(50));

  // Final confirmation for mainnet
  if (MAINNET_DEPLOY === "YES") {
    if (CONFIRM_DEPLOY !== "YES") {
      console.log("\n⚠️  CONFIRM_DEPLOY is not set to YES");
      console.log("   This is a MAINNET deployment!");
      console.log("   Set CONFIRM_DEPLOY=YES in .env to confirm\n");
      throw new Error("Deployment aborted: CONFIRM_DEPLOY not set");
    }

    console.log("\n🚨 MAINNET DEPLOYMENT CONFIRMED");
    console.log("   Waiting 5 seconds before deployment...\n");
    await new Promise((r) => setTimeout(r, 5000));
  }

  // Deploy contracts
  console.log("🚀 Starting deployment...\n");

  // 1. Deploy EndpointRegistry
  console.log("1️⃣  Deploying EndpointRegistry...");
  const EndpointRegistry = await ethers.getContractFactory("EndpointRegistry");
  const endpointRegistry = await EndpointRegistry.deploy();
  await endpointRegistry.waitForDeployment();
  const registryAddress = await endpointRegistry.getAddress();
  console.log(`   ✅ EndpointRegistry deployed at: ${registryAddress}`);

  // 2. Deploy SellerBondVault
  console.log("2️⃣  Deploying SellerBondVault...");
  const SellerBondVault = await ethers.getContractFactory("SellerBondVault");
  const sellerBondVault = await SellerBondVault.deploy(USDC_POLYGON);
  await sellerBondVault.waitForDeployment();
  const bondVaultAddress = await sellerBondVault.getAddress();
  console.log(`   ✅ SellerBondVault deployed at: ${bondVaultAddress}`);

  // 3. Deploy EscrowVault
  console.log("3️⃣  Deploying EscrowVault...");
  const EscrowVault = await ethers.getContractFactory("EscrowVault");
  const escrowVault = await EscrowVault.deploy(
    USDC_POLYGON,
    registryAddress,
    PROTOCOL_FEE_BPS,
    deployer.address
  );
  await escrowVault.waitForDeployment();
  const escrowAddress = await escrowVault.getAddress();
  console.log(`   ✅ EscrowVault deployed at: ${escrowAddress}`);

  // 4. Deploy ReceiptStore
  console.log("4️⃣  Deploying ReceiptStore...");
  const ReceiptStore = await ethers.getContractFactory("ReceiptStore");
  const receiptStore = await ReceiptStore.deploy();
  await receiptStore.waitForDeployment();
  const receiptStoreAddress = await receiptStore.getAddress();
  console.log(`   ✅ ReceiptStore deployed at: ${receiptStoreAddress}`);

  // 5. Deploy ReputationEngine
  console.log("5️⃣  Deploying ReputationEngine...");
  const ReputationEngine = await ethers.getContractFactory("ReputationEngine");
  const reputationEngine = await ReputationEngine.deploy();
  await reputationEngine.waitForDeployment();
  const reputationAddress = await reputationEngine.getAddress();
  console.log(`   ✅ ReputationEngine deployed at: ${reputationAddress}`);

  // 6. Deploy PaymentRouter
  console.log("6️⃣  Deploying PaymentRouter...");
  const PaymentRouter = await ethers.getContractFactory("PaymentRouter");
  const paymentRouter = await PaymentRouter.deploy(USDC_POLYGON, escrowAddress);
  await paymentRouter.waitForDeployment();
  const routerAddress = await paymentRouter.getAddress();
  console.log(`   ✅ PaymentRouter deployed at: ${routerAddress}`);

  // Wire up contracts
  console.log("\n🔗 Wiring up contracts...");

  // EndpointRegistry: set BondVault + EscrowVault
  console.log("   Setting BondVault on Registry...");
  const tx1 = await endpointRegistry.setBondVault(bondVaultAddress);
  await tx1.wait();

  console.log("   Setting EscrowVault on Registry...");
  const tx2 = await endpointRegistry.setEscrowVault(escrowAddress);
  await tx2.wait();

  // SellerBondVault: set EscrowVault
  console.log("   Setting EscrowVault on BondVault...");
  const tx3 = await sellerBondVault.setEscrowVault(escrowAddress);
  await tx3.wait();

  // ReceiptStore: set EscrowVault
  console.log("   Setting EscrowVault on ReceiptStore...");
  const tx4 = await receiptStore.setEscrowVault(escrowAddress);
  await tx4.wait();

  // EscrowVault: set BondVault, ReceiptStore, ReputationEngine
  console.log("   Setting BondVault on EscrowVault...");
  const tx5 = await escrowVault.setBondVault(bondVaultAddress);
  await tx5.wait();

  console.log("   Setting ReceiptStore on EscrowVault...");
  const tx6 = await escrowVault.setReceiptStore(receiptStoreAddress);
  await tx6.wait();

  console.log("   Setting ReputationEngine on EscrowVault...");
  const tx7 = await escrowVault.setReputationEngine(reputationAddress);
  await tx7.wait();

  // ReputationEngine: set EscrowVault
  console.log("   Setting EscrowVault on ReputationEngine...");
  const tx8 = await reputationEngine.setEscrowVault(escrowAddress);
  await tx8.wait();

  console.log("   ✅ All contracts wired successfully");

  // Get deployment block
  const currentBlock = await ethers.provider.getBlockNumber();

  // Prepare addresses JSON
  const addresses: DeploymentAddresses = {
    chainId: 137,
    usdc: USDC_POLYGON,
    EndpointRegistry: registryAddress,
    EscrowVault: escrowAddress,
    SellerBondVault: bondVaultAddress,
    ReceiptStore: receiptStoreAddress,
    ReputationEngine: reputationAddress,
    PaymentRouter: routerAddress,
    deploymentBlock: currentBlock,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
  };

  // Write to frontend config
  const frontendConfigDir = path.join(__dirname, "../../frontend/src/config");
  const addressesPath = path.join(frontendConfigDir, "addresses.137.json");

  // Create directory if it doesn't exist
  if (!fs.existsSync(frontendConfigDir)) {
    fs.mkdirSync(frontendConfigDir, { recursive: true });
  }

  fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
  console.log(`\n📄 Addresses written to: ${addressesPath}`);

  // Also write to contracts directory for reference
  const contractsConfigDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(contractsConfigDir)) {
    fs.mkdirSync(contractsConfigDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(contractsConfigDir, "polygon-mainnet.json"),
    JSON.stringify(addresses, null, 2)
  );

  // Print final summary
  console.log("\n" + "=".repeat(50));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(50));
  console.log("\n📋 Contract Addresses:");
  console.log(`   EndpointRegistry:   ${registryAddress}`);
  console.log(`   EscrowVault:        ${escrowAddress}`);
  console.log(`   SellerBondVault:    ${bondVaultAddress}`);
  console.log(`   ReceiptStore:       ${receiptStoreAddress}`);
  console.log(`   ReputationEngine:   ${reputationAddress}`);
  console.log(`   PaymentRouter:      ${routerAddress}`);
  console.log(`\n📦 Deployment Block:   ${currentBlock}`);
  console.log(`⏰ Deployed At:        ${addresses.deployedAt}`);

  if (MAINNET_DEPLOY === "YES") {
    console.log("\n🔍 Verify contracts on Polygonscan:");
    console.log(`   npx hardhat verify --network polygon ${registryAddress}`);
    console.log(`   npx hardhat verify --network polygon ${bondVaultAddress} "${USDC_POLYGON}"`);
    console.log(`   npx hardhat verify --network polygon ${escrowAddress} "${USDC_POLYGON}" "${registryAddress}" "${PROTOCOL_FEE_BPS}" "${deployer.address}"`);
    console.log(`   npx hardhat verify --network polygon ${receiptStoreAddress}`);
    console.log(`   npx hardhat verify --network polygon ${reputationAddress}`);
    console.log(`   npx hardhat verify --network polygon ${routerAddress} "${USDC_POLYGON}" "${escrowAddress}"`);
  }

  console.log("\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  });
