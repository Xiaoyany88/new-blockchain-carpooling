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

    // Add system-wide events
    event RideCompleted(uint256 rideId, address driver, address passenger);
    event RewardTokensIssued(address user, uint256 amount);

    // Function to issue reward tokens after successful rides
    function issueRewardTokens(address _user) internal {
        uint256 rewardAmount = 10 * 10**18; // 10 tokens
        carpoolToken.mint(_user, rewardAmount);
        emit RewardTokensIssued(_user, rewardAmount);
    }
}
