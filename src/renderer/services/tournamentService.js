import { supabase } from '../supabaseClient.js';

// Obtener equipos que forman parte de un torneo (por división y temporada)
export async function getTournamentTeams(division, season) {
  const { data, error } = await supabase
    .from('tournament_teams')
    .select('team_id')
    .eq('division', division)
    .eq('season', season);
  if (error) throw error;
  // Devuelve un array de objetos { team_id }
  return data;
}

// Insertar varios equipos en un torneo (snapshot)
export async function addTournamentTeams(division, season, teamIds) {
  if (!teamIds || teamIds.length === 0) return;
  const rows = teamIds.map(id => ({ division, season, team_id: id }));
  const { error } = await supabase
    .from('tournament_teams')
    .insert(rows);
  if (error) throw error;
}

export async function deleteTournamentTeamsByTeam(teamId) {
  const { error } = await supabase
    .from('tournament_teams')
    .delete()
    .eq('team_id', teamId);
  if (error) throw error;
}
