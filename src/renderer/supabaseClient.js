// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uittwrwbcktjdjureqgs.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY;   // asegúrate de usar el prefijo REACT_APP_
export const supabase = createClient(supabaseUrl, supabaseKey);
