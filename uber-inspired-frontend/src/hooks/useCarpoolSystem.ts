// src/hooks/useCarpoolSystem.ts
import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import CARPOOL_ABI from '../abis/CarpoolSystem.json'; // You'll need to create this ABI file
import RIDEOFFER_ABI from '../abis/RideOffer.json';
import { CONTRACT_ADDRESSES } from "../config/contracts";

const useCarpoolSystem = (provider: ethers.providers.Web3Provider | null) => {
  const [contract, setContract] = useState<ethers.Contract | null>(null);

  useEffect(() => {
    if (!provider) return;

    // Initialize contract
    try {
      const signer = provider.getSigner();
      const carpoolContract = new ethers.Contract(
        CONTRACT_ADDRESSES.CARPOOL_SYSTEM, 
        CARPOOL_ABI, 
        signer
      );
      setContract(carpoolContract);
    } catch (error) {
      console.error("Error initializing carpool contract:", error);
    }
  }, [provider]);

  const bookRide = useCallback(async (
    rideId: number, 
    seats: number, 
    totalCostWei: ethers.BigNumber
  ) => {
    if (!contract) {
      return { 
        success: false, 
        error: "Wallet not connected" 
      };
    }

    try {
      // Log exact values being sent
      console.log("Booking with Wei value:", totalCostWei.toString());
      
      // Get the RideOffer contract instance from CarpoolSystem
      const rideOfferAddress = await contract.rideOffer();
      console.log("RideOffer address:", rideOfferAddress);
      // Create an instance of the RideOffer contract
      // You'll need to import the RideOffer ABI
      const rideOfferContract = new ethers.Contract(
        rideOfferAddress,
        RIDEOFFER_ABI,  
        contract.signer
      );

      // Verify exact match with contract data
      const rideDetails = await rideOfferContract.rides(rideId);
      const contractPricePerSeat = rideDetails.pricePerSeat;
      const contractTotalWei = contractPricePerSeat.mul(seats);
      
      console.log("EXACT WEI COMPARISON:", {
        contractPricePerSeat: contractPricePerSeat.toString(),
        clientPriceCalculation: totalCostWei.toString(),
        exactMatch: contractTotalWei.eq(totalCostWei)
      });

      // Call the bookRide function with transaction value
      const tx = await contract.bookRide(rideId, seats, {
        value: contractTotalWei,
        gasLimit: 600000 // Set a reasonable gas limit
      });
      console.log("Transaction sent:", tx.hash);
      // Wait for transaction to be confirmed
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);

      return { success: true, transactionHash: receipt.transactionHash };
    } catch (error: any) {
      console.error("Error booking ride:", error);
      
      // Try to extract more useful error information
      let errorMessage = "Transaction failed";

      // Specific error handling for common cases
    if (error.reason) {
      errorMessage = error.reason;
    } else if (error.message) {
      if (error.message.includes("Incorrect payment amount")) {
        errorMessage = "Price mismatch. The contract expected a different payment amount.";
      } else if (error.message.includes("execution reverted")) {
        const match = error.message.match(/execution reverted: (.*?)"/);
        if (match && match[1]) {
          errorMessage = match[1];
        }
      }
    }
      
      return { success: false, error: errorMessage };
    }
  }, [contract]);

  // Additional functions like getMyBookings can go here

  return {
    bookRide
  };
};

export default useCarpoolSystem;