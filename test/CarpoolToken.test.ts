import { expect } from "chai";
import { ethers } from "hardhat";
import { CarpoolToken } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("CarpoolToken", function () {
  let carpoolToken: CarpoolToken;
  let owner: SignerWithAddress;
  let driver: SignerWithAddress;
  let passenger: SignerWithAddress;
  const REWARD_PER_RIDE = ethers.parseEther("10"); // 10 tokens

  beforeEach(async function () {
    [owner, driver, passenger] = await ethers.getSigners();
    const CarpoolToken = await ethers.getContractFactory("CarpoolToken");
    carpoolToken = await CarpoolToken.deploy();
    await carpoolToken.waitForDeployment();
  });

  describe("Token Deployment", function () {
    it("Should set the correct token properties", async function () {
      expect(await carpoolToken.name()).to.equal("CarpoolToken");
      expect(await carpoolToken.symbol()).to.equal("CPT");
      expect(await carpoolToken.owner()).to.equal(owner.address);
    });

    it("Should have correct initial supply", async function () {
      const contractBalance = await carpoolToken.balanceOf(await carpoolToken.getAddress());
      expect(contractBalance).to.equal(ethers.parseEther("1000000"));
    });
  });

  describe("Driver Rewards", function () {
    it("Should reward driver correctly", async function () {
      await carpoolToken.connect(owner).rewardDriver(driver.address);
      
      const driverBalance = await carpoolToken.balanceOf(driver.address);
      const driverRewards = await carpoolToken.driverRewards(driver.address);
      
      expect(driverBalance).to.equal(REWARD_PER_RIDE);
      expect(driverRewards).to.equal(REWARD_PER_RIDE);
    });

    it("Should fail when non-owner tries to reward", async function () {
      await expect(
        carpoolToken.connect(passenger).rewardDriver(driver.address)
      ).to.be.revertedWith("Only owner can reward drivers");
    });

    it("Should track cumulative rewards", async function () {
      await carpoolToken.connect(owner).rewardDriver(driver.address);
      await carpoolToken.connect(owner).rewardDriver(driver.address);
      
      const totalRewards = await carpoolToken.getDriverRewards(driver.address);
      expect(totalRewards).to.equal(REWARD_PER_RIDE * BigInt(2));
    });
  });

  describe("Token Operations", function () {
    beforeEach(async function () {
      await carpoolToken.connect(owner).mint(owner.address, ethers.parseEther("100"));
    });

    it("Should allow token transfers", async function () {
      await carpoolToken.connect(owner).transfer(passenger.address, ethers.parseEther("50"));
      const balance = await carpoolToken.balanceOf(passenger.address);
      expect(balance).to.equal(ethers.parseEther("50"));
    });

    it("Should allow token burning", async function () {
      const initialBalance = await carpoolToken.balanceOf(owner.address);
      const burnAmount = ethers.parseEther("10");
      
      await carpoolToken.connect(owner).burn(burnAmount);
      
      const finalBalance = await carpoolToken.balanceOf(owner.address);
      expect(initialBalance - finalBalance).to.equal(burnAmount);
    });

    it("Should only allow owner to mint", async function () {
      await expect(
        carpoolToken.connect(passenger).mint(passenger.address, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(carpoolToken, "OwnableUnauthorizedAccount");
    });
  });
});
