# CryptoRide – Decentralized Carpooling Proof of Concept

CryptoRide is a proof-of-concept (**PoC**) decentralized application (**dApp**) that aims to modernize the carpooling experience by leveraging **Ethereum** smart contracts and a **React + TypeScript** frontend. By integrating blockchain-based automations—such as secure payment handling, reputation tracking, and token rewards—CryptoRide highlights how decentralized technology can bring greater trust, transparency, and efficiency to ride-sharing.

---

## Table of Contents

1. [Features](#features)  
2. [Tech Stack](#tech-stack)  
3. [Architecture Overview](#architecture-overview)  
4. [Prerequisites](#prerequisites)  


---

## Features

- **Ride Creation and Management**  
  Drivers can create ride offers with details such as pickup location, destination, departure time, and price-per-seat. They can view and manage active or completed rides.

- **Secure Payment Escrow**  
  Booking fees are placed into an on-chain escrow smart contract. Drivers receive payment only upon ride completion, or the funds are refunded to riders if the ride is canceled within the allowed timeframe.

- **Reputation System**  
  Riders can rate drivers after the ride. Ratings are stored on-chain, contributing to a driver’s reputation score and fostering trust in the community.

- **Tokenized Reward System**  
  Drivers earn platform tokens (Carpool Tokens, or **CPT**) upon ride completion. These can be exchanged for ETH within the app.

- **In-App Messaging**  
  A **Firebase Firestore**-backed messaging system allows drivers and riders to communicate in real time without incurring additional blockchain transaction fees.

- **MetaMask Integration**  
  Users connect their Ethereum wallets via MetaMask for authentication, transaction signing, and seamless dApp interaction.

---

## Tech Stack

| Layer                   | Technology               |
|-------------------------|--------------------------|
| **Frontend**            | React, TypeScript, ethers.js |
| **Backend (Smart Contracts)** | Solidity, Hardhat, OpenZeppelin |
| **Blockchain Network**  | Ethereum (tested on Sepolia testnet) |
| **Database**            | Firebase Firestore (for messaging) |
| **Authentication**      | MetaMask (wallet-based) |

---

## Architecture Overview
- **Frontend**: Uses React and TypeScript for a modular, maintainable UI.  
- **Smart Contracts**: Split into multiple contracts to handle rides, payment escrow, reputation, and token rewards.  
- **Hardhat**: Manages contract compilation, deployment, and testing.  
- **Firestore**: Stores real-time messages to keep chat functionality off-chain.  
- **MetaMask**: Wallet for user authentication and signing Ethereum transactions.

---

## Prerequisites

- **Node.js** (v14+) and **npm** (v6+) or **Yarn**  
- **MetaMask** browser extension  
- **Hardhat** (installed locally within the repo via npm or yarn)  
- **An Ethereum-compatible wallet** with test ETH (for the Sepolia testnet if deploying or testing on a public network)  
- **Firebase** account (for Firestore-based messaging)
