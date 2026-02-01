import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { 
  EndpointRegistry,
  EscrowVault,
  SellerBondVault,
  ReceiptStore 
} from "../typechain-types";

describe("LatchPay Contracts", function () {
  let owner: SignerWithAddress;
  let seller: SignerWithAddress;
  let buyer: SignerWithAddress;
  let feeRecipient: SignerWithAddress;

  let registry: EndpointRegistry;
  let escrowVault: EscrowVault;
  let bondVault: SellerBondVault;
  let receiptStore: ReceiptStore;
  let mockUSDC: any;

  const PROTOCOL_FEE_BPS = 100; // 1%
  const PRICE_PER_CALL = ethers.parseUnits("1", 6); // 1 USDC
  const DISPUTE_WINDOW = 24 * 60 * 60; // 24 hours

  beforeEach(async function () {
    [owner, seller, buyer, feeRecipient] = await ethers.getSigners();

    // Deploy mock USDC
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockUSDC = await MockERC20.deploy("USD Coin", "USDC", 6);
    await mockUSDC.waitForDeployment();

    // Mint USDC to buyer
    await mockUSDC.mint(buyer.address, ethers.parseUnits("10000", 6));

    // Deploy contracts
    const EndpointRegistry = await ethers.getContractFactory("EndpointRegistry");
    registry = await EndpointRegistry.deploy();
    await registry.waitForDeployment();

    const SellerBondVault = await ethers.getContractFactory("SellerBondVault");
    bondVault = await SellerBondVault.deploy(await mockUSDC.getAddress());
    await bondVault.waitForDeployment();

    const EscrowVault = await ethers.getContractFactory("EscrowVault");
    escrowVault = await EscrowVault.deploy(
      await mockUSDC.getAddress(),
      await registry.getAddress(),
      PROTOCOL_FEE_BPS,
      feeRecipient.address
    );
    await escrowVault.waitForDeployment();

    const ReceiptStore = await ethers.getContractFactory("ReceiptStore");
    receiptStore = await ReceiptStore.deploy();
    await receiptStore.waitForDeployment();

    // Wire up contracts
    await registry.setBondVault(await bondVault.getAddress());
    await bondVault.setEscrowVault(await escrowVault.getAddress());
    await receiptStore.setEscrowVault(await escrowVault.getAddress());
  });

  describe("EndpointRegistry", function () {
    it("should register an endpoint", async function () {
      const categoryHash = ethers.keccak256(ethers.toUtf8Bytes("AI"));
      
      const tx = await registry.connect(seller).registerEndpoint(
        "ipfs://test-metadata",
        PRICE_PER_CALL,
        categoryHash,
        DISPUTE_WINDOW,
        0
      );

      const receipt = await tx.wait();
      expect(receipt?.status).to.equal(1);

      const endpoints = await registry.getSellerEndpoints(seller.address);
      expect(endpoints.length).to.equal(1);
    });

    it("should update an endpoint", async function () {
      const categoryHash = ethers.keccak256(ethers.toUtf8Bytes("AI"));
      
      await registry.connect(seller).registerEndpoint(
        "ipfs://test-metadata",
        PRICE_PER_CALL,
        categoryHash,
        DISPUTE_WINDOW,
        0
      );

      const endpoints = await registry.getSellerEndpoints(seller.address);
      const endpointId = endpoints[0];

      const newPrice = ethers.parseUnits("2", 6);
      await registry.connect(seller).updateEndpoint(
        endpointId,
        "ipfs://updated-metadata",
        newPrice,
        DISPUTE_WINDOW
      );

      const endpoint = await registry.getEndpoint(endpointId);
      expect(endpoint.pricePerCall).to.equal(newPrice);
    });

    it("should deactivate and reactivate an endpoint", async function () {
      const categoryHash = ethers.keccak256(ethers.toUtf8Bytes("AI"));
      
      await registry.connect(seller).registerEndpoint(
        "ipfs://test-metadata",
        PRICE_PER_CALL,
        categoryHash,
        DISPUTE_WINDOW,
        0
      );

      const endpoints = await registry.getSellerEndpoints(seller.address);
      const endpointId = endpoints[0];

      await registry.connect(seller).deactivateEndpoint(endpointId);
      let endpoint = await registry.getEndpoint(endpointId);
      expect(endpoint.active).to.be.false;

      await registry.connect(seller).reactivateEndpoint(endpointId);
      endpoint = await registry.getEndpoint(endpointId);
      expect(endpoint.active).to.be.true;
    });
  });

  describe("EscrowVault", function () {
    let endpointId: string;

    beforeEach(async function () {
      const categoryHash = ethers.keccak256(ethers.toUtf8Bytes("AI"));
      
      await registry.connect(seller).registerEndpoint(
        "ipfs://test-metadata",
        PRICE_PER_CALL,
        categoryHash,
        DISPUTE_WINDOW,
        0
      );

      const endpoints = await registry.getSellerEndpoints(seller.address);
      endpointId = endpoints[0];

      // Approve USDC spending
      await mockUSDC.connect(buyer).approve(
        await escrowVault.getAddress(),
        ethers.parseUnits("10000", 6)
      );
    });

    it("should open a payment", async function () {
      const buyerNoteHash = ethers.keccak256(ethers.toUtf8Bytes("test request"));
      
      const tx = await escrowVault.connect(buyer).openPayment(
        endpointId,
        PRICE_PER_CALL,
        buyerNoteHash
      );

      const receipt = await tx.wait();
      expect(receipt?.status).to.equal(1);

      const buyerPayments = await escrowVault.getBuyerPayments(buyer.address);
      expect(buyerPayments.length).to.equal(1);
    });

    it("should mark as delivered with seller signature", async function () {
      const buyerNoteHash = ethers.keccak256(ethers.toUtf8Bytes("test request"));
      
      await escrowVault.connect(buyer).openPayment(
        endpointId,
        PRICE_PER_CALL,
        buyerNoteHash
      );

      const buyerPayments = await escrowVault.getBuyerPayments(buyer.address);
      const paymentId = buyerPayments[0];

      const deliveryHash = ethers.keccak256(ethers.toUtf8Bytes("delivery content"));
      const responseMetaHash = ethers.keccak256(ethers.toUtf8Bytes("meta"));
      const timestamp = Math.floor(Date.now() / 1000);

      // Get the typed data hash
      const domain = {
        name: "LatchPay",
        version: "1",
        chainId: 137,
        verifyingContract: await escrowVault.getAddress(),
      };

      const types = {
        DeliveryCommitment: [
          { name: "paymentId", type: "bytes32" },
          { name: "deliveryHash", type: "bytes32" },
          { name: "responseMetaHash", type: "bytes32" },
          { name: "timestamp", type: "uint256" },
        ],
      };

      const value = {
        paymentId,
        deliveryHash,
        responseMetaHash,
        timestamp,
      };

      const signature = await seller.signTypedData(domain, types, value);

      await escrowVault.markDeliveredWithSellerSig(
        paymentId,
        deliveryHash,
        responseMetaHash,
        signature
      );

      const payment = await escrowVault.getPayment(paymentId);
      expect(payment.status).to.equal(1); // Delivered
    });

    it("should release payment after dispute window", async function () {
      const buyerNoteHash = ethers.keccak256(ethers.toUtf8Bytes("test request"));
      
      await escrowVault.connect(buyer).openPayment(
        endpointId,
        PRICE_PER_CALL,
        buyerNoteHash
      );

      const buyerPayments = await escrowVault.getBuyerPayments(buyer.address);
      const paymentId = buyerPayments[0];

      // Mark as delivered
      const deliveryHash = ethers.keccak256(ethers.toUtf8Bytes("delivery content"));
      const responseMetaHash = ethers.keccak256(ethers.toUtf8Bytes("meta"));
      const timestamp = Math.floor(Date.now() / 1000);

      const domain = {
        name: "LatchPay",
        version: "1",
        chainId: 137,
        verifyingContract: await escrowVault.getAddress(),
      };

      const types = {
        DeliveryCommitment: [
          { name: "paymentId", type: "bytes32" },
          { name: "deliveryHash", type: "bytes32" },
          { name: "responseMetaHash", type: "bytes32" },
          { name: "timestamp", type: "uint256" },
        ],
      };

      const value = {
        paymentId,
        deliveryHash,
        responseMetaHash,
        timestamp,
      };

      const signature = await seller.signTypedData(domain, types, value);

      await escrowVault.markDeliveredWithSellerSig(
        paymentId,
        deliveryHash,
        responseMetaHash,
        signature
      );

      // Fast forward past dispute window
      await ethers.provider.send("evm_increaseTime", [DISPUTE_WINDOW + 1]);
      await ethers.provider.send("evm_mine", []);

      // Release
      const sellerBalanceBefore = await mockUSDC.balanceOf(seller.address);
      await escrowVault.release(paymentId);
      const sellerBalanceAfter = await mockUSDC.balanceOf(seller.address);

      // Check seller received funds minus fee
      const expectedAmount = PRICE_PER_CALL - (PRICE_PER_CALL * BigInt(PROTOCOL_FEE_BPS)) / BigInt(10000);
      expect(sellerBalanceAfter - sellerBalanceBefore).to.equal(expectedAmount);
    });
  });

  describe("SellerBondVault", function () {
    beforeEach(async function () {
      // Mint USDC to seller for bond
      await mockUSDC.mint(seller.address, ethers.parseUnits("1000", 6));
      await mockUSDC.connect(seller).approve(
        await bondVault.getAddress(),
        ethers.parseUnits("1000", 6)
      );
    });

    it("should deposit bond", async function () {
      const amount = ethers.parseUnits("100", 6);
      await bondVault.connect(seller).deposit(amount);

      const bond = await bondVault.getBond(seller.address);
      expect(bond.amount).to.equal(amount);
    });

    it("should withdraw bond after lock period", async function () {
      const amount = ethers.parseUnits("100", 6);
      await bondVault.connect(seller).deposit(amount);

      // Fast forward past lock period
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine", []);

      await bondVault.connect(seller).withdraw(amount);

      const bond = await bondVault.getBond(seller.address);
      expect(bond.amount).to.equal(0);
    });

    it("should not withdraw during lock period", async function () {
      const amount = ethers.parseUnits("100", 6);
      await bondVault.connect(seller).deposit(amount);

      await expect(
        bondVault.connect(seller).withdraw(amount)
      ).to.be.revertedWithCustomError(bondVault, "BondLocked");
    });
  });
});
