import { ethers } from 'ethers';
import RideOfferABI from "../abis/RideOffer.json";
import { CONTRACT_ADDRESSES } from "../config/contracts";

export const testContractIntegration = async () => {
  if (window.ethereum) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.RIDE_OFFER, RideOfferABI, signer);
    
    try {
      console.log("Testing contract integration...");
      
      // Test getUserBookings
      const userAddress = await signer.getAddress();
      console.log("User address:", userAddress);
      
      const bookings = await contract.getUserBookings(userAddress);
      console.log("User bookings:", bookings.map((id: any) => id.toString()));
      
      // Test getAvailableRides
      const availableRides = await contract.getAvailableRides();
      console.log("Available rides:", availableRides.map((id: any) => id.toString()));
      
      console.log("Contract integration test completed successfully!");
      return true;
    } catch (error) {
      console.error("Contract integration test failed:", error);
      return false;
    }
  } else {
    console.error("Ethereum provider not found");
    return false;
  }
};
