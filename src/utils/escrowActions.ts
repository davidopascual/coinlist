import { ESCROW_MARKETPLACE_ABI, ESCROW_MARKETPLACE_ADDRESS } from './escrowConfig';
import { ethers } from 'ethers';

// USDC token address for Base Sepolia (checksummed)
export const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS!;
export const ETH_ADDRESS = '0x0000000000000000000000000000000000000000';

// Minimal ERC20 ABI for approve/allowance
const ERC20_ABI = [
  'function approve(address spender, uint256 amount) public returns (bool)',
  'function allowance(address owner, address spender) public view returns (uint256)',
  'function balanceOf(address owner) public view returns (uint256)'
];

export async function confirmReceipt(purchaseId: number) {
  if (!window.ethereum) throw new Error('No wallet provider');
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = new ethers.Contract(
    ESCROW_MARKETPLACE_ADDRESS,
    ESCROW_MARKETPLACE_ABI,
    signer
  );
  const tx = await contract.confirmReceipt(purchaseId);
  return tx;
}

export async function refund(purchaseId: number) {
  if (!window.ethereum) throw new Error('No wallet provider');
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = new ethers.Contract(
    ESCROW_MARKETPLACE_ADDRESS,
    ESCROW_MARKETPLACE_ABI,
    signer
  );
  const tx = await contract.refund(purchaseId);
  return tx;
}

export async function checkUSDCApproval(user: string, amount: bigint) {
  if (!window.ethereum) throw new Error('No wallet provider');
  const provider = new ethers.BrowserProvider(window.ethereum);
  const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, provider);
  const allowance: bigint = await usdc.allowance(user, ESCROW_MARKETPLACE_ADDRESS);
  return allowance >= amount;
}

export async function approveUSDC(amount: bigint) {
  if (!window.ethereum) throw new Error('No wallet provider');
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signer);
  const tx = await usdc.approve(ESCROW_MARKETPLACE_ADDRESS, amount);
  return tx;
}
