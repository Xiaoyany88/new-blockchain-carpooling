import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from "../config/contracts";

/**
 * Helper function to simulate time advancement on local blockchains
 * Only works with Hardhat or other networks that support time manipulation
 */
export const advanceBlockchainTime = async (secondsToAdvance: number): Promise<void> => {
  if (window.ethereum) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    
    try {
      // This is specifically for Hardhat
      await provider.send("evm_increaseTime", [secondsToAdvance]);
      await provider.send("evm_mine", []);
      console.log(`Blockchain time advanced by ${secondsToAdvance} seconds`);
    } catch (error) {
      console.error("Failed to advance time. Make sure you're using a test network that supports this feature:", error);
    }
  }
};

/**
 * For testing purposes: Force a ride to be marked as completed
 * Note: This would require your smart contract to have a test-only function
 * that allows changing a ride status (not secure for production)
 */
export const forceCompleteRide = async (rideId: number): Promise<void> => {
  if (window.ethereum) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    
    const abi = ["function forceCompleteRide(uint256 rideId) external"];
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.RIDE_OFFER, abi, signer);
    
    try {
      const tx = await contract.forceCompleteRide(rideId);
      await tx.wait();
      console.log(`Ride ${rideId} marked as completed for testing purposes`);
    } catch (error) {
      console.error("Failed to force complete ride:", error);
    }
  }
};

// Add a new function to test rating functionality
export const testRateDriver = async (driverAddress: string, rideId: number, rating: number): Promise<void> => {
  if (window.ethereum) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    
    const abi = ["function rateDriver(address _driver, uint256 _rideId, uint256 _rating) external"];
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.RIDE_OFFER, abi, signer);
    
    try {
      const tx = await contract.rateDriver(driverAddress, rideId, rating);
      await tx.wait();
      console.log(`Driver ${driverAddress} rated with ${rating} stars for ride ${rideId}`);
    } catch (error) {
      console.error("Failed to rate driver:", error);
    }
  }
};
