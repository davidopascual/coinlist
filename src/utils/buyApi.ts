import { useAccount, useChainId } from 'wagmi';
import { ESCROW_MARKETPLACE_ABI, ESCROW_MARKETPLACE_ADDRESS } from './escrowConfig';
import { ethers } from 'ethers';
import { Listing } from './listingsApi';

export async function buyListing(listing: Listing) {
  if (!window.ethereum) throw new Error('No wallet provider');
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = new ethers.Contract(
    ESCROW_MARKETPLACE_ADDRESS,
    ESCROW_MARKETPLACE_ABI,
    signer
  );
  const isETH = listing.payment_token === '0x0000000000000000000000000000000000000000';
  const price = ethers.parseUnits(listing.price_usdc.toString(), isETH ? 18 : 6); // 18 for ETH, 6 for USDC
  const tx = await contract.purchase(
    listing.seller_wallet,
    price,
    listing.payment_token,
    isETH ? { value: price } : {}
  );
  return tx;
}
