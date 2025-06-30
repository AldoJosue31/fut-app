// src/services/profileService.js
import { supabase } from '../supabaseClient';

export const createProfile = async (user, role = 'admin') => {
  const { data, error } = await supabase
    .from('profiles')
    .insert({ id: user.id, email: user.email, role }) // ahora role por defecto es 'admin'
    .single();
  if (error) throw error;
  return data;
};

export const getProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, role')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
};
