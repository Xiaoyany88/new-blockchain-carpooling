// src/components/rider/BookRideButton.tsx
import { useState } from 'react';
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
  const { bookRide } = useCarpoolSystem();
  const [seats, setSeats] = useState(1);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingResult, setBookingResult] = useState<{success: boolean; message: string} | null>(null);
  
  const handleBooking = async () => {
    setIsBooking(true);
    setBookingResult(null);
    
    try {
      // Convert ride ID to number if needed
      const rideId = typeof ride.id === 'string' ? parseInt(ride.id) : ride.id;
      
      const result = await bookRide(rideId, seats, ride.pricePerSeat);
      
      if (result.success) {
        setBookingResult({
          success: true,
          message: `Successfully booked ${seats} seat(s)! Transaction: ${result.transaction.transactionHash.substring(0, 10)}...`
        });
      } else {
        setBookingResult({
          success: false,
          message: result.error || "Failed to book ride."
        });
      }
    } catch (error) {
      console.error("Error booking ride:", error);
      setBookingResult({
        success: false,
        message: error instanceof Error ? error.message : "An error occurred during booking."
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
          {Array.from({length: Math.min(ride.availableSeats, 5)}, (_, i) => i + 1).map(num => (
            <option key={num} value={num}>{num}</option>
          ))}
        </select>
      </div>
      
      <div className="price-display">
        Total: {(seats * Number(ride.pricePerSeat)).toFixed(6)} ETH
      </div>
      
      <button 
        onClick={handleBooking} 
        disabled={isBooking}
        className="book-button"
      >
        {isBooking ? 'Booking...' : 'Book Now'}
      </button>
      
      {bookingResult && (
        <div className={`booking-result ${bookingResult.success ? 'success' : 'error'}`}>
          {bookingResult.message}
        </div>
      )}
    </div>
  );
};