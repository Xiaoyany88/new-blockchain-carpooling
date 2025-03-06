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

  // Network validation states
  const [currentChainId, setCurrentChainId] = useState<number | null>(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState<boolean>(false);

  // Event notifications state
  const [eventNotifications, setEventNotifications] = useState<Array<{
    type: string;
    data: any;
    timestamp: number;
    read: boolean;
  }>>([]);

  // Initialize contracts when component mounts
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
              rpcUrls: ['https://sepolia.infura.io/v3/', 'https://rpc.sepolia.org'],
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
          const bookRideFunction = carpoolSystemContract.interface.getFunction('bookRide(uint256,uint256)');
          const completeRideFunction = carpoolSystemContract.interface.getFunction('completeRide(uint256,address)');
          const rateDriverFunction = carpoolSystemContract.interface.getFunction('rateDriver(uint256,address,uint8)');
          const getDriverInfoFunction = carpoolSystemContract.interface.getFunction('getDriverInfo(address)');
          
          if (!bookRideFunction || !completeRideFunction || !rateDriverFunction || !getDriverInfoFunction) {
            console.warn("Some expected CarpoolSystem functions are missing from the ABI");
          }
        }
      } catch (err) {
        console.error("Contract validation failed:", err);
      }
    };
    
    validateContracts();
  }, [carpoolSystemContract]);

  /**
   * Book a ride and handle payment in one transaction
   * @param rideId The ID of the ride to book
   * @param seats Number of seats to book
   * @param pricePerSeat Price per seat in ETH
   */
  const bookRide = async (rideId: number, seats: number, pricePerSeat: string) => {
    try {
      if (!carpoolSystemContract) {
        throw new Error("CarpoolSystem contract not initialized");
      }

      const totalPrice = ethers.utils.parseEther(
        (parseFloat(pricePerSeat) * seats).toString()
      );

      // Estimate gas for the transaction
      const gasEstimate = await carpoolSystemContract.estimateGas.bookRide(
        rideId, 
        seats, 
        { value: totalPrice }
      );
      const adjustedGasLimit = gasEstimate.mul(120).div(100); // Add 20% buffer

      // Send transaction with gas limit and value
      const tx = await carpoolSystemContract.bookRide(
        rideId, 
        seats, 
        { 
          value: totalPrice,
          gasLimit: adjustedGasLimit 
        }
      );
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      return { success: true, transaction: receipt };
    } catch (err) {
      console.error("Error booking ride:", err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : "Failed to book ride" 
      };
    }
  };

  /**
   * Complete a ride and release payment to the driver
   * @param rideId The ID of the ride to complete
   * @param passengerAddress The address of the passenger to complete ride for
   */
  const completeRide = async (rideId: number, passengerAddress: string) => {
    try {
      if (!carpoolSystemContract) {
        throw new Error("CarpoolSystem contract not initialized");
      }

      // Estimate gas for the transaction
      const gasEstimate = await carpoolSystemContract.estimateGas.completeRide(
        rideId, 
        passengerAddress
      );
      const adjustedGasLimit = gasEstimate.mul(120).div(100); // Add 20% buffer

      // Send transaction with gas limit
      const tx = await carpoolSystemContract.completeRide(
        rideId, 
        passengerAddress, 
        { gasLimit: adjustedGasLimit }
      );
      
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
   * Rate a driver after ride completion
   * @param rideId The ID of the completed ride
   * @param driverAddress The address of the driver to rate
   * @param rating Rating from 1-5 stars
   */
  const rateDriver = async (rideId: number, driverAddress: string, rating: number) => {
    try {
      if (!carpoolSystemContract) {
        throw new Error("CarpoolSystem contract not initialized");
      }

      // Ensure rating is between 1-5
      if (rating < 1 || rating > 5) {
        throw new Error("Rating must be between 1 and 5");
      }

      // Estimate gas for the transaction
      const gasEstimate = await carpoolSystemContract.estimateGas.rateDriver(
        rideId, 
        driverAddress, 
        rating
      );
      const adjustedGasLimit = gasEstimate.mul(120).div(100); // Add 20% buffer

      // Send transaction with gas limit
      const tx = await carpoolSystemContract.rateDriver(
        rideId, 
        driverAddress, 
        rating, 
        { gasLimit: adjustedGasLimit }
      );
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      return { success: true, transaction: receipt };
    } catch (err) {
      console.error("Error rating driver:", err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : "Failed to rate driver" 
      };
    }
  };

  /**
   * Get driver's reputation information
   * @param driverAddress The address of the driver
   */
  const getDriverInfo = async (driverAddress: string) => {
    try {
      if (!carpoolSystemContract) {
        throw new Error("CarpoolSystem contract not initialized");
      }

      const result = await carpoolSystemContract.getDriverInfo(driverAddress);
      
      return { 
        success: true, 
        data: {
          avgRating: result[0].toNumber(),
          totalRides: result[1].toNumber(),
          cancelledRides: result[2].toNumber()
        }
      };
    } catch (err) {
      console.error("Error getting driver info:", err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : "Failed to get driver information" 
      };
    }
  };

  // Register event listeners for contract events
  useEffect(() => {
    if (!carpoolSystemContract) return;

    const rideCompletedFilter = carpoolSystemContract.filters.RideCompleted();
    const rewardTokensIssuedFilter = carpoolSystemContract.filters.RewardTokensIssued();
    const rideBookedFilter = carpoolSystemContract.filters.RideBooked();
    const driverRatedFilter = carpoolSystemContract.filters.DriverRated();
    
    const handleRideCompleted = (
      rideId: ethers.BigNumber, 
      driver: string, 
      passenger: string,
      event: ethers.Event
    ) => {
      const notificationData = { 
        rideId: rideId.toString(), 
        driver, 
        passenger
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

    const handleRideBooked = (
      rideId: ethers.BigNumber,
      passenger: string,
      seats: ethers.BigNumber,
      event: ethers.Event
    ) => {
      const notificationData = {
        rideId: rideId.toString(),
        passenger,
        seats: seats.toString()
      };
      
      // Create a notification object
      const notification = {
        type: 'RIDE_BOOKED',
        data: notificationData,
        timestamp: Date.now(),
        read: false
      };
      
      // Update notifications state
      setEventNotifications(prev => [notification, ...prev].slice(0, 10));
      
      console.log("Ride booked:", notificationData);
    };

    const handleDriverRated = (
      rideId: ethers.BigNumber,
      driver: string,
      rating: number,
      event: ethers.Event
    ) => {
      const notificationData = {
        rideId: rideId.toString(),
        driver,
        rating
      };
      
      // Create a notification object
      const notification = {
        type: 'DRIVER_RATED',
        data: notificationData,
        timestamp: Date.now(),
        read: false
      };
      
      // Update notifications state
      setEventNotifications(prev => [notification, ...prev].slice(0, 10));
      
      console.log("Driver rated:", notificationData);
    };

    carpoolSystemContract.on(rideCompletedFilter, handleRideCompleted);
    carpoolSystemContract.on(rewardTokensIssuedFilter, handleRewardTokensIssued);
    carpoolSystemContract.on(rideBookedFilter, handleRideBooked);
    carpoolSystemContract.on(driverRatedFilter, handleDriverRated);

    return () => {
      carpoolSystemContract.off(rideCompletedFilter, handleRideCompleted);
      carpoolSystemContract.off(rewardTokensIssuedFilter, handleRewardTokensIssued);
      carpoolSystemContract.off(rideBookedFilter, handleRideBooked);
      carpoolSystemContract.off(driverRatedFilter, handleDriverRated);
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
    // Core contract functions (aligned with CarpoolSystem.sol)
    bookRide,
    completeRide,
    rateDriver,
    getDriverInfo,
    // Notification management
    eventNotifications,
    markNotificationAsRead,
    clearAllNotifications
  };
};

export default useCarpoolSystem;