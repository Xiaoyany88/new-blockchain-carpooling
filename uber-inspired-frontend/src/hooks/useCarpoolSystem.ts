import { useEffect, useState } from "react";
import { ethers } from "ethers";
import CarpoolSystemABI from "../abis/CarpoolSystem.json";
import { CONTRACT_ADDRESSES } from "../config/contracts";

const useCarpoolSystem = (provider: ethers.providers.Web3Provider | null) => {
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [rideOfferContract, setRideOfferContract] = useState<ethers.Contract | null>(null);
  const [reputationContract, setReputationContract] = useState<ethers.Contract | null>(null);
  const [escrowContract, setEscrowContract] = useState<ethers.Contract | null>(null);
  const [tokenContract, setTokenContract] = useState<ethers.Contract | null>(null);

  useEffect(() => {
    if (provider) {
      const signer = provider.getSigner();
      const systemContract = new ethers.Contract(
        CONTRACT_ADDRESSES.CARPOOL_SYSTEM,
        CarpoolSystemABI,
        signer
      );
      setContract(systemContract);
      
      // Get references to other contracts
      const loadContracts = async () => {
        try {
          const rideOfferAddress = await systemContract.rideOffer();
          const reputationAddress = await systemContract.reputationSystem();
          const escrowAddress = await systemContract.paymentEscrow();
          const tokenAddress = await systemContract.carpoolToken();
          
          // You would need to import the ABIs for these contracts
          // setRideOfferContract(new ethers.Contract(rideOfferAddress, RideOfferABI, signer));
          // setReputationContract(new ethers.Contract(reputationAddress, ReputationSystemABI, signer));
          // setEscrowContract(new ethers.Contract(escrowAddress, PaymentEscrowABI, signer));
          // setTokenContract(new ethers.Contract(tokenAddress, CarpoolTokenABI, signer));
        } catch (error) {
          console.error("Error loading contract references:", error);
        }
      };
      
      loadContracts();
    }
  }, [provider]);

  // This would need to be implemented within the RideOffer contract functionality
  const completeRide = async (rideId: number) => {
    if (!rideOfferContract) return;
    try {
      const tx = await rideOfferContract.completeRide(rideId);
      await tx.wait();
      return true;
    } catch (error) {
      console.error("Error completing ride:", error);
      return false;
    }
  };

  return {
    contract,
    rideOfferContract,
    reputationContract,
    escrowContract,
    tokenContract,
    completeRide
  };
};

export default useCarpoolSystem;
