// src/pages/DriverDashboard.tsx
import { useEffect, useState } from 'react';
import useProvider from '../hooks/useProvider';
import { CreateRideForm } from '../components/driver/CreateRideForm';
import { DriverRides } from '../components/driver/DriverRides';
import { DriverReputation } from '../components/driver/DriverReputation';
import './DriverDashboard.css';

export const DriverDashboard = () => {
  const provider = useProvider();
  const [isConnected, setIsConnected] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showRides, setShowRides] = useState(false);
  const [showReputation, setShowReputation] = useState(false);
  
  useEffect(() => {
    const checkConnection = async () => {
      if (provider) {
        const accounts = await provider.listAccounts();
        setIsConnected(accounts.length > 0);
      }
    };
    
    checkConnection();
  }, [provider]);
  
  if (!isConnected) {
    return (
      <div className="driver-dashboard">
        <div className="wallet-prompt">
          <h2>Driver Dashboard</h2>
          <p>Please connect your wallet to access the driver features.</p>
        </div>
      </div>
    );
  }
  
  // Handler to go back to dashboard
  const handleBackToDashboard = () => {
    setShowCreateForm(false);
    setShowRides(false);
    setShowReputation(false);
  };
  
  return (
    <div className="driver-dashboard">
      <h1>Driver Dashboard</h1>
      
      {showCreateForm ? (
        <div className="form-container">
          <button 
            className="back-button"
            onClick={handleBackToDashboard}
          >
            ← Back to Dashboard
          </button>
          <CreateRideForm onSuccess={handleBackToDashboard} />
        </div>
      ) : showRides ? (
        <>
          <button 
            className="back-button"
            onClick={handleBackToDashboard}
          >
            ← Back to Dashboard
          </button>
          <DriverRides />
        </>
      ) : showReputation ? ( // Add this condition
        <>
          <button 
            className="back-button"
            onClick={handleBackToDashboard}
          >
            ← Back to Dashboard
          </button>
          <DriverReputation />
        </>
      ) : (
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h2>Create a Ride</h2>
            <p>Offer a new ride to passengers and earn tokens</p>
            <button 
              className="dashboard-btn"
              onClick={() => setShowCreateForm(true)}
            >
              Create Ride
            </button>
          </div>
          
          <div className="dashboard-card">
            <h2>Your Rides</h2>
            <p>Manage your active and upcoming rides</p>
            <button 
              className="dashboard-btn"
              onClick={() => setShowRides(true)}
            >
              View Rides
            </button>
          </div>
          
          <div className="dashboard-card">
            <h2>Earnings</h2>
            <p>Track your earnings and rewards</p>
            <button className="dashboard-btn">View Earnings</button>
          </div>
          
          <div className="dashboard-card">
            <h2>Your Reputation</h2>
            <p>View your driver ratings and feedback</p>
            <button 
              className="dashboard-btn"
              onClick={() => setShowReputation(true)} // Update handler
            >
              View Reputation
            </button>
          </div>
        </div>
      )}
    </div>
  );
};