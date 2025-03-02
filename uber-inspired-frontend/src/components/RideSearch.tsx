import React, { useState, useEffect, useCallback } from "react";
import { Box, TextField, Button, Typography, Paper, Grid, Snackbar, Alert } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import useProvider from '../hooks/useProvider';
import useRideOffer from '../hooks/useRideOffer';
import useReputationSystem from '../hooks/useReputationSystem';
import BookingConfirmationDialog from './BookingConfirmationDialog';
import { useNavigate } from 'react-router-dom';

interface RideOffer {
  id: number;
  driverAddress: string;
  pickup: string;
  destination: string;
  departureTime: Date;
  availableSeats: number;
  pricePerSeat: string;
  rating: number;
}

interface RideSearchProps {
  onBookingSuccess?: () => void;
}

const RideSearch: React.FC<RideSearchProps> = ({ onBookingSuccess }) => {
  const provider = useProvider();
  const { getAvailableRides, getRide, bookRide } = useRideOffer(provider);
  const { getAverageRating, getDriverStats } = useReputationSystem(provider);
  
  const [searchParams, setSearchParams] = useState({
    pickup: '',
    destination: '',
    departureTime: null as Date | null
  });

  const [availableRides, setAvailableRides] = useState<RideOffer[]>([]);
  const [selectedRide, setSelectedRide] = useState<RideOffer | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingStatus, setBookingStatus] = useState<{
    type: 'success' | 'error',
    message: string
  } | null>(null);
  
  const navigate = useNavigate();

  const loadAvailableRides = React.useCallback(async () => {
    if (!getAvailableRides || !getRide) return;
    
    try {
      const availableRideIds = await getAvailableRides();
      if (!availableRideIds) return;
      
      const rides = await Promise.all(
        availableRideIds.map(async (id: number) => {
          const rideData = await getRide(id);
          if (!rideData) return null;
          
          let driverRating = 0;
          try {
            // Try to get driver's stats first (more detailed)
            const stats = await getDriverStats(rideData.driver);
            // Fix: Check if stats is an object and not a string (error message)
            if (typeof stats === 'object' && stats !== null) {
              driverRating = Number(stats.avgRating);
            } else {
              // Fallback to regular rating
              const rating = await getAverageRating(rideData.driver);
              driverRating = rating ? Number(rating) : 0;
            }
          } catch (error) {
            // Fallback to regular rating on any error
            try {
              const rating = await getAverageRating(rideData.driver);
              driverRating = rating ? Number(rating) : 0;
            } catch {
              driverRating = 0; // Default if all rating lookups fail
            }
          }
          
          return {
            id,
            driverAddress: rideData.driver,
            pickup: rideData.pickup,
            destination: rideData.destination,
            departureTime: new Date(rideData.departureTime * 1000),
            availableSeats: rideData.availableSeats,
            pricePerSeat: rideData.pricePerSeat,
            rating: driverRating
          };
        })
      );
      
      setAvailableRides(rides.filter(Boolean) as RideOffer[]);
    } catch (error) {
      console.error("Error loading rides:", error);
    }
  }, [getAvailableRides, getRide, getAverageRating, getDriverStats]);

  useEffect(() => {
    loadAvailableRides();
  }, [loadAvailableRides]);

  const handleSearch = () => {
    // Implement search logic
    console.log('Searching with params:', searchParams);
  };

  const handleBookRide = async (rideId: number, seats: number, price: string) => {
    const ride = availableRides.find(r => r.id === rideId);
    if (ride) {
      setSelectedRide(ride);
      setConfirmDialogOpen(true);  // This opens the confirmation dialog
    }
  };

  const handleConfirmBooking = async () => {
    if (!bookRide || !selectedRide) return;
    setIsProcessing(true);
    
    try {
      await bookRide(selectedRide.id, 1, selectedRide.pricePerSeat);
      
      // Call the onBookingSuccess callback if provided
      if (onBookingSuccess) {
        onBookingSuccess();
      }
      
      setBookingStatus({
        type: 'success',
        message: 'Ride booked successfully! Redirecting to your bookings...'
      });
      
      // Close dialog after successful booking
      setConfirmDialogOpen(false);
      
      // Wait a moment before redirecting
      setTimeout(() => {
        navigate('/my-rides');  // Redirect to My Rides page
      }, 2000);
    } catch (error) {
      console.error("Error booking ride:", error);
      setBookingStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to book ride'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="From"
            value={searchParams.pickup}
            onChange={(e) => setSearchParams({...searchParams, pickup: e.target.value})}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="To"
            value={searchParams.destination}
            onChange={(e) => setSearchParams({...searchParams, destination: e.target.value})}
          />
        </Grid>
        <Grid item xs={12}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateTimePicker
              label="Departure Time"
              value={searchParams.departureTime}
              onChange={(newValue) => setSearchParams({...searchParams, departureTime: newValue})}
            />
          </LocalizationProvider>
        </Grid>
        <Grid item xs={12}>
          <Button fullWidth variant="contained" onClick={handleSearch}>
            Search Rides
          </Button>
        </Grid>
      </Grid>

      <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
        Available Rides
      </Typography>

      {availableRides.map((ride, index) => (
        <Paper key={index} sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle1">
                {ride.pickup} → {ride.destination}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Departure: {ride.departureTime.toLocaleString()}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography>
                Available Seats: {ride.availableSeats} | Price: {ride.pricePerSeat}
              </Typography>
              <Typography variant="body2">
                Driver Rating: {ride.rating} ★
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Button variant="contained" color="primary" onClick={() => handleBookRide(ride.id, 1, ride.pricePerSeat)}>
                Book Seat
              </Button>
            </Grid>
          </Grid>
        </Paper>
      ))}

      {/* Confirmation Dialog */}
      <BookingConfirmationDialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={handleConfirmBooking}
        rideDetails={selectedRide}
        isProcessing={isProcessing}
      />

      {/* Booking Status Notification */}
      <Snackbar 
        open={!!bookingStatus} 
        autoHideDuration={6000} 
        onClose={() => setBookingStatus(null)}
      >
        <Alert 
          onClose={() => setBookingStatus(null)} 
          severity={bookingStatus?.type} 
          sx={{ width: '100%' }}
        >
          {bookingStatus?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RideSearch;
