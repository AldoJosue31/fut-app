// src/renderer/services/matchesService.js
import { supabase } from '../supabaseClient.js';
import { getTeams } from './teamsService.js';

const TOURNAMENT_NAME = 'Clausura 2025';

// Crear un partido con torneo (jornada) asociado
export async function createMatch({ team1Id, team2Id, goals1, goals2, playerGoalsInput, jornadaId }) {
  // Insertamos en matches usando tournament_id para referir la jornada
  const { data: matchData, error: matchError } = await supabase
    .from('matches')
    .insert([{
      team1_id: team1Id,
      team2_id: team2Id,
      goals1,
      goals2,
      tournament_id: jornadaId,
      date: new Date().toISOString().split('T')[0]
    }])
    .select('id')
    .single();
  if (matchError) throw matchError;
  const matchId = matchData.id;

  // Registrar goles por jugador
  if (playerGoalsInput && playerGoalsInput.length) {
    const playerGoals = playerGoalsInput.map(pg => ({ player_id: pg.playerId, goals: pg.goals, match_id: matchId }));
    const { error: pgError } = await supabase
      .from('player_goals')
      .insert(playerGoals);
    if (pgError) console.error('Error registrando goles por jugador:', pgError);
  }

  return matchData;
}

// Obtener partidos filtrados por tournament_id (antes jornada_id)
export async function getMatchesByJornada(jornadaId) {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('tournament_id', jornadaId)
    .order('date', { ascending: true });
  if (error) throw error;
  return data;
}
