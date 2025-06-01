import { supabase } from '../supabaseClient';

export async function getDivisions() {
  const { data, error } = await supabase
    .from('divisions')
    .select('id, name')
    .order('id');
  if (error) throw error;
  return data;
}

export async function addDivision(division) {
  const { data, error } = await supabase
    .from('divisions')
    .insert([{ name: division.name }])
    .select('id, name');
  if (error) throw error;
  return data[0];
}

export async function updateDivision(id, division) {
  const { data, error } = await supabase
    .from('divisions')
    .update({ name: division.name })
    .eq('id', id)
    .select('id, name');
  if (error) throw error;
  return data[0];
}

export async function deleteDivision(id) {
  const { error } = await supabase
    .from('divisions')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return;
}
