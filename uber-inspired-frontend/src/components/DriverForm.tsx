import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Paper, Alert, CircularProgress } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import useProvider from '../hooks/useProvider';
import useRideOffer from '../hooks/useRideOffer';

interface RideOffer {
  pickup: string;
  destination: string;
  departureTime: Date;
  maxPassengers: number;
  pricePerSeat: string;
  additionalNotes: string;
}

const DriverForm: React.FC = () => {
  const provider = useProvider();
  const { createRide } = useRideOffer(provider);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [rideOffer, setRideOffer] = useState<RideOffer>({
    pickup: '',
    destination: '',
    departureTime: new Date(),
    maxPassengers: 1,
    pricePerSeat: '',
    additionalNotes: ''
  });

  const validateForm = () => {
    if (!rideOffer.pickup) return "Pickup location is required";
    if (!rideOffer.destination) return "Destination is required";
    if (!rideOffer.pricePerSeat) return "Price per seat is required";
    if (rideOffer.maxPassengers < 1) return "Must accept at least one passenger";
    if (rideOffer.departureTime.getTime() <= Date.now()) return "Departure time must be in the future";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provider || !createRide) {
      setError("Please connect your wallet first");
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log("Creating ride with params:", {
        pickup: rideOffer.pickup,
        destination: rideOffer.destination,
        departureTime: Math.floor(rideOffer.departureTime.getTime() / 1000),
        maxPassengers: rideOffer.maxPassengers,
        pricePerSeat: rideOffer.pricePerSeat,
        notes: rideOffer.additionalNotes
      });

      await createRide(
        rideOffer.pickup,
        rideOffer.destination,
        Math.floor(rideOffer.departureTime.getTime() / 1000),
        rideOffer.maxPassengers,
        rideOffer.pricePerSeat,
        rideOffer.additionalNotes
      );
      
      setSuccess("Ride created successfully!");
      
      // Clear form
      setRideOffer({
        pickup: '',
        destination: '',
        departureTime: new Date(),
        maxPassengers: 1,
        pricePerSeat: '',
        additionalNotes: ''
      });
    } catch (error) {
      console.error('Error posting ride:', error);
      setError(error instanceof Error ? error.message : 'Error creating ride');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="h6" gutterBottom>
        Post a New Ride
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <TextField
        fullWidth
        label="Pickup Location"
        value={rideOffer.pickup}
        onChange={(e) => setRideOffer({...rideOffer, pickup: e.target.value})}
        margin="normal"
      />
      <TextField
        fullWidth
        label="Destination"
        value={rideOffer.destination}
        onChange={(e) => setRideOffer({...rideOffer, destination: e.target.value})}
        margin="normal"
      />
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DateTimePicker
          label="Departure Time"
          value={rideOffer.departureTime}
          onChange={(newValue) => setRideOffer({...rideOffer, departureTime: newValue || new Date()})}
        />
      </LocalizationProvider>
      <TextField
        fullWidth
        type="number"
        label="Maximum Passengers"
        value={rideOffer.maxPassengers}
        onChange={(e) => setRideOffer({...rideOffer, maxPassengers: parseInt(e.target.value)})}
        margin="normal"
        InputProps={{ inputProps: { min: 1, max: 8 } }}
      />
      <TextField
        fullWidth
        label="Price per Seat (ETH)"
        value={rideOffer.pricePerSeat}
        onChange={(e) => setRideOffer({...rideOffer, pricePerSeat: e.target.value})}
        margin="normal"
      />
      <TextField
        fullWidth
        multiline
        rows={3}
        label="Additional Notes"
        value={rideOffer.additionalNotes}
        onChange={(e) => setRideOffer({...rideOffer, additionalNotes: e.target.value})}
        margin="normal"
      />
      <Button
        fullWidth
        variant="contained"
        color="primary"
        type="submit"
        disabled={loading}
        sx={{ mt: 2 }}
      >
        {loading ? <CircularProgress size={24} /> : 'Post Ride'}
      </Button>
    </Box>
  );
};

export default DriverForm;
