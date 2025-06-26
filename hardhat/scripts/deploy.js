const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const EscrowMarketplace = await hre.ethers.getContractFactory("EscrowMarketplace");
  const contract = await EscrowMarketplace.deploy(deployer.address); // feeRecipient = deployer

  await contract.waitForDeployment();
  console.log("EscrowMarketplace deployed to:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
