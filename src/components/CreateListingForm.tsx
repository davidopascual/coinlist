import { useState } from 'react';
import { createListing } from '@/utils/listingsApi';
import { useAccount } from 'wagmi';

// USDC token address for Base Sepolia (update if needed)
const USDC_ADDRESS = '0xD9C64bB8cA1e2e2e6bB6e7e6e7e6e7e6e7e6e7e6';

export function CreateListingForm({ onCreated }: { onCreated?: () => void }) {
  const { address } = useAccount();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [paymentType, setPaymentType] = useState<'USDC' | 'ETH'>('USDC');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!address) {
      setError('Connect your wallet to create a listing.');
      return;
    }
    if (!title || !description || !price || !imageUrl) {
      setError('All fields are required.');
      return;
    }
    setLoading(true);
    try {
      await createListing({
        seller_wallet: address,
        title,
        description,
        price_usdc: parseFloat(price),
        image_url: imageUrl,
        payment_token: paymentType === 'USDC' ? USDC_ADDRESS : '0x0000000000000000000000000000000000000000',
      });
      setSuccess(true);
      setTitle('');
      setDescription('');
      setPrice('');
      setImageUrl('');
      setPaymentType('USDC');
      onCreated?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 max-w-lg w-full mx-auto mb-8 flex flex-col gap-4">
      <h3 className="text-xl font-bold mb-2">Create a New Listing</h3>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      {success && <div className="text-green-600 text-sm">Listing created!</div>}
      <input
        className="border rounded px-3 py-2"
        placeholder="Title"
        value={title}
        onChange={e => setTitle(e.target.value)}
        disabled={loading}
      />
      <textarea
        className="border rounded px-3 py-2"
        placeholder="Description"
        value={description}
        onChange={e => setDescription(e.target.value)}
        disabled={loading}
      />
      <input
        className="border rounded px-3 py-2"
        placeholder="Price (USDC or ETH)"
        type="number"
        min="0"
        step="0.01"
        value={price}
        onChange={e => setPrice(e.target.value)}
        disabled={loading}
      />
      <input
        className="border rounded px-3 py-2"
        placeholder="Image URL"
        value={imageUrl}
        onChange={e => setImageUrl(e.target.value)}
        disabled={loading}
      />
      <div className="flex gap-4 items-center">
        <label className="text-sm">Payment:</label>
        <select
          className="border rounded px-2 py-1"
          value={paymentType}
          onChange={e => setPaymentType(e.target.value as 'USDC' | 'ETH')}
          disabled={loading}
        >
          <option value="USDC">USDC (recommended)</option>
          <option value="ETH">ETH (optional)</option>
        </select>
      </div>
      <button
        type="submit"
        className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
        disabled={loading}
      >
        {loading ? 'Creating...' : 'Create Listing'}
      </button>
    </form>
  );
}
