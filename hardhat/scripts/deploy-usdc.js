const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying TestUSDC with account:", deployer.address);

  const TestUSDC = await hre.ethers.getContractFactory("TestUSDC");
  const contract = await TestUSDC.deploy();

  await contract.waitForDeployment();
  console.log("TestUSDC deployed to:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
