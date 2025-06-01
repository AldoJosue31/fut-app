// src/services/jornadasService.js
import { supabase } from '../supabaseClient.js';

// Listar todas las jornadas
export async function getJornadas() {
  const { data, error } = await supabase
    .from('jornadas')
    .select('*')
    .order('id', { ascending: true });
  if (error) throw error;
  return data;
}

// Agregar una nueva jornada
export async function addJornada(name, division) {
  const { data, error } = await supabase
    .from('jornadas')
    .insert([{ name, division }])
    .single();
  if (error) throw error;
  return data;
}

// Eliminar una jornada por su ID
export async function deleteJornada(id) {
  const { error } = await supabase
    .from('jornadas')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
