import { useEffect, useState } from "react";
import { Web3Provider } from "@ethersproject/providers";

const useProvider = () => {
  const [provider, setProvider] = useState<Web3Provider | null>(null);

  useEffect(() => {
    if (window.ethereum) {
      const newProvider = new Web3Provider(window.ethereum);
      setProvider(newProvider);
    } else {
      console.error("Ethereum provider is not available. Install MetaMask.");
    }
  }, []);

  return provider;
};

export default useProvider;
