import React, { useState, useEffect } from "react";
import useProvider from "../hooks/useProvider";

const ConnectWallet: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const provider = useProvider();

  useEffect(() => {
    // Check if already connected
    if (provider) {
      const checkConnection = async () => {
        try {
          const accounts = await provider.listAccounts();
          if (accounts && accounts.length > 0) {
            setAddress(accounts[0]);
            setIsConnected(true);
          }
        } catch (err) {
          console.error("Failed to check connection:", err);
        }
      };
      
      checkConnection();
    }
  }, [provider]);

  const connect = async () => {
    if (provider) {
      try {
        // Request account access
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        setAddress(address);
        setIsConnected(true);
      } catch (err) {
        console.error("Failed to connect:", err);
      }
    }
  };

  const disconnect = () => {
    setAddress(null);
    setIsConnected(false);
  };

  return (
    <div>
      {!isConnected ? (
        <button onClick={connect}>Connect Wallet</button>
      ) : (
        <div>
          <p>Connected: {address}</p>
          <button onClick={disconnect}>Disconnect</button>
        </div>
      )}
    </div>
  );
};

export default ConnectWallet;
