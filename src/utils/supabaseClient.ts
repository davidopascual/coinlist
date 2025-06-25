// src/utils/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

export function getSupabaseClient() {
  // Hardcoded for local development only
  const supabaseUrl = "https://aumqfcjvcaoabldyafmh.supabase.co";
  const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bXFmY2p2Y2FvYWJsZHlhZm1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4ODQ0NTIsImV4cCI6MjA2NjQ2MDQ1Mn0.RH0aFoCa3OkKYtdfEFmEOFjW8p9-cGn8NGoO66YC0s0";
  return createClient(supabaseUrl, supabaseAnonKey);
}
