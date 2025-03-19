// src/components/driver/DriverReputation.tsx
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import useProvider from '../../hooks/useProvider';
import useCarpoolSystem from '../../hooks/useCarpoolSystem';
import './DriverReputation.css';

export const DriverReputation = () => {
  const provider = useProvider();
  const { getDriverInfo } = useCarpoolSystem(provider);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reputationStats, setReputationStats] = useState<{
    avgRating: number;
    totalRides: number;
    cancelledRides: number;
    completionRate: number;
  } | null>(null);
  const [userAddress, setUserAddress] = useState<string>('');

  useEffect(() => {
    const fetchDriverReputation = async () => {
      if (!provider || !getDriverInfo) {
        setError("Wallet not connected or contract not available");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        setUserAddress(address);

        const info = await getDriverInfo(address);
        
        if (info) {
          // Calculate completion rate
          const totalRides = info.totalRides.toNumber();
          const cancelledRides = info.cancelledRides.toNumber();
          const completionRate = totalRides > 0 
            ? ((totalRides - cancelledRides) / totalRides) * 100 
            : 0;
          
          setReputationStats({
            avgRating: info.avgRating.toNumber(),
            totalRides: totalRides,
            cancelledRides: cancelledRides,
            completionRate: completionRate
          });
        }

        setLoading(false);
      } catch (err: any) {
        console.error("Failed to fetch reputation:", err);
        setError(err.message || "Failed to fetch reputation data");
        setLoading(false);
      }
    };

    fetchDriverReputation();
  }, [provider, getDriverInfo]);

  // Helper to render star rating
  const renderStars = (rating: number) => {
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={star <= rating ? "star filled" : "star"}>
            {star <= rating ? "★" : "☆"}
          </span>
        ))}
      </div>
    );
  };

  if (loading) {
    return <div className="driver-reputation loading">Loading your reputation data...</div>;
  }

  if (error) {
    return <div className="driver-reputation error">Error: {error}</div>;
  }

  if (!reputationStats) {
    return (
      <div className="driver-reputation no-data">
        <h2>Your Reputation</h2>
        <p>No reputation data available yet. Complete rides to build your reputation.</p>
      </div>
    );
  }

  return (
    <div className="driver-reputation">
      <h2>Your Reputation</h2>
      
      <div className="reputation-stats">
        <div className="stat-card rating">
          <h3>Average Rating</h3>
          <div className="rating-display">
            <div className="rating-number">{reputationStats.avgRating || 0}</div>
            <div className="rating-stars">
              {renderStars(reputationStats.avgRating || 0)}
            </div>
          </div>
        </div>
        
        <div className="stat-card rides">
          <h3>Completed Rides</h3>
          <div className="stat-value">{reputationStats.totalRides}</div>
        </div>
        
        <div className="stat-card completion">
          <h3>Completion Rate</h3>
          <div className="stat-value">{reputationStats.completionRate.toFixed(1)}%</div>
        </div>
        
        <div className="stat-card cancellations">
          <h3>Cancelled Rides</h3>
          <div className="stat-value">{reputationStats.cancelledRides}</div>
        </div>
      </div>
      
      <div className="reputation-details">
        <h3>What This Means</h3>
        <ul>
          <li><strong>Average Rating:</strong> The average of all ratings you've received from riders.</li>
          <li><strong>Completed Rides:</strong> Total number of rides you've successfully completed.</li>
          <li><strong>Completion Rate:</strong> Percentage of rides you've completed versus cancelled.</li>
          <li><strong>Cancelled Rides:</strong> Number of rides you've cancelled.</li>
        </ul>
        <p className="reputation-tip">
          <strong>Tip:</strong> Higher ratings and completion rates will attract more riders!
        </p>
      </div>
    </div>
  );
};