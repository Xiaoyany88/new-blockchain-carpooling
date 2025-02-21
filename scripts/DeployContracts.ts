import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy PaymentEscrow
  const PaymentEscrow = await ethers.getContractFactory("PaymentEscrow");
  const paymentEscrow = await PaymentEscrow.deploy();
  // v6: Wait for the contract to actually be deployed
  await paymentEscrow.waitForDeployment();
  // v6: Retrieve the contract address
  const paymentEscrowAddress = await paymentEscrow.getAddress();
  console.log("PaymentEscrow deployed to:", paymentEscrowAddress);

  // Deploy ReputationSystem
  const ReputationSystem = await ethers.getContractFactory("ReputationSystem");
  const reputationSystem = await ReputationSystem.deploy();
  await reputationSystem.waitForDeployment();
  const reputationSystemAddress = await reputationSystem.getAddress();
  console.log("ReputationSystem deployed to:", reputationSystemAddress);

  // Deploy CarpoolToken
  const CarpoolToken = await ethers.getContractFactory("CarpoolToken");
  const carpoolToken = await CarpoolToken.deploy();
  await carpoolToken.waitForDeployment();
  const carpoolTokenAddress = await carpoolToken.getAddress();
  console.log("CarpoolToken deployed to:", carpoolTokenAddress);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error in deployment script:", err);
    process.exit(1);
  });
