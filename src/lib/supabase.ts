import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * Supabase client — null when env vars are not configured.
 * Always check `if (supabase)` before using.
 */
export const supabase: SupabaseClient | null =
  url && key ? createClient(url, key) : null;
