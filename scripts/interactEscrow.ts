import { ethers } from "hardhat";
import { PaymentEscrow, PaymentEscrow__factory } from "../typechain-types";

async function main() {
  const PAYMENT_ESCROW_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  // Get a signer (assuming Hardhat is set up to provide one)
  const [signer] = await ethers.getSigners();

  // Attach to the deployed contract using the generated factory
  const paymentEscrow: PaymentEscrow = PaymentEscrow__factory.connect(
    PAYMENT_ESCROW_ADDRESS,
    signer
  );

  // Now TypeScript knows about rideCounter()
  const rideCount = await paymentEscrow.rideCounter();
  console.log("Current rideCount:", rideCount.toString());
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error in interaction script:", err);
    process.exit(1);
  });
