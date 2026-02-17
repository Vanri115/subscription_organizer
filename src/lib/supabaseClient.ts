import { createClient } from '@supabase/supabase-js';

// These would normally come from import.meta.env.VITE_SUPABASE_URL etc.
// For now we export a dummy client or null if not configured.

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : null;

// Helper to check if we are using DB or LocalStorage
export const isDatabaseEnabled = () => !!supabase;
