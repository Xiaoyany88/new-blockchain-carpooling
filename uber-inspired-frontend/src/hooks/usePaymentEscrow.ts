import { useEffect, useState } from "react";
import { ethers } from "ethers";
import PaymentEscrowABI from "../abis/PaymentEscrow.json";

interface PaymentEscrowContract extends ethers.Contract {
  createRide: (driverAddress: string, options?: { value: ethers.BigNumber, gasLimit?: ethers.BigNumber }) => Promise<ethers.ContractTransaction>;
  submitFeedback: (targetAddress: string, rating: number, options?: { gasLimit: ethers.BigNumber }) => Promise<ethers.ContractTransaction>;
  getRideStatus: (rideId: string) => Promise<number>;
  getRating: (address: string) => Promise<number>;
  getStatus: (address: string) => Promise<number>;
}

const CONTRACT_ADDRESS = "0xd73a3F604a12a26442f446c245963c87ac7bC1BE"; // Replace with actual address

const usePaymentEscrow = (provider: ethers.providers.Web3Provider | null) => {
  const [contract, setContract] = useState<PaymentEscrowContract | null>(null);

  useEffect(() => {
    if (provider) {
      const signer = provider.getSigner();
      const escrowContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        PaymentEscrowABI,
        signer
      ) as PaymentEscrowContract;
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

  const createRide = async (driverAddress: string, fare: string) => {
    if (!contract || !driverAddress || !fare) return null;
    try {
      const fareInWei = ethers.utils.parseEther(fare);
      const gasEstimate = await contract.estimateGas.createRide(driverAddress, {
        value: fareInWei
      });
      const gasLimit = await estimateGas(Promise.resolve(gasEstimate));

      // Fixed transaction call with proper options typing
      const tx = await contract.createRide(
        driverAddress,
        { 
          value: fareInWei,
          gasLimit: gasLimit
        }
      );
      return await tx.wait();
    } catch (error) {
      console.error("Error creating ride:", error);
      throw error;
    }
  };

  const getRideStatus = async (rideId: string) => {
    if (!contract || !rideId) return null;
    try {
      const status = await contract.getRideStatus(rideId);
      return status;
    } catch (error) {
      console.error("Error getting ride status:", error);
      throw error;
    }
  };

  const getStatus = async (address: string) => {
    if (!contract || !address) return null;
    try {
      const status = await contract.getStatus(address);
      return status;
    } catch (error) {
      console.error("Error getting status:", error);
      throw error;
    }
  };

  const submitFeedback = async (targetAddress: string, rating: number) => {
    if (!contract || !targetAddress) return null;
    try {
      const gasEstimate = await contract.estimateGas.submitFeedback(targetAddress, rating);
      const gasLimit = await estimateGas(Promise.resolve(gasEstimate));

      const tx = await contract.submitFeedback(
        targetAddress, 
        rating, 
        { gasLimit }  // Pass gasLimit as part of the options object
      );
      return await tx.wait();
    } catch (error) {
      console.error("Error submitting feedback:", error);
      throw error;
    }
  };

  return {
    contract,
    createRide,
    getRideStatus,
    getStatus,
    submitFeedback  // Add this to the returned object
  };
};

export default usePaymentEscrow;
