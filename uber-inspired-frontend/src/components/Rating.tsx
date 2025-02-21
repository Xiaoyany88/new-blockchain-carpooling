import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import usePaymentEscrow from "../hooks/usePaymentEscrow";

const Rating: React.FC = () => {
  const [targetAddress, setTargetAddress] = useState<string>("");
  const [rating, setRating] = useState<string>("");
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
    return "Error submitting rating";
  };

  const handleSubmitRating = async () => {
    if (!provider || !paymentEscrow || !targetAddress || !rating) {
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
      // No need to wait again since submitFeedback already returns the receipt
      await paymentEscrow.submitFeedback(targetAddress, ratingNumber);
      setStatus("Rating submitted successfully!");
      
      // Clear inputs
      setTargetAddress("");
      setRating("");
    } catch (error: unknown) {
      console.error("Error submitting rating:", error);
      setStatus(getErrorMessage(error));
    }
  };

  return (
    <div>
      <h2>Submit Rating</h2>
      <input
        type="text"
        placeholder="Address to Rate"
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
      <button onClick={handleSubmitRating}>Submit Rating</button>
      {status && <p>{status}</p>}
    </div>
  );
};

export default Rating;
