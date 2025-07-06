// src/services/teamsService.js
import { supabase, ensureOnline } from '../supabaseClient';


export const getTeamsWithStats = async (division) => {
  ensureOnline(); // Lanza error si no hay conexión
  const { data, error } = await supabase
    .from('teams_with_stats')
    .select('*')
    .eq('division', division)
    .order('name', { ascending: true });
  if (error) throw error;
  return data;
};

export const getTeams = async () => {
  ensureOnline(); // Lanza error si no hay conexión
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return data;
};

export const addTeam = async (team) => {
  ensureOnline();
  const { data, error } = await supabase
    .from('teams')
    .insert([team])     // -> { name, color, founded, status, division }
    .select('id')       // pedimos que nos devuelva el id generado
    .single();          // seleccionamos un único registro

  if (error) throw error;
  return data;         // -> { id: 123 }
};

export const deleteTeam = async (id) => {
  ensureOnline(); // Lanza error si no hay conexión
  const { error } = await supabase
    .from('teams')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

export async function updateTeam(id, team) {
  ensureOnline(); // Lanza error si no hay conexión
  const { data, error } = await supabase
    .from('teams')
    .update(team)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

// ---------------------------------------------------
// Nuevas funciones para estadísticas
export const getTeamStats = async (teamId) => {
  ensureOnline(); // Lanza error si no hay conexión
  // usa los campos wins, draws, losses de la tabla teams
  const { data, error } = await supabase
    .from('teams')
    .select('wins,draws,losses')
    .eq('id', teamId)
    .single();
  if (error) throw error;
  return {
    total_wins: data.wins,
    total_draws: data.draws,
    total_losses: data.losses
  };
};

export const getTeamTournamentStats = async (teamId, tournamentId) => {
  ensureOnline(); // Lanza error si no hay conexión
  const { data, error } = await supabase
    .from('team_tournament_stats')
    .select('wins,draws,losses')
    .match({ team_id: teamId, tournament_id: tournamentId })
    .maybeSingle();      // <-- aquí
  if (error) throw error;
  // si no hay datos, devolvemos ceros
  return {
    wins: data?.wins ?? 0,
    draws: data?.draws ?? 0,
    losses: data?.losses ?? 0
  };
};
