import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
// If using TypeChain:
// import { CarpoolToken, CarpoolToken__factory } from "../typechain-types";

describe("CarpoolToken", () => {
  async function deployCarpoolTokenFixture() {
    const [owner, alice, bob] = await ethers.getSigners();
    
    // If using TypeChain:
    // const CarpoolTokenFactory = (await ethers.getContractFactory(
    //   "CarpoolToken"
    // )) as CarpoolToken__factory;
    // const carpoolToken = await CarpoolTokenFactory.deploy();
    
    // If not using TypeChain (and ignoring type-safety):
    const CarpoolTokenFactory = await ethers.getContractFactory("CarpoolToken");
    const carpoolToken = await CarpoolTokenFactory.deploy();
    
    await carpoolToken.waitForDeployment();

    return { carpoolToken, owner, alice, bob };
  }

  it("should have the correct name and symbol", async () => {
    const { carpoolToken } = await loadFixture(deployCarpoolTokenFixture);

    const name = await carpoolToken.name();
    const symbol = await carpoolToken.symbol();

    expect(name).to.equal("CarpoolToken");
    expect(symbol).to.equal("CPT");
  });

  it("should allow the owner to mint tokens", async () => {
    const { carpoolToken, owner, alice } = await loadFixture(deployCarpoolTokenFixture);
    const mintAmount = ethers.parseEther("100");

    // Only the owner can mint
    await carpoolToken.connect(owner).mint(await alice.getAddress(), mintAmount);

    const aliceBalance = await carpoolToken.balanceOf(await alice.getAddress());
    expect(aliceBalance).to.equal(mintAmount);
  });

  it("should not allow a non-owner to mint tokens", async () => {
    const { carpoolToken, alice } = await loadFixture(deployCarpoolTokenFixture);
    const mintAmount = ethers.parseEther("100");

    // Alice is not the owner
    await expect(
        carpoolToken.connect(alice).mint(await alice.getAddress(), mintAmount)
      ).to.be.revertedWithCustomError(carpoolToken, "OwnableUnauthorizedAccount");
  });

  it("should allow token holders to burn tokens", async () => {
    const { carpoolToken, owner, alice } = await loadFixture(deployCarpoolTokenFixture);
    const mintAmount = ethers.parseEther("100");
    const burnAmount = ethers.parseEther("50");

    // Owner mints 100 tokens to Alice
    await carpoolToken.connect(owner).mint(await alice.getAddress(), mintAmount);

    // Alice burns 50 tokens
    await carpoolToken.connect(alice).burn(burnAmount);

    const aliceBalance = await carpoolToken.balanceOf(await alice.getAddress());
    expect(aliceBalance).to.equal(mintAmount - burnAmount);
  });
});
