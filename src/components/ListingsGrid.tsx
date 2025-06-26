"use client";
import { fetchListings, Listing } from '@/utils/listingsApi';
import { getSupabaseClient } from '@/utils/supabaseClient';
import { buyListing } from '@/utils/buyApi';
import { confirmReceipt, refund, checkUSDCApproval, approveUSDC, USDC_ADDRESS, ETH_ADDRESS } from '@/utils/escrowActions';
import { useAccount } from 'wagmi';
import { useState, useEffect } from 'react';
import { Interface, Log, ethers } from 'ethers';
import { ESCROW_MARKETPLACE_ABI } from '@/utils/escrowConfig';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

function StatusBadge({ status }: { status: string }) {
  const color = status === 'Available' ? 'bg-green-100 text-green-700' : status === 'Sold' ? 'bg-gray-300 text-gray-600' : 'bg-yellow-100 text-yellow-700';
  return <span className={`px-2 py-1 rounded text-xs font-semibold ${color}`}>{status}</span>;
}

function Tooltip({ text, children }: { text: string, children: React.ReactNode }) {
  return (
    <span className="relative group cursor-pointer">
      {children}
      <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block bg-black text-white text-xs rounded px-2 py-1 z-10 whitespace-nowrap">{text}</span>
    </span>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="ml-2 text-xs text-blue-500 underline hover:text-blue-700"
      onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1000); }}
      title="Copy to clipboard"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) {
  const icon = type === 'success' ? <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" /> : type === 'error' ? <XCircleIcon className="w-5 h-5 text-red-500 mr-2" /> : <ArrowPathIcon className="w-5 h-5 text-blue-500 mr-2 animate-spin" />;
  const bg = type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-blue-50 border-blue-200 text-blue-800';
  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded shadow-lg border flex items-center gap-2 ${bg}`}> 
      {icon}
      <span>{message}</span>
      <button className="ml-4 text-xs text-gray-500 hover:text-gray-700" onClick={onClose}>Dismiss</button>
    </div>
  );
}

function BuyConfirmationModal({ open, onClose, onConfirm, price, isETH, loading }: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  price: number;
  isETH: boolean;
  loading: boolean;
}) {
  if (!open) return null;
  const fee = price * 0.02;
  const total = price + fee;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-md border border-blue-200 dark:border-gray-700 relative animate-fadeIn">
        <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" onClick={onClose} aria-label="Close">
          <XCircleIcon className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2 mb-4">
          <ArrowPathIcon className="w-6 h-6 text-blue-500 animate-spin-slow" />
          <h3 className="font-bold text-xl">Confirm Purchase</h3>
        </div>
        <div className="mb-2 flex justify-between"><span>Price:</span> <span className="font-mono">{price} {isETH ? 'ETH' : 'USDC'}</span></div>
        <div className="mb-2 flex justify-between"><span>Marketplace Fee (2%):</span> <span className="font-mono">{fee.toFixed(4)} {isETH ? 'ETH' : 'USDC'}</span></div>
        <div className="mb-4 flex justify-between font-semibold text-lg"><span>Total:</span> <span className="font-mono">{total.toFixed(4)} {isETH ? 'ETH' : 'USDC'}</span></div>
        <div className="flex gap-4 justify-end mt-6">
          <button className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 transition" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-2 transition disabled:opacity-50" onClick={onConfirm} disabled={loading}>
            {loading && <ArrowPathIcon className="w-5 h-5 animate-spin" />}Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

function ListingImage({ src, alt }: { src: string; alt: string }) {
  const [imgSrc, setImgSrc] = useState(src);
  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={400}
      height={192}
      className="w-full h-48 object-cover rounded mb-3 border"
      onError={() => setImgSrc('/placeholder.png')}
    />
  );
}

function isEthersError(e: unknown): e is { code?: string; reason?: string; message?: string } {
  return typeof e === 'object' && e !== null && (
    'code' in e || 'reason' in e || 'message' in e
  );
}

export function ListingsGrid() {
  const { address, chain } = useAccount();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalListing, setModalListing] = useState<Listing | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [approvalNeeded, setApprovalNeeded] = useState<string | null>(null); // listing id
  const [approvalError, setApprovalError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [infoBanner, setInfoBanner] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    getSupabaseClient();
    fetchListings()
      .then(setListings)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [refresh]);

  async function handleBuy(listing: Listing) {
    setApprovalError(null);
    setModalListing(listing);
    setShowModal(true);
    // If USDC, check approval
    if (listing.payment_token === USDC_ADDRESS && address) {
      try {
        const price = ethers.parseUnits(listing.price_usdc.toString(), 6);
        const approved = await checkUSDCApproval(address, price);
        setApprovalNeeded(!approved ? listing.id : null);
      } catch {
        setApprovalError('Failed to check USDC approval.');
        setApprovalNeeded(listing.id);
      }
    } else {
      setApprovalNeeded(null);
    }
  }

  async function handleApprove(listing: Listing) {
    setApprovalLoading(true);
    setApprovalError(null);
    try {
      const price = ethers.parseUnits(listing.price_usdc.toString(), 6);
      const tx = await approveUSDC(price);
      setTxStatus('Approval sent! Waiting for confirmation...');
      setTxHash(tx.hash);
      setToast({ message: 'Approval transaction sent. Waiting for confirmation...', type: 'info' });
      await tx.wait();
      setTxStatus('USDC approved! You can now buy.');
      setToast({ message: 'USDC approved! You can now buy.', type: 'success' });
      setApprovalNeeded(null);
    } catch (e: unknown) {
      let msg = 'Approval failed.';
      if (isEthersError(e) && e.code === 'CALL_EXCEPTION') {
        msg = 'Approval failed: Contract reverted. Check if you have enough USDC and correct network.';
      } else if (isEthersError(e) && e.reason) {
        msg = `Approval failed: ${e.reason}`;
      } else if (isEthersError(e) && e.message) {
        msg = `Approval failed: ${e.message}`;
      }
      setApprovalError(msg);
      setToast({ message: msg, type: 'error' });
    } finally {
      setApprovalLoading(false);
    }
  }

  async function confirmBuy(listing: Listing) {
    setModalLoading(true);
    setBuyingId(listing.id);
    setTxStatus(null);
    setTxHash(null);
    setShowModal(false);
    try {
      // If USDC, check approval again before buy
      if (listing.payment_token === USDC_ADDRESS && address) {
        const price = ethers.parseUnits(listing.price_usdc.toString(), 6);
        const approved = await checkUSDCApproval(address, price);
        if (!approved) {
          setApprovalNeeded(listing.id);
          setTxStatus('Please approve USDC before buying.');
          setModalLoading(false);
          setBuyingId(null);
          return;
        }
      }
      const tx = await buyListing(listing);
      if (tx && tx.hash) {
        setToast({ message: 'Purchase transaction sent. Waiting for confirmation...', type: 'info' });
      }
      const receipt = await tx.wait();
      console.log('Transaction confirmed', receipt);
      // Parse logs for Purchased event using ethers v6 Interface
      const iface = new Interface(ESCROW_MARKETPLACE_ABI);
      let purchaseId: string | null = null;
      for (const log of receipt.logs as Log[]) {
        try {
          const parsed = iface.parseLog(log);
          if (parsed && parsed.name === 'Purchased') {
            purchaseId = parsed.args.purchaseId.toString();
            break;
          }
        } catch {}
      }
      setTxStatus('Purchase successful!');
      setToast({ message: 'Purchase successful!', type: 'success' });
      // Update Supabase: mark as sold and store purchaseId
      if (purchaseId) {
        const supabase = getSupabaseClient();
        await supabase
          .from('listings')
          .update({ is_sold: true, purchase_id: purchaseId })
          .eq('id', listing.id);
      }
      setRefresh(r => r + 1);
    } catch (e: unknown) {
      let msg = 'Transaction failed.';
      if (isEthersError(e) && e.code === 'CALL_EXCEPTION') {
        if (e.message && e.message.includes('missing revert data')) {
          msg = 'Purchase failed: This item may already be sold or unavailable.';
        } else {
          msg = 'Purchase failed: Contract reverted. Check if you have enough USDC/ETH, correct network, and the listing is available.';
        }
      } else if (isEthersError(e) && e.reason) {
        msg = `Purchase failed: ${e.reason}`;
      } else if (isEthersError(e) && e.message) {
        msg = `Purchase failed: ${e.message}`;
      }
      setTxStatus(msg);
      setToast({ message: msg, type: 'error' });
      setRefresh(r => r + 1); // Auto-refresh listings after failure
    } finally {
      setBuyingId(null);
      setModalLoading(false);
    }
  }

  async function handleConfirm(purchaseId: string) {
    setActionId(purchaseId);
    setActionStatus(null);
    try {
      const tx = await confirmReceipt(Number(purchaseId));
      setActionStatus('Confirming...');
      setTxHash(tx.hash);
      setToast({ message: 'Confirming receipt. Waiting for confirmation...', type: 'info' });
      await tx.wait();
      setActionStatus('Receipt confirmed! Funds released to seller.');
      setToast({ message: 'Receipt confirmed! Funds released to seller.', type: 'success' });
      setRefresh(r => r + 1);
    } catch (e: unknown) {
      let msg = 'Confirmation failed.';
      if (isEthersError(e) && e.code === 'CALL_EXCEPTION') {
        msg = 'Confirmation failed: Contract reverted. You may not be authorized or the purchase is not in the correct state.';
      } else if (isEthersError(e) && e.reason) {
        msg = `Confirmation failed: ${e.reason}`;
      } else if (isEthersError(e) && e.message) {
        msg = `Confirmation failed: ${e.message}`;
      }
      setActionStatus(msg);
      setToast({ message: msg, type: 'error' });
    } finally {
      setActionId(null);
    }
  }

  async function handleRefund(purchaseId: string) {
    setActionId(purchaseId);
    setActionStatus(null);
    try {
      const tx = await refund(Number(purchaseId));
      setActionStatus('Refunding...');
      setTxHash(tx.hash);
      setToast({ message: 'Refunding. Waiting for confirmation...', type: 'info' });
      await tx.wait();
      setActionStatus('Refund successful! Funds returned to buyer.');
      setToast({ message: 'Refund successful! Funds returned to buyer.', type: 'success' });
      setRefresh(r => r + 1);
    } catch (e: unknown) {
      let msg = 'Refund failed.';
      if (isEthersError(e) && e.code === 'CALL_EXCEPTION') {
        msg = 'Refund failed: Contract reverted. You may not be authorized or the purchase is not in the correct state.';
      } else if (isEthersError(e) && e.reason) {
        msg = `Refund failed: ${e.reason}`;
      } else if (isEthersError(e) && e.message) {
        msg = `Refund failed: ${e.message}`;
      }
      setActionStatus(msg);
      setToast({ message: msg, type: 'error' });
    } finally {
      setActionId(null);
    }
  }

  if (loading) return <div className="text-center py-8">Loading listings...</div>;
  if (error) return <div className="text-center text-red-500 py-8">{error}</div>;
  if (!listings.length) return <div className="text-center py-8">No listings found.</div>;

  // Network check
  const correctNetwork = chain?.id === 84532;

  // Filtered listings
  const filteredListings = listings.filter(l =>
    l.title.toLowerCase().includes(search.toLowerCase()) ||
    l.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {infoBanner && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded mb-4 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <b>Testnet Info:</b> You are on Base Sepolia. <br />
            <span>Need test USDC? <a href="https://faucet.circle.com/base-sepolia" target="_blank" rel="noopener noreferrer" className="underline">Get USDC from Circle Faucet</a></span> | <span>What is MARKT? <Link href="/about-markt" className="underline">Learn more</Link></span>
          </div>
          <button className="mt-2 md:mt-0 text-xs text-blue-600 underline" onClick={() => setInfoBanner(false)}>Hide</button>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
        <input
          className="border rounded px-3 py-2 w-full sm:w-64"
          placeholder="Search listings..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      {!correctNetwork && (
        <div className="text-center text-red-500 mb-4 font-semibold">Please switch your wallet to Base Sepolia (chainId 84532) to buy or interact.</div>
      )}
      <BuyConfirmationModal
        open={showModal && !!modalListing}
        onClose={() => setShowModal(false)}
        onConfirm={() => modalListing && confirmBuy(modalListing)}
        price={modalListing ? modalListing.price_usdc : 0}
        isETH={modalListing ? modalListing.payment_token === ETH_ADDRESS : false}
        loading={modalLoading}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 py-8">
        {filteredListings.map((listing) => {
          const status = listing.is_sold ? 'Sold' : 'Available';
          const isUSDC = listing.payment_token === USDC_ADDRESS;
          return (
            <div key={listing.id} className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-5 flex flex-col border border-blue-100 dark:border-gray-800 hover:shadow-2xl transition-all duration-200">
              <div className="flex justify-between items-center mb-2">
                <StatusBadge status={status} />
                <span className="text-xs text-gray-400">{listing.seller_wallet.slice(0, 6)}...{listing.seller_wallet.slice(-4)}</span>
              </div>
              <ListingImage src={listing.image_url} alt={listing.title} />
              <h3 className="font-bold text-lg mb-1 line-clamp-1">{listing.title}</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-2 line-clamp-2">{listing.description}</p>
              <div className="mt-auto flex justify-between items-center mb-2">
                <span className="font-semibold text-blue-600 text-lg">{listing.price_usdc} {listing.payment_token === '0x0000000000000000000000000000000000000000' ? 'ETH' : 'USDC'}</span>
              </div>
              {!listing.is_sold && (
                <div className="flex flex-col gap-2 mt-2">
                  {isUSDC && approvalNeeded === listing.id ? (
                    <Tooltip text="Approve USDC for escrow contract before buying.">
                      <button
                        className="w-full bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-2 rounded-lg transition disabled:opacity-50 flex items-center justify-center shadow"
                        disabled={approvalLoading || !correctNetwork}
                        onClick={() => handleApprove(listing)}
                      >
                        {approvalLoading ? <ArrowPathIcon className="w-5 h-5 animate-spin mr-2" /> : null}Approve USDC
                      </button>
                    </Tooltip>
                  ) : (
                    <Tooltip text="Buy this item and lock funds in escrow until you confirm receipt.">
                      <button
                        className="w-full bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-bold py-2 rounded-lg transition disabled:opacity-50 flex items-center justify-center shadow"
                        disabled={buyingId === listing.id || !correctNetwork}
                        onClick={() => handleBuy(listing)}
                      >
                        {buyingId === listing.id && <ArrowPathIcon className="w-5 h-5 animate-spin mr-2" />}Buy
                      </button>
                    </Tooltip>
                  )}
                </div>
              )}
              {/* Confirm/Refund buttons only if sold and purchase_id exists */}
              {listing.is_sold && !!listing.purchase_id && (
                <div className="flex flex-col gap-2 mt-2">
                  {address && address.toLowerCase() === listing.seller_wallet.toLowerCase() && (
                    <Tooltip text="Refund the buyer if you cannot deliver the item.">
                      <button
                        className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded-lg transition disabled:opacity-50 flex items-center justify-center shadow"
                        onClick={() => handleRefund(listing.purchase_id!)}
                        disabled={actionId === listing.purchase_id}
                      >
                        {actionId === listing.purchase_id && <ArrowPathIcon className="w-5 h-5 animate-spin mr-2" />}Refund
                      </button>
                    </Tooltip>
                  )}
                  {address && address.toLowerCase() !== listing.seller_wallet.toLowerCase() && (
                    <Tooltip text="Confirm you received the item to release funds to the seller.">
                      <button
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-lg transition disabled:opacity-50 flex items-center justify-center shadow"
                        onClick={() => handleConfirm(listing.purchase_id!)}
                        disabled={actionId === listing.purchase_id}
                      >
                        {actionId === listing.purchase_id && <ArrowPathIcon className="w-5 h-5 animate-spin mr-2" />}Confirm Receipt
                      </button>
                    </Tooltip>
                  )}
                </div>
              )}
              {(actionId === (listing.purchase_id || listing.id) && actionStatus) && (
                <div className="text-xs text-blue-500 mt-2 flex items-center gap-1"><ArrowPathIcon className="w-4 h-4 animate-spin" />{actionStatus}</div>
              )}
              {buyingId === listing.id && txStatus && (
                <div className={`text-xs mt-2 flex items-center gap-1 ${txStatus.includes('failed') ? 'text-red-500' : 'text-blue-500'}`}><ArrowPathIcon className="w-4 h-4 animate-spin" />{txStatus}</div>
              )}
              {txHash && (
                <div className="text-xs text-gray-400 mt-1 break-all flex items-center">Tx: <a href={`https://sepolia.basescan.org/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="underline ml-1">{txHash.slice(0, 10)}...</a><CopyButton value={txHash} /></div>
              )}
            </div>
          );
        })}
      </div>
      {/* Error banners for payment actions */}
      {approvalError && <div className="text-center text-red-500 mt-4 flex items-center justify-center gap-2"><ExclamationTriangleIcon className="w-5 h-5" />{approvalError}</div>}
      {txStatus && txStatus.toLowerCase().includes('error') && <div className="text-center text-red-500 mt-4 flex items-center justify-center gap-2"><ExclamationTriangleIcon className="w-5 h-5" />{txStatus}</div>}
      {actionStatus && actionStatus.toLowerCase().includes('error') && <div className="text-center text-red-500 mt-4 flex items-center justify-center gap-2"><ExclamationTriangleIcon className="w-5 h-5" />{actionStatus}</div>}
    </>
  );
}
