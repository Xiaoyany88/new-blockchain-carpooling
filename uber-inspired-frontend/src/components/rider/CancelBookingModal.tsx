import { useEffect, useMemo, useState } from 'react';
import './CancelBookingModal.css';

type CancelBookingModalProps = {
  booking: {
    id: number;
    pickup: string;
    destination: string;
    departureTime: number;
    pricePerSeat: string;
    bookedSeats: number;
  };
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isProcessing: boolean;
  result: { success: boolean; message: string } | null;
};

export const CancelBookingModal = ({ 
  booking, 
  onClose, 
  onConfirm, 
  isProcessing,
  result 
}: CancelBookingModalProps) => {
  const [countdown, setCountdown] = useState(5);
  const [acknowledged, setAcknowledged] = useState(false);
  
  // Calculate if cancellation is within 24 hours
  const { isWithin24Hours, timeUntilDepartureFormatted } = useMemo(() => {
    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
    const departureTime = booking.departureTime;
    const timeUntilDeparture = departureTime - currentTime; // Time until departure in seconds
    const isWithin24Hours = timeUntilDeparture < 24 * 60 * 60; // 24 hours in seconds
    
    // Format time until departure for display
    const hours = Math.floor(timeUntilDeparture / 3600);
    const minutes = Math.floor((timeUntilDeparture % 3600) / 60);
    
    let timeFormatted;
    if (hours < 0) {
      timeFormatted = "Departure time has passed";
    } else if (hours > 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      timeFormatted = `${days} days, ${remainingHours} hours, ${minutes} minutes`;
    } else {
      timeFormatted = `${hours} hours, ${minutes} minutes`;
    }
    
    return { isWithin24Hours, timeUntilDepartureFormatted: timeFormatted };
  }, [booking.departureTime]);
  
  // Auto-close countdown for success message
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (result?.success && countdown > 0) {
      timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
      
      if (countdown === 1) {
        const closeTimer = setTimeout(onClose, 1000);
        return () => clearTimeout(closeTimer);
      }
    }
    return () => clearTimeout(timer);
  }, [countdown, result, onClose]);
  
  return (
    <div className="modal-overlay">
      <div className="modal-content cancel-booking-modal">
        <button className="close-modal-btn" onClick={onClose}>×</button>
        
        {result ? (
          <div className={`result-container ${result.success ? 'success' : 'error'}`}>
            <h3>{result.success ? 'Booking Cancelled' : 'Error'}</h3>
            <p>{result.message}</p>
            {result.success && (
              <p className="countdown">Closing in {countdown} seconds...</p>
            )}
            <button className="modal-btn" onClick={onClose}>Close</button>
          </div>
        ) : (
          <>
            <h3>Cancel Booking</h3>
            <div className="booking-summary">
              <p><strong>From:</strong> {booking.pickup}</p>
              <p><strong>To:</strong> {booking.destination}</p>
              <p><strong>Departure:</strong> {new Date(booking.departureTime * 1000).toLocaleString()}</p>
              <p><strong>Time until departure:</strong> {timeUntilDepartureFormatted}</p>
              <p><strong>Seats:</strong> {booking.bookedSeats}</p>
              <p><strong>Total Price:</strong> {(Number(booking.pricePerSeat) * booking.bookedSeats).toFixed(6)} ETH</p>
            </div>
            
            <div className="cancellation-policy">
              <h4>Cancellation Policy:</h4>
              <p className={`policy-highlight ${isWithin24Hours ? 'warning' : 'success'}`}>
                {isWithin24Hours ? (
                  <span>
                    <strong>⚠️ Warning:</strong> Cancelling within 24 hours of departure will forfeit your payment. 
                    The funds will be transferred to the driver.
                  </span>
                ) : (
                  <span>
                    <strong>✓ Good news:</strong> Cancelling more than 24 hours before departure will refund your full payment.
                  </span>
                )}
              </p>
              
              <label className="acknowledge-label">
                <input 
                  type="checkbox" 
                  checked={acknowledged} 
                  onChange={() => setAcknowledged(!acknowledged)}
                />
                I understand and accept the cancellation policy
              </label>
            </div>
            
            <div className="modal-actions">
              <button 
                className="modal-btn secondary" 
                onClick={onClose}
                disabled={isProcessing}
              >
                Keep Booking
              </button>
              <button 
                className="modal-btn primary" 
                onClick={onConfirm}
                disabled={!acknowledged || isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Confirm Cancellation'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};