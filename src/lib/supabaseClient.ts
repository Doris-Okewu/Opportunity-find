import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env and fill in your Supabase project credentials.',
  );
}

// Snapshot of the landing URL taken BEFORE supabase-js reads (and clears) any
// auth tokens or errors from it, so the email-confirmation page can tell the
// user what happened. Contains no secrets once copied: only the hash/query
// keys are inspected (see pages/AuthConfirmPage.tsx).
export const initialAuthUrl = {
  pathname: typeof window !== 'undefined' ? window.location.pathname : '/',
  hash: typeof window !== 'undefined' ? window.location.hash : '',
  search: typeof window !== 'undefined' ? window.location.search : '',
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
