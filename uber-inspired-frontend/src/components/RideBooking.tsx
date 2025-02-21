import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import usePaymentEscrow from "../hooks/usePaymentEscrow";

const RideBooking: React.FC = () => {
  const [driverAddress, setDriverAddress] = useState<string>("");
  const [fare, setFare] = useState<string>("");
  const [status, setStatus] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window?.ethereum) {
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(web3Provider);
    }
  }, []);

  const paymentEscrow = usePaymentEscrow(provider);

  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    return "Error booking ride";
  };

  const handleBookRide = async () => {
    if (!provider || !paymentEscrow || !driverAddress || !fare) {
      setStatus("Please ensure wallet is connected and all fields are filled");
      return;
    }

    try {
      setStatus("Creating ride...");
      const receipt = await paymentEscrow.createRide(driverAddress, fare);
      
      if (receipt && receipt.events) {
        // TypeScript type guard for the event
        const rideCreatedEvent = receipt.events.find(
          (event): event is ethers.Event => 
            event.event === 'RideCreated' && event.args !== undefined
        );

        if (rideCreatedEvent && rideCreatedEvent.args) {
          const rideId = rideCreatedEvent.args[0]; // Assuming rideId is the first argument
          setStatus(`Ride created successfully! Ride ID: ${rideId}`);
        } else {
          setStatus("Ride created successfully! (No ride ID available)");
        }
      } else {
        setStatus("Ride created successfully!");
      }

      // Clear inputs
      setDriverAddress("");
      setFare("");
    } catch (error: unknown) {
      console.error("Error booking ride:", error);
      setStatus(getErrorMessage(error));
    }
  };

  return (
    <div>
      <h2>Book a Ride</h2>
      <input
        type="text"
        placeholder="Driver Address"
        onChange={(e) => setDriverAddress(e.target.value)}
      />
      <input
        type="text"
        placeholder="Fare (ETH)"
        onChange={(e) => setFare(e.target.value)}
      />
      <button onClick={handleBookRide}>Book Ride</button>
      {status && <p>{status}</p>}
    </div>
  );
};

export default RideBooking;
