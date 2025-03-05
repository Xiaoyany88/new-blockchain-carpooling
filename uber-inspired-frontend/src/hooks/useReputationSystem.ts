import { useEffect, useState } from "react";
import { ethers } from "ethers";
import ReputationSystemABI from "../abis/ReputationSystem.json"; // ABI for ReputationSystem contract
import { CONTRACT_ADDRESSES } from "../config/contracts";

const useReputationSystem = (provider: any) => {
  const [reputationSystem, setReputationSystem] = useState<any>(null);

  useEffect(() => {
    if (provider) {
      const contract = new ethers.Contract(
        CONTRACT_ADDRESSES.REPUTATION_SYSTEM,
        ReputationSystemABI,
        provider
      );
      setReputationSystem(contract);
    }
  }, [provider]);

  // Function to rate a user
  const rateUser = async (userAddress: string, rating: number) => {
    if (reputationSystem && userAddress && rating > 0) {
      try {
        const tx = await reputationSystem.rateUser(userAddress, rating);
        await tx.wait();
        return "User rated successfully!";
      } catch (error) {
        console.error("Error rating user:", error);
        return "Error rating user.";
      }
    }
  };

  // Function to specifically rate a driver for a ride
  const rateDriver = async (driverAddress: string, rating: number, rideId: number) => {
    if (reputationSystem && driverAddress && rating > 0) {
      try {
        const tx = await reputationSystem.rateDriver(driverAddress, rating, rideId);
        await tx.wait();
        return "Driver rated successfully!";
      } catch (error) {
        console.error("Error rating driver:", error);
        return "Error rating driver.";
      }
    }
  };

  // Function to record a completed ride
  const recordRideCompletion = async (driverAddress: string) => {
    if (reputationSystem && driverAddress) {
      try {
        const tx = await reputationSystem.recordRideCompletion(driverAddress);
        await tx.wait();
        return "Ride completion recorded!";
      } catch (error) {
        console.error("Error recording ride completion:", error);
        return "Error recording ride completion.";
      }
    }
  };

  // Function to record a cancelled ride
  const recordRideCancellation = async (driverAddress: string) => {
    if (reputationSystem && driverAddress) {
      try {
        const tx = await reputationSystem.recordRideCancellation(driverAddress);
        await tx.wait();
        return "Ride cancellation recorded!";
      } catch (error) {
        console.error("Error recording ride cancellation:", error);
        return "Error recording cancellation.";
      }
    }
  };

  // Function to get the average rating for a user
  const getAverageRating = async (userAddress: string) => {
    if (reputationSystem && userAddress) {
      try {
        const avgRating = await reputationSystem.getAverageRating(userAddress);
        return avgRating;
      } catch (error) {
        console.error("Error fetching average rating:", error);
        return "Error fetching rating.";
      }
    }
  };

  // Function to get driver statistics
  const getDriverStats = async (driverAddress: string) => {
    if (reputationSystem && driverAddress) {
      try {
        const stats = await reputationSystem.getDriverStats(driverAddress);
        return {
          avgRating: stats[0],
          totalRides: stats[1],
          cancelledRides: stats[2]
        };
      } catch (error) {
        console.error("Error fetching driver stats:", error);
        return "Error fetching driver stats.";
      }
    }
  };

  
  const hasUserRatedRide = async (rideId: number) => {
    if (!reputationSystem || !provider) return false;
    
    try {
      const signer = provider.getSigner();
      const userAddress = await signer.getAddress();
      
      // Access the public hasRated mapping directly
      // Public mappings in Solidity automatically generate getter methods
      const hasRated = await reputationSystem.hasRated(rideId, userAddress);
      return hasRated;
    } catch (error) {
      console.error("Error checking if user rated ride:", error);
      return false;
    }
  };
  
  return { 
    reputationSystem, 
    rateUser, 
    rateDriver, 
    recordRideCompletion, 
    recordRideCancellation, 
    getAverageRating, 
    getDriverStats,
    hasUserRatedRide
  };
};

export default useReputationSystem;
