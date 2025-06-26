"use client";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ListingsGrid } from "@/components/ListingsGrid";
import { CreateListingForm } from "@/components/CreateListingForm";
import { WalletStatus } from "@/components/WalletStatus";
import { USDCBalance } from "@/components/USDCBalance";
import { useState } from "react";

export default function Home() {
  const [refresh, setRefresh] = useState(0);
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col">
      <header className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-2xl font-bold tracking-tight">Coinlist Marketplace</h1>
        <div className="flex flex-col items-end gap-1">
          <ConnectButton />
          <WalletStatus />
          <USDCBalance />
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center px-4 py-12">
        <div className="max-w-xl w-full text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Buy & Sell with Crypto, Trustlessly
          </h2>
          <p className="mb-8 text-lg text-gray-600 dark:text-gray-300">
            Coinlist is a decentralized peer-to-peer marketplace for physical and
            digital goods. Connect your wallet to get started, browse listings, or
            create your own. All payments are secured by on-chain escrow using ETH
            or USDC.
          </p>
        </div>
        <CreateListingForm onCreated={() => setRefresh(r => r + 1)} />
        <ListingsGrid key={refresh} />
      </main>
      <footer className="text-center text-xs text-gray-400 py-4 border-t border-gray-200 dark:border-gray-800">
        &copy; {new Date().getFullYear()} Coinlist. All rights reserved.
      </footer>
    </div>
  );
}
