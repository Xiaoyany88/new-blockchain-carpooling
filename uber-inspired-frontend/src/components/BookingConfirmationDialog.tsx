import React from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography,
  Grid,
  CircularProgress
} from '@mui/material';

interface RideDetails {
  id: number;
  pickup: string;
  destination: string;
  departureTime: Date;
  pricePerSeat: string;
  driverAddress: string;
  rating: number;
}

interface BookingConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  rideDetails: RideDetails | null;
  isProcessing: boolean;
}

const BookingConfirmationDialog: React.FC<BookingConfirmationDialogProps> = ({
  open,
  onClose,
  onConfirm,
  rideDetails,
  isProcessing
}) => {
  if (!rideDetails) return null;

  return (
    <Dialog open={open} onClose={isProcessing ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Confirm Booking</DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="subtitle1">Trip Details:</Typography>
            <Typography>
              From: <strong>{rideDetails.pickup}</strong>
            </Typography>
            <Typography>
              To: <strong>{rideDetails.destination}</strong>
            </Typography>
            <Typography>
              Departure: <strong>{rideDetails.departureTime.toLocaleString()}</strong>
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle1">Payment Information:</Typography>
            <Typography>
              Price: <strong>{rideDetails.pricePerSeat} ETH</strong>
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Payment will be held in escrow until your ride is completed. 
              Funds will only be released to the driver after you arrive at your destination.
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle1">Driver Information:</Typography>
            <Typography>
              Driver Address: <strong>{`${rideDetails.driverAddress.substring(0, 6)}...${rideDetails.driverAddress.substring(38)}`}</strong>
            </Typography>
            <Typography>
              Rating: <strong>{rideDetails.rating} ★</strong>
            </Typography>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isProcessing}>
          Cancel
        </Button>
        <Button 
          onClick={onConfirm} 
          variant="contained" 
          color="primary"
          disabled={isProcessing}
        >
          {isProcessing ? <CircularProgress size={24} /> : 'Confirm & Pay'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BookingConfirmationDialog;
