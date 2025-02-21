// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

contract PaymentEscrow {
    // Structure to store ride information
    struct Ride {
        uint256 rideId;
        address payable passenger;
        address payable driver;
        uint256 amount;
        bool completed;
        bool refunded;
    }

    uint256 public rideCounter;
    mapping(uint256 => Ride) public rides;

    // Events to log important actions
    event RideCreated(uint256 rideId, address indexed passenger, address indexed driver, uint256 amount);
    event RideCompleted(uint256 rideId);
    event RideRefunded(uint256 rideId);

    /**
     * @notice Passenger creates a ride by depositing funds that are held in escrow.
     * @param _driver The address of the driver offering the ride.
     * @return rideId The unique identifier for the created ride.
     */
    function createRide(address payable _driver) external payable returns (uint256 rideId) {
        require(msg.value > 0, "Must deposit funds for the ride");
        rideCounter++;
        rides[rideCounter] = Ride({
            rideId: rideCounter,
            passenger: payable(msg.sender),
            driver: _driver,
            amount: msg.value,
            completed: false,
            refunded: false
        });
        emit RideCreated(rideCounter, msg.sender, _driver, msg.value);
        return rideCounter;
    }

    /**
     * @notice Confirms ride completion and releases escrowed funds to the driver.
     * @param _rideId The ride identifier.
     *
     * Requirements:
     * - Only the passenger who created the ride can confirm its completion.
     */
    function confirmRide(uint256 _rideId) external {
        Ride storage ride = rides[_rideId];
        require(ride.passenger != address(0), "Ride does not exist");
        require(!ride.completed, "Ride already completed");
        require(!ride.refunded, "Ride already refunded");
        require(msg.sender == ride.passenger, "Only the passenger can confirm completion");

        ride.completed = true;
        // Transfer the funds to the driver
        ride.driver.transfer(ride.amount);
        emit RideCompleted(_rideId);
    }

    /**
     * @notice Refunds the escrowed funds to the passenger in case of cancellation.
     * @param _rideId The ride identifier.
     *
     * Requirements:
     * - Only the passenger can request a refund.
     * - The ride must not already be completed or refunded.
     */
    function refundRide(uint256 _rideId) external {
        Ride storage ride = rides[_rideId];
        require(ride.passenger != address(0), "Ride does not exist");
        require(!ride.completed, "Ride already completed, cannot refund");
        require(!ride.refunded, "Ride already refunded");
        require(msg.sender == ride.passenger, "Only the passenger can request a refund");

        ride.refunded = true;
        ride.passenger.transfer(ride.amount);
        emit RideRefunded(_rideId);
    }
}
