import { supabase, ensureOnline } from '../supabaseClient';

// Listar todas las jornadas
export async function getJornadas() {
  ensureOnline();
  const { data, error } = await supabase
    .from('jornadas')
    .select('*')
    .order('id', { ascending: true });
  if (error) throw error;
  return data;
}

// Listar jornadas por temporada
export async function getJornadasBySeason(season) {
  ensureOnline();
  const { data, error } = await supabase
    .from('jornadas')
    .select('*')
    .eq('season', season)
    .order('id', { ascending: true });
  if (error) throw error;
  return data;
}

// Agregar una nueva jornada
export async function addJornada(name, division, season) {
  ensureOnline();
  const { data, error } = await supabase
    .from('jornadas')
    .insert([{ name, division, season }])
    .single();
  if (error) throw error;
  return data;
}

// Eliminar una jornada por su ID
export async function deleteJornada(id) {
  ensureOnline();
  const { error } = await supabase
    .from('jornadas')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// Verificar si una división ya tiene jornadas creadas para una temporada
export async function isTorneoComenzado(division, season) {
  ensureOnline();
  const { data, error } = await supabase
    .from('jornadas')
    .select('*')
    .eq('division', division)
    .eq('season', season);
  if (error) throw error;
  return data.length > 0;
}
