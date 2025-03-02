import React, { useState } from "react";
import useProvider from '../hooks/useProvider';
import useReputationSystem from "../hooks/useReputationSystem";

const Rating: React.FC = () => {
  const [targetAddress, setTargetAddress] = useState<string>("");
  const [rating, setRating] = useState<string>("");
  const [rideId, setRideId] = useState<string>("");
  const [status, setStatus] = useState<string | null>(null);
  const provider = useProvider();
  const { rateDriver } = useReputationSystem(provider);

  const handleSubmitRating = async () => {
    if (!provider || !rateDriver || !targetAddress || !rating || !rideId) {
      setStatus("Please ensure wallet is connected and all fields are filled");
      return;
    }

    try {
      const ratingNumber = parseInt(rating);
      if (ratingNumber < 1 || ratingNumber > 5) {
        setStatus("Rating must be between 1 and 5");
        return;
      }

      setStatus("Submitting rating...");
      
      // Use rateDriver for all cases
      const result = await rateDriver(targetAddress, ratingNumber, parseInt(rideId));
      
      setStatus("Rating submitted successfully!");
      
      // Clear inputs
      setTargetAddress("");
      setRating("");
      setRideId("");
    } catch (error: unknown) {
      console.error("Error submitting rating:", error);
      setStatus(error instanceof Error ? error.message : "Error submitting rating");
    }
  };

  return (
    <div>
      <h2>Rate a Driver</h2>
      <input
        type="text"
        placeholder="Driver Address"
        value={targetAddress}
        onChange={(e) => setTargetAddress(e.target.value)}
      />
      <input
        type="number"
        min="1"
        max="5"
        placeholder="Rating (1-5)"
        value={rating}
        onChange={(e) => setRating(e.target.value)}
      />
      <input
        type="text"
        placeholder="Ride ID (required)"
        value={rideId}
        onChange={(e) => setRideId(e.target.value)}
      />
      <button onClick={handleSubmitRating}>Submit Rating</button>
      {status && <p>{status}</p>}
    </div>
  );
};

export default Rating;
