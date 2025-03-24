// src/components/rider/RideSearchResults.tsx
import { useEffect, useState, useMemo } from 'react';
import useProvider from '../../hooks/useProvider';
import useRideOffer from '../../hooks/useRideOffer';
import { ethers } from 'ethers';
import { BookRideButton } from './BookRideButton';
import useCarpoolSystem from '../../hooks/useCarpoolSystem';
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
  driverRating?: number;
};

type SearchFilters = {
  pickup: string;
  destination: string;
  date: string;
};

export const RideSearchResults = ({ filters }: { filters?: SearchFilters }) => {
  const provider = useProvider();
  const { getAvailableRides, getRide } = useRideOffer(provider);
  const { getDriverInfo } = useCarpoolSystem(provider); 
  const [allRides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Apply filters to get filtered rides
  const rides = useMemo(() => {
    if (!filters || (!filters.pickup && !filters.destination && !filters.date)) {
      // No filters applied, return all rides
      return allRides;
    }
    
    return allRides.filter(ride => {
      // Case insensitive matching for text fields
      const pickupMatch = !filters.pickup || 
        ride.pickup.toLowerCase().includes(filters.pickup.toLowerCase());
      
      const destinationMatch = !filters.destination || 
        ride.destination.toLowerCase().includes(filters.destination.toLowerCase());
      
      // Date matching - convert timestamps to dates for comparison
      let dateMatch = true;
      if (filters.date) {
        const filterDate = new Date(filters.date);
        filterDate.setHours(0, 0, 0, 0); // Start of the day
        
        const rideDate = new Date(ride.departureTime * 1000);
        rideDate.setHours(0, 0, 0, 0); // Start of the day
        
        dateMatch = filterDate.getTime() === rideDate.getTime();
      }
      
      return pickupMatch && destinationMatch && dateMatch;
    });
  }, [allRides, filters]);
  
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

          let driverRating = 0;
          try {
            if (getDriverInfo) {
              const reputationData = await getDriverInfo(rideData.driver);
              driverRating = reputationData ? reputationData.avgRating.toNumber() : 0;
            }
          } catch (err) {
            console.log(`Could not fetch rating for driver ${rideData.driver}:`, err);
          }
          return {
            id,
            ...rideData,
            driverRating,
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
  }, [provider, getAvailableRides, getRide, getDriverInfo]);
  
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
    // Show different messages based on whether filters are applied
    return (
      <div className="empty-message">
        {filters && (filters.pickup || filters.destination || filters.date) ? 
          "No rides found matching your search criteria." : 
          "No rides available at the moment."}
      </div>
    );
  }
  
  return (
    <div className="ride-search-results">
      {/* Show active filters if any */}
      {filters && (filters.pickup || filters.destination || filters.date) && (
        <div className="applied-filters">
          <h3>Search results for:</h3>
          <div className="filter-tags">
            {filters.pickup && <span className="filter-tag">From: {filters.pickup}</span>}
            {filters.destination && <span className="filter-tag">To: {filters.destination}</span>}
            {filters.date && <span className="filter-tag">Date: {new Date(filters.date).toLocaleDateString()}</span>}
          </div>
        </div>
      )}
      
      <h2>Available Rides {rides.length > 0 && `(${rides.length})`}</h2>
      <div className="rides-container">
        {rides.map(ride => (
          <RideCard key={ride.id} ride={ride} />
        ))}
      </div>
    </div>
  );
};
// Helper component to render star ratings
const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= rating ? "star filled" : "star"}>
          {star <= rating ? "★" : "☆"}
        </span>
      ))}
    </div>
  );
};
const RideCard = ({ ride }: { ride: Ride }) => {
  // RideCard remains the same
  return (
    <div className="ride-card">
      <h3>{ride.pickup} to {ride.destination}</h3>
      <div className="ride-details">
        <p><strong>Departure:</strong> {new Date(ride.departureTime * 1000).toLocaleString()}</p>
        <p><strong>Available Seats:</strong> {ride.availableSeats} / {ride.maxPassengers}</p>
        <p><strong>Price per Seat:</strong> {ride.pricePerSeat} ETH</p>
        {/* New driver info section with rating */}
        <div className="driver-info">
          <p><strong>Driver:</strong> {`${ride.driver.substring(0, 6)}...${ride.driver.substring(38)}`}</p>
          <div className="driver-rating">
            <strong>Rating:</strong> 
            {ride.driverRating !== undefined && ride.driverRating > 0 ? (
              <StarRating rating={ride.driverRating} />
            ) : (
              <span className="no-rating">Not rated yet</span>
            )}
          </div>
        </div>
        {ride.additionalNotes && <p><strong>Notes:</strong> {ride.additionalNotes}</p>}
      </div>
      <BookRideButton ride={ride} />
    </div>
  );
};