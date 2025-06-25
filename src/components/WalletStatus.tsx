import { useSupabaseWalletAuth } from '@/hooks/useSupabaseWalletAuth';

export function WalletStatus() {
  const { user, loading, error } = useSupabaseWalletAuth();

  if (loading) return <div className="text-sm text-gray-500">Syncing wallet with Supabase...</div>;
  if (error) return <div className="text-sm text-red-500">{error}</div>;
  if (!user) return <div className="text-sm text-gray-500">Wallet not connected.</div>;

  return (
    <div className="text-sm text-green-600">Wallet authenticated with Supabase!</div>
  );
}
