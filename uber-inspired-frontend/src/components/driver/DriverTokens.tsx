import { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import useProvider from '../../hooks/useProvider';
import useCarpoolSystem from '../../hooks/useCarpoolSystem';
import './DriverTokens.css';

export const DriverTokens = () => {
  const provider = useProvider();
  const { getTokenBalance, exchangeTokensForETH, getExchangeRate, contractReady, contract } = useCarpoolSystem(provider);
  
  const [tokenBalance, setTokenBalance] = useState<string>('0');
  const [loading, setLoading] = useState(true);
  const [exchangeAmount, setExchangeAmount] = useState<string>('');
  const [ethEquivalent, setEthEquivalent] = useState<string>('0');
  const [isExchanging, setIsExchanging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number>(10000); // Default 10000 tokens per ETH
  
  // Add these new state/refs to fix the loading issue
  const isFetchingRef = useRef(false);
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  
  // Separate the fetch function to make it reusable
  const fetchTokenBalance = useCallback(async () => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) {
      console.log("Fetch already in progress, skipping");
      return;
    }
    
    try {
      isFetchingRef.current = true;
      setLoading(true);
      console.log("Starting token balance fetch...");
      
      const signer = provider?.getSigner();
      if (!signer) {
        console.error("No signer available");
        setError("Wallet not connected");
        return;
      }
      
      const address = await signer.getAddress();
      console.log("Fetching balance for address:", address);
      
      // Check if function exists
      if (!getTokenBalance) {
        console.error("getTokenBalance function not available in contract interface");
        setError("Contract methods not available");
        return;
      }
      
      // Try 3 times with delay
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          console.log(`Attempt ${attempt + 1} to fetch token balance`);
          const balance = await getTokenBalance(address);
          console.log("Raw balance response:", balance);
          const formattedBalance = ethers.utils.formatEther(balance);
          console.log("Formatted token balance:", formattedBalance);
          setTokenBalance(formattedBalance);
          setError(null);
          break;
        } catch (err) {
          console.error(`Attempt ${attempt + 1} failed:`, err);
          if (attempt === 2) throw err; // Throw on last attempt
          await new Promise(r => setTimeout(r, 2000)); // Wait 2s before retry
        }
      }
      
      if (getExchangeRate) {
        const rate = await getExchangeRate();
        setExchangeRate(rate.toNumber());
      }
      
      // Mark initial fetch as complete
      setInitialFetchDone(true);
    } catch (error) {
      console.error("Error fetching token balance:", error);
      setError("Failed to load token balance");
    } finally {
      console.log("Finished fetch operation, setting loading to false");
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [provider, getTokenBalance, getExchangeRate]);
  
  // Only fetch data when contract is ready and initial fetch hasn't been done
  useEffect(() => {
    // Don't attempt to fetch if contract isn't ready
    if (!provider || !contractReady) {
      return;
    }
    
    // Only do the fetch if we haven't done it yet
    if (!initialFetchDone) {
      fetchTokenBalance();
    }
    
    // No interval - we'll use manual refresh instead to avoid loops
  }, [provider, contractReady, initialFetchDone, fetchTokenBalance]);
  
  // Calculate ETH equivalent based on token amount
  useEffect(() => {
    if (!exchangeAmount || isNaN(parseFloat(exchangeAmount))) {
      setEthEquivalent('0');
      return;
    }
    
    const tokens = parseFloat(exchangeAmount);
    const ethValue = tokens / exchangeRate;
    setEthEquivalent(ethValue.toFixed(6));
  }, [exchangeAmount, exchangeRate]);
  
  const handleExchange = async () => {
    if (!exchangeAmount || parseFloat(exchangeAmount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    
    if (parseFloat(exchangeAmount) > parseFloat(tokenBalance)) {
      setError("Insufficient token balance");
      return;
    }
    
    setIsExchanging(true);
    setError(null);
    setSuccess(null);
    
    try {
      if (!exchangeTokensForETH || !contract) {
        throw new Error("Exchange function not available");
      }
      
       // 1. Raw value for viability check (no wei conversion)
      const tokenAmountRaw = ethers.BigNumber.from(exchangeAmount);
      // 2. Wei value for actual exchange
      const tokenAmountWei = ethers.utils.parseUnits(exchangeAmount, 18);

      try {
        console.log("Running exchange viability check...");
        const debug = await contract.checkExchangeViability(tokenAmountRaw);
        
        console.log("Exchange viability check:", {
          tokenAmount: exchangeAmount,
          ethRequired: ethers.utils.formatEther(debug.ethRequired),
          contractBalance: ethers.utils.formatEther(debug.contractBalance),
          hasEnoughBalance: debug.hasEnoughBalance,
          userBalance: ethers.utils.formatEther(debug.userBalance),
          hasEnoughTokens: debug.hasEnoughTokens
        });
        
        if (!debug.hasEnoughBalance) {
          setError(`Contract has insufficient ETH (${ethers.utils.formatEther(debug.contractBalance)} ETH available, ${ethers.utils.formatEther(debug.ethRequired)} ETH required)`);
          setIsExchanging(false);
          return;
        }
        
        if (!debug.hasEnoughTokens) {
          setError(`You don't have enough tokens (${ethers.utils.formatEther(debug.userBalance)} tokens available, ${exchangeAmount} required)`);
          setIsExchanging(false);
          return;
        }
      } catch (debugError) {
        console.error("Debug check failed:", debugError);
      }
      console.log(tokenAmountRaw)
      // Use THE SAME tokenAmountBN for the exchange
      const result = await exchangeTokensForETH(tokenAmountWei);
      
      if (result.success) {
        setSuccess(`Successfully exchanged ${exchangeAmount} tokens for ${ethEquivalent} ETH`);
        setExchangeAmount('');
        fetchTokenBalance();
      } else {
        setError(result.error || "Exchange failed");
      }
    } catch (error: any) {
      console.error("Error exchanging tokens:", error);
      setError(error.message || "Failed to exchange tokens");
    } finally {
      setIsExchanging(false);
    }
  };
  useEffect(() => {
    if (!provider || !contractReady) return;
    
    const checkContractBalance = async () => {
      try {
        const balance = await provider.getBalance('0x199DC781713af233ffCA296B9c71532b8b74DEC2');
        console.log("Contract ETH balance:", ethers.utils.formatEther(balance));
      } catch (error) {
        console.error("Error checking balance:", error);
      }
    };
    
    checkContractBalance();
  }, [provider, contractReady]);
  
  return (
    <div className="driver-tokens">
      <h2>Your Reward Tokens</h2>
      
      {!contractReady ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Connecting to token contract...</p>
        </div>
      ) : (
        <>
          <div className="token-card">
            <div className="token-balance">
              <span className="token-label">Available Balance</span>
              <span className="token-value">{loading ? 'Loading...' : `${tokenBalance} CPT`}</span>
              
              {/* Add manual refresh button */}
              <button 
                className="refresh-btn" 
                onClick={() => fetchTokenBalance()}
                disabled={loading || isFetchingRef.current}
              >
                {loading ? '⏳ Refreshing...' : '🔄 Refresh Balance'}
              </button>
            </div>
            
            <div className="token-info">
              <p>
                <strong> How it works:</strong> You earn tokens for every completed ride. 
                These tokens can be exchanged for ETH.
              </p>
              <p>Exchange Rate: <strong>1 ETH = {exchangeRate} CPT</strong></p>
            </div>
          </div>
          
          <div className="exchange-card">
            <h3>Exchange Tokens for ETH</h3>
            
            <div className="exchange-form">
              <div className="input-group">
                <label>Amount to Exchange (CPT)</label>
                <input 
                  type="number" 
                  min="0"
                  step="1"
                  value={exchangeAmount} 
                  onChange={(e) => setExchangeAmount(e.target.value)}
                  placeholder="Enter token amount"
                />
              </div>
              
              <div className="eth-equivalent">
                <span>You will receive:</span>
                <strong>{ethEquivalent} ETH</strong>
              </div>
              
              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}
              
              <button 
                className="exchange-btn" 
                onClick={handleExchange}
                disabled={isExchanging || loading || !exchangeAmount || parseFloat(exchangeAmount) <= 0}
              >
                {isExchanging ? 'Processing...' : 'Exchange Tokens'}
              </button>
            </div>
          </div>
          
          <div className="token-history">
            <h3>Token Activity</h3>
            <div className="history-item">
              <div className="history-details">
                <span className="history-type earn">Earned</span>
                <span className="history-date">For completing rides</span>
              </div>
              <span className="history-amount">+10 CPT per ride</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};