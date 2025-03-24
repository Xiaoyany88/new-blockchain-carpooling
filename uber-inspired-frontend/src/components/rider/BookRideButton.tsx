// src/components/rider/BookRideButton.tsx
import { useState } from 'react';
import { ethers } from 'ethers';
import useProvider from '../../hooks/useProvider';
import useCarpoolSystem from '../../hooks/useCarpoolSystem';
import { CONTRACT_ADDRESSES, SUPPORTED_CHAIN_ID } from '../../config/contracts';
import './BookRideButton.css';

type Ride = {
  id: number;
  driver: string;
  pickup: string;
  destination: string;
  departureTime: number;
  maxPassengers: number;
  availableSeats: number;
  pricePerSeat: string;
  additionalNotes: string;
  isActive: boolean;
};

export const BookRideButton = ({ ride }: { ride: Ride }) => {
  const provider = useProvider();
  const { bookRide } = useCarpoolSystem(provider);
  const [seats, setSeats] = useState(1);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingResult, setBookingResult] = useState<{success: boolean; message: string; txHash?: string} | null>(null);
  
  const handleBooking = async () => {
    if (!provider || !bookRide) return;
    
    setIsBooking(true);
    setBookingResult(null);
    
    try {
      // Calculate total cost for selected seats
      //const totalCost = (parseFloat(ride.pricePerSeat) * seats).toFixed(6);
      // Use BigNumber for precise calculations
      const pricePerSeatWei = ethers.utils.parseEther(ride.pricePerSeat);
      const totalCostWei = pricePerSeatWei.mul(seats);
      const totalCost = ethers.utils.formatEther(totalCostWei); // For display

      console.log("Debug price info:", {
        pricePerSeat: ride.pricePerSeat,
        pricePerSeatWei: pricePerSeatWei.toString(),
        seats,
        calculatedTotal: totalCostWei.toString(),
        formattedTotal: totalCost
      });

      console.log("Booking details:", {
        rideId: ride.id,
        seats,
        totalCost,
        availableSeats: ride.availableSeats,
        isActive: ride.isActive,
        departureTime: new Date(ride.departureTime * 1000).toISOString(),
        currentTime: new Date().toISOString()
      });
      
      // Call the bookRide function from useCarpoolSystem hook
      const result = await bookRide(ride.id, seats, totalCostWei);
      
      if (result.success) {
        console.log("🔍 PAYMENT VERIFICATION: Checking if payment was escrowed...");
        try {
          const signer = provider.getSigner();
          const userAddress = await signer.getAddress();
          
          // Get the PaymentEscrow contract address from CarpoolSystem
          const carpoolSystemContract = new ethers.Contract(
            CONTRACT_ADDRESSES.CARPOOL_SYSTEM,
            ['function paymentEscrow() external view returns (address)'],
            signer
          );
          
          const paymentEscrowAddress = await carpoolSystemContract.paymentEscrow();
          console.log("📋 PaymentEscrow contract address:", paymentEscrowAddress);
          
          // Create PaymentEscrow contract instance
          const paymentEscrowContract = new ethers.Contract(
            paymentEscrowAddress,
            [
              'function payments(uint256, address) external view returns (uint256 rideId, address passenger, uint256 amount, uint256 seats, bool released, bool refunded)'
            ],
            signer
          );
          
          // Get payment details from escrow
          const payment = await paymentEscrowContract.payments(ride.id, userAddress);
          
          console.log("💰 PAYMENT ESCROW RECORD:", {
            rideId: payment.rideId.toString(),
            passenger: payment.passenger,
            amount: ethers.utils.formatEther(payment.amount),
            seats: payment.seats.toString(),
            released: payment.released,
            refunded: payment.refunded,
            exists: payment.amount.gt(0),
            matchesUserAddress: payment.passenger.toLowerCase() === userAddress.toLowerCase(),
            matchesRideId: payment.rideId.toString() === ride.id.toString()
          });
          
          if (payment.amount.gt(0)) {
            console.log("✅ SUCCESS: Payment was correctly escrowed!");
          } else {
            console.log("❌ ERROR: No payment record found in escrow!");
          }
        } catch (verifyError) {
          console.error("Error verifying payment escrow:", verifyError);
        }
        setBookingResult({
          success: true,
          message: `Successfully booked ${seats} seat(s)!`,
          txHash: result.transactionHash
        });
      } else {
        setBookingResult({
          success: false,
          message: result.error || "Failed to book ride."
        });
      }
    } catch (error: any) {
      console.error("Error booking ride:", error);
      let errorMessage = "Failed to book ride.";
      
      // Extract useful error messages from different error formats
      if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message) {
        // Clean up the error message
        errorMessage = error.message.replace(/\[ethjs-query\]\s+while formatting outputs from RPC\s+'/, '');
        
        if (errorMessage.includes("user rejected transaction")) {
          errorMessage = "Transaction rejected by user.";
        } else if (errorMessage.includes("insufficient funds")) {
          errorMessage = "Insufficient funds to complete this booking.";
        }
      }
      
      setBookingResult({
        success: false,
        message: errorMessage
      });
    } finally {
      setIsBooking(false);
    }
  };
  
  return (
    <div className="book-ride">
      <div className="seat-selector">
        <label htmlFor="seatCount">Number of seats:</label>
        <select 
          id="seatCount" 
          value={seats} 
          onChange={(e) => setSeats(Number(e.target.value))}
          disabled={isBooking}
        >
          {Array.from(
            { length: Math.min(ride.availableSeats, 5) }, 
            (_, i) => i + 1
          ).map(num => (
            <option key={num} value={num}>{num}</option>
          ))}
        </select>
      </div>
      
      <div className="price-display">
        Total: {(Number(ride.pricePerSeat) * seats).toFixed(6)} ETH
      </div>
      
      <button 
        onClick={handleBooking} 
        disabled={isBooking || !provider}
        className="book-button"
      >
        {isBooking ? 'Processing...' : 'Book Now'}
      </button>
      
      {bookingResult && (
        <div className={`booking-result ${bookingResult.success ? 'success' : 'error'}`}>
          <p>{bookingResult.message}</p>
          {bookingResult.success && bookingResult.txHash && (
            <div className="tx-info">
              <span>Transaction: </span>
              <a 
                href={`https://sepolia.etherscan.io/tx/${bookingResult.txHash}`} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                {`${bookingResult.txHash.substring(0, 10)}...`}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};