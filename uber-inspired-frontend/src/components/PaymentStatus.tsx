import React, { useState } from "react";
import useProvider from '../hooks/useProvider';
import useRideOffer from "../hooks/useRideOffer";

const PaymentStatus: React.FC = () => {
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const provider = useProvider();
  const { getRide } = useRideOffer(provider);
  const [rideId, setRideId] = useState<string>("");

  const fetchStatus = async () => {
    if (!getRide || !rideId) {
      setError("Please provide a ride ID");
      return;
    }

    try {
      const rideIdNumber = parseInt(rideId);
      const ride = await getRide(rideIdNumber);
      
      if (ride) {
        setStatus(ride.isActive ? 
          (new Date(ride.departureTime * 1000) > new Date() ? "Active" : "In Progress") : 
          "Completed or Cancelled");
        setError(null);
      } else {
        setError("Ride not found");
        setStatus(null);
      }
    } catch (err) {
      console.error("Error fetching status:", err);
      setError("Failed to fetch ride status");
      setStatus(null);
    }
  };

  return (
    <div>
      <h2>Ride Status</h2>
      <input
        type="text"
        placeholder="Enter Ride ID"
        value={rideId}
        onChange={(e) => setRideId(e.target.value)}
      />
      <button onClick={fetchStatus}>Check Status</button>
      {error && <p className="error">{error}</p>}
      {status && <p>Status: {status}</p>}
    </div>
  );
};

export default PaymentStatus;
