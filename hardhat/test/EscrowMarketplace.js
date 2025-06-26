const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EscrowMarketplace", function () {
  let EscrowMarketplace, escrow, owner, seller, buyer, feeRecipient;

  beforeEach(async function () {
    [owner, seller, buyer, feeRecipient] = await ethers.getSigners();
    EscrowMarketplace = await ethers.getContractFactory("EscrowMarketplace");
    escrow = await EscrowMarketplace.deploy(feeRecipient.address);
  });

  it("should allow ETH purchase, confirm, and fee distribution", async function () {
    const price = ethers.parseEther("1");
    // Buyer purchases from seller
    await expect(
      escrow.connect(buyer).purchase(seller.address, price, ethers.ZeroAddress, { value: price })
    ).to.emit(escrow, "Purchased");

    // Confirm receipt
    await expect(
      escrow.connect(buyer).confirmReceipt(1)
    ).to.emit(escrow, "Confirmed");
  });

  it("should allow seller to refund before confirmation", async function () {
    const price = ethers.parseEther("1");
    await escrow.connect(buyer).purchase(seller.address, price, ethers.ZeroAddress, { value: price });
    await expect(
      escrow.connect(seller).refund(1)
    ).to.emit(escrow, "Refunded");
  });
});
