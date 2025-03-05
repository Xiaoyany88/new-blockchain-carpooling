import React, { useState, useEffect, useCallback } from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  Grid, 
  Button, 
  Tabs, 
  Tab, 
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Rating as MuiRating
} from '@mui/material';
import useProvider from '../hooks/useProvider';
import useRideOffer from '../hooks/useRideOffer';
import useReputationSystem from '../hooks/useReputationSystem';
import useCarpoolSystem from '../hooks/useCarpoolSystem';
import { ethers } from 'ethers';
import { formatAddress } from '../utils/addressFormatter';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// Updated BookedRide interface to match contract structure
interface BookedRide {
  id: number;
  pickup: string;
  destination: string;
  departureTime: Date;
  driver: string;
  pricePerSeat: string;
  status: string;
  seats: number;
  hasRated: boolean;
  isActive: boolean;
}

interface MyRidesProps {
  initialTab?: number;
  showTabs?: boolean;
  showOnly?: 'upcoming' | 'past';
  showTitle?: boolean;
  refreshTrigger?: number;
}

const MyRides: React.FC<MyRidesProps> = ({ 
  initialTab = 0, 
  showTabs = true,
  showOnly,
  showTitle = true,
  refreshTrigger = 0
}) => {
  const [tabValue, setTabValue] = useState(initialTab);
  const [upcomingRides, setUpcomingRides] = useState<BookedRide[]>([]);
  const [pastRides, setPastRides] = useState<BookedRide[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [selectedRide, setSelectedRide] = useState<BookedRide | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const provider = useProvider();
  const { getRide, getUserBookings, hasUserRatedRide } = useRideOffer(provider);
  const { rateDriver } = useReputationSystem(provider);
  const { cancelRide: cancelRideFunction } = useCarpoolSystem();

  // Wrap loadMyRides with useCallback
  const loadMyRides = useCallback(async () => {
    if (isLoading) return; // Prevent concurrent fetches

    setLoading(true);
    console.log("loadMyRides called at:", new Date().toISOString());
    
    try {
      if (!getRide || !provider) {
        console.error("Contract functions not available");
        setLoading(false);
        return;
      }
  
      // Get the current user's bookings
      const bookingIds = await getUserBookings();
      
      if (!bookingIds || bookingIds.length === 0) {
        console.log("No bookings found for user");
        setUpcomingRides([]);
        setPastRides([]);
        setLoading(false);
        return;
      }
  
      // Get full details for each booking
      const ridePromises = bookingIds.map(async (id: number) => {
        try {
          // Get the basic ride details from the contract
          const rideData = await getRide(id);
          
          if (!rideData) {
            console.log(`No ride data found for ID: ${id}`);
            return null;
          }
          
          // Check if user has rated this ride
          const hasRated = await hasUserRatedRide(id);
          
          // Determine if ride is in the past
          const currentTime = Math.floor(Date.now() / 1000);
          const isPastRide = Number(rideData.departureTime) < currentTime;
          
          // Determine ride status based on contract data
          let status = "Confirmed";
          
          if (!rideData.isActive && isPastRide) {
            status = "Completed";
          } else if (rideData.isActive && isPastRide) {
            status = "Missed";
          } else if (!rideData.isActive && !isPastRide) {
            status = "Cancelled";
          } else if (rideData.isActive && !isPastRide) {
            if (currentTime > Number(rideData.departureTime) - 3600) { // Within 1 hour of departure
              status = "In Progress";
            } else {
              status = "Confirmed";
            }
          }
          
          return {
            id: id,
            pickup: rideData.pickup,
            destination: rideData.destination,
            departureTime: new Date(rideData.departureTime * 1000),
            driver: rideData.driver,
            pricePerSeat: rideData.pricePerSeat,
            status: status,
            seats: 1, // Default to 1 since we can't get exact booking seat count
            hasRated: hasRated,
            isActive: rideData.isActive
          };
        } catch (error) {
          console.error(`Error processing ride ID ${id}:`, error);
          return null;
        }
      });
  
      const rides = (await Promise.all(ridePromises)).filter(Boolean) as BookedRide[];
      
      // Split rides into upcoming and past
      const upcoming = rides.filter(ride => 
        ride.status === "Confirmed" || ride.status === "In Progress"
      );
      
      const past = rides.filter(ride => 
        ride.status === "Completed" || ride.status === "Cancelled" || ride.status === "Missed"
      );
      
      setUpcomingRides(upcoming);
      setPastRides(past);
    } catch (error) {
      console.error("Error loading rides:", error);
    } finally {
      setIsLoading(false);
    }
  }, [provider?.getSigner().getAddress, getRide, getUserBookings, hasUserRatedRide]);

  useEffect(() => {
    if (provider) {
      loadMyRides();
    }
  }, [provider, loadMyRides, refreshTrigger]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleRateDriver = (ride: BookedRide) => {
    setSelectedRide(ride);
    setRatingDialogOpen(true);
  };

  const handleSubmitRating = async () => {
    if (!selectedRide) return;
    
    setIsSubmittingRating(true);
    try {
      await rateDriver(selectedRide.driver, rating, selectedRide.id);
      
      // Update the ride in our local state to show it's been rated
      const updatedPastRides = pastRides.map(ride => 
        ride.id === selectedRide.id ? { ...ride, hasRated: true } : ride
      );
      setPastRides(updatedPastRides);
      
      setRatingDialogOpen(false);
    } catch (error) {
      console.error("Error submitting rating:", error);
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const handleCancelRide = async (rideId: number) => {
    try {
      await cancelRideFunction(rideId.toString());
      loadMyRides(); // Reload rides after cancellation
    } catch (error) {
      console.error("Error canceling ride:", error);
    }
  };

  const renderRideCard = (ride: BookedRide) => {
    const isPast = ride.status === "Completed" || ride.status === "Cancelled" || ride.status === "Missed";
    
    return (
      <Paper key={ride.id} sx={{ mb: 2, p: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6">
              {ride.pickup} → {ride.destination}
            </Typography>
            <Typography variant="body1" color="textSecondary">
              {ride.departureTime.toLocaleString()}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="body2">
              <strong>Driver:</strong> {formatAddress(ride.driver)}
            </Typography>
            <Typography variant="body2">
              <strong>Price:</strong> {ride.pricePerSeat} ETH
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
              <Chip 
                label={ride.status} 
                color={
                  ride.status === "Completed" ? "success" : 
                  ride.status === "Confirmed" ? "primary" :
                  ride.status === "In Progress" ? "secondary" :
                  "default"
                }
                sx={{ mr: 1 }}
              />
              
              {ride.status === "Confirmed" && (
                <Button 
                  variant="outlined" 
                  color="error" 
                  size="small"
                  onClick={() => handleCancelRide(ride.id)}
                >
                  Cancel
                </Button>
              )}
              
              {isPast && ride.status === "Completed" && !ride.hasRated && (
                <Button 
                  variant="outlined" 
                  color="primary" 
                  size="small"
                  onClick={() => handleRateDriver(ride)}
                >
                  Rate Driver
                </Button>
              )}
              
              {isPast && ride.hasRated && (
                <Chip label="Rated" color="success" size="small" />
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if ((showOnly === 'upcoming' || tabValue === 0) && upcomingRides.length === 0) {
      return (
        <Typography variant="body1" sx={{ textAlign: 'center', my: 4 }}>
          You don't have any upcoming rides.
        </Typography>
      );
    }

    if ((showOnly === 'past' || tabValue === 1) && pastRides.length === 0) {
      return (
        <Typography variant="body1" sx={{ textAlign: 'center', my: 4 }}>
          You don't have any past rides.
        </Typography>
      );
    }

    return (
      <>
        {(!showOnly || showOnly === 'upcoming') && (tabValue === 0 || !showTabs) && (
          <>
            {upcomingRides.map((ride, index) => (
              <React.Fragment key={`${ride.id}-${index}`}>
                {renderRideCard(ride)}
              </React.Fragment>
            ))}
          </>
        )}
        
        {(!showOnly || showOnly === 'past') && (tabValue === 1 || !showTabs) && (
          <>
            {pastRides.map((ride, index) => (
              <React.Fragment key={`${ride.id}-${index}`}>
                {renderRideCard(ride)}
              </React.Fragment>
            ))}
          </>
        )}
      </>
    );
  };

  return (
    <Container>
      {showTitle && (
        <Typography variant="h4" gutterBottom>
          My Rides
        </Typography>
      )}

      {showTabs && (
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="ride history tabs">
            <Tab label="Upcoming" />
            <Tab label="History" />
          </Tabs>
        </Box>
      )}

      {renderContent()}

      <Dialog open={ratingDialogOpen} onClose={() => setRatingDialogOpen(false)}>
        <DialogTitle>Rate your driver</DialogTitle>
        <DialogContent>
          <Box sx={{ my: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography component="legend">Rating</Typography>
            <MuiRating
              name="driver-rating"
              value={rating}
              onChange={(event, newValue) => setRating(newValue || 5)}
              size="large"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRatingDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmitRating} 
            disabled={isSubmittingRating}
            variant="contained" 
            color="primary"
          >
            {isSubmittingRating ? <CircularProgress size={24} /> : "Submit"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MyRides;