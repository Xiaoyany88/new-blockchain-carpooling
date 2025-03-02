import { useEffect, useState } from "react";
import { ethers } from "ethers";
import CarpoolTokenABI from "../abis/CarpoolToken.json"; // ABI for CarpoolToken contract
import { CONTRACT_ADDRESSES } from "../config/contracts";

const useCarpoolToken = (provider: ethers.providers.Web3Provider | null) => {
  const [carpoolToken, setCarpoolToken] = useState<ethers.Contract | null>(null);

  useEffect(() => {
    if (provider) {
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESSES.CARPOOL_TOKEN,
        CarpoolTokenABI,
        signer
      );
      setCarpoolToken(contract);
    }
  }, [provider]);

  // Function to mint tokens to a user
  const mintTokens = async (toAddress: string, amount: string) => {
    if (!carpoolToken || !toAddress || !amount) return null;
    try {
      const tx = await carpoolToken.mint(toAddress, ethers.utils.parseUnits(amount, 18)); // Assuming token has 18 decimals
      await tx.wait();
      return `${amount} tokens minted to ${toAddress}`;
    } catch (error) {
      console.error("Error minting tokens:", error);
      throw error;
    }
  };

  // Function to burn tokens from the user's balance
  const burnTokens = async (amount: string) => {
    if (!carpoolToken || !amount) return null;
    try {
      const tx = await carpoolToken.burn(ethers.utils.parseUnits(amount, 18));
      await tx.wait();
      return `${amount} tokens burned.`;
    } catch (error) {
      console.error("Error burning tokens:", error);
      throw error;
    }
  };

  // Function to reward a driver
  const rewardDriver = async (driverAddress: string) => {
    if (!carpoolToken || !driverAddress) return null;
    try {
      const tx = await carpoolToken.rewardDriver(driverAddress);
      await tx.wait();
      return `Driver ${driverAddress} has been rewarded!`;
    } catch (error) {
      console.error("Error rewarding driver:", error);
      throw error;
    }
  };
  
  // Function to get driver rewards
  const getDriverRewards = async (driverAddress: string) => {
    if (!carpoolToken || !driverAddress) return null;
    try {
      const rewards = await carpoolToken.getDriverRewards(driverAddress);
      return ethers.utils.formatUnits(rewards, 18); // Assuming token has 18 decimals
    } catch (error) {
      console.error("Error fetching driver rewards:", error);
      throw error;
    }
  };

  // Function to check the token balance of an address
  const getBalance = async (userAddress: string) => {
    if (!carpoolToken || !userAddress) return null;
    try {
      const balance = await carpoolToken.balanceOf(userAddress);
      return ethers.utils.formatUnits(balance, 18); // Assuming token has 18 decimals
    } catch (error) {
      console.error("Error fetching balance:", error);
      throw error;
    }
  };

  return { 
    carpoolToken, 
    mintTokens, 
    burnTokens, 
    rewardDriver, 
    getDriverRewards, 
    getBalance 
  };
};

export default useCarpoolToken;
