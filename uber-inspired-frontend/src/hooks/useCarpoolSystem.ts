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
      const rideDetails = await rideOfferContract.getRide(rideId);
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
  const getUserBookings = useCallback(async () => {
    if (!contract || !provider) {
      return { success: false, error: "Wallet not connected", bookings: [] };
    }
  
    try {
      const signer = provider.getSigner();
      const userAddress = await signer.getAddress();
      
      // Get the RideOffer contract instance
      const rideOfferAddress = await contract.rideOffer();
      const rideOfferContract = new ethers.Contract(
        rideOfferAddress,
        RIDEOFFER_ABI,
        signer
      );
      
      // Get user's booking IDs
      const bookingIds = await rideOfferContract.getUserBookings(userAddress);
      console.log("User bookings IDs:", bookingIds);
      
      // Fetch detailed information for each booking
      const bookingsPromises = bookingIds.map(async (rideId: number) => {
        // Get the ride details
        const ride = await rideOfferContract.rides(rideId);
        
        // Find this user's specific booking for this ride
        const bookingsForRide = await rideOfferContract.getBookingsByRide(rideId);
        const userBooking = bookingsForRide.find((booking: any) => 
          booking.passenger.toLowerCase() === userAddress.toLowerCase()
        );
        
        return {
          id: rideId,
          driver: ride.driver,
          pickup: ride.pickup,
          destination: ride.destination,
          departureTime: ride.departureTime.toNumber(),
          pricePerSeat: ethers.utils.formatEther(ride.pricePerSeat),
          bookedSeats: userBooking ? userBooking.seats.toNumber() : 0,
          // Add cancellation check FIRST:
          status: userBooking ? 
          (userBooking.cancelled ? "Cancelled" : 
          userBooking.completed ? "Completed" : "Active") 
          : "Unknown",
          isPaid: userBooking ? userBooking.paid : false
        };
      });
      
      const bookings = await Promise.all(bookingsPromises);
      return { success: true, bookings };
    } catch (error: any) {
      console.error("Error fetching user bookings:", error);
      return { 
        success: false, 
        error: error.message || "Failed to fetch bookings",
        bookings: [] 
      };
    }
  }, [contract, provider]);


  const completeRide = useCallback(async (
    rideId: number,
    passengerAddress: string
  ) => {
    if (!contract) {
      return { 
        success: false, 
        error: "Wallet not connected" 
      };
    }
  
    try {
      console.log("Completing ride:", rideId, "for passenger:", passengerAddress);
      
      // Call the completeRide function from our CarpoolSystem contract
      const tx = await contract.completeRide(rideId, passengerAddress, {
        gasLimit: 700000 // Set a reasonable gas limit
      });
      
      console.log("Transaction sent:", tx.hash);
      // Wait for transaction to be confirmed
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);
      
      return { 
        success: true, 
        transactionHash: receipt.transactionHash 
      };
    } catch (error: any) {
      console.error("Error completing ride:", error);
      
      // Try to extract more useful error information
      let errorMessage = "Transaction failed";
      if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message) {
        if (error.message.includes("execution reverted")) {
          const match = error.message.match(/execution reverted: (.*?)"/);
          if (match && match[1]) {
            errorMessage = match[1];
          }
        }
      }
      
      return { success: false, error: errorMessage };
    }
  }, [contract]);

  const cancelBookingFromSystem = useCallback(async (
    rideId: number, 
    isWithin24Hours: boolean
  ) => {
    if (!contract) {
      return { success: false, error: "Wallet not connected" };
    }
    
    try {
      console.log(`Cancelling booking for ride ID: ${rideId}, within 24h: ${isWithin24Hours}`);
      
      // Call the appropriate smart contract function based on timing
      const tx = await contract.cancelBooking(rideId, isWithin24Hours);
      console.log("Transaction sent:", tx.hash);
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);
      
      return { 
        success: true, 
        transactionHash: receipt.transactionHash
      };
    } catch (error: any) {
      console.error("Error cancelling booking:", error);
      
      // Handle specific errors
      if (error.code === 'CALL_EXCEPTION') {
        const reason = error.reason || "Transaction failed";
        return { success: false, error: `Transaction failed: ${reason}` };
      }
      
      return { 
        success: false, 
        error: error.message || "Failed to cancel booking"
      };
    }
  }, [contract]);



  return {
    bookRide,
    getUserBookings,
    completeRide,
    cancelBookingFromSystem
  };
};

export default useCarpoolSystem;