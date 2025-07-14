import { supabase, ensureOnline } from '../supabaseClient';

export async function getDivisions() {
  ensureOnline(); // Lanza error si no hay conexión
  const { data, error } = await supabase
    .from('divisions')
    .select('id, name')
    .order('id');
  if (error) throw error;
  return data;
}

export async function addDivision(division) {
  ensureOnline(); // Lanza error si no hay conexión
  const { data, error } = await supabase
    .from('divisions')
    .insert([{ name: division.name }])
    .select('id, name');
  if (error) throw error;
  return data[0];
}

export async function updateDivision(id, division) {
  ensureOnline(); // Lanza error si no hay conexión
  const { data, error } = await supabase
    .from('divisions')
    .update({ name: division.name })
    .eq('id', id)
    .select('id, name');
  if (error) throw error;
  return data[0];
}

export async function deleteDivision(id) {
  ensureOnline(); // Lanza error si no hay conexión
  const { error } = await supabase
    .from('divisions')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return;
}

export async function hasActiveTournament(divisionName) {
  ensureOnline();

  // 1) Obtengo todos los team_id de tournament_teams para esa división
  const { data: tts, error: err1 } = await supabase
    .from('tournament_teams')
    .select('team_id')
    .eq('division', divisionName);

  if (err1) throw err1;
  if (!tts || tts.length === 0) return false;
  const teamIds = tts.map(tt => tt.team_id);

  // 2) Obtengo todos los tournament_id de team_tournament_stats para esos equipos
  const { data: stats, error: err2 } = await supabase
    .from('team_tournament_stats')
    .select('tournament_id')
    .in('team_id', teamIds);

  if (err2) throw err2;
  if (!stats || stats.length === 0) return false;
  const tournamentIds = [...new Set(stats.map(s => s.tournament_id))];

  // 3) Filtro en tournaments por rango de fechas: start_date ≤ hoy ≤ end_date
  const today = new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'
  const { data: tours, error: err3 } = await supabase
    .from('tournaments')
    .select('id')
    .in('id', tournamentIds)
    .lte('start_date', today)
    .gte('end_date', today);

  if (err3) throw err3;
  return Array.isArray(tours) && tours.length > 0;
}
