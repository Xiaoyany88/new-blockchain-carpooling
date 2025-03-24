import { ethers } from "hardhat";
import deployments from "../deployments.json";

async function main() {
  const [signer] = await ethers.getSigners();
  
  // Connect to deployed contracts
  const rideOffer = await ethers.getContractAt(
    "RideOffer",
    deployments.sepolia.RideOffer,
    signer
  );

  const carpoolToken = await ethers.getContractAt(
    "CarpoolToken",
    deployments.sepolia.CarpoolToken,
    signer
  );

  // Example interaction
  console.log("Creating a new ride...");
  const futureTime = Math.floor(Date.now() / 1000) + 3600;
  const tx = await rideOffer.createRide(
    "New York",
    "Boston",
    futureTime,
    4,
    ethers.parseEther("0.1"),
    "Direct route"
  );
  
  await tx.wait();
  console.log("Ride created!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
