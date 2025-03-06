import { Link } from 'react-router-dom';
import './HomePage.css';

export const HomePage = () => {
  return (
    <div className="home-page">
      <div className="hero">
        <h1>Welcome to BlockRide</h1>
        <p className="subtitle">Decentralized carpooling powered by blockchain technology</p>
      </div>
      
      <div className="options-container">
        <Link to="/driver" className="option driver-option">
          <div className="option-content">
            <h2>Drive</h2>
            <p>Offer rides, earn tokens, and build your reputation</p>
          </div>
        </Link>
        
        <Link to="/rider" className="option rider-option">
          <div className="option-content">
            <h2>Ride</h2>
            <p>Find rides, book securely, and rate your experience</p>
          </div>
        </Link>
      </div>
      
      <div className="info-section">
        <h2>How It Works</h2>
        <div className="info-cards">
          <div className="info-card">
            <h3>Connect Wallet</h3>
            <p>Connect your Ethereum wallet to access the platform</p>
          </div>
          
          <div className="info-card">
            <h3>Create or Book Rides</h3>
            <p>Drivers offer rides, riders find and book them</p>
          </div>
          
          <div className="info-card">
            <h3>Secure Payments</h3>
            <p>All payments are handled securely through smart contracts</p>
          </div>
        </div>
      </div>
    </div>
  );
};