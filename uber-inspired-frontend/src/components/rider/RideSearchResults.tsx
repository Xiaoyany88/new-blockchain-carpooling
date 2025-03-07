// src/components/rider/RideSearchResults.tsx
import { useEffect, useState } from 'react';
import useProvider from '../../hooks/useProvider';
import useRideOffer from '../../hooks/useRideOffer';
import { ethers } from 'ethers';
import { BookRideButton } from './BookRideButton';
import './RideSearchResults.css';

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

export const RideSearchResults = () => {
  const provider = useProvider();
  const { getAvailableRides, getRide } = useRideOffer(provider);
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const loadRides = async () => {
      if (!provider) return;
      
      try {
        setLoading(true);
        const rideIds = await getAvailableRides();
        
        const ridePromises = rideIds.map(async (id: number) => {
          const rideData = await getRide(id);
          // Check if rideData is null or undefined
          if (!rideData) {
            console.log(`No data found for ride ID: ${id}`);
            return null; // Return null for this ride
        }
          return {
            id,
            ...rideData,
            // Handle various possible formats of pricePerSeat
            pricePerSeat: ethers.BigNumber.isBigNumber(rideData.pricePerSeat)
              ? ethers.utils.formatEther(rideData.pricePerSeat)
              : typeof rideData.pricePerSeat === 'string' && rideData.pricePerSeat.startsWith('0x')
                ? ethers.utils.formatEther(rideData.pricePerSeat)
                : rideData.pricePerSeat.toString()
          };
        });
        
        const ridesData = await Promise.all(ridePromises);
        setRides(ridesData.filter(ride => ride.isActive && ride.availableSeats > 0));
      } catch (err) {
        console.error("Error loading rides:", err);
        setError("Failed to load available rides. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    
    loadRides();
  }, [provider, getAvailableRides, getRide]);
  
  if (!provider) {
    return <div className="loading-message">Please connect your wallet to view available rides.</div>;
  }
  
  if (loading) {
    return <div className="loading-message">Loading available rides...</div>;
  }
  
  if (error) {
    return <div className="error">{error}</div>;
  }
  
  if (rides.length === 0) {
    return <div className="empty-message">No rides available at the moment.</div>;
  }
  
  return (
    <div className="ride-search-results">
      <h2>Available Rides</h2>
      <div className="rides-container">
        {rides.map(ride => (
          <RideCard key={ride.id} ride={ride} />
        ))}
      </div>
    </div>
  );
};

const RideCard = ({ ride }: { ride: Ride }) => {
  return (
    <div className="ride-card">
      <h3>{ride.pickup} to {ride.destination}</h3>
      <div className="ride-details">
        <p><strong>Departure:</strong> {new Date(ride.departureTime * 1000).toLocaleString()}</p>
        <p><strong>Available Seats:</strong> {ride.availableSeats} / {ride.maxPassengers}</p>
        <p><strong>Price per Seat:</strong> {ride.pricePerSeat} ETH</p>
        <p><strong>Driver:</strong> {`${ride.driver.substring(0, 6)}...${ride.driver.substring(38)}`}</p>
        {ride.additionalNotes && <p><strong>Notes:</strong> {ride.additionalNotes}</p>}
      </div>
      <BookRideButton ride={ride} />
    </div>
  );
};