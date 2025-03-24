import { useEffect, useState } from "react";
import { ethers } from "ethers";
import PaymentEscrowABI from "../abis/PaymentEscrow.json";
import { CONTRACT_ADDRESSES } from "../config/contracts";

const usePaymentEscrow = (provider: ethers.providers.Web3Provider | null) => {
  const [contract, setContract] = useState<ethers.Contract | null>(null);

  useEffect(() => {
    if (provider) {
      const signer = provider.getSigner();
      const escrowContract = new ethers.Contract(
        CONTRACT_ADDRESSES.PAYMENT_ESCROW,
        PaymentEscrowABI,
        signer
      );
      setContract(escrowContract);
    }
  }, [provider]);

  const estimateGas = async (
    method: Promise<ethers.BigNumber>,
    buffer: number = 1.2
  ): Promise<ethers.BigNumber> => {
    try {
      const estimatedGas = await method;
      return estimatedGas.mul(Math.floor(buffer * 100)).div(100);
    } catch (error) {
      console.warn("Gas estimation failed, using default:", error);
      return ethers.BigNumber.from("300000"); // Default fallback
    }
  };

  const escrowPayment = async (rideId: number, seats: number, amount: string) => {
    if (!contract) return null;
    try {
      const amountInWei = ethers.utils.parseEther(amount);
      const gasEstimate = await contract.estimateGas.escrowPayment(rideId, seats, {
        value: amountInWei
      });
      const gasLimit = await estimateGas(Promise.resolve(gasEstimate));

      const tx = await contract.escrowPayment(
        rideId,
        seats,
        { 
          value: amountInWei,
          gasLimit: gasLimit
        }
      );
      return await tx.wait();
    } catch (error) {
      console.error("Error escrowing payment:", error);
      throw error;
    }
  };

  const releasePayment = async (rideId: number, driverAddress: string, passengerAddress: string) => {
    if (!contract) return null;
    try {
      const gasEstimate = await contract.estimateGas.releasePayment(rideId, driverAddress, passengerAddress);
      const gasLimit = await estimateGas(Promise.resolve(gasEstimate));

      const tx = await contract.releasePayment(
        rideId,
        driverAddress,
        passengerAddress,
        { gasLimit }
      );
      return await tx.wait();
    } catch (error) {
      console.error("Error releasing payment:", error);
      throw error;
    }
  };

  const refundPayment = async (rideId: number, passengerAddress: string) => {
    if (!contract) return null;
    try {
      const gasEstimate = await contract.estimateGas.refundPayment(rideId, passengerAddress);
      const gasLimit = await estimateGas(Promise.resolve(gasEstimate));

      const tx = await contract.refundPayment(
        rideId,
        passengerAddress,
        { gasLimit }
      );
      return await tx.wait();
    } catch (error) {
      console.error("Error refunding payment:", error);
      throw error;
    }
  };

  return {
    contract,
    escrowPayment,
    releasePayment,
    refundPayment
  };
};

export default usePaymentEscrow;
