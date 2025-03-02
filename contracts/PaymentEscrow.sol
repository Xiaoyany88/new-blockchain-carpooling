// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

contract PaymentEscrow {
    struct Payment {
        uint256 rideId;
        address payable passenger;
        uint256 amount;
        uint256 seats;
        bool released;
        bool refunded;
    }

    mapping(uint256 => mapping(address => Payment)) public payments;
    
    event PaymentEscrowed(uint256 rideId, address passenger, uint256 amount, uint256 seats);
    event PaymentReleased(uint256 rideId, address passenger, address driver, uint256 amount);
    event PaymentRefunded(uint256 rideId, address passenger, uint256 amount);

    function escrowPayment(uint256 _rideId, uint256 _seats) external payable {
        require(msg.value > 0, "Payment required");
        payments[_rideId][msg.sender] = Payment({
            rideId: _rideId,
            passenger: payable(msg.sender),
            amount: msg.value,
            seats: _seats,
            released: false,
            refunded: false
        });
        emit PaymentEscrowed(_rideId, msg.sender, msg.value, _seats);
    }

    function releasePayment(uint256 _rideId, address payable _driver, address _passenger) external {
        Payment storage payment = payments[_rideId][_passenger];
        require(!payment.released && !payment.refunded, "Payment already processed");
        require(payment.amount > 0, "No payment to release");
        
        payment.released = true;
        _driver.transfer(payment.amount);
        emit PaymentReleased(_rideId, _passenger, _driver, payment.amount);
    }

    function refundPayment(uint256 _rideId, address _passenger) external {
        Payment storage payment = payments[_rideId][_passenger];
        require(!payment.released && !payment.refunded, "Payment already processed");
        require(payment.amount > 0, "No payment to refund");
        
        payment.refunded = true;
        payment.passenger.transfer(payment.amount);
        emit PaymentRefunded(_rideId, _passenger, payment.amount);
    }
}
