// src/components/common/WalletConnector.tsx
import { useState, useEffect } from 'react';
import  useProvider  from '../../hooks/useProvider';

export const WalletConnector = () => {
  const provider = useProvider();
  const [account, setAccount] = useState<string | null>(null);
  
  useEffect(() => {
    const getAccount = async () => {
      if (provider) {
        const accounts = await provider.listAccounts();
        setAccount(accounts[0] || null);
      }
    };
    getAccount();
  }, [provider]);
  
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        // Refresh page to update provider
        window.location.reload();
      } catch (error) {
        console.error("Failed to connect wallet:", error);
      }
    }
  };
  
  return (
    <div className="wallet-connector">
      {account ? (
        <div className="wallet-connected">
          <span>Connected: {account.substring(0, 6)}...{account.substring(38)}</span>
        </div>
      ) : (
        <button onClick={connectWallet}>Connect Wallet</button>
      )}
    </div>
  );
};