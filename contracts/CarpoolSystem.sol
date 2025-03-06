// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./RideOffer.sol";
import "./ReputationSystem.sol";
import "./PaymentEscrow.sol";
import "./CarpoolToken.sol";

contract CarpoolSystem {
    RideOffer public rideOffer;
    ReputationSystem public reputationSystem;
    PaymentEscrow public paymentEscrow;
    CarpoolToken public carpoolToken;

    // System-wide events
    event RideCompleted(uint256 indexed rideId, address indexed driver, address indexed passenger);
    event RideBooked(uint256 indexed rideId, address indexed passenger, uint256 seats);
    event DriverRated(uint256 indexed rideId, address indexed driver, uint8 rating);
    event RewardTokensIssued(address indexed user, uint256 amount);

    constructor(
        address _rideOffer,
        address _reputationSystem,
        address _paymentEscrow,
        address _carpoolToken
    ) {
        rideOffer = RideOffer(_rideOffer);
        reputationSystem = ReputationSystem(_reputationSystem);
        paymentEscrow = PaymentEscrow(_paymentEscrow);
        carpoolToken = CarpoolToken(_carpoolToken);
    }

    /**
     * @notice Book a ride and handle payment in one transaction
     * @param _rideId The ID of the ride to book
     * @param _seats Number of seats to book
     */
    function bookRide(uint256 _rideId, uint256 _seats) external payable {
        // Get price from ride
        (,,,,,uint256 pricePerSeat,,,) = rideOffer.rides(_rideId);
        require(msg.value == pricePerSeat * _seats, "Incorrect payment amount");
        
        // Handle payment through escrow
        paymentEscrow.escrowPayment{value: msg.value}(_rideId, _seats);
        
        // Book the ride without sending value again
        rideOffer.bookRide{value: 0}(_rideId, _seats);
        
        emit RideBooked(_rideId, msg.sender, _seats);
    }

    /**
     * @notice Complete ride, update reputation, release payment
     * @param _rideId The ID of the ride to complete
     * @param _passenger The address of the passenger to complete for
     */
    function completeRide(uint256 _rideId, address _passenger) external {
        // Get driver from ride
        (address driver,,,,,,,, bool isActive) = rideOffer.rides(_rideId);
        require(msg.sender == driver, "Only driver can complete ride");
        require(isActive, "Ride is not active");
        
        // Complete the ride in RideOffer
        rideOffer.completeRide(_rideId);
        
        // Update driver reputation
        reputationSystem.recordRideCompletion(driver);
        
        // Release payment for this passenger
        paymentEscrow.releasePayment(_rideId, payable(driver), _passenger);
        
        // Issue token rewards
        issueRewardTokens(driver);
        
        emit RideCompleted(_rideId, driver, _passenger);
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
     * @return cancelledRides Number of cancelled rides
     */
    function getDriverInfo(address _driver) external view returns (
        uint256 avgRating,
        uint256 totalRides,
        uint256 cancelledRides
    ) {
        return reputationSystem.getDriverStats(_driver);
    }

    /**
     * @notice Issue reward tokens to a user
     * @param _user The address of the user to reward
     */
    function issueRewardTokens(address _user) internal {
        uint256 rewardAmount = 10 * 10**18; // 10 tokens
        carpoolToken.mint(_user, rewardAmount);
        emit RewardTokensIssued(_user, rewardAmount);
    }
}