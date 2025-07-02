// src/services/playersService.js
import { supabase, ensureOnline } from '../supabaseClient';

export async function getPlayersByTeam(teamId) {
  ensureOnline(); // Lanza error si no hay conexión
  const { data, error } = await supabase
    .from('jugadores')
    .select('id, nombre, apellido, equipo_id')
    .eq('equipo_id', teamId);
  if (error) throw error;
  return data;
}

export async function addPlayers(players) {
  ensureOnline(); // Lanza error si no hay conexión
  const { error } = await supabase
    .from('jugadores')
    .insert(players);
  if (error) throw error;
}

// ---------------------------------------------------
// Nuevas funciones para estadísticas de goles
export const getPlayerStats = async (playerId) => {
  ensureOnline(); // Lanza error si no hay conexión
  // asumiendo que tienes una tabla player_goals con columnas player_id, season, goals
  const { data, error } = await supabase
    .from('player_goals')
    .select('goals')
    .eq('player_id', playerId);
  if (error) throw error;
  // suma todos los goals
  const total_goals = data.reduce((sum, row) => sum + row.goals, 0);
  return { total_goals };
};

export const getPlayerSeasonStats = async (playerId, season) => {
  ensureOnline(); // Lanza error si no hay conexión
  const { data, error } = await supabase
    .from('player_goals')
    .select('goals')
    .match({ player_id: playerId, season })
    .single();
  if (error) throw error;
  return { season_goals: data.goals };
};
