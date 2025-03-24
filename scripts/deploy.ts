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
      contract: constructorArguments.length === 0 ? undefined : undefined, 
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
  const isLocalNetwork = network.name === "hardhat" || network.name === "localhost";
  
  console.log("Deploying Carpool System contracts with circular dependency fix...");

  // Step 1: Deploy supporting contracts first
  const ReputationSystem = await ethers.getContractFactory("ReputationSystem");
  const reputationSystem = await ReputationSystem.deploy();
  await reputationSystem.waitForDeployment();
  console.log("ReputationSystem deployed to:", await reputationSystem.getAddress());

  const PaymentEscrow = await ethers.getContractFactory("PaymentEscrow");
  const paymentEscrow = await PaymentEscrow.deploy();
  await paymentEscrow.waitForDeployment();
  console.log("PaymentEscrow deployed to:", await paymentEscrow.getAddress());

  const CarpoolToken = await ethers.getContractFactory("CarpoolToken");
  const carpoolToken = await CarpoolToken.deploy();
  await carpoolToken.waitForDeployment();
  console.log("CarpoolToken deployed to:", await carpoolToken.getAddress());

  // Step 2: Deploy CarpoolSystem with a placeholder address for RideOffer
  const placeholderAddress = "0x0000000000000000000000000000000000000001";
  
  const carpoolSystemArgs = [
    placeholderAddress, // Temporary placeholder for RideOffer
    await reputationSystem.getAddress(),
    await paymentEscrow.getAddress(),
    await carpoolToken.getAddress(),
  ];

  const CarpoolSystem = await ethers.getContractFactory("CarpoolSystem");
  const carpoolSystem = await CarpoolSystem.deploy(
    carpoolSystemArgs[0],
    carpoolSystemArgs[1],
    carpoolSystemArgs[2],
    carpoolSystemArgs[3]
  );
  await carpoolSystem.waitForDeployment();
  const carpoolSystemAddress = await carpoolSystem.getAddress();
  console.log("CarpoolSystem deployed to:", carpoolSystemAddress);

  // Step 3: Deploy RideOffer with CarpoolSystem's address
  const RideOffer = await ethers.getContractFactory("RideOffer");
  const rideOffer = await RideOffer.deploy(carpoolSystemAddress as unknown as any);
  await rideOffer.waitForDeployment();
  const rideOfferAddress = await rideOffer.getAddress();
  console.log("RideOffer deployed to:", rideOfferAddress);

  // Step 4: Update CarpoolSystem with the real RideOffer address
  console.log("Updating RideOffer address in CarpoolSystem...");
  const signer = (await ethers.getSigners())[0];
  const updateTx = await signer.sendTransaction({
    to: carpoolSystemAddress,
    data: new ethers.Interface([
      "function updateRideOfferAddress(address _newRideOffer)"
    ]).encodeFunctionData("updateRideOfferAddress", [rideOfferAddress])
  });
  
  await updateTx.wait();
  console.log("Updated RideOffer address in CarpoolSystem");

  // Step 5: Authorize CarpoolSystem in CarpoolToken
  console.log("Authorizing CarpoolSystem in CarpoolToken...");
  const carpoolTokenAddress = await carpoolToken.getAddress();
  const authorizeTx = await signer.sendTransaction({
    to: carpoolTokenAddress,
    data: new ethers.Interface([
      "function setAuthorizedSystem(address _system, bool _authorized)"
    ]).encodeFunctionData("setAuthorizedSystem", [carpoolSystemAddress, true])
  });
  
  await authorizeTx.wait();
  console.log("CarpoolSystem authorized successfully in CarpoolToken");

  // Verification
  if (!isLocalNetwork) {
    console.log("\nStarting verification process...");
    
    await verifyContract(await reputationSystem.getAddress());
    await verifyContract(await paymentEscrow.getAddress());
    await verifyContract(await carpoolToken.getAddress());
    
    // For CarpoolSystem, use the original args with placeholder
    await verifyContract(await carpoolSystem.getAddress(), carpoolSystemArgs);
    
    // For RideOffer, include CarpoolSystem address as constructor arg
    await verifyContract(
      await rideOffer.getAddress(),
      [await carpoolSystem.getAddress()]
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