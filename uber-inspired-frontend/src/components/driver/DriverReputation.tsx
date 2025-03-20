import { useState, useEffect, useRef, useCallback } from 'react';
import { ethers } from 'ethers';
import useProvider from '../../hooks/useProvider';
import useCarpoolSystem from '../../hooks/useCarpoolSystem';
import './DriverReputation.css';

export const DriverReputation = () => {
  // State management
  const provider = useProvider();
  const { getDriverInfo } = useCarpoolSystem(provider);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reputationStats, setReputationStats] = useState<{
    avgRating: number;
    totalRides: number;
    completionRate: number;
  } | null>(null);
  const [userAddress, setUserAddress] = useState<string>('');
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);

  
  // Prevent stale closure with refs
  const loadingRef = useRef(loading);
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);
  
  // Connection management - this function is stable across renders with useCallback
  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      setError("Please install MetaMask to use this feature");
      setLoading(false);
      return false;
    }
    
    try {
      // Request accounts explicitly
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      setIsWalletConnected(true);
      setError(null);
      setLoading(true);
      return true;
    } catch (err) {
      console.error("Failed to connect wallet:", err);
      setError("Failed to connect wallet. Please try again.");
      setLoading(false);
      return false;
    }
  }, []);
  
  // Check wallet connection status once on mount
  useEffect(() => {
    const checkWalletConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            console.log("Wallet already connected:", accounts[0]);
            setIsWalletConnected(true);
          }
        } catch (err) {
          console.error("Error checking wallet connection:", err);
        }
      }
    };
    
    checkWalletConnection();
    
    // Add event listeners for account changes
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setIsWalletConnected(true);
          setLoading(true); // Refresh data
        } else {
          setIsWalletConnected(false);
          setError("Wallet disconnected");
        }
      };
      
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => window.location.reload());
      
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', () => {});
      };
    }
  }, []); // Empty dependency array - only run once on mount
  
  // Try to connect automatically when the component mounts
  useEffect(() => {
    const autoConnect = async () => {
      if (!isWalletConnected && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ 
            method: 'eth_accounts'  // This doesn't prompt, just checks
          });
          
          if (accounts.length > 0) {
            // Already connected, just not tracked in our state
            console.log("Auto-detected connected wallet:", accounts[0]);
            setIsWalletConnected(true);
          } else {
            // Try silent connection if possible (some browsers allow this)
            try {
              console.log("Attempting silent wallet connection...");
              await connectWallet();
            } catch (e) {
              // Silent connection failed, user will need to click button
              console.log("Silent connection not possible, waiting for user action");
            }
          }
        } catch (err) {
          console.error("Auto-connect check failed:", err);
        }
      }
    };
    
    autoConnect();
  }, [isWalletConnected, connectWallet]);
  
  // The main data fetching effect - with better dependencies
  useEffect(() => {
    // Skip if wallet not connected
    if (!isWalletConnected || !provider || dataFetched) {
      return;
    }
    
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const fetchDriverReputation = async () => {
      try {
        console.log("Fetching driver reputation data...");
        
        // Set a timeout to prevent endless loading
        timeoutId = setTimeout(() => {
          if (isMounted && loadingRef.current) {
            console.log("Loading timed out - showing default state");
            setReputationStats({
              avgRating: 0,
              totalRides: 0,
              completionRate: 0
            });
            setLoading(false);
          }
        }, 8000);

        const signer = provider.getSigner();
        const address = await signer.getAddress();
        if (isMounted) setUserAddress(address);

        if (!getDriverInfo) {
          if (isMounted) {
            console.error("getDriverInfo function not available");
            setError("Contract functions not available");
            setLoading(false);
          }
          return;
        }

        console.log("Calling getDriverInfo for address:", address);
        const info = await getDriverInfo(address);
        
        if (info && isMounted) {
          clearTimeout(timeoutId);
          // Process reputation data
          const totalRides = info.totalRides.toNumber();
          
          // For this version without cancelled rides:
          const completionRate = 100; // Assume 100% completion rate
          
          console.log("Retrieved reputation data:", {
            avgRating: info.avgRating.toNumber(),
            totalRides: totalRides
          });
          
          setReputationStats({
            avgRating: info.avgRating.toNumber(),
            totalRides: totalRides,
            completionRate: completionRate
          });
          setLoading(false);
          setDataFetched(true);
        }
      } catch (err: any) {
        console.error("Failed to fetch reputation:", err);
        if (isMounted) {
          clearTimeout(timeoutId);
          // Show new driver UI instead of error for empty data
          setReputationStats({
            avgRating: 0,
            totalRides: 0,
            completionRate: 0
          });
          setLoading(false);
          setDataFetched(true);
        }
      }
    };

    fetchDriverReputation();
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [provider, getDriverInfo, isWalletConnected, dataFetched]);
  
  useEffect(() => {
    setDataFetched(false);
  }, [isWalletConnected]);

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
    return (
      <div className="driver-reputation loading">
        <div className="loading-spinner"></div>
        <p>Loading your reputation data...</p>
      </div>
    );
  }

  if (error || !isWalletConnected) {
    return (
      <div className="driver-reputation error">
        <h2>Connection Required</h2>
        <p>{error || "Please connect your wallet to view your reputation"}</p>
        <button 
          className="connect-wallet-btn"
          onClick={connectWallet}
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  // For new drivers (all zeros)
  if (!reputationStats || 
      (reputationStats.totalRides === 0 && 
       reputationStats.avgRating === 0)) {
    return (
      <div className="driver-reputation new-driver">
        <h2>Your Reputation</h2>
        <div className="empty-state">
          <div className="empty-icon">🚘</div>
          <h3>New Driver</h3>
          <p>You haven't completed any rides yet. Start driving to build your reputation!</p>
          <div className="reputation-tip">
            <strong>Tip:</strong> Complete rides and provide great service to earn high ratings from passengers.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="driver-reputation">
      <h2>Your Reputation</h2>
      <div className="address-info">
        <span className="label">Wallet:</span>
        <span className="value">{userAddress.substring(0, 6)}...{userAddress.substring(38)}</span>
      </div>
      
      <div className="reputation-stats">
        <div className="stat-card rating">
          <h3>Average Rating</h3>
          <div className="rating-display">
            <div className="rating-number">{reputationStats.avgRating}</div>
            <div className="rating-stars">
              {renderStars(reputationStats.avgRating)}
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
      </div>
      
      <div className="reputation-details">
        <h3>What This Means</h3>
        <div className="details-grid">
          <div className="details-item">
            <h4>Average Rating</h4>
            <p>The average of all ratings you've received from passengers.</p>
            {reputationStats.avgRating >= 4.5 && (
              <div className="rating-badge excellent">Excellent</div>
            )}
            {reputationStats.avgRating >= 4 && reputationStats.avgRating < 4.5 && (
              <div className="rating-badge good">Good</div>
            )}
            {reputationStats.avgRating >= 3 && reputationStats.avgRating < 4 && (
              <div className="rating-badge average">Average</div>
            )}
            {reputationStats.avgRating < 3 && reputationStats.avgRating > 0 && (
              <div className="rating-badge needs-improvement">Needs Improvement</div>
            )}
          </div>
          
          <div className="details-item">
            <h4>Ride Activity</h4>
            <p>You've completed <strong>{reputationStats.totalRides}</strong> rides with a <strong>{reputationStats.completionRate.toFixed(1)}%</strong> completion rate.</p>
            {reputationStats.totalRides >= 50 && (
              <div className="rating-badge excellent">Experienced Driver</div>
            )}
            {reputationStats.totalRides >= 20 && reputationStats.totalRides < 50 && (
              <div className="rating-badge good">Regular Driver</div>
            )}
            {reputationStats.totalRides >= 5 && reputationStats.totalRides < 20 && (
              <div className="rating-badge average">Active Driver</div>
            )}
            {reputationStats.totalRides < 5 && (
              <div className="rating-badge">New Driver</div>
            )}
          </div>
        </div>
        
        <div className="reputation-tip">
          <strong>Tip:</strong> Higher ratings help you stand out to potential passengers and could lead to more bookings!
        </div>
      </div>
    </div>
  );
};