import { ESCROW_MARKETPLACE_ABI, ESCROW_MARKETPLACE_ADDRESS } from './escrowConfig';
import { ethers } from 'ethers';
import { Listing } from './listingsApi';

export async function buyListing(listing: Listing) {
  if (!window.ethereum) throw new Error('No wallet provider detected. Please install MetaMask or use WalletConnect.');
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = new ethers.Contract(
    ESCROW_MARKETPLACE_ADDRESS,
    ESCROW_MARKETPLACE_ABI,
    signer
  );
  const isETH = listing.payment_token === '0x0000000000000000000000000000000000000000';
  let price;
  try {
    price = isETH
      ? ethers.parseEther(listing.price_usdc.toString())
      : ethers.parseUnits(listing.price_usdc.toString(), 6);
  } catch (e: unknown) {
    console.error(e);
    throw new Error('Invalid price format.');
  }
  try {
    const tx = await contract.purchase(
      listing.seller_wallet,
      price,
      listing.payment_token,
      isETH ? { value: price } : {}
    );
    return tx;
  } catch (e: unknown) {
    if (typeof e === 'object' && e !== null) {
      // @ts-expect-error: ethers error object may have reason property
      if (e.reason) throw new Error(e.reason);
      // @ts-expect-error: ethers error object may have data.message property
      if (e.data?.message) throw new Error(e.data.message);
    }
    console.error(e);
    throw new Error('Transaction failed. Please check your wallet and network.');
  }
}
