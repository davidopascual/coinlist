# Coinlist – Decentralized Crypto Marketplace MVP

A decentralized eBay-style peer-to-peer marketplace where users can buy and sell physical or digital goods using USDC or ETH, with trustless on-chain escrow and a native token for rewards, staking, and fee discounts.

## Tech Stack
- **Frontend:** Next.js, TailwindCSS, Wagmi, RainbowKit
- **Backend:** Supabase (Postgres DB + Auth + Storage)
- **Smart Contracts:** Solidity (Escrow + Marketplace logic)
- **Wallets:** MetaMask, WalletConnect, Phantom
- **Testnet:** Base Sepolia (default)

## Core Features (MVP)
- Wallet authentication (MetaMask, WalletConnect, Phantom)
- Product listings (create, browse, search)
- Escrow payments (USDC/ETH) via smart contract
- Delivery confirmation & fund release
- (Planned) Native token integration for rewards, staking, and fee discounts

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the development server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure
- `src/` – Main app code (pages, components, styles)
- `smart-contracts/` – Solidity contracts (to be added)
- `.github/copilot-instructions.md` – Copilot custom instructions

## Next Steps
- Integrate Wagmi, RainbowKit, and Supabase
- Add smart contract for escrow logic
- Build listing and purchase flows

---

_This project was bootstrapped with Next.js and is ready for full-stack crypto marketplace development._
