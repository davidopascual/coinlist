import { fetchListings, Listing } from '@/utils/listingsApi';
import { getSupabaseClient } from '@/utils/supabaseClient';
import { buyListing } from '@/utils/buyApi';
import { confirmReceipt, refund } from '@/utils/escrowActions';
import { useAccount } from 'wagmi';
import { useState, useEffect } from 'react';

export function ListingsGrid() {
  const { address } = useAccount();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  useEffect(() => {
    // Ensure Supabase client is created at runtime
    getSupabaseClient();
    fetchListings()
      .then(setListings)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleBuy(listing: Listing) {
    setBuyingId(listing.id);
    setTxStatus(null);
    try {
      const tx = await buyListing(listing);
      setTxStatus('Transaction sent! Waiting for confirmation...');
      await tx.wait();
      setTxStatus('Purchase successful!');
      // Optionally, update Supabase to mark as sold or refresh listings
    } catch (e) {
      setTxStatus(e instanceof Error ? e.message : 'Transaction failed');
    } finally {
      setBuyingId(null);
    }
  }

  async function handleConfirm(purchaseId: number) {
    setActionId(String(purchaseId));
    setActionStatus(null);
    try {
      const tx = await confirmReceipt(purchaseId);
      setActionStatus('Confirming...');
      await tx.wait();
      setActionStatus('Receipt confirmed! Funds released to seller.');
    } catch (e) {
      setActionStatus(e instanceof Error ? e.message : 'Confirmation failed');
    } finally {
      setActionId(null);
    }
  }

  async function handleRefund(purchaseId: number) {
    setActionId(String(purchaseId));
    setActionStatus(null);
    try {
      const tx = await refund(purchaseId);
      setActionStatus('Refunding...');
      await tx.wait();
      setActionStatus('Refund successful! Funds returned to buyer.');
    } catch (e) {
      setActionStatus(e instanceof Error ? e.message : 'Refund failed');
    } finally {
      setActionId(null);
    }
  }

  if (loading) return <div className="text-center py-8">Loading listings...</div>;
  if (error) return <div className="text-center text-red-500 py-8">{error}</div>;
  if (!listings.length) return <div className="text-center py-8">No listings found.</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 py-8">
      {listings.map((listing) => (
        <div key={listing.id} className="bg-white dark:bg-gray-900 rounded-lg shadow p-4 flex flex-col">
          <img
            src={listing.image_url}
            alt={listing.title}
            className="w-full h-48 object-cover rounded mb-3 border"
            onError={(e) => (e.currentTarget.src = '/placeholder.png')}
          />
          <h3 className="font-bold text-lg mb-1">{listing.title}</h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-2 line-clamp-2">{listing.description}</p>
          <div className="mt-auto flex justify-between items-center">
            <span className="font-semibold text-blue-600">{listing.price_usdc} {listing.payment_token === '0x0000000000000000000000000000000000000000' ? 'ETH' : 'USDC'}</span>
            <span className="text-xs text-gray-400">{listing.seller_wallet.slice(0, 6)}...{listing.seller_wallet.slice(-4)}</span>
          </div>
          <button
            className="mt-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
            disabled={buyingId === listing.id}
            onClick={() => handleBuy(listing)}
          >
            {buyingId === listing.id ? 'Processing...' : 'Buy'}
          </button>
          {/* Confirm Receipt button for buyer (replace with actual purchaseId logic) */}
          {address && address.toLowerCase() === listing.seller_wallet.toLowerCase() && (
            <button
              className="mt-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
              onClick={() => handleRefund(Number(listing.id))}
              disabled={actionId === listing.id}
            >
              {actionId === listing.id ? 'Refunding...' : 'Refund'}
            </button>
          )}
          {address && address.toLowerCase() !== listing.seller_wallet.toLowerCase() && (
            <button
              className="mt-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
              onClick={() => handleConfirm(Number(listing.id))}
              disabled={actionId === listing.id}
            >
              {actionId === listing.id ? 'Confirming...' : 'Confirm Receipt'}
            </button>
          )}
          {(actionId === listing.id && actionStatus) && (
            <div className="text-xs text-blue-500 mt-2">{actionStatus}</div>
          )}
          {buyingId === listing.id && txStatus && (
            <div className="text-xs text-blue-500 mt-2">{txStatus}</div>
          )}
        </div>
      ))}
    </div>
  );
}
