// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

contract ReputationSystem {
    // Structure to keep track of a user's reputation
    struct Reputation {
        uint256 totalRating;   // Sum of all ratings received
        uint256 ratingCount;   // Number of ratings received
    }

    struct DriverReputation {
        uint256 totalRating;   // Sum of all ratings received
        uint256 ratingCount;   // Number of ratings received
        uint256 completedRides;  // Count of successfully completed rides
        uint256 cancelledRides;  // Count of rides the driver cancelled
    }

    mapping(address => Reputation) public reputations;  // General user reputation
    mapping(address => DriverReputation) public driverReputations;  // Driver-specific reputation
    mapping(uint256 => mapping(address => bool)) public hasRated;  // Tracks if user rated a specific ride

    // Event to log rating submissions
    event Rated(address indexed user, uint8 rating, uint256 newTotalRating, uint256 newRatingCount);
    event DriverRated(address indexed driver, uint8 rating, uint256 rideId);
    event RideCompleted(address indexed driver);
    event RideCancelled(address indexed driver);

    /**
     * @notice Allows any participant to rate a user.
     * @param _user The address of the user being rated.
     * @param _rating The rating given (must be between 1 and 5).
     */
    function rateUser(address _user, uint8 _rating) external {
        require(_rating >= 1 && _rating <= 5, "Rating must be between 1 and 5");
        Reputation storage rep = reputations[_user];
        rep.totalRating += _rating;
        rep.ratingCount++;
        emit Rated(_user, _rating, rep.totalRating, rep.ratingCount);
    }

    function rateDriver(address _driver, uint8 _rating, uint256 _rideId) external {
        require(_rating >= 1 && _rating <= 5, "Rating must be between 1 and 5");
        require(!hasRated[_rideId][msg.sender], "Already rated this ride");
        
        DriverReputation storage rep = driverReputations[_driver];
        rep.totalRating += _rating;
        rep.ratingCount++;
        hasRated[_rideId][msg.sender] = true;
        
        emit DriverRated(_driver, _rating, _rideId);
    }

    function recordRideCompletion(address _driver) external {
        DriverReputation storage rep = driverReputations[_driver];
        rep.completedRides++;
        emit RideCompleted(_driver);
    }

    function recordRideCancellation(address _driver) external {
        DriverReputation storage rep = driverReputations[_driver];
        rep.cancelledRides++;
        emit RideCancelled(_driver);
    }

    /**
     * @notice Retrieves the average rating for a user.
     * @param _user The address of the user.
     * @return The average rating (0 if no ratings yet).
     */
    function getAverageRating(address _user) external view returns (uint256) {
        Reputation storage rep = reputations[_user];
        if (rep.ratingCount == 0) {
            return 0;
        }
        return rep.totalRating / rep.ratingCount;
    }

    function getDriverStats(address _driver) external view returns (
        uint256 avgRating,
        uint256 totalRides,
        uint256 cancelledRides
    ) {
        DriverReputation storage rep = driverReputations[_driver];
        avgRating = rep.ratingCount > 0 ? rep.totalRating / rep.ratingCount : 0;
        totalRides = rep.completedRides;
        cancelledRides = rep.cancelledRides;
    }
}
