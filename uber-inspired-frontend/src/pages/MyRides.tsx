import React, { useState, useEffect } from 'react';
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
  TextField
} from '@mui/material';
import useProvider from '../hooks/useProvider';
import useRideOffer from '../hooks/useRideOffer';
import useReputationSystem from '../hooks/useReputationSystem';

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

// Update the BookedRide interface to include the hasRated property
interface BookedRide {
  id: number;
  pickup: string;
  destination: string;
  departureTime: Date;
  driver: string;
  pricePerSeat: string;
  status: string;
  seats: number;
  hasRated?: boolean; // Add this optional property
}

// Add this interface just before the component
interface MyRidesProps {
  initialTab?: number;
  showTabs?: boolean;
  showOnly?: 'upcoming' | 'past';
  showTitle?: boolean;
  refreshTrigger?: number;
}

// Update the component definition
const MyRides: React.FC<MyRidesProps> = ({ 
  initialTab = 0, 
  showTabs = true,
  showOnly,
  showTitle = true,
  refreshTrigger = 0
}) => {
  // Update the initial tab state to use the prop
  const [tabValue, setTabValue] = useState(initialTab);
  const [upcomingRides, setUpcomingRides] = useState<BookedRide[]>([]);
  const [pastRides, setPastRides] = useState<BookedRide[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [selectedRide, setSelectedRide] = useState<BookedRide | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  const provider = useProvider();
  const { getRide } = useRideOffer(provider);
  const { rateDriver } = useReputationSystem(provider);

  // This would need to be integrated with your backend/blockchain
  // to retrieve the user's actual booked rides
  const loadMyRides = async () => {
    // In a real implementation, you would fetch the user's booked rides
    // from your smart contract or backend
    setLoading(true);
    
    try {
      // For demo purposes, we're using mock data
      // Replace this with your actual data fetching logic
      
      // Mock data for example
      const mockUpcoming = [
        {
          id: 1,
          pickup: "Downtown",
          destination: "Airport",
          departureTime: new Date(Date.now() + 86400000), // tomorrow
          driver: "0x1234567890123456789012345678901234567890",
          pricePerSeat: "0.05",
          status: "Confirmed",
          seats: 1
        },
        // More mock rides...
      ];
      
      const mockPast = [
        {
          id: 2,
          pickup: "Mall",
          destination: "University",
          departureTime: new Date(Date.now() - 86400000), // yesterday
          driver: "0x0987654321098765432109876543210987654321",
          pricePerSeat: "0.03",
          status: "Completed",
          seats: 1
        },
        // More mock rides...
      ];
      
      setUpcomingRides(mockUpcoming);
      setPastRides(mockPast);
    } catch (error) {
      console.error("Error loading rides:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyRides();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleRateDriver = (ride: BookedRide) => {
    setSelectedRide(ride);
    setRatingDialogOpen(true);
  };

  const handleSubmitRating = async () => {
    if (!rateDriver || !selectedRide) return;
    
    setIsSubmittingRating(true);
    try {
      await rateDriver(selectedRide.driver, rating, selectedRide.id);
      // Update the UI to show the driver has been rated
      const updatedPastRides = pastRides.map(ride => 
        ride.id === selectedRide.id ? { ...ride, hasRated: true } : ride
      );
      setPastRides(updatedPastRides);
      setRatingDialogOpen(false);
    } catch (error) {
      console.error("Error rating driver:", error);
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const cancelRide = async (rideId: number) => {
    // In a real implementation, call your smart contract to cancel the ride
    console.log(`Cancelling ride ${rideId}`);
    // After successful cancellation, refresh the rides list
    loadMyRides();
  };

  const getRideStatusChip = (status: string) => {
    let color: "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" = "default";
    
    switch(status) {
      case "Confirmed":
        color = "primary";
        break;
      case "Completed":
        color = "success";
        break;
      case "Cancelled":
        color = "error";
        break;
      case "In Progress":
        color = "info";
        break;
    }
    
    return <Chip label={status} color={color} size="small" />;
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  // Use the props to conditionally render different parts of the UI
  return (
    <Container sx={{ mt: showTitle ? 4 : 0 }}>
      {showTitle && (
        <Typography variant="h4" gutterBottom>
          My Rides
        </Typography>
      )}
      
      {showTabs && (
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Upcoming" />
            <Tab label="Past Rides" />
          </Tabs>
        </Box>
      )}
      
      {/* Conditionally render based on showOnly and tab value */}
      {(!showOnly || showOnly === 'upcoming') && (showTabs ? tabValue === 0 : true) && (
        <Box sx={{ p: showTabs ? 3 : 0 }}>
          {upcomingRides.length === 0 ? (
            <Typography>No upcoming rides found.</Typography>
          ) : (
            upcomingRides.map((ride) => (
              <Paper key={ride.id} sx={{ p: 3, mb: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={8}>
                    <Typography variant="h6">
                      {ride.pickup} to {ride.destination}
                    </Typography>
                    <Typography color="textSecondary">
                      {ride.departureTime.toLocaleString()}
                    </Typography>
                    <Typography>
                      Driver: {ride.driver.substring(0, 6)}...{ride.driver.substring(38)}
                    </Typography>
                    <Typography>
                      Price: {ride.pricePerSeat} ETH × {ride.seats} seat(s)
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      {getRideStatusChip(ride.status)}
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                      <Button 
                        variant="outlined" 
                        color="error" 
                        onClick={() => cancelRide(ride.id)}
                        disabled={ride.status === "In Progress"}
                      >
                        Cancel Ride
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            ))
          )}
        </Box>
      )}
      
      {(!showOnly || showOnly === 'past') && (showTabs ? tabValue === 1 : true) && (
        <Box sx={{ p: showTabs ? 3 : 0 }}>
          {pastRides.length === 0 ? (
            <Typography>No past rides found.</Typography>
          ) : (
            pastRides.map((ride) => (
              <Paper key={ride.id} sx={{ p: 3, mb: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={8}>
                    <Typography variant="h6">
                      {ride.pickup} to {ride.destination}
                    </Typography>
                    <Typography color="textSecondary">
                      {ride.departureTime.toLocaleString()}
                    </Typography>
                    <Typography>
                      Driver: {ride.driver.substring(0, 6)}...{ride.driver.substring(38)}
                    </Typography>
                    <Typography>
                      Price: {ride.pricePerSeat} ETH × {ride.seats} seat(s)
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      {getRideStatusChip(ride.status)}
                    </Box>
                    {ride.status === "Completed" && ride.hasRated !== true && (
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                        <Button 
                          variant="contained" 
                          onClick={() => handleRateDriver(ride)}
                        >
                          Rate Driver
                        </Button>
                      </Box>
                    )}
                    {ride.hasRated === true && (
                      <Typography variant="body2" align="right" sx={{ mt: 2 }}>
                        Driver rated ✓
                      </Typography>
                    )}
                  </Grid>
                </Grid>
              </Paper>
            ))
          )}
        </Box>
      )}

      {/* Rating Dialog */}
      <Dialog open={ratingDialogOpen} onClose={() => !isSubmittingRating && setRatingDialogOpen(false)}>
        <DialogTitle>Rate your driver</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            How was your experience with this driver?
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
            <Typography sx={{ mr: 2 }}>Rating:</Typography>
            <TextField
              type="number"
              variant="outlined"
              value={rating}
              onChange={(e) => setRating(Math.max(1, Math.min(5, parseInt(e.target.value) || 1)))}
              InputProps={{ inputProps: { min: 1, max: 5 } }}
              size="small"
              sx={{ width: 80 }}
            />
            <Typography sx={{ ml: 1 }}>/ 5</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRatingDialogOpen(false)} disabled={isSubmittingRating}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitRating} 
            variant="contained" 
            disabled={isSubmittingRating}
          >
            {isSubmittingRating ? <CircularProgress size={24} /> : 'Submit Rating'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MyRides;
