# Coinlist Hardhat Test Suite

## Setup

1. Install dependencies:
   ```sh
   cd hardhat
   npm install
   ```

2. Run tests:
   ```sh
   npx hardhat test
   ```

## Files
- `contracts/EscrowMarketplace.sol`: Your smart contract
- `test/EscrowMarketplace.js`: Automated tests for ETH flow

## Notes
- For ERC20/USDC tests, you can add a mock ERC20 contract and extend the test file.
