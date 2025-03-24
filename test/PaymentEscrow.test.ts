import { expect } from "chai";
import { ethers } from "hardhat";
import { PaymentEscrow } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("PaymentEscrow", function () {
  let paymentEscrow: PaymentEscrow;
  let owner: SignerWithAddress;
  let driver: SignerWithAddress;
  let passenger: SignerWithAddress;
  const rideId = 1;
  const seats = 2;
  const paymentAmount = ethers.parseEther("1");

  beforeEach(async function () {
    [owner, driver, passenger] = await ethers.getSigners();
    const PaymentEscrow = await ethers.getContractFactory("PaymentEscrow");
    paymentEscrow = await PaymentEscrow.deploy();
    await paymentEscrow.waitForDeployment();
  });

  describe("Payment Escrow", function () {
    it("Should escrow payment", async function () {
      await paymentEscrow.connect(passenger).escrowPayment(rideId, seats, {
        value: paymentAmount
      });

      const payment = await paymentEscrow.payments(rideId, passenger.address);
      expect(payment.amount).to.equal(paymentAmount);
      expect(payment.seats).to.equal(seats);
      expect(payment.released).to.be.false;
      expect(payment.refunded).to.be.false;
    });

    it("Should fail with zero payment", async function () {
      await expect(
        paymentEscrow.connect(passenger).escrowPayment(rideId, seats, {
          value: 0
        })
      ).to.be.revertedWith("Payment required");
    });
  });

  describe("Payment Release", function () {
    beforeEach(async function () {
      await paymentEscrow.connect(passenger).escrowPayment(rideId, seats, {
        value: paymentAmount
      });
    });

    it("Should release payment to driver", async function () {
      const initialBalance = await ethers.provider.getBalance(driver.address);
      
      await paymentEscrow.connect(owner).releasePayment(
        rideId,
        driver.address,
        passenger.address
      );

      const finalBalance = await ethers.provider.getBalance(driver.address);
      expect(finalBalance - initialBalance).to.equal(paymentAmount);

      const payment = await paymentEscrow.payments(rideId, passenger.address);
      expect(payment.released).to.be.true;
    });

    it("Should not allow double release", async function () {
      await paymentEscrow.connect(owner).releasePayment(
        rideId,
        driver.address,
        passenger.address
      );

      await expect(
        paymentEscrow.connect(owner).releasePayment(
          rideId,
          driver.address,
          passenger.address
        )
      ).to.be.revertedWith("Payment already processed");
    });
  });

  describe("Payment Refund", function () {
    beforeEach(async function () {
      await paymentEscrow.connect(passenger).escrowPayment(rideId, seats, {
        value: paymentAmount
      });
    });

    it("Should refund payment to passenger", async function () {
      const initialBalance = await ethers.provider.getBalance(passenger.address);
      
      await paymentEscrow.connect(owner).refundPayment(rideId, passenger.address);

      const finalBalance = await ethers.provider.getBalance(passenger.address);
      expect(finalBalance - initialBalance).to.be.closeTo(
        paymentAmount,
        ethers.parseEther("0.01") // Account for gas costs
      );

      const payment = await paymentEscrow.payments(rideId, passenger.address);
      expect(payment.refunded).to.be.true;
    });

    it("Should not allow refund after release", async function () {
      await paymentEscrow.connect(owner).releasePayment(
        rideId,
        driver.address,
        passenger.address
      );

      await expect(
        paymentEscrow.connect(owner).refundPayment(rideId, passenger.address)
      ).to.be.revertedWith("Payment already processed");
    });
  });
});
