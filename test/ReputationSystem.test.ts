import { expect } from "chai";
import { ethers } from "hardhat";
import { ReputationSystem } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("ReputationSystem", function () {
  let reputationSystem: ReputationSystem;
  let owner: SignerWithAddress;
  let driver: SignerWithAddress;
  let passenger: SignerWithAddress;

  beforeEach(async function () {
    [owner, driver, passenger] = await ethers.getSigners();
    const ReputationSystem = await ethers.getContractFactory("ReputationSystem");
    reputationSystem = await ReputationSystem.deploy();
    await reputationSystem.waitForDeployment();
  });

  describe("User Rating", function () {
    it("Should allow rating a user", async function () {
      await reputationSystem.connect(passenger).rateUser(driver.address, 5);
      const rating = await reputationSystem.getAverageRating(driver.address);
      expect(rating).to.equal(5);
    });

    it("Should fail with invalid rating", async function () {
      await expect(
        reputationSystem.connect(passenger).rateUser(driver.address, 6)
      ).to.be.revertedWith("Rating must be between 1 and 5");
    });

    it("Should calculate average rating correctly", async function () {
      await reputationSystem.connect(passenger).rateUser(driver.address, 4);
      await reputationSystem.connect(owner).rateUser(driver.address, 2);
      const rating = await reputationSystem.getAverageRating(driver.address);
      expect(rating).to.equal(3);
    });
  });

  describe("Driver Rating", function () {
    it("Should allow rating a driver for a specific ride", async function () {
      await reputationSystem.connect(passenger).rateDriver(driver.address, 5, 1);
      const stats = await reputationSystem.getDriverStats(driver.address);
      expect(stats.avgRating).to.equal(5);
    });

    it("Should prevent double rating for same ride", async function () {
      await reputationSystem.connect(passenger).rateDriver(driver.address, 5, 1);
      await expect(
        reputationSystem.connect(passenger).rateDriver(driver.address, 4, 1)
      ).to.be.revertedWith("Already rated this ride");
    });
  });

  describe("Ride Statistics", function () {
    it("Should track completed rides", async function () {
      await reputationSystem.recordRideCompletion(driver.address);
      await reputationSystem.recordRideCompletion(driver.address);
      const stats = await reputationSystem.getDriverStats(driver.address);
      expect(stats.totalRides).to.equal(2);
    });

    it("Should track cancelled rides", async function () {
      await reputationSystem.recordRideCancellation(driver.address);
      const stats = await reputationSystem.getDriverStats(driver.address);
      expect(stats.cancelledRides).to.equal(1);
    });

    it("Should provide accurate driver statistics", async function () {
      await reputationSystem.connect(passenger).rateDriver(driver.address, 4, 1);
      await reputationSystem.recordRideCompletion(driver.address);
      await reputationSystem.recordRideCancellation(driver.address);

      const stats = await reputationSystem.getDriverStats(driver.address);
      expect(stats.avgRating).to.equal(4);
      expect(stats.totalRides).to.equal(1);
      expect(stats.cancelledRides).to.equal(1);
    });
  });
});
