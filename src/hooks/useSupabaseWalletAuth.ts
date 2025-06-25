import { getSupabaseClient } from '@/utils/supabaseClient';
import { useAccount } from 'wagmi';
import { useEffect, useState } from 'react';

export interface SupabaseUser {
  id: string;
  wallet_address: string;
  created_at: string;
}

export function useSupabaseWalletAuth() {
  const { address, isConnected } = useAccount();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function syncWallet() {
      setError(null);
      if (!isConnected || !address) {
        setUser(null);
        return;
      }
      setLoading(true);
      try {
        const supabase = getSupabaseClient();
        // Check if user exists
        const { data: foundUser, error: selectError } = await supabase
          .from('users')
          .select('*')
          .eq('wallet_address', address)
          .single();
        if (selectError && selectError.code !== 'PGRST116') throw selectError;
        if (!foundUser) {
          // Create user if not exists
          const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert([{ wallet_address: address }])
            .select()
            .single();
          if (insertError) throw insertError;
          setUser(newUser);
        } else {
          setUser(foundUser);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    syncWallet();
  }, [address, isConnected]);

  return { user, loading, error };
}
