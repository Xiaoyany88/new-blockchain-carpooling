import React, { useEffect, useState } from "react";
import { ethers, BigNumber } from "ethers";
import usePaymentEscrow from "../hooks/usePaymentEscrow";

const PaymentStatus: React.FC = () => {
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [rideId, setRideId] = useState<string>("");

  useEffect(() => {
    if (typeof window !== 'undefined' && window?.ethereum) {
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(web3Provider);
    }
  }, []);

  const paymentEscrow = usePaymentEscrow(provider);

  const fetchStatus = async () => {
    if (!paymentEscrow || !rideId) {
      setError("Please provide a ride ID");
      return;
    }

    try {
      // Convert string rideId to bytes32
      const bytes32RideId = ethers.utils.formatBytes32String(rideId);
      const result = await paymentEscrow.getRideStatus(bytes32RideId);
      
      // Ensure result is treated as BigNumber
      const statusBigNumber = BigNumber.from(result);
      setStatus(getRideStatusText(statusBigNumber));
      setError(null);
    } catch (err) {
      console.error("Error fetching status:", err);
      setError("Failed to fetch ride status");
    }
  };

  const getRideStatusText = (statusCode: BigNumber): string => {
    switch (statusCode.toNumber()) {
      case 0: return "Pending";
      case 1: return "Active";
      case 2: return "Completed";
      case 3: return "Cancelled";
      default: return "Unknown";
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
