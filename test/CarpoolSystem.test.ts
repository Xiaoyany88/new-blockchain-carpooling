import { expect } from "chai";
import { ethers } from "hardhat";
import { 
  CarpoolSystem,
  RideOffer,
  ReputationSystem,
  PaymentEscrow,
  CarpoolToken
} from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("CarpoolSystem", function () {
  let carpoolSystem: CarpoolSystem;
  let rideOffer: RideOffer;
  let reputationSystem: ReputationSystem;
  let paymentEscrow: PaymentEscrow;
  let carpoolToken: CarpoolToken;
  let owner: SignerWithAddress;
  let driver: SignerWithAddress;
  let passenger: SignerWithAddress;

  beforeEach(async function () {
    [owner, driver, passenger] = await ethers.getSigners();

    // Deploy individual contracts
    const RideOffer = await ethers.getContractFactory("RideOffer");
    const ReputationSystem = await ethers.getContractFactory("ReputationSystem");
    const PaymentEscrow = await ethers.getContractFactory("PaymentEscrow");
    const CarpoolToken = await ethers.getContractFactory("CarpoolToken");

    rideOffer = await RideOffer.deploy();
    reputationSystem = await ReputationSystem.deploy();
    paymentEscrow = await PaymentEscrow.deploy();
    carpoolToken = await CarpoolToken.deploy();

    await Promise.all([
      rideOffer.waitForDeployment(),
      reputationSystem.waitForDeployment(),
      paymentEscrow.waitForDeployment(),
      carpoolToken.waitForDeployment()
    ]);

    // Deploy CarpoolSystem
    const CarpoolSystem = await ethers.getContractFactory("CarpoolSystem");
    carpoolSystem = await CarpoolSystem.deploy(
      await rideOffer.getAddress(),
      await reputationSystem.getAddress(),
      await paymentEscrow.getAddress(),
      await carpoolToken.getAddress()
    );
    await carpoolSystem.waitForDeployment();
  });

  describe("System Integration", function () {
    it("Should have correct contract addresses", async function () {
      expect(await carpoolSystem.rideOffer()).to.equal(await rideOffer.getAddress());
      expect(await carpoolSystem.reputationSystem()).to.equal(await reputationSystem.getAddress());
      expect(await carpoolSystem.paymentEscrow()).to.equal(await paymentEscrow.getAddress());
      expect(await carpoolSystem.carpoolToken()).to.equal(await carpoolToken.getAddress());
    });

    // Add more integration tests based on your system's specific requirements
  });
});
