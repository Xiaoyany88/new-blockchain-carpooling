import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '../config/contracts';

// Import all necessary ABIs
import CarpoolSystemABI from '../abis/CarpoolSystem.json';
import RideOfferABI from '../abis/RideOffer.json';
import ReputationSystemABI from '../abis/ReputationSystem.json';
import PaymentEscrowABI from '../abis/PaymentEscrow.json';
import CarpoolTokenABI from '../abis/CarpoolToken.json';

// Define Sepolia testnet chain ID
const EXPECTED_CHAIN_ID = 11155111; // Sepolia testnet

export const useCarpoolSystem = () => {
  const [carpoolSystemContract, setCarpoolSystemContract] = useState<ethers.Contract | null>(null);
  const [rideOfferContract, setRideOfferContract] = useState<ethers.Contract | null>(null);
  const [reputationSystemContract, setReputationSystemContract] = useState<ethers.Contract | null>(null);
  const [paymentEscrowContract, setPaymentEscrowContract] = useState<ethers.Contract | null>(null);
  const [carpoolTokenContract, setCarpoolTokenContract] = useState<ethers.Contract | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

   // Add network validation states
   const [currentChainId, setCurrentChainId] = useState<number | null>(null);
   const [isCorrectNetwork, setIsCorrectNetwork] = useState<boolean>(false);

  // Add state for event notifications
  const [eventNotifications, setEventNotifications] = useState<Array<{
    type: string;
    data: any;
    timestamp: number;
    read: boolean;
  }>>([]);

  useEffect(() => {
    const initContracts = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check if window.ethereum exists
        if (!window.ethereum) {
          throw new Error("MetaMask is not installed. Please install MetaMask to use this application.");
        }

        // Request account access
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // Create provider and signer
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        
        // Check network before proceeding
        const network = await provider.getNetwork();
        setCurrentChainId(network.chainId);
        
        if (network.chainId !== EXPECTED_CHAIN_ID) {
          setIsCorrectNetwork(false);
          setError(`Please switch to Sepolia testnet in MetaMask. Current network: ${network.name || "unknown"} (Chain ID: ${network.chainId})`);
          setIsLoading(false);
          return; // Stop initialization if wrong network
        }
        
        setIsCorrectNetwork(true);
        
        const signer = provider.getSigner();
        
        // Initialize contracts with addresses from config
        const carpoolSystem = new ethers.Contract(
          CONTRACT_ADDRESSES.CARPOOL_SYSTEM,
          CarpoolSystemABI,
          signer
        );
        setCarpoolSystemContract(carpoolSystem);

        // Initialize all related contracts
        const rideOffer = new ethers.Contract(
          CONTRACT_ADDRESSES.RIDE_OFFER,
          RideOfferABI,
          signer
        );
        setRideOfferContract(rideOffer);

        const reputationSystem = new ethers.Contract(
          CONTRACT_ADDRESSES.REPUTATION_SYSTEM,
          ReputationSystemABI,
          signer
        );
        setReputationSystemContract(reputationSystem);

        const paymentEscrow = new ethers.Contract(
          CONTRACT_ADDRESSES.PAYMENT_ESCROW,
          PaymentEscrowABI,
          signer
        );
        setPaymentEscrowContract(paymentEscrow);

        const carpoolToken = new ethers.Contract(
          CONTRACT_ADDRESSES.CARPOOL_TOKEN,
          CarpoolTokenABI,
          signer
        );
        setCarpoolTokenContract(carpoolToken);

        setIsLoading(false);
      } catch (err) {
        console.error("Failed to initialize contracts:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred");
        setIsLoading(false);
      }
    };

    initContracts();

    // Setup event listeners for network changes
    const handleChainChanged = () => {
      window.location.reload();
    };

    const handleAccountsChanged = () => {
      window.location.reload();
    };

    if (window.ethereum) {
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('accountsChanged', handleAccountsChanged);
    }

    return () => {
      // Clean up event listeners
      if (window.ethereum) {
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  /**
   * Helper function to switch to Sepolia network
   */
  const switchToSepoliaNetwork = async () => {
    if (!window.ethereum) {
      setError("MetaMask is not installed");
      return;
    }
    
    try {
      // Try to switch to Sepolia
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${EXPECTED_CHAIN_ID.toString(16)}` }], // Convert to hex
      });
      
      // Reload page after switching
      window.location.reload();
    } catch (switchError: any) {
      // This error code indicates the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          // Add Sepolia network to MetaMask
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${EXPECTED_CHAIN_ID.toString(16)}`,
              chainName: 'Sepolia Test Network',
              nativeCurrency: {
                name: 'Sepolia ETH',
                symbol: 'ETH',
                decimals: 18
              },
              rpcUrls: [process.env.SEPOLIA_RPC_URL, 'https://rpc.sepolia.org'],
              blockExplorerUrls: ['https://sepolia.etherscan.io']
            }]
          });
          
          // Try switching again
          await switchToSepoliaNetwork();
        } catch (addError) {
          console.error('Failed to add Sepolia network:', addError);
          setError('Failed to add Sepolia to your wallet. Please add it manually.');
        }
      } else {
        console.error('Failed to switch to Sepolia:', switchError);
        setError('Failed to switch network. Please try manually switching in MetaMask.');
      }
    }
  };

  // Add contract method validation
  useEffect(() => {
    const validateContracts = async () => {
      try {
        // Validate CarpoolSystem contract methods
        if (carpoolSystemContract) {
          const completeRideFunction = carpoolSystemContract.interface.getFunction('completeRide(uint256)');
          const cancelRideFunction = carpoolSystemContract.interface.getFunction('cancelRide(uint256)');
          const totalRidesFunction = carpoolSystemContract.interface.getFunction('totalRides()');
          
          if (!completeRideFunction || !cancelRideFunction || !totalRidesFunction) {
            console.warn("Some expected CarpoolSystem functions are missing from the ABI");
          }
        }
        
        // Validate RideOffer contract methods
        if (rideOfferContract) {
          const createRideFunction = rideOfferContract.interface.getFunction('createRide(address,string,string,uint256,uint256,uint256)');
          const bookRideFunction = rideOfferContract.interface.getFunction('bookRide(uint256)');
          
          if (!createRideFunction || !bookRideFunction) {
            console.warn("Some expected RideOffer functions are missing from the ABI");
          }
        }
        
        // Validate ReputationSystem contract methods
        if (reputationSystemContract) {
          const rateUserFunction = reputationSystemContract.interface.getFunction('rateUser(address,uint8)');
          const getAverageRatingFunction = reputationSystemContract.interface.getFunction('getAverageRating(address)');
          
          if (!rateUserFunction || !getAverageRatingFunction) {
            console.warn("Some expected ReputationSystem functions are missing from the ABI");
          }
        }
        
        // Validate PaymentEscrow contract methods
        if (paymentEscrowContract) {
          const escrowPaymentFunction = paymentEscrowContract.interface.getFunction('escrowPayment(uint256)');
          const releasePaymentFunction = paymentEscrowContract.interface.getFunction('releasePayment(uint256)');
          
          if (!escrowPaymentFunction || !releasePaymentFunction) {
            console.warn("Some expected PaymentEscrow functions are missing from the ABI");
          }
        }
        
        // Validate CarpoolToken contract methods
        if (carpoolTokenContract) {
          const balanceOfFunction = carpoolTokenContract.interface.getFunction('balanceOf(address)');
          const rewardDriverFunction = carpoolTokenContract.interface.getFunction('rewardDriver(address,uint256)');
          
          if (!balanceOfFunction || !rewardDriverFunction) {
            console.warn("Some expected CarpoolToken functions are missing from the ABI");
          }
        }
      } catch (err) {
        console.error("Contract validation failed:", err);
      }
    };
    
    validateContracts();
  }, [
    carpoolSystemContract, 
    rideOfferContract, 
    reputationSystemContract, 
    paymentEscrowContract, 
    carpoolTokenContract
  ]);
  /**
   * Complete a ride and release payment to the driver
   */
  const completeRide = async (rideId: string) => {
    try {
      if (!carpoolSystemContract) {
        throw new Error("CarpoolSystem contract not initialized");
      }

      // Estimate gas for the transaction
      const gasEstimate = await carpoolSystemContract.estimateGas.completeRide(rideId);
      const adjustedGasLimit = gasEstimate.mul(120).div(100); // Add 20% buffer

      // Send transaction with gas limit
      const tx = await carpoolSystemContract.completeRide(rideId, {
        gasLimit: adjustedGasLimit
      });
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      return { success: true, transaction: receipt };
    } catch (err) {
      console.error("Error completing ride:", err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : "Failed to complete ride" 
      };
    }
  };

  /**
   * Cancel a ride and refund the passenger
   */
  const cancelRide = async (rideId: string) => {
    try {
      if (!carpoolSystemContract) {
        throw new Error("CarpoolSystem contract not initialized");
      }

      // Estimate gas for the transaction
      const gasEstimate = await carpoolSystemContract.estimateGas.cancelRide(rideId);
      const adjustedGasLimit = gasEstimate.mul(120).div(100); // Add 20% buffer

      // Send transaction with gas limit
      const tx = await carpoolSystemContract.cancelRide(rideId, {
        gasLimit: adjustedGasLimit
      });
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      return { success: true, transaction: receipt };
    } catch (err) {
      console.error("Error cancelling ride:", err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : "Failed to cancel ride" 
      };
    }
  };

  /**
   * Get system statistics
   */
  const getSystemStats = async () => {
    try {
      if (!carpoolSystemContract) {
        throw new Error("CarpoolSystem contract not initialized");
      }

      const totalRides = await carpoolSystemContract.totalRides();
      const totalUsers = await carpoolSystemContract.totalUsers();
      const totalTokensIssued = await carpoolSystemContract.totalTokensIssued();
      
      return {
        success: true,
        data: {
          totalRides: totalRides.toString(),
          totalUsers: totalUsers.toString(),
          totalTokensIssued: ethers.utils.formatUnits(totalTokensIssued, 18)
        }
      };
    } catch (err) {
      console.error("Error getting system stats:", err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : "Failed to get system statistics" 
      };
    }
  };

  // Register event listeners for important contract events
  useEffect(() => {
    if (!carpoolSystemContract) return;

    const rideCompletedFilter = carpoolSystemContract.filters.RideCompleted();
    const rewardTokensIssuedFilter = carpoolSystemContract.filters.RewardTokensIssued();
    
    const handleRideCompleted = (
      rideId: string, 
      driver: string, 
      passenger: string, 
      amount: ethers.BigNumber, 
      event: ethers.Event
    ) => {
      const notificationData = { 
        rideId, 
        driver, 
        passenger, 
        amount: ethers.utils.formatEther(amount) 
      };
      
      // Create a notification object
      const notification = {
        type: 'RIDE_COMPLETED',
        data: notificationData,
        timestamp: Date.now(),
        read: false
      };
      
      // Update notifications state (keeping latest 10)
      setEventNotifications(prev => [notification, ...prev].slice(0, 10));
      
      console.log("Ride completed:", notificationData);
      // You could dispatch an action or update state here
    };
    
    const handleRewardTokensIssued = (
      user: string, 
      amount: ethers.BigNumber, 
      event: ethers.Event
    ) => {
      const notificationData = {
        user,
        amount: ethers.utils.formatEther(amount)
      };
      
      // Create a notification object
      const notification = {
        type: 'REWARD_TOKENS_ISSUED',
        data: notificationData,
        timestamp: Date.now(),
        read: false
      };
      
      // Update notifications state (keeping latest 10)
      setEventNotifications(prev => [notification, ...prev].slice(0, 10));
      
      console.log("Tokens rewarded:", notificationData);
    };

    carpoolSystemContract.on(rideCompletedFilter, handleRideCompleted);
    carpoolSystemContract.on(rewardTokensIssuedFilter, handleRewardTokensIssued);

    return () => {
      carpoolSystemContract.off(rideCompletedFilter, handleRideCompleted);
      carpoolSystemContract.off(rewardTokensIssuedFilter, handleRewardTokensIssued);
    };
  }, [carpoolSystemContract]);

  /**
   * Mark a notification as read
   */
  const markNotificationAsRead = (timestamp: number) => {
    setEventNotifications(prev => 
      prev.map(notification => 
        notification.timestamp === timestamp 
          ? { ...notification, read: true } 
          : notification
      )
    );
  };

  /**
   * Clear all notifications
   */
  const clearAllNotifications = () => {
    setEventNotifications([]);
  };

  return {
    carpoolSystemContract,
    rideOfferContract,
    reputationSystemContract,
    paymentEscrowContract,
    carpoolTokenContract,
    isLoading,
    error,
    // Network validation fields
    currentChainId,
    isCorrectNetwork,
    switchToSepoliaNetwork,
    // Existing functions
    completeRide,
    cancelRide,
    getSystemStats,
    // Add notification-related properties
    eventNotifications,
    markNotificationAsRead,
    clearAllNotifications
  };
};

export default useCarpoolSystem;