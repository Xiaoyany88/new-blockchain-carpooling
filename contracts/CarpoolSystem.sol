// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./RideOffer.sol";
import "./ReputationSystem.sol";
import "./PaymentEscrow.sol";
import "./CarpoolToken.sol";

contract CarpoolSystem {
    // Define the Booking struct to match the one in RideOffer
    struct Booking {
        address passenger;
        uint256 rideId;
        uint256 seats;
        bool paid;
        bool completed;
    }
    RideOffer public rideOffer;
    ReputationSystem public reputationSystem;
    PaymentEscrow public paymentEscrow;
    CarpoolToken public carpoolToken;

    // Owner for admin functions
    address public owner;

    // System-wide events
    event RideCompleted(uint256 indexed rideId, address indexed driver, address indexed passenger);
    event RideBooked(uint256 indexed rideId, address indexed passenger, uint256 seats);
    event DriverRated(uint256 indexed rideId, address indexed driver, uint8 rating);
    event RewardTokensIssued(address indexed user, uint256 amount);
    event BookingCancelled(uint256 indexed rideId, address indexed passenger, uint256 seats, bool refunded);

    constructor(
        address _rideOffer,
        address _reputationSystem,
        address _paymentEscrow,
        address _carpoolToken
    ) {
        owner = msg.sender;
        rideOffer = RideOffer(_rideOffer);
        reputationSystem = ReputationSystem(_reputationSystem);
        paymentEscrow = PaymentEscrow(_paymentEscrow);
        carpoolToken = CarpoolToken(_carpoolToken);
    }
    
    // Function to update RideOffer address (for circular dependency)
    function updateRideOfferAddress(address _newRideOffer) external {
        require(msg.sender == owner, "Only owner can update");
        rideOffer = RideOffer(_newRideOffer);
    }

    /**
     * @notice Book a ride and handle payment in one transaction
     * @param _rideId The ID of the ride to book
     * @param _seats Number of seats to book
     */
    function bookRide(uint256 _rideId, uint256 _seats) external payable {
        // Get price from ride
        (,,,,,uint256 pricePerSeat,,,bool isActive) = rideOffer.getRide(_rideId);
        require(isActive, "Ride is not active");
        require(msg.value == pricePerSeat * _seats, "Incorrect payment amount");
        
        // Handle payment through escrow
        paymentEscrow.escrowPayment{value: msg.value}(_rideId, _seats, msg.sender);
        
        // Call the special function that skips payment check
        rideOffer.bookRideFromSystem(_rideId, _seats, msg.sender);
        
        emit RideBooked(_rideId, msg.sender, _seats);
    }

    /**
     * @notice Complete ride, update reputation, release payment
     * @param _rideId The ID of the ride to complete
     * @param _passenger The address of the passenger to complete for
     */
    function completeRide(uint256 _rideId, address _passenger) external {
        // Get driver from ride
        (address driver,,,,,,,, bool isActive) = rideOffer.getRide(_rideId);
        require(msg.sender == driver, "Only driver can complete ride");
        require(isActive, "Ride is not active");
        
        // Complete the ride in RideOffer
        rideOffer.completeRideFromSystem(_rideId, msg.sender, _passenger);
        
        // Update driver reputation
        reputationSystem.recordRideCompletion(driver);
        
        // Release payment for this passenger
        paymentEscrow.releasePayment(_rideId, payable(driver), _passenger);
        
        // Issue token rewards
        issueRewardTokens(driver);
        
        emit RideCompleted(_rideId, driver, _passenger);
    }
    
    /**
    * @notice Cancel a booking and handle refund or payment to driver based on timing
    * @param _rideId The ID of the ride to cancel
    * @param _isWithin24Hours Whether cancellation is within 24h of departure
    */
    function cancelBooking(uint256 _rideId, bool _isWithin24Hours) external {
        // Get the booking details from RideOffer
        address passenger = msg.sender;
        
        // Verify the booking exists and belongs to the caller
        bool bookingExists = rideOffer.bookingExists(_rideId, passenger);
        require(bookingExists, "No valid booking found");
        
        // Get ride details to check timing
        (address driver,,,uint256 departureTime,,,,, bool isActive) = rideOffer.getRide(_rideId);
        require(isActive, "Ride is not active");
        require(departureTime > block.timestamp, "Ride already departed");
        
        // Get the seats count for this booking
        uint256 seats = rideOffer.getBookingSeats(_rideId, passenger);
        require(seats > 0, "No seats booked for this ride");
        
        // If cancellation is within 24 hours, payment goes to driver
        // If more than 24 hours before, refund passenger
        if (_isWithin24Hours) {
            // Transfer payment to driver using releasePayment
            paymentEscrow.releasePayment(_rideId, payable(driver), passenger);
            // Cancel the booking in RideOffer (NOT refunded)
            rideOffer.cancelBookingFromSystem(_rideId, passenger, seats, false);
        } else {
            // Refund payment to passenger
            paymentEscrow.refundPayment(_rideId, passenger);
            // Cancel the booking in RideOffer (refunded)
            rideOffer.cancelBookingFromSystem(_rideId, passenger, seats, true);
        }
        
        emit BookingCancelled(_rideId, passenger, seats, !_isWithin24Hours);
    }
    /**
     * @notice Rate a driver after ride completion
     * @param _rideId The ID of the completed ride
     * @param _driver The driver's address
     * @param _rating Rating from 1-5 stars
     */
    function rateDriver(uint256 _rideId, address _driver, uint8 _rating) external {
        reputationSystem.rateDriver(_driver, _rating, _rideId);
        emit DriverRated(_rideId, _driver, _rating);
    }

    /**
     * @notice Get driver's reputation information
     * @param _driver The driver's address
     * @return avgRating Average rating (1-5)
     * @return totalRides Total completed rides
     */
    //@return cancelledRides Number of cancelled rides
    function getDriverInfo(address _driver) external view returns (
        uint256 avgRating,
        uint256 totalRides
        /*uint256 cancelledRides*/
    ) {
        return reputationSystem.getDriverStats(_driver);
    }

    /**
     * @notice Issue reward tokens to a user
     * @param _user The address of the user to reward
     */
    function issueRewardTokens(address _user) internal {
        uint256 rewardAmount = 10 * 10**18; // 10 tokens
        carpoolToken.rewardFromSystem(_user);
        emit RewardTokensIssued(_user, rewardAmount);
    }

    // Add this after issueRewardTokens function
    /**
    * @notice Exchange tokens for ETH
    * @param _tokenAmount The amount of tokens to exchange
    */
    function exchangeTokensForETH(uint256 _tokenAmount) external {
        require(_tokenAmount > 0, "Amount must be greater than 0");
        
        // Check if the user has enough tokens
        uint256 userBalance = carpoolToken.balanceOf(msg.sender);
        require(userBalance >= _tokenAmount, "Insufficient token balance");
        
        // Calculate ETH amount (1 token = 0.0001 ETH)
        uint256 ethAmount = (_tokenAmount * 1 ether) /(10000 * 10**18);
        
        // Check if contract has enough ETH
        require(address(this).balance >= ethAmount, "Insufficient ETH in contract");
        
        // Transfer tokens from user to contract
        bool success = carpoolToken.transferFrom(msg.sender, address(this), _tokenAmount);
        require(success, "Token transfer failed");
        
        // Transfer ETH to user
        (bool sent, ) = msg.sender.call{value: ethAmount}("");
        require(sent, "ETH transfer failed");
        
        emit TokensExchanged(msg.sender, _tokenAmount, ethAmount);
    }

    // Add a receive function to allow the contract to receive ETH
    receive() external payable {}

    // Add this event to the events section at the top
    event TokensExchanged(address indexed user, uint256 tokenAmount, uint256 ethAmount);
    
    /**
    * @notice Get user's token balance
    * @param _user The address of the user
    * @return balance The user's token balance
    */
    function getTokenBalance(address _user) external view returns (uint256 balance) {
        return carpoolToken.balanceOf(_user);
    }

    /**
    * @notice Get exchange rate for tokens to ETH
    * @return rate The exchange rate (tokens per ETH)
    */
    function getExchangeRate() external pure returns (uint256 rate) {
        return 10000; // 10000 tokens for 1 ETH
    }

    function checkExchangeViability(uint256 _tokenAmount) external view returns (
        uint256 ethRequired,
        uint256 contractBalance,
        bool hasEnoughBalance,
        uint256 userBalance,
        bool hasEnoughTokens
    ) {
        ethRequired = (_tokenAmount * 1 ether) / 10000;
        contractBalance = address(this).balance;
        hasEnoughBalance = contractBalance >= ethRequired;
        userBalance = carpoolToken.balanceOf(msg.sender);
        hasEnoughTokens = userBalance >= _tokenAmount;
        
        return (ethRequired, contractBalance, hasEnoughBalance, userBalance, hasEnoughTokens);
    }
}