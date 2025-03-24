import { useEffect, useState,useCallback } from "react";
import { ethers } from "ethers";
import RideOfferABI from "../abis/RideOffer.json";
import { CONTRACT_ADDRESSES } from "../config/contracts";

const useRideOffer = (provider: ethers.providers.Web3Provider | null) => {
  const [contract, setContract] = useState<ethers.Contract | null>(null);

  useEffect(() => {
    if (provider) {
      const signer = provider.getSigner();
      const rideOfferContract = new ethers.Contract(
        CONTRACT_ADDRESSES.RIDE_OFFER,
        RideOfferABI,
        signer
      );
      setContract(rideOfferContract);
    }
  }, [provider]);

  const createRide = async (
    pickup: string,
    destination: string,
    departureTime: number,
    maxPassengers: number,
    pricePerSeat: string,
    additionalNotes: string
  ) => {
    if (!contract) return null;
    try {
      const priceInWei = ethers.utils.parseEther(pricePerSeat);
      const tx = await contract.createRide(
        pickup,
        destination,
        departureTime,
        maxPassengers,
        priceInWei,
        additionalNotes
      );
      const receipt = await tx.wait();
      return receipt;
    } catch (error) {
      console.error("Error creating ride:", error);
      throw error;
    }
  };

  const bookRide = async (rideId: number, seats: number, price: string) => {
    if (!contract) return null;
    try {
      const valueInWei = ethers.utils.parseEther(price);
      const tx = await contract.bookRide(rideId, seats, { value: valueInWei });
      const receipt = await tx.wait();
      return receipt;
    } catch (error) {
      console.error("Error booking ride:", error);
      throw error;
    }
  };

  const cancelRide = async (rideId: number) => {
    if (!contract) return null;
    try {
      const tx = await contract.cancelRide(rideId);
      const receipt = await tx.wait();
      return receipt;
    } catch (error) {
      console.error("Error cancelling ride:", error);
      throw error;
    }
  };

  const completeRide = async (rideId: number) => {
    if (!contract) return null;
    try {
      const tx = await contract.completeRide(rideId);
      const receipt = await tx.wait();
      return receipt;
    } catch (error) {
      console.error("Error completing ride:", error);
      throw error;
    }
  };

  const getRide = useCallback(async (rideId: number) => {
    if (!contract) return null;
    try {
      const rideData = await contract.getRide(rideId);
      return {
        driver: rideData[0],
        pickup: rideData[1],
        destination: rideData[2],
        departureTime: rideData[3].toNumber(),
        maxPassengers: rideData[4].toNumber(),
        pricePerSeat: ethers.utils.formatEther(rideData[5]),
        availableSeats: rideData[6].toNumber(),
        additionalNotes: rideData[7],
        isActive: rideData[8]
      };
    } catch (error) {
      console.error("Error getting ride:", error);
      throw error;
    }
  }, [contract]);

  // Use useCallback to memoize the function
  const getAvailableRides = useCallback(async () => {
    if (!contract) return [];
    try {
      const rideIds = await contract.getAvailableRides();
      return rideIds.map((id: ethers.BigNumber) => id.toNumber());
    } catch (error) {
      console.error("Error getting available rides:", error);
      return [];
    }
  }, [contract]); // only recreate when contract changes

  const getUserBookings = useCallback(async () => {
    if (!contract || !provider) return [];
    
    try {
      const signer = provider.getSigner();
      const userAddress = await signer.getAddress();
      console.log("Fetching bookings for address:", userAddress);
      
      const bookings = await contract.getUserBookings(userAddress);
      console.log("Raw bookings data:", bookings);
      
      const bookingIds = bookings.map((id: ethers.BigNumber) => id.toNumber());
      console.log("Processed booking IDs:", bookingIds);
      
      return bookingIds;
    } catch (error) {
      console.error("Error fetching user bookings:", error);
      return [];
    }
  }, [contract, provider]);

  const hasUserRatedRide = async (rideId: number) => {
    if (!contract || !provider) return false;
    
    try {
      const signer = provider.getSigner();
      const userAddress = await signer.getAddress();
      
      const hasRated = await contract.hasUserRatedRide(userAddress, rideId);
      return hasRated;
    } catch (error) {
      console.error("Error checking if user rated ride:", error);
      return false;
    }
  };

  return {
    contract,
    createRide,
    bookRide,
    cancelRide,
    completeRide,
    getRide,
    getAvailableRides,
    getUserBookings,
    //newly added
    hasUserRatedRide
  };
};

export default useRideOffer;
