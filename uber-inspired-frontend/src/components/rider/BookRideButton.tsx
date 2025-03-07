// src/components/rider/BookRideButton.tsx
import { useState } from 'react';
import { ethers } from 'ethers';
import useProvider from '../../hooks/useProvider';
import useCarpoolSystem from '../../hooks/useCarpoolSystem';
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