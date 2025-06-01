// src/services/teamsService.js
import { supabase } from '../supabaseClient';

export const getTeams = async () => {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return data;
};

export const addTeam = async (team) => {
  const { data, error } = await supabase
    .from('teams')
    .insert([team])
    .select('id')
    .single();
  if (error) throw error;
  return data;
};

export const deleteTeam = async (id) => {
  const { error } = await supabase
    .from('teams')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

export async function updateTeam(id, team) {
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
