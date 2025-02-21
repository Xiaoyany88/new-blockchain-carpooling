import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
// If using TypeChain:
// import { ReputationSystem, ReputationSystem__factory } from "../typechain-types";

describe("ReputationSystem", () => {
  async function deployReputationSystemFixture() {
    const [rater1, rater2, target] = await ethers.getSigners();

    // If using TypeChain:
    // const ReputationSystemFactory = (await ethers.getContractFactory(
    //   "ReputationSystem"
    // )) as ReputationSystem__factory;
    // const reputationSystem = await ReputationSystemFactory.deploy();
    
    // If not using TypeChain (and ignoring type-safety):
    const ReputationSystemFactory = await ethers.getContractFactory("ReputationSystem");
    const reputationSystem = await ReputationSystemFactory.deploy();
    
    await reputationSystem.waitForDeployment();

    return { reputationSystem, rater1, rater2, target };
  }

  it("should allow valid ratings and store them on-chain", async () => {
    const { reputationSystem, rater1, target } = await loadFixture(deployReputationSystemFixture);

    // Rater1 rates target a 5
    await reputationSystem.connect(rater1).rateUser(await target.getAddress(), 5);

    // Check average rating
    const averageRating = await reputationSystem.getAverageRating(await target.getAddress());
    expect(averageRating).to.equal(5);
  });

  it("should revert if the rating is out of range", async () => {
    const { reputationSystem, rater1, target } = await loadFixture(deployReputationSystemFixture);

    // Ratings must be between 1 and 5
    await expect(
      reputationSystem.connect(rater1).rateUser(await target.getAddress(), 6)
    ).to.be.revertedWith("Rating must be between 1 and 5");
  });

  it("should compute average rating correctly", async () => {
    const { reputationSystem, rater1, rater2, target } = await loadFixture(deployReputationSystemFixture);

    // Rater1 rates a 4
    await reputationSystem.connect(rater1).rateUser(await target.getAddress(), 4);
    // Rater2 rates a 2
    await reputationSystem.connect(rater2).rateUser(await target.getAddress(), 2);

    const averageRating = await reputationSystem.getAverageRating(await target.getAddress());
    // totalRating = 6, ratingCount = 2 => average is 6 / 2 = 3
    expect(averageRating).to.equal(3);
  });

  it("should return 0 if there are no ratings yet", async () => {
    const { reputationSystem, target } = await loadFixture(deployReputationSystemFixture);
    const averageRating = await reputationSystem.getAverageRating(await target.getAddress());
    expect(averageRating).to.equal(0);
  });
});
