import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './Header.css';

export const Header = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [userAddress, setUserAddress] = useState('');
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setIsConnected(true);
          setUserAddress(accounts[0]);
          
          // Check network (Sepolia = 11155111)
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          setIsCorrectNetwork(chainId === '0xaa36a7'); // Sepolia chain ID in hex
        }
      }
    };
    
    checkConnection();
    
    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', checkConnection);
      window.ethereum.on('chainChanged', () => window.location.reload());
    }
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', checkConnection);
      }
    };
  }, []);

  const connectWallet = async () => {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setIsConnected(true);
      setUserAddress(accounts[0]);
    } catch (error) {
      console.error("User denied wallet connection", error);
    }
  };
  
  const switchToSepolia = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }], // Sepolia chain ID
      });
    } catch (error) {
      console.error("Failed to switch network", error);
    }
  };

  return (
    <header className="app-header">
      <div className="container">
        <Link to="/" className="logo">
          Skibidi Ride
        </Link>
        
        <nav>
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/driver" className="nav-link">Drive</Link>
          <Link to="/rider" className="nav-link">Ride</Link>
        </nav>
        
        <div className="wallet-section">
          {!isConnected ? (
            <button className="connect-btn" onClick={connectWallet}>
              Connect Wallet
            </button>
          ) : !isCorrectNetwork ? (
            <button className="network-btn" onClick={switchToSepolia}>
              Switch to Sepolia
            </button>
          ) : (
            <div className="address-display">
              {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;