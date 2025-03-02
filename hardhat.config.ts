import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ethers";
import "@typechain/hardhat";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",  // Updated version to match OpenZeppelin
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "paris", // Add specific EVM version
    },
  },
  typechain: {
    outDir: "typechain-types",  // or your preferred directory
    target: "ethers-v6",       // ensures v6-compatible typings
  },
  networks: {
    // The built-in Hardhat network
    hardhat: {},
    
    // Sepolia test network configuration
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    
    // Polygon amoy test network configuration
    polygonAmoy: {
      url: process.env.AMOY_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY || ""
    },
  },
  // Optionally, configure paths or additional settings here
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  // You can add other configurations like Mocha settings if needed:
  mocha: {
    timeout: 20000, // 20 seconds
  },
};

export default config;
