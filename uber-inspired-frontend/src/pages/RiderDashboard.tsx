// src/pages/RiderDashboard.tsx
import { useEffect, useState } from 'react';
import useProvider from '../hooks/useProvider';
import { RideSearchResults } from '../components/rider/RideSearchResults';
import './RiderDashboard.css';

export const RiderDashboard = () => {
  const provider = useProvider();
  const [isConnected, setIsConnected] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  
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
      <div className="rider-dashboard">
        <div className="wallet-prompt">
          <h2>Rider Dashboard</h2>
          <p>Please connect your wallet to access the rider features.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="rider-dashboard">
      <h1>Rider Dashboard</h1>
      
      {showSearch ? (
        <>
          <button 
            className="back-button"
            onClick={() => setShowSearch(false)}
          >
            ← Back to Dashboard
          </button>
          <RideSearchResults />
        </>
      ) : (
        <>
          <div className="search-box">
            <h2>Find a Ride</h2>
            <div className="search-form">
              <div className="form-group">
                <label htmlFor="pickup">Pickup Location</label>
                <input type="text" id="pickup" placeholder="Enter pickup location" />
              </div>
              
              <div className="form-group">
                <label htmlFor="destination">Destination</label>
                <input type="text" id="destination" placeholder="Enter destination" />
              </div>
              
              <div className="form-group">
                <label htmlFor="date">Date</label>
                <input type="date" id="date" />
              </div>
              
              <button 
                className="search-btn"
                onClick={() => setShowSearch(true)}
              >
                Find Rides
              </button>
            </div>
          </div>
          
          <div className="dashboard-grid">
            <div className="dashboard-card">
              <h2>Your Bookings</h2>
              <p>Manage your active and upcoming rides</p>
              <button className="dashboard-btn">View Bookings</button>
            </div>
            
            <div className="dashboard-card">
              <h2>Ride History</h2>
              <p>Review your past rides and ratings</p>
              <button className="dashboard-btn">View History</button>
            </div>
            
            <div className="dashboard-card">
              <h2>Rewards</h2>
              <p>Check your token balance and rewards</p>
              <button className="dashboard-btn">View Rewards</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};