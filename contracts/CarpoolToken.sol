// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "@openzeppelin/contracts/access/Ownable.sol";

contract CarpoolToken is ERC20, Ownable {
    /**
     * @notice Initializes the token with a name, symbol, and sets owner.
     */
    constructor() ERC20("CarpoolToken", "CPT") Ownable(msg.sender) {
        // Optionally, mint an initial supply to the deployer:
        // _mint(msg.sender, 1000000 * 10 ** decimals());
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
