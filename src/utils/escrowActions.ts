import { ESCROW_MARKETPLACE_ABI, ESCROW_MARKETPLACE_ADDRESS } from './escrowConfig';
import { ethers } from 'ethers';

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
