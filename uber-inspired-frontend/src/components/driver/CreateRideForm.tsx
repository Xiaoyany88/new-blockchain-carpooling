import { useState } from 'react';
import useProvider from '../../hooks/useProvider';
import useRideOffer from '../../hooks/useRideOffer';
import './CreateRideForm.css';

type CreateRideFormProps = {
  onSuccess?: () => void;
};
export const CreateRideForm = ({ onSuccess }: CreateRideFormProps) => {
  const provider = useProvider();
  const { createRide } = useRideOffer(provider);
  
  const [formState, setFormState] = useState({
    pickup: '',
    destination: '',
    departureTime: '',
    maxPassengers: 1,
    pricePerSeat: '0.01',
    additionalNotes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{success: boolean, message: string} | null>(null);
  
  const resetForm = () => {
    setFormState({
      pickup: '',
      destination: '',
      departureTime: '',
      maxPassengers: 1,
      pricePerSeat: '0.01',
      additionalNotes: ''
    });
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResult(null);
    
    try {
      // Convert to UNIX timestamp
      const departureTimestamp = Math.floor(new Date(formState.departureTime).getTime() / 1000);
      
      const receipt = await createRide(
        formState.pickup,
        formState.destination,
        departureTimestamp,
        Number(formState.maxPassengers),
        formState.pricePerSeat,
        formState.additionalNotes
      );
      
      setResult({
        success: true,
        message: `Ride created successfully! Transaction: ${receipt?.transactionHash}`
      });

      // Reset form after successful submission
      resetForm();

      // Call onSuccess after a short delay to allow user to see success message
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 2000); // 2 second delay
      }
    } catch (error) {
      console.error('Error creating ride:', error);
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create ride'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form className="create-ride-form" onSubmit={handleSubmit}>
      <h2>Create a New Ride</h2>
      
      <div className="form-group">
        <label htmlFor="pickup">Pickup Location</label>
        <input
          type="text"
          id="pickup"
          name="pickup"
          value={formState.pickup}
          onChange={handleChange}
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="destination">Destination</label>
        <input
          type="text"
          id="destination"
          name="destination"
          value={formState.destination}
          onChange={handleChange}
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="departureTime">Departure Time</label>
        <input
          type="datetime-local"
          id="departureTime"
          name="departureTime"
          value={formState.departureTime}
          onChange={handleChange}
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="maxPassengers">Maximum Passengers</label>
        <input
          type="number"
          id="maxPassengers"
          name="maxPassengers"
          value={formState.maxPassengers}
          onChange={handleChange}
          min="1"
          max="10"
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="pricePerSeat">Price per Seat (ETH)</label>
        <input
          type="number"
          id="pricePerSeat"
          name="pricePerSeat"
          value={formState.pricePerSeat}
          onChange={handleChange}
          step="0.001"
          min="0.001"
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="additionalNotes">Additional Notes</label>
        <textarea
          id="additionalNotes"
          name="additionalNotes"
          value={formState.additionalNotes}
          onChange={handleChange}
          rows={3}
        />
      </div>
      
      <button 
        type="submit" 
        disabled={isSubmitting || !provider}
      >
        {isSubmitting ? 'Creating...' : 'Create Ride'}
      </button>
      
      {!provider && <p className="error">Please connect your wallet first</p>}
      
      {result && (
        <div className={`result ${result.success ? 'success' : 'error'}`}>
          {result.message}
          {result.success && <div className="redirect-message">Redirecting to dashboard...</div>}
        </div>
      )}
    </form>
  );
};