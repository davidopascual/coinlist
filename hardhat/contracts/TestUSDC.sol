// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestUSDC is ERC20 {
    constructor() ERC20("Test USDC", "USDC") {
        _mint(msg.sender, 1000000 * 10 ** decimals()); // Mint 1,000,000 USDC to deployer
    }
}
