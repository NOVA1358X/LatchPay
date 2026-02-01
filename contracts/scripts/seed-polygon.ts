import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import "dotenv/config";

/**
 * Seed Script for LatchPay - Registers sample endpoints on Polygon Mainnet
 * 
 * SAFETY: Only runs if SEED_MAINNET=YES is set
 */

interface DeploymentAddresses {
  endpointRegistry: string;
  escrowVault: string;
  sellerBondVault: string;
  receiptStore: string;
}

const CATEGORIES = {
  AI: ethers.keccak256(ethers.toUtf8Bytes("AI")),
  DATA: ethers.keccak256(ethers.toUtf8Bytes("DATA")),
  COMPUTE: ethers.keccak256(ethers.toUtf8Bytes("COMPUTE")),
  STORAGE: ethers.keccak256(ethers.toUtf8Bytes("STORAGE")),
  ORACLE: ethers.keccak256(ethers.toUtf8Bytes("ORACLE")),
};

// Sample endpoints to seed (prices in USDC with 6 decimals)
const SAMPLE_ENDPOINTS = [
  {
    metadataURI: "ipfs://QmSampleEndpoint1/metadata.json",
    pricePerCall: ethers.parseUnits("0.01", 6), // $0.01 per call
    category: CATEGORIES.AI,
    disputeWindowSeconds: 24 * 60 * 60, // 24 hours
    requiredBond: 0,
  },
  {
    metadataURI: "ipfs://QmSampleEndpoint2/metadata.json",
    pricePerCall: ethers.parseUnits("0.05", 6), // $0.05 per call
    category: CATEGORIES.DATA,
    disputeWindowSeconds: 12 * 60 * 60, // 12 hours
    requiredBond: 0,
  },
  {
    metadataURI: "ipfs://QmSampleEndpoint3/metadata.json",
    pricePerCall: ethers.parseUnits("0.001", 6), // $0.001 per call
    category: CATEGORIES.ORACLE,
    disputeWindowSeconds: 6 * 60 * 60, // 6 hours
    requiredBond: 0,
  },
];

async function main() {
  console.log("\n🌱 LatchPay Seed Script");
  console.log("=".repeat(50));

  // Safety check
  if (process.env.SEED_MAINNET !== "YES") {
    console.log("\n⚠️  SEED_MAINNET is not set to YES");
    console.log("   Set SEED_MAINNET=YES in .env to seed mainnet data");
    console.log("   Exiting...\n");
    return;
  }

  // Load deployment addresses
  const addressesPath = path.join(__dirname, "../../frontend/src/config/addresses.137.json");
  
  if (!fs.existsSync(addressesPath)) {
    throw new Error("Deployment addresses not found. Run deploy-polygon.ts first.");
  }

  const addresses: DeploymentAddresses = JSON.parse(fs.readFileSync(addressesPath, "utf-8"));

  const [deployer] = await ethers.getSigners();
  console.log(`\n👛 Seeding as: ${deployer.address}`);

  // Get registry contract
  const registry = await ethers.getContractAt("EndpointRegistry", addresses.endpointRegistry);

  console.log("\n📝 Registering sample endpoints...\n");

  for (let i = 0; i < SAMPLE_ENDPOINTS.length; i++) {
    const endpoint = SAMPLE_ENDPOINTS[i];
    console.log(`   Registering endpoint ${i + 1}/${SAMPLE_ENDPOINTS.length}...`);
    
    const tx = await registry.registerEndpoint(
      endpoint.metadataURI,
      endpoint.pricePerCall,
      endpoint.category,
      endpoint.disputeWindowSeconds,
      endpoint.requiredBond
    );
    
    const receipt = await tx.wait();
    
    // Get endpoint ID from event
    const event = receipt?.logs.find(
      (log: any) => log.fragment?.name === "EndpointRegistered"
    );
    
    if (event) {
      console.log(`   ✅ Endpoint registered: ${(event as any).args[0]}`);
    }
  }

  console.log("\n🎉 Seeding complete!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
