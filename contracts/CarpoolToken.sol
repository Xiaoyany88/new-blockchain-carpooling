// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CarpoolToken is ERC20, Ownable {
    mapping(address => uint256) public driverRewards;
    uint256 public constant REWARD_PER_RIDE = 10 * 10**18; // 10 tokens per completed ride

    constructor() ERC20("CarpoolToken", "CPT") Ownable(msg.sender) {
        _mint(address(this), 1000000 * 10**decimals()); // Initial supply for rewards
    }

    function rewardDriver(address _driver) external {
        require(msg.sender == owner(), "Only owner can reward drivers");
        _transfer(address(this), _driver, REWARD_PER_RIDE);
        driverRewards[_driver] += REWARD_PER_RIDE;
    }

    function getDriverRewards(address _driver) external view returns (uint256) {
        return driverRewards[_driver];
    }

    /**
     * @notice Allows the owner to mint tokens to a specified address.
     * @param _to The recipient address.
     * @param _amount The number of tokens to mint.
     */
    function mint(address _to, uint256 _amount) external onlyOwner {
        _mint(_to, _amount);
    }

    /**
     * @notice Allows token holders to burn their tokens.
     * @param _amount The number of tokens to burn.
     */
    function burn(uint256 _amount) external {
        _burn(msg.sender, _amount);
    }
}
