// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract RideOffer {
    struct Ride {
        address driver;
        string pickup;
        string destination;
        uint256 departureTime;
        uint256 maxPassengers;
        uint256 pricePerSeat;
        uint256 availableSeats;
        string additionalNotes;
        bool isActive;
    }

    struct Booking {
        address passenger;
        uint256 rideId;
        uint256 seats;
        bool paid;
        bool completed;
        bool cancelled;
        bool paidToDriver;
    }

    // Rating system structure
    struct Rating {
        address user;
        uint256 rideId;
        uint256 score; // 1-5 rating
        bool exists;
    }

    // links a unique identifier to a Ride struct
    mapping(uint256 => Ride) public rides;
    // link a unique identifier to a list of Booking structs
    mapping(uint256 => Booking[]) public bookings;
    
    // New mappings for user functionality
    mapping(address => uint256[]) private userBookings; // Maps users to their booked rides
    mapping(address => mapping(uint256 => Rating)) private ratings; // Maps user -> rideId -> rating
    
    uint256 public rideCounter;
    address public carpoolSystem;
    constructor(address _carpoolSystem){
        carpoolSystem = _carpoolSystem;
    }

    event RideCreated(uint256 indexed rideId, address indexed driver);
    event RideBooked(uint256 indexed rideId, address indexed passenger, uint256 seats);
    event RideCancelled(uint256 indexed rideId);
    event RideCompleted(uint256 indexed rideId);
    event RideCompletedForPassenger(uint256 indexed rideId, address indexed driver, address indexed passenger);
    event DriverRated(uint256 indexed rideId, address indexed driver, address indexed passenger, uint256 rating);
    // Add this event at the top with other events
    event BookingCancelled(uint256 indexed rideId, address indexed passenger, uint256 seats, bool refunded);
    function createRide(
        string memory _pickup,
        string memory _destination,
        uint256 _departureTime,
        uint256 _maxPassengers,
        uint256 _pricePerSeat,
        string memory _additionalNotes
    ) external returns (uint256) {
        require(_departureTime > block.timestamp, "Departure time must be in the future");
        require(_maxPassengers > 0, "Must accept at least one passenger");

        uint256 rideId = rideCounter++;
        rides[rideId] = Ride({
            driver: msg.sender,
            pickup: _pickup,
            destination: _destination,
            departureTime: _departureTime,
            maxPassengers: _maxPassengers,
            pricePerSeat: _pricePerSeat,
            availableSeats: _maxPassengers,
            additionalNotes: _additionalNotes,
            isActive: true
        });

        emit RideCreated(rideId, msg.sender);
        return rideId;
    }

    function bookRide(uint256 _rideId, uint256 _seats) external payable {
        // First, validate all requirements
        Ride storage ride = rides[_rideId];
        require(ride.isActive, "Ride is not active");
        require(ride.departureTime > block.timestamp, "Ride has already departed");
        require(ride.availableSeats >= _seats, "Not enough seats available");
        require(msg.value == ride.pricePerSeat * _seats, "Incorrect payment amount");

        // Update seat availability
        ride.availableSeats -= _seats;
        
        // THIS is where the booking gets recorded in blockchain storage
        bookings[_rideId].push(Booking({
            passenger: msg.sender,  // User's wallet address
            rideId: _rideId,        // Which ride they booked
            seats: _seats,          // How many seats
            paid: true,             // Payment status
            completed: false,        // Completion status
            cancelled: false,
            paidToDriver: false
        }));
        
        // Add this booking to the user's list of bookings
        userBookings[msg.sender].push(_rideId);

        // THIS broadcasts the booking event to the blockchain
        emit RideBooked(_rideId, msg.sender, _seats);
    }

    function bookRideFromSystem(uint256 _rideId, uint256 _seats, address passenger) external {
        // Only allow CarpoolSystem to call this
        require(msg.sender == carpoolSystem, "Only CarpoolSystem can call");
        
        Ride storage ride = rides[_rideId];
        require(ride.isActive, "Ride is not active");
        require(ride.departureTime > block.timestamp, "Ride has already departed");
        require(ride.availableSeats >= _seats, "Not enough seats available");
        // No payment check needed - CarpoolSystem has already handled payment
        
    
        ride.availableSeats -= _seats;
        
       
        // Record the booking but use the passenger address provided by CarpoolSystem
        bookings[_rideId].push(Booking({
            passenger: passenger,  // Use passenger address from CarpoolSystem
            rideId: _rideId,
            seats: _seats,
            paid: true,
            completed: false,
            cancelled: false,
            paidToDriver: false
        }));
        
        // Add this booking to the user's list of bookings
        userBookings[passenger].push(_rideId);

        // THIS broadcasts the booking event to the blockchain
        emit RideBooked(_rideId, passenger, _seats);
    }

    function cancelRide(uint256 _rideId) external {
        Ride storage ride = rides[_rideId];
        require(msg.sender == ride.driver, "Only driver can cancel ride");
        require(ride.isActive, "Ride is not active");

        ride.isActive = false;
        
        // Refund all passengers
        for (uint i = 0; i < bookings[_rideId].length; i++) {
            Booking storage booking = bookings[_rideId][i];
            if (booking.paid && !booking.completed) {
                payable(booking.passenger).transfer(ride.pricePerSeat * booking.seats);
                booking.paid = false;
            }
        }

        emit RideCancelled(_rideId);
    }

    function completeRide(uint256 _rideId) external {
        Ride storage ride = rides[_rideId];
        require(msg.sender == ride.driver, "Only driver can complete ride");
        require(ride.isActive, "Ride is not active");
        require(ride.departureTime <= block.timestamp, "Ride hasn't started yet");

        ride.isActive = false;
        
        // Transfer payments to driver
        uint256 totalPayment = 0;
        for (uint i = 0; i < bookings[_rideId].length; i++) {
            Booking storage booking = bookings[_rideId][i];
            if (booking.paid && !booking.completed) {
                totalPayment += ride.pricePerSeat * booking.seats;
                booking.completed = true;
            }
        }

        if (totalPayment > 0) {
            payable(ride.driver).transfer(totalPayment);
        }

        emit RideCompleted(_rideId);
    }

    function completeRideFromSystem(uint256 _rideId, address _driver, address _passenger) external {
    // Only CarpoolSystem can call this function
        require(msg.sender == carpoolSystem, "Only CarpoolSystem can call");
        
        Ride storage ride = rides[_rideId];
        require(_driver == ride.driver, "Only driver can complete ride");
        require(ride.isActive, "Ride is not active");
        
        // Find and update the specific passenger's booking
        bool bookingFound = false;
        for (uint i = 0; i < bookings[_rideId].length; i++) {
            Booking storage booking = bookings[_rideId][i];
            if (booking.passenger == _passenger && booking.paid) {
                booking.completed = true;  // Mark this specific booking as completed
                bookingFound = true;
                break;
            }
        }
        
        require(bookingFound, "No valid booking found for passenger");
        
        // Only set ride as inactive if all paid bookings are completed
        bool allCompleted = true;
        for (uint i = 0; i < bookings[_rideId].length; i++) {
            if (bookings[_rideId][i].paid && !bookings[_rideId][i].completed) {
                allCompleted = false;
                break;
            }
        }
        
        if (allCompleted) {
            ride.isActive = false;
        }
        
        emit RideCompletedForPassenger(_rideId, _driver, _passenger);
    }

    function cancelBookingFromSystem(uint256 _rideId, address _passenger, uint256 _seats, bool _refunded) external {
        require(msg.sender == carpoolSystem, "Only CarpoolSystem can call");
        
        Ride storage ride = rides[_rideId];
        require(ride.isActive, "Ride is not active");
        
        // Find and update the booking
        bool bookingFound = false;
        
        for (uint i = 0; i < bookings[_rideId].length; i++) {
            Booking storage booking = bookings[_rideId][i];
            if (booking.passenger == _passenger) {
                // Mark the booking as cancelled
                booking.cancelled = true;
                
                // If not refunded, payment went to driver
                booking.paidToDriver = !_refunded;
                
                // Don't set paid to false if payment went to driver
                if (_refunded) {
                    booking.paid = false;
                }
                
                booking.completed = false;
                
                // Restore available seats
                ride.availableSeats += _seats;
                
                bookingFound = true;
                break;
            }
        }
        
        require(bookingFound, "No valid booking found for this passenger");
        
        emit BookingCancelled(_rideId, _passenger, _seats, _refunded);
    }
    // Check if a booking exists and is paid
    function bookingExists(uint256 _rideId, address _passenger) external view returns (bool) {
        for (uint i = 0; i < bookings[_rideId].length; i++) {
            if (bookings[_rideId][i].passenger == _passenger && bookings[_rideId][i].paid) {
                return true;
            }
        }
        return false;
    }

    // Get the number of seats for a specific booking
    function getBookingSeats(uint256 _rideId, address _passenger) external view returns (uint256) {
        for (uint i = 0; i < bookings[_rideId].length; i++) {
            if (bookings[_rideId][i].passenger == _passenger) {
                return bookings[_rideId][i].seats;
            }
        }
        return 0;
    }

    function getRide(uint256 _rideId) external view returns (
        address driver,
        string memory pickup,
        string memory destination,
        uint256 departureTime,
        uint256 maxPassengers,
        uint256 pricePerSeat,
        uint256 availableSeats,
        string memory additionalNotes,
        bool isActive
    ) {
        Ride storage ride = rides[_rideId];
        return (
            ride.driver,
            ride.pickup,
            ride.destination,
            ride.departureTime,
            ride.maxPassengers,
            ride.pricePerSeat,
            ride.availableSeats,
            ride.additionalNotes,
            ride.isActive
        );
    }

    function getAvailableRides() external view returns (uint256[] memory) {
        uint256[] memory availableRides = new uint256[](rideCounter);
        uint256 count = 0;
        
        for (uint256 i = 0; i < rideCounter; i++) {
            if (rides[i].isActive && rides[i].availableSeats > 0 && rides[i].departureTime > block.timestamp) {
                availableRides[count] = i;
                count++;
            }
        }

        // Resize array to actual count
        assembly {
            mstore(availableRides, count)
        }
        
        return availableRides;
    }
    
    // New function to get a user's booked rides
    function getUserBookings(address _user) external view returns (uint256[] memory) {
        return userBookings[_user];
    }
    // Function to get all bookings for a specific ride
    function getBookingsByRide(uint256 _rideId) external view returns (Booking[] memory) {
        return bookings[_rideId];
    }
    function getRideCount() external view returns (uint256) {
        return rideCounter; 
    }
    // Function to rate a driver after a ride
    function rateDriver(address _driver, uint256 _rideId, uint256 _rating) external {
        require(_rating >= 1 && _rating <= 5, "Rating must be between 1 and 5");
        
        // Check if this is a valid ride that the user booked
        bool isValidBooking = false;
        for (uint i = 0; i < bookings[_rideId].length; i++) {
            if (bookings[_rideId][i].passenger == msg.sender) {
                isValidBooking = true;
                break;
            }
        }
        
        require(isValidBooking, "You did not book this ride");
        require(rides[_rideId].driver == _driver, "Driver does not match ride");
        require(!ratings[msg.sender][_rideId].exists, "You already rated this ride");
        
        ratings[msg.sender][_rideId] = Rating({
            user: msg.sender,
            rideId: _rideId,
            score: _rating,
            exists: true
        });
        
        emit DriverRated(_rideId, _driver, msg.sender, _rating);
    }
    
    // Check if a user has rated a ride
    function hasUserRatedRide(address _user, uint256 _rideId) external view returns (bool) {
        return ratings[_user][_rideId].exists;
    }

    // Function for testing only - to force complete a ride for demonstration purposes
    function forceCompleteRide(uint256 _rideId) external {
        Ride storage ride = rides[_rideId];
        ride.isActive = false;
        
        // Transfer payments to driver
        uint256 totalPayment = 0;
        for (uint i = 0; i < bookings[_rideId].length; i++) {
            Booking storage booking = bookings[_rideId][i];
            if (booking.paid && !booking.completed) {
                totalPayment += ride.pricePerSeat * booking.seats;
                booking.completed = true;
            }
        }

        if (totalPayment > 0) {
            payable(ride.driver).transfer(totalPayment);
        }

        emit RideCompleted(_rideId);
    }
}
