import { useAccount } from 'wagmi';
import { useEffect, useState } from 'react';
import { formatEther } from 'viem';

export function ETHBalance() {
  const { address, isConnected, chain } = useAccount();
  const [balance, setBalance] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBalance() {
      setError(null);
      setBalance(null);
      if (!isConnected || !address) return;
      try {
        // Only fetch on supported chain (Base Sepolia)
        if (chain?.id !== 84532) return;
        const provider = window.ethereum as unknown as import('ethers').Eip1193Provider;
        if (!provider) throw new Error('No wallet provider');
        const ethers = await import('ethers');
        const ethProvider = new ethers.BrowserProvider(provider);
        const raw = await ethProvider.getBalance(address);
        setBalance(formatEther(raw));
      } catch {
        setError('Could not fetch ETH balance');
      }
    }
    fetchBalance();
  }, [address, isConnected, chain]);

  if (!isConnected) return null;
  if (error) return <div className="text-xs text-red-500">{error}</div>;
  if (balance === null) return <div className="text-xs text-gray-400">ETH: ...</div>;
  return <div className="text-xs text-yellow-600">ETH: {balance}</div>;
}
