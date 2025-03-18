import { useEffect, useState } from 'react';
import useProvider from '../../hooks/useProvider';
import useCarpoolSystem from '../../hooks/useCarpoolSystem';
import { CancelBookingModal } from './CancelBookingModal';
import { MessagingModal } from '../common/MessagingModal';
import './MyBookings.css';
// Tab options
type TabType = 'Active' | 'Completed' | 'Cancelled';

type Booking = {
  id: number;
  bookingId?: string;     // A unique identifier for this specific booking
  driver: string;
  pickup: string;
  destination: string;
  departureTime: number;
  pricePerSeat: string;
  bookedSeats: number;
  status: string;
  isPaid: boolean;
  isCancelled?: boolean;
  timestamp?: number;     // When the booking was created
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
  // New state for active tab
  const [activeTab, setActiveTab] = useState<TabType>('Active');
  const [activeMessageRide, setActiveMessageRide] = useState<Booking | null>(null);
  const [userAddress, setUserAddress] = useState<string>('');
  // Add this effect to get the user address once
  useEffect(() => {
    const getUserAddress = async () => {
      if (provider) {
        try {
          const address = await provider.getSigner().getAddress();
          setUserAddress(address);
        } catch (err) {
          console.error("Failed to get user address:", err);
        }
      }
    };
    
    getUserAddress();
  }, [provider]);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!getUserBookings) return;
      
      try {
        setLoading(true);
        const result = await getUserBookings();
        
        if (result.success) {
          // Group bookings by ride ID to handle rebookings
          const bookingsByRideId = new Map();
          
          // First, process all bookings and group by ride ID
          result.bookings.forEach((booking, index) => {
            const rideId = booking.id;
            
            if (!bookingsByRideId.has(rideId)) {
              bookingsByRideId.set(rideId, []);
            }
            
            // Add timestamp to each booking for sorting (use current time + index if not available)
            const bookingWithTimestamp = {
              ...booking,
              timestamp: booking.timestamp || Date.now() - (index * 1000),
              bookingId: `${booking.id}-${booking.status.toLowerCase()}-${Date.now()}-${index}`
            };
            
            bookingsByRideId.get(rideId).push(bookingWithTimestamp);
          });
          
          // Process each ride's bookings
          const processedBookings: Booking[] = [];
          
          bookingsByRideId.forEach((rideBookings, rideId) => {
            // Sort bookings by timestamp (most recent first)
            rideBookings.sort((a: Booking, b: Booking) => (b.timestamp || 0) - (a.timestamp || 0));
            
            // The most recent booking status determines if we consider this active
            const mostRecentBooking = rideBookings[0];
            
            // If most recent booking is Active, use that one
            if (mostRecentBooking.status.toLowerCase() === 'active') {
              processedBookings.push(mostRecentBooking);
              
              // Add cancelled bookings separately to maintain history
              rideBookings.slice(1).forEach((booking: Booking) => {
                if (booking.status.toLowerCase() === 'cancelled') {
                  processedBookings.push(booking);
                }
              });
            } else {
              // If most recent isn't active, include all distinct status bookings
              // This preserves history while avoiding duplicates
              const addedStatuses = new Set();
              
              rideBookings.forEach((booking: Booking) => {
                const status = booking.status.toLowerCase();
                if (!addedStatuses.has(status)) {
                  addedStatuses.add(status);
                  processedBookings.push(booking);
                }
              });
            }
          });
          
          console.log('Processed bookings:', processedBookings);
          setBookings(processedBookings);
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

  // Handle tab change
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };
  
  // Filter bookings based on active tab
  const filteredBookings = bookings.filter(booking => {
    const status = booking.status.toLowerCase();
    switch(activeTab) {
      case 'Active':
        return status === 'active';
      case 'Completed':
        return status === 'completed';
      case 'Cancelled':
        return status === 'cancelled';
      default:
        return true;
    }
  });

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
          if (booking.id === cancelBookingData.id && 
              booking.bookingId === cancelBookingData.bookingId) {
            return { 
              ...booking, 
              status: 'Cancelled',
              timestamp: Date.now() // Update timestamp to be most recent
            };
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

  // this function handle opening the chat
  const handleOpenChat = (booking: Booking) => {
    setActiveMessageRide(booking);
  };

  // this function handle closing the chat
  const handleCloseChat = () => {
    setActiveMessageRide(null);
  };

  if (loading) {
    return <div className="bookings-loading">Loading your bookings...</div>;
  }
  
  if (error) {
    return <div className="bookings-error">Error: {error}</div>;
  }
  // Show custom message when there are bookings but none match the current filter
  const showNoFilteredResults = bookings.length > 0 && filteredBookings.length === 0;

  if (bookings.length === 0) {
    return (
      <div className="no-bookings">
        <h2>No Bookings Found</h2>
        <p>You haven't booked any rides yet.</p>
      </div>
    );
  }
  // Add this right before your return statement
  console.log('Current Tab:', activeTab);
  console.log('All Bookings:', bookings.map(b => ({ 
    id: b.id, 
    status: b.status,
  
  })));
  console.log('Filtered Bookings:', filteredBookings.map(b => ({ 
    id: b.id, 
    status: b.status, 
   
  })));
  return (
    <div className="my-bookings">
      <h2>My Bookings</h2>
      
      {/* Tab navigation */}
      <div className="booking-tabs">
        <button 
          className={`tab-btn ${activeTab === 'Active' ? 'active' : ''}`}
          onClick={() => handleTabChange('Active')}
        >
          Active
        </button>
        <button 
          className={`tab-btn ${activeTab === 'Completed' ? 'active' : ''}`}
          onClick={() => handleTabChange('Completed')}
        >
          Completed
        </button>
        <button 
          className={`tab-btn ${activeTab === 'Cancelled' ? 'active' : ''}`}
          onClick={() => handleTabChange('Cancelled')}
        >
          Cancelled
        </button>
      </div>
      
      {showNoFilteredResults ? (
        <div className="no-filtered-bookings">
          <p>No {activeTab.toLowerCase()} bookings found.</p>
        </div>
      ) : (
        <div className="bookings-list">
          {filteredBookings.map(booking => (
            <div className="booking-card" key={booking.bookingId || `${booking.id}-${booking.status}`}>
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
                {booking.status.toLowerCase() === 'active' && (
                  <button 
                    className="action-btn"
                    onClick={() => handleCancelBooking(booking)}
                  >
                    Cancel Booking
                  </button>
                )}
                {booking.status.toLowerCase() === 'active' && (
                  <button 
                    className="action-btn message-btn"
                    onClick={() => handleOpenChat(booking)}
                  >
                    Contact Driver
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {cancelBookingData && (
        <CancelBookingModal
          booking={cancelBookingData}
          onClose={handleCloseModal}
          onConfirm={handleConfirmCancellation}
          isProcessing={isCancelling}
          result={cancellationResult}
        />
      )}
      {activeMessageRide && (
        <MessagingModal
          rideId={activeMessageRide.id}
          driverAddress={activeMessageRide.driver}
          passengerAddress={userAddress}
          onClose={handleCloseChat}
        />
      )}
      
    </div>
    
  );
};