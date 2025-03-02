import { ethers, run, network } from "hardhat";

async function verifyContract(address: string, constructorArguments: any[] = []) {
  console.log(`Verifying contract at ${address}`);
  try {
    // Add delay before verification
    console.log("Waiting for block confirmations...");
    await new Promise(resolve => setTimeout(resolve, 60000)); // 60 seconds delay

    await run("verify:verify", {
      address: address,
      constructorArguments: constructorArguments,
      contract: constructorArguments.length === 0 ? undefined : undefined, // Add contract path if needed
    });
    console.log("Contract verified successfully");
  } catch (error: any) {
    if (error.message.toLowerCase().includes("already verified")) {
      console.log("Contract already verified!");
    } else {
      console.error("Error verifying contract:", error);
    }
  }
}

async function main() {
  // Skip verification on local network
  const isLocalNetwork = network.name === "hardhat" || network.name === "localhost";
  
  console.log("Deploying Carpool System contracts...");

  // Deploy RideOffer
  const RideOffer = await ethers.getContractFactory("RideOffer");
  const rideOffer = await RideOffer.deploy();
  await rideOffer.waitForDeployment();
  console.log("RideOffer deployed to:", await rideOffer.getAddress());

  // Deploy ReputationSystem
  const ReputationSystem = await ethers.getContractFactory("ReputationSystem");
  const reputationSystem = await ReputationSystem.deploy();
  await reputationSystem.waitForDeployment();
  console.log("ReputationSystem deployed to:", await reputationSystem.getAddress());

  // Deploy PaymentEscrow
  const PaymentEscrow = await ethers.getContractFactory("PaymentEscrow");
  const paymentEscrow = await PaymentEscrow.deploy();
  await paymentEscrow.waitForDeployment();
  console.log("PaymentEscrow deployed to:", await paymentEscrow.getAddress());

  // Deploy CarpoolToken
  const CarpoolToken = await ethers.getContractFactory("CarpoolToken");
  const carpoolToken = await CarpoolToken.deploy();
  await carpoolToken.waitForDeployment();
  console.log("CarpoolToken deployed to:", await carpoolToken.getAddress());

  // Store constructor arguments for CarpoolSystem
  const carpoolSystemArgs = [
    await rideOffer.getAddress(),
    await reputationSystem.getAddress(),
    await paymentEscrow.getAddress(),
    await carpoolToken.getAddress(),
  ];

  // Deploy CarpoolSystem
  const CarpoolSystem = await ethers.getContractFactory("CarpoolSystem");
  const carpoolSystem = await CarpoolSystem.deploy(
    carpoolSystemArgs[0],
    carpoolSystemArgs[1],
    carpoolSystemArgs[2],
    carpoolSystemArgs[3]
  );
  await carpoolSystem.waitForDeployment();
  console.log("CarpoolSystem deployed to:", await carpoolSystem.getAddress());

  // Update verification section
  if (!isLocalNetwork) {
    console.log("\nStarting verification process...");
    
    // Verify contracts one by one with proper delays
    await verifyContract(await rideOffer.getAddress());
    await verifyContract(await reputationSystem.getAddress());
    await verifyContract(await paymentEscrow.getAddress());
    await verifyContract(await carpoolToken.getAddress());
    
    // For CarpoolSystem, specifically include the contract path
    await verifyContract(
      await carpoolSystem.getAddress(),
      carpoolSystemArgs
    );
  }

  console.log("\nDeployment complete!");

  // Log all deployed addresses
  console.log("\nDeployed Contracts:");
  console.log("-------------------");
  console.log("RideOffer:", await rideOffer.getAddress());
  console.log("ReputationSystem:", await reputationSystem.getAddress());
  console.log("PaymentEscrow:", await paymentEscrow.getAddress());
  console.log("CarpoolToken:", await carpoolToken.getAddress());
  console.log("CarpoolSystem:", await carpoolSystem.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
