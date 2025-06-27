import { useAccount } from 'wagmi';
import { useEffect, useState } from 'react';
import { formatUnits } from 'viem';

// USDC contract address for Base Sepolia (update if needed)
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS!;
const USDC_DECIMALS = 6;

const ERC20_ABI = [
	{
		constant: true,
		inputs: [{ name: 'owner', type: 'address' }],
		name: 'balanceOf',
		outputs: [{ name: 'balance', type: 'uint256' }],
		type: 'function',
	},
];

export function USDCBalance() {
	const { address, isConnected, chain } = useAccount();
	const [balance, setBalance] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [mounted, setMounted] = useState(false);

	useEffect(() => { setMounted(true); }, []);

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
				const contract = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, ethProvider);
				const raw = await contract.balanceOf(address);
				setBalance(formatUnits(raw, USDC_DECIMALS));
			} catch {
				setError('Could not fetch USDC balance');
			}
		}
		fetchBalance();
	}, [address, isConnected, chain]);

	if (!mounted) return null;
	if (!isConnected) return null;
	if (error) return <div className="text-xs text-red-500">{error}</div>;
	if (balance === null) return <div className="text-xs text-gray-400">USDC: ...</div>;
	return <div className="text-xs text-blue-600">USDC: {balance}</div>;
}
