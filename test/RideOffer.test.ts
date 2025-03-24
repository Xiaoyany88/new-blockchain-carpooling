import { expect } from "chai";
import { ethers } from "hardhat";
import { RideOffer } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("RideOffer", function () {
  let rideOffer: RideOffer;
  let owner: SignerWithAddress;
  let driver: SignerWithAddress;
  let passenger: SignerWithAddress;
  const oneEther = ethers.parseEther("1");
  
  beforeEach(async function () {
    [owner, driver, passenger] = await ethers.getSigners();
    const RideOffer = await ethers.getContractFactory("RideOffer");
    rideOffer = await RideOffer.deploy();
    await rideOffer.waitForDeployment();
  });

  describe("Ride Creation", function () {
    it("Should create a new ride", async function () {
      const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      await rideOffer.connect(driver).createRide(
        "New York",
        "Boston",
        futureTime,
        4,
        oneEther,
        "Direct route"
      );

      const ride = await rideOffer.getRide(0);
      expect(ride.driver).to.equal(driver.address);
      expect(ride.pickup).to.equal("New York");
      expect(ride.availableSeats).to.equal(4);
    });

    it("Should fail if departure time is in the past", async function () {
      const pastTime = Math.floor(Date.now() / 1000) - 3600;
      await expect(
        rideOffer.connect(driver).createRide(
          "New York",
          "Boston",
          pastTime,
          4,
          oneEther,
          "Direct route"
        )
      ).to.be.revertedWith("Departure time must be in the future");
    });
  });

  describe("Ride Booking", function () {
    beforeEach(async function () {
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      await rideOffer.connect(driver).createRide(
        "New York",
        "Boston",
        futureTime,
        4,
        oneEther,
        "Direct route"
      );
    });

    it("Should allow booking a ride", async function () {
      await rideOffer.connect(passenger).bookRide(0, 2, {
        value: oneEther * BigInt(2)
      });

      const ride = await rideOffer.getRide(0);
      expect(ride.availableSeats).to.equal(2);
    });

    it("Should fail if payment amount is incorrect", async function () {
      await expect(
        rideOffer.connect(passenger).bookRide(0, 2, {
          value: oneEther
        })
      ).to.be.revertedWith("Incorrect payment amount");
    });
  });

  describe("Ride Cancellation and Completion", function () {
    beforeEach(async function () {
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      await rideOffer.connect(driver).createRide(
        "New York",
        "Boston",
        futureTime,
        4,
        oneEther,
        "Direct route"
      );
    });

    it("Should allow driver to cancel ride", async function () {
      await rideOffer.connect(driver).cancelRide(0);
      const ride = await rideOffer.getRide(0);
      expect(ride.isActive).to.be.false;
    });

    it("Should refund passengers on cancellation", async function () {
      await rideOffer.connect(passenger).bookRide(0, 1, {
        value: oneEther
      });

      const balanceBefore = await ethers.provider.getBalance(passenger.address);
      await rideOffer.connect(driver).cancelRide(0);
      const balanceAfter = await ethers.provider.getBalance(passenger.address);

      // Using BigInt for comparison
      expect(balanceAfter - balanceBefore).to.be.closeTo(
        oneEther,
        ethers.parseEther("0.01") // Account for gas costs
      );
    });
  });
});
