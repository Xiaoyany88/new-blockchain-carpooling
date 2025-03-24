import { useState } from 'react';
import './RateDriverModal.css';

type RateDriverModalProps = {
  driverAddress: string;
  rideId: number;
  onClose: () => void;
  onSubmit: (rideId: number, driverAddress: string, rating: number) => Promise<void>;
  isProcessing: boolean;
  result: { success: boolean; message: string; } | null;
};

export const RateDriverModal = ({ 
  driverAddress, 
  rideId, 
  onClose, 
  onSubmit,
  isProcessing,
  result 
}: RateDriverModalProps) => {
  const [rating, setRating] = useState<number>(0);
  
  const handleSubmit = () => {
    if (rating > 0) {
      onSubmit(rideId, driverAddress, rating);
    }
  };
  
  // Show truncated driver address for better UX
  const shortAddress = `${driverAddress.substring(0, 6)}...${driverAddress.substring(38)}`;
  
  return (
    <div className="modal-overlay">
      <div className="modal-content rate-driver-modal">
        <button className="close-button" onClick={onClose}>×</button>
        
        <h2>Rate Your Driver</h2>
        
        {!result ? (
          <>
            <p className="driver-info">Driver: {shortAddress}</p>
            
            <div className="rating-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  className={`star-btn ${rating >= star ? 'selected' : ''}`}
                  onClick={() => setRating(star)}
                >
                  {rating >= star ? '★' : '☆'}
                </button>
              ))}
            </div>
            
            <div className="rating-label">
              {rating === 1 && "Poor"}
              {rating === 2 && "Below Average"}
              {rating === 3 && "Average"}
              {rating === 4 && "Good"}
              {rating === 5 && "Excellent"}
            </div>
            
            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={onClose}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button 
                className="submit-btn"
                onClick={handleSubmit}
                disabled={rating === 0 || isProcessing}
              >
                {isProcessing ? 'Submitting...' : 'Submit Rating'}
              </button>
            </div>
          </>
        ) : (
          <div className="rating-result">
            <div className={`result-message ${result.success ? 'success' : 'error'}`}>
              {result.message}
            </div>
            <button className="close-btn" onClick={onClose}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
};