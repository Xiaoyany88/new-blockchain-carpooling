import { useEffect, useState } from 'react';
import useProvider from '../../hooks/useProvider';
import useCarpoolSystem from '../../hooks/useCarpoolSystem';
import { CancelBookingModal } from './CancelBookingModal';
import './MyBookings.css';

type Booking = {
  id: number;
  driver: string;
  pickup: string;
  destination: string;
  departureTime: number;
  pricePerSeat: string;
  bookedSeats: number;
  status: string;
  isPaid: boolean;
};

export const MyBookings = () => {
  const provider = useProvider();
  const { getUserBookings, cancelBookingFromSystem } = useCarpoolSystem(provider);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelBookingData, setCancelBookingData] = useState<Booking | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancellationResult, setCancellationResult] = useState<{success: boolean; message: string} | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!getUserBookings) return;
      
      try {
        setLoading(true);
        const result = await getUserBookings();
        
        if (result.success) {
          setBookings(result.bookings);
          setError(null);
        } else {
          setError(result.error || "Failed to load bookings");
          setBookings([]);
        }
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred");
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBookings();
  }, [getUserBookings]);

  const handleCancelBooking = (booking: Booking) => {
    setCancelBookingData(booking);
  };
  
  const handleCloseModal = () => {
    setCancelBookingData(null);
    setCancellationResult(null);
  };
  
  const handleConfirmCancellation = async () => {
    if (!cancelBookingData || !cancelBookingFromSystem) return;
    
    try {
      setIsCancelling(true);
      
      // Calculate if cancellation is within 24 hours
      const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
      const departureTime = cancelBookingData.departureTime;
      const timeUntilDeparture = departureTime - currentTime; // Time until departure in seconds
      const isWithin24Hours = timeUntilDeparture < 24 * 60 * 60; // 24 hours in seconds
      
      // Call the smart contract function
      const result = await cancelBookingFromSystem(
        cancelBookingData.id, 
        isWithin24Hours
      );
      
      if (result.success) {
        // Update local state to reflect the cancellation
        setBookings(prevBookings => prevBookings.map(booking => {
          if (booking.id === cancelBookingData.id) {
            return { ...booking, status: 'Cancelled' };
          }
          return booking;
        }));
        
        setCancellationResult({
          success: true, 
          message: isWithin24Hours 
            ? "Your booking has been cancelled. Since cancellation was within 24 hours of departure, the payment has been sent to the driver."
            : "Your booking has been cancelled and your payment has been refunded."
        });
      } else {
        setCancellationResult({
          success: false,
          message: result.error || "Failed to cancel booking"
        });
      }
    } catch (err: any) {
      console.error("Error cancelling booking:", err);
      setCancellationResult({
        success: false,
        message: err.message || "An unexpected error occurred"
      });
    } finally {
      setIsCancelling(false);
    }
  };

  
  if (loading) {
    return <div className="bookings-loading">Loading your bookings...</div>;
  }
  
  if (error) {
    return <div className="bookings-error">Error: {error}</div>;
  }
  
  if (bookings.length === 0) {
    return (
      <div className="no-bookings">
        <h2>No Bookings Found</h2>
        <p>You haven't booked any rides yet.</p>
      </div>
    );
  }
  
  return (
    <div className="my-bookings">
      <h2>My Bookings</h2>
      
      <div className="bookings-list">
        {bookings.map(booking => (
          <div className="booking-card" key={booking.id}>
            <div className="booking-header">
              <h3>{booking.pickup} to {booking.destination}</h3>
              <span className={`booking-status ${booking.status.toLowerCase()}`}>
                {booking.status}
              </span>
            </div>
            
            <div className="booking-details">
              <p><strong>Departure:</strong> {new Date(booking.departureTime * 1000).toLocaleString()}</p>
              <p><strong>Seats:</strong> {booking.bookedSeats}</p>
              <p><strong>Total Cost:</strong> {(Number(booking.pricePerSeat) * booking.bookedSeats).toFixed(6)} ETH</p>
              <p><strong>Driver:</strong> {`${booking.driver.substring(0, 6)}...${booking.driver.substring(38)}`}</p>
              <p><strong>Payment Status:</strong> {booking.isPaid ? "Paid" : "Unpaid"}</p>
            </div>
            
            <div className="booking-actions">
              {booking.status.toLowerCase() !== 'cancelled' && (
                  <button 
                    className="action-btn"
                    onClick={() => handleCancelBooking(booking)}
                    disabled={booking.status.toLowerCase() === 'completed'}
                  >
                    Cancel Booking
                  </button>
                )}
              <button className="action-btn">Contact Driver</button>
            </div>
          </div>
        ))}
      </div>
      {cancelBookingData && (
        <CancelBookingModal
          booking={cancelBookingData}
          onClose={handleCloseModal}
          onConfirm={handleConfirmCancellation}
          isProcessing={isCancelling}
          result={cancellationResult}
        />
      )}
    </div>
  );
};