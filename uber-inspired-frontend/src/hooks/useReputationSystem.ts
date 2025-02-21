import { useEffect, useState } from "react";
import { ethers } from "ethers";
import ReputationSystemABI from "../abis/ReputationSystem.json"; // ABI for ReputationSystem contract

const useReputationSystem = (provider: any) => {
  const [reputationSystem, setReputationSystem] = useState<any>(null);

  useEffect(() => {
    if (provider) {
      const contract = new ethers.Contract(
        "0xd73a3F604a12a26442f446c245963c87ac7bC1BE",  // Replace with your contract's address
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

  return { reputationSystem, rateUser, getAverageRating };
};

export default useReputationSystem;
