// deployRideOffer.ts
import { ethers, run, network } from "hardhat";

// The address of your existing CarpoolSystem contract
const CARPOOL_SYSTEM_ADDRESS = "0x40aca411326e4D469c157aCaE65cc1803792D6Bc"; 

async function verifyContract(address: string, constructorArguments: any[] = []) {
  console.log(`Verifying contract at ${address}`);
  try {
    // Add delay before verification
    console.log("Waiting for block confirmations...");
    await new Promise(resolve => setTimeout(resolve, 60000)); // 60 seconds delay

    await run("verify:verify", {
      address: address,
      constructorArguments: constructorArguments,
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
  
  console.log("Deploying new RideOffer contract...");
  console.log("Using CarpoolSystem at:", CARPOOL_SYSTEM_ADDRESS);

  // Step 1: Deploy new RideOffer with CarpoolSystem's address
  const RideOffer = await ethers.getContractFactory("RideOffer");
  const rideOffer = await RideOffer.deploy(CARPOOL_SYSTEM_ADDRESS);
  await rideOffer.waitForDeployment();
  const rideOfferAddress = await rideOffer.getAddress();
  console.log("New RideOffer deployed to:", rideOfferAddress);

  // Step 2: Update CarpoolSystem with the new RideOffer address
  console.log("Updating RideOffer address in CarpoolSystem...");
  const signer = (await ethers.getSigners())[0];
  const updateTx = await signer.sendTransaction({
    to: CARPOOL_SYSTEM_ADDRESS,
    data: new ethers.Interface([
      "function updateRideOfferAddress(address _newRideOffer)"
    ]).encodeFunctionData("updateRideOfferAddress", [rideOfferAddress])
  });
  
  await updateTx.wait();
  console.log("Updated RideOffer address in CarpoolSystem");

  // Verification
  if (!isLocalNetwork) {
    console.log("\nStarting verification process...");
    
    // For RideOffer, include CarpoolSystem address as constructor arg
    await verifyContract(rideOfferAddress, [CARPOOL_SYSTEM_ADDRESS]);
  }

  console.log("\nDeployment complete!");
  console.log("\nNew RideOffer:", rideOfferAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });