// src/renderer/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL     = 'https://uittwrwbcktjdjureqgs.supabase.co';
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_KEY;

console.log('⚡ Supabase URL:', SUPABASE_URL);
console.log('⚡ Supabase Anon Key:', SUPABASE_ANON_KEY);

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

console.log('⚡ Supabase client ready:', !!supabase);

/**
 * Lanza un error controlado si no hay conexión.
 * @throws {Error} con .code === 'OFFLINE'
 */
export function ensureOnline() {
  if (!window.navigator.onLine) {
    const err = new Error('Sin conexión a Internet');
    err.code = 'OFFLINE';
    throw err;
  }
}
