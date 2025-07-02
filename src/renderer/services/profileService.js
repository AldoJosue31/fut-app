// src/services/profileService.js
import { supabase, ensureOnline } from '../supabaseClient';

export const createProfile = async (user, role = 'admin') => {
  ensureOnline();
  const { data, error } = await supabase
    .from('profiles')
    .insert({ id: user.id, email: user.email, role }) // ahora role por defecto es 'admin'
    .single();
  if (error) throw error;
  return data;
};

export const getProfile = async (userId) => {
  ensureOnline();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, role')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
};
