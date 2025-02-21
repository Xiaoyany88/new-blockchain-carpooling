// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

contract ReputationSystem {
    // Structure to keep track of a user's reputation
    struct Reputation {
        uint256 totalRating;
        uint256 ratingCount;
    }

    mapping(address => Reputation) public reputations;

    // Event to log rating submissions
    event Rated(address indexed user, uint8 rating, uint256 newTotalRating, uint256 newRatingCount);

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
}
