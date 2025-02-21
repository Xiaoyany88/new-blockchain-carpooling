import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("PaymentEscrow", () => {
  async function deployEscrowFixture() {
    const [passenger, driver, otherAccount] = await ethers.getSigners();
    const PaymentEscrow = await ethers.getContractFactory("PaymentEscrow");
    const paymentEscrow = await PaymentEscrow.deploy();
    await paymentEscrow.waitForDeployment();
    const escrowAddress = await paymentEscrow.getAddress();

    return { paymentEscrow, escrowAddress, passenger, driver, otherAccount };
  }

  it("Should create a ride and store escrowed funds", async () => {
    const { paymentEscrow, passenger, driver } = await loadFixture(deployEscrowFixture);

    // Send 1 ETH from passenger to escrow
    const rideTx = await paymentEscrow
      .connect(passenger)
      .createRide(await driver.getAddress(), { value: ethers.parseEther("1") });

    // Wait for the transaction to be mined
    await rideTx.wait();

    // Confirm the ride was created with ID 1
    const ride = await paymentEscrow.rides(1);
    expect(ride.amount).to.equal(ethers.parseEther("1"));
    expect(ride.passenger).to.equal(await passenger.getAddress());
    expect(ride.driver).to.equal(await driver.getAddress());
  });

  it("Should release funds to driver on ride confirmation", async () => {
    const { paymentEscrow, passenger, driver } = await loadFixture(deployEscrowFixture);

    // Create a ride with 1 ETH
    await paymentEscrow
      .connect(passenger)
      .createRide(await driver.getAddress(), { value: ethers.parseEther("1") });

    const driverInitialBalance = await ethers.provider.getBalance(await driver.getAddress());

    // Passenger confirms the ride
    const confirmTx = await paymentEscrow.connect(passenger).confirmRide(1);
    await confirmTx.wait();

    // Check the driver's balance after
    const driverFinalBalance = await ethers.provider.getBalance(await driver.getAddress());
    expect(driverFinalBalance).to.be.gt(driverInitialBalance);
  });
});
