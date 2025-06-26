import { getSupabaseClient } from '@/utils/supabaseClient';

export type Listing = {
  id: string;
  seller_wallet: string;
  title: string;
  description: string;
  price_usdc: number;
  image_url: string;
  payment_token: string; // <-- Added for token address (USDC or ETH zero address)
  is_sold: boolean;
  created_at: string;
  purchase_id?: string; // <-- Add purchase_id for contract purchaseId
};

export async function fetchListings(): Promise<Listing[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('is_sold', false)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createListing(listing: Omit<Listing, 'id' | 'is_sold' | 'created_at' | 'purchase_id'>): Promise<Listing> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('listings')
    .insert([{ ...listing, is_sold: false }])
    .select()
    .single();
  if (error) throw error;
  return data;
}
