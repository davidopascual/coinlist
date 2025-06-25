import { useEffect, useState } from 'react';
import { fetchListings, Listing } from '@/utils/listingsApi';
import { getSupabaseClient } from '@/utils/supabaseClient';

export function ListingsGrid() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Ensure Supabase client is created at runtime
    getSupabaseClient();
    fetchListings()
      .then(setListings)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

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
            <span className="font-semibold text-blue-600">{listing.price_usdc} USDC</span>
            <span className="text-xs text-gray-400">{listing.seller_wallet.slice(0, 6)}...{listing.seller_wallet.slice(-4)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
