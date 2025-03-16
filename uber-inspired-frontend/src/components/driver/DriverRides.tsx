// src/components/driver/DriverRides.tsx
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import useProvider from '../../hooks/useProvider';
import useRideOffer from '../../hooks/useRideOffer';
import useCarpoolSystem from '../../hooks/useCarpoolSystem';
import { CONTRACT_ADDRESSES, SUPPORTED_CHAIN_ID } from '../../config/contracts';
import './DriverRides.css';

type Ride = {
  id: number;
  pickup: string;
  destination: string;
  departureTime: number;
  maxPassengers: number;
  availableSeats: number;
  pricePerSeat: string;
  totalBookedSeats: number;
  passengers: {
    address: string;
    seats: number;
    paid: boolean;
    completed: boolean;
  }[];
  isActive: boolean;
};

export const DriverRides = () => {
  const provider = useProvider();
  const { getRide, getAvailableRides } = useRideOffer(provider);
  const carpoolSystem = useCarpoolSystem(provider);
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completingRide, setCompletingRide] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchDriverRides = async () => {
      if (!provider) return;
      
      try {
        setLoading(true);
        
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        
        // Instead of using getAvailableRides, get ALL rides
        let contractAddress = CONTRACT_ADDRESSES.RIDE_OFFER;
        const rideOfferContract = new ethers.Contract(
          contractAddress,
          [
            'function getRideCount() external view returns (uint256)',
            'function getRide(uint256) external view returns (address, string, string, uint256, uint256, uint256, uint256, string, bool)',
            'function getBookingsByRide(uint256) external view returns (tuple(address passenger, uint256 rideId, uint256 seats, bool paid, bool completed)[])'
          ],
          signer
        );
        
        // Get total number of rides
        const rideCount = await rideOfferContract.getRideCount();
        console.log("Total rides in system:", rideCount.toString());
        
        // Create array of ride IDs to check (from 0 to rideCount-1)
        const allRideIds = Array.from({ length: rideCount.toNumber() }, (_, i) => i);
        
        // Filter and fetch details for rides where the user is the driver
        const driverRidesPromises = allRideIds.map(async (id: number) => {
          try {
            // Use getRide instead of direct mapping access
            const rideDetails = await rideOfferContract.getRide(id);
            const driverAddress = rideDetails[0]; // First element is driver address
            
            if (driverAddress.toLowerCase() === address.toLowerCase()) {
              // This is the current user's ride
              
              // Get all bookings for this ride
              const bookings = await rideOfferContract.getBookingsByRide(id);
              
              // Calculate total booked seats
              let totalBookedSeats = 0;
              const passengers = bookings.map((booking: any) => {
                totalBookedSeats += booking.seats.toNumber();
                return {
                  address: booking.passenger,
                  seats: booking.seats.toNumber(),
                  paid: booking.paid,
                  completed: booking.completed
                };
              });
              
              // Extract other ride details
              const pickup = rideDetails[1];
              const destination = rideDetails[2];
              const departureTime = rideDetails[3].toNumber();
              const maxPassengers = rideDetails[4].toNumber();
              const pricePerSeat = ethers.utils.formatEther(rideDetails[5]);
              const availableSeats = rideDetails[6].toNumber();
              const additionalNotes = rideDetails[7];
              const isActive = rideDetails[8];
              
              return {
                id,
                driver: driverAddress,
                pickup,
                destination,
                departureTime,
                maxPassengers,
                availableSeats,
                pricePerSeat,
                additionalNotes,
                isActive,
                totalBookedSeats,
                passengers
              };
            }
            return null;
          } catch (err) {
            console.error(`Error fetching ride ${id}:`, err);
            return null;
          }
        });
        
        const results = await Promise.all(driverRidesPromises);
        const driverRides = results.filter(Boolean) as Ride[];
        
        // Sort rides: active first, then by departure time
        driverRides.sort((a, b) => {
          // First sort by active status
          if (a.isActive && !b.isActive) return -1;
          if (!a.isActive && b.isActive) return 1;
          
          // Then by departure time
          return a.departureTime - b.departureTime;
        });
        
        setRides(driverRides);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching driver rides:", err);
        setError(err.message || "Failed to load rides");
      } finally {
        setLoading(false);
      }
    };
    
    fetchDriverRides();
  }, [provider]); // Remove getAvailableRides and getRide from dependencies

  const handleCompleteRide = async (rideId: number, passengerAddress: string) => {
    if (!provider || !carpoolSystem) return;
    
    // Add debugging code to check addresses
    console.log("DEBUG - Starting ride completion process");
    
    try {
      const signer = provider.getSigner();
      const currentAddress = await signer.getAddress();
      console.log("DEBUG - Current wallet address:", currentAddress);
      // Check if there's a payment record in escrow
      const paymentEscrowContract = new ethers.Contract(
        CONTRACT_ADDRESSES.PAYMENT_ESCROW,
        ['function payments(uint256, address) view returns (uint256 rideId, address passenger, uint256 amount, uint256 seats, bool released, bool refunded)'],
        provider.getSigner()
      );
      const payment = await paymentEscrowContract.payments(rideId, passengerAddress);
      console.log("DEBUG - Payment record:", {
        amount: payment.amount.toString(),
        exists: payment.amount.gt(0),
        released: payment.released,
        refunded: payment.refunded
      });
      
      
      // Get network details
      const network = await provider.getNetwork();
      console.log("DEBUG - Current network:", network.name, "chainId:", network.chainId);
      
      // Get ride details directly from contract to verify driver
      let contractAddress = CONTRACT_ADDRESSES.RIDE_OFFER;
      console.log("DEBUG - Using RideOffer contract at:", contractAddress);
      
      const rideOfferContract = new ethers.Contract(
        contractAddress,
        [
          'function getBookingsByRide(uint256) external view returns (tuple(address passenger, uint256 rideId, uint256 seats, bool paid, bool completed)[])',
          'function getRide(uint256) external view returns (address, string, string, uint256, uint256, uint256, uint256, string, bool)'
        ],
        signer
      );
      
      const bookings = await rideOfferContract.getBookingsByRide(rideId);
      const passengerBooking = bookings.find((b: any) => 
        b.passenger.toLowerCase() === passengerAddress.toLowerCase()
      );
      
      console.log("Passenger booking in RideOffer:", passengerBooking ? {
        seats: passengerBooking.seats.toString(),
        paid: passengerBooking.paid,
        completed: passengerBooking.completed
      } : "Not found");
      
      // Check if CarpoolSystem is calling the right PaymentEscrow
      const carpoolSystemContract = new ethers.Contract(
        CONTRACT_ADDRESSES.CARPOOL_SYSTEM,
        [
          'function paymentEscrow() external view returns (address)'
        ],
        signer
      );
      
      const escrowAddress = await carpoolSystemContract.paymentEscrow();
      console.log("PaymentEscrow address from CarpoolSystem:", escrowAddress);
      console.log("PaymentEscrow address in CONFIG:", CONTRACT_ADDRESSES.PAYMENT_ESCROW);
      console.log("Match:", escrowAddress.toLowerCase() === CONTRACT_ADDRESSES.PAYMENT_ESCROW.toLowerCase());

      // Fetch ride details to check driver
      const rideDetails = await rideOfferContract.getRide(rideId);
      const driverAddress = rideDetails[0]; // First element is driver address
      console.log("DEBUG - Ride driver address:", driverAddress);
      console.log("DEBUG - Are addresses equal?", currentAddress === driverAddress);
      console.log("DEBUG - Case-insensitive equal?", currentAddress.toLowerCase() === driverAddress.toLowerCase());
      
      // Check if ride is active
      const isActive = rideDetails[8]; // Ninth element is isActive
      console.log("DEBUG - Is ride active?", isActive);
      
      // Check departure time
      const departureTime = rideDetails[3].toNumber();
      const currentTime = Math.floor(Date.now() / 1000);
      console.log("DEBUG - Departure time:", new Date(departureTime * 1000).toLocaleString());
      console.log("DEBUG - Current time:", new Date(currentTime * 1000).toLocaleString());
      console.log("DEBUG - Has departure time passed?", currentTime > departureTime);
    } catch (err) {
      console.error("DEBUG - Error fetching ride details:", err);
    }
    
  
    const key = `${rideId}-${passengerAddress}`;
    setCompletingRide(prev => ({ ...prev, [key]: true }));
    
    try {
      console.log("DEBUG - Calling carpoolSystem.completeRide with params:", rideId, passengerAddress);
      // Call the completeRide function in CarpoolSystem
      const result = await carpoolSystem.completeRide(rideId, passengerAddress);
      console.log("DEBUG - Complete ride result:", result);
      
      if (result.success) {
        // Update local state to reflect the completed ride
        setRides(prevRides => prevRides.map(ride => {
          if (ride.id === rideId) {
            const updatedPassengers = ride.passengers.map(passenger => {
              if (passenger.address.toLowerCase() === passengerAddress.toLowerCase()) {
                return { ...passenger, completed: true };
              }
              return passenger;
            });
            
            // Mark ride as inactive if all passengers completed
            const allCompleted = updatedPassengers.every(p => p.completed);
            
            return {
              ...ride,
              passengers: updatedPassengers,
              isActive: !allCompleted
            };
          }
          return ride;
        }));
      } else {
        throw new Error(result.error || "Failed to complete ride");
      }
    } catch (err: any) {
      console.error("Error completing ride:", err);
      alert(`Failed to complete ride: ${err.message || "Unknown error"}`);
    } finally {
      setCompletingRide(prev => ({ ...prev, [key]: false }));
    }
  };
  
  if (loading) {
    return <div className="rides-loading">Loading your rides...</div>;
  }
  
  if (error) {
    return <div className="rides-error">Error: {error}</div>;
  }
  
  if (rides.length === 0) {
    return (
      <div className="no-rides">
        <h2>No Rides Found</h2>
        <p>You haven't created any rides yet.</p>
      </div>
    );
  }
  
  return (
    <div className="driver-rides">
        
      <h2>Your Rides</h2>
      
      <div className="rides-list">
        {rides.map(ride => (
          <div 
            className={`ride-card ${!ride.isActive ? 'completed' : ''}`} 
            key={ride.id}
          >
            <div className="ride-header">
              <h3>{ride.pickup} to {ride.destination}</h3>
              <span className={`ride-status ${ride.isActive ? 'active' : 'completed'}`}>
                {ride.isActive ? 'Active' : 'Completed'}
              </span>
            </div>
            
            <div className="ride-details">
              <p><strong>Departure:</strong> {new Date(ride.departureTime * 1000).toLocaleString()}</p>
              <p><strong>Seats:</strong> {ride.totalBookedSeats} booked of {ride.maxPassengers} total</p>
              <p><strong>Price:</strong> {ride.pricePerSeat} ETH per seat</p>
              <p><strong>Total Potential Earnings:</strong> {(Number(ride.pricePerSeat) * ride.totalBookedSeats).toFixed(6)} ETH</p>
            </div>
            
            {ride.passengers.length > 0 && (
              <div className="passengers-section">
                <h4>Passengers</h4>
                <div className="passengers-list">
                  {ride.passengers.map(passenger => (
                    <div className="passenger-item" key={passenger.address}>
                      <div className="passenger-info">
                        <p className="passenger-address">
                          {`${passenger.address.substring(0, 6)}...${passenger.address.substring(38)}`}
                        </p>
                        <p className="passenger-seats">Seats: {passenger.seats}</p>
                        <p className="payment-status">
                          {passenger.paid ? 'Paid' : 'Unpaid'}
                        </p>
                      </div>
                      
                      <div className="passenger-actions">
                        {ride.isActive && passenger.paid && !passenger.completed && (
                          <button 
                            className="complete-button"
                            onClick={() => handleCompleteRide(ride.id, passenger.address)}
                            disabled={completingRide[`${ride.id}-${passenger.address}`]}
                          >
                            {completingRide[`${ride.id}-${passenger.address}`] ? 'Processing...' : 'Complete & Release Payment'}
                          </button>
                        )}
                        
                        {passenger.completed && (
                          <span className="completed-label">Completed</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="ride-actions">
              {/* Add cancel ride button if needed */}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};