// src/services/matchesService.js
import { supabase, ensureOnline } from '../supabaseClient.js';

/**
 * Crea un partido asociado a una jornada concreta.
 *
 * @param {Object} params
 * @param {number} params.team1Id
 * @param {number} params.team2Id
 * @param {number} params.goals1
 * @param {number} params.goals2
 * @param {Array<{playerId: number, goals: number}>} params.playerGoalsInput
 * @param {number} params.jornadaId
 */
export async function createMatch({
  team1Id,
  team2Id,
  goals1,
  goals2,
  playerGoalsInput,
  jornadaId
}) {
  ensureOnline();

  const { data: matchData, error: matchError } = await supabase
    .from('matches')
    .insert([{
      team1_id:   team1Id,
      team2_id:   team2Id,
      goals1,
      goals2,
      jornada_id: jornadaId,
      date:       new Date().toISOString().split('T')[0]
    }])
    .select('id')
    .single();

  if (matchError) throw matchError;
  const matchId = matchData.id;

  if (playerGoalsInput && playerGoalsInput.length > 0) {
    const playerGoals = playerGoalsInput.map(pg => ({
      player_id: pg.playerId,
      goals:     pg.goals,
      match_id:  matchId
    }));
    const { error: pgError } = await supabase
      .from('player_goals')
      .insert(playerGoals);

    if (pgError) console.error('Error registrando goles por jugador:', pgError);
  }

  return matchData;
}

/**
 * Recupera todos los partidos de una jornada dada.
 *
 * @param {number} jornadaId
 * @returns {Promise<Array>}
 */
export async function getMatchesByJornada(jornadaId) {
  ensureOnline();

  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('jornada_id', jornadaId)
    .order('date', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Actualiza el resultado de un partido ya creado.
 *
 * @param {Object} params
 * @param {number} params.matchId
 * @param {number} params.goals1
 * @param {number} params.goals2
 * @param {Array<{playerId: number, goals: number}>} [params.playerGoalsInput]
 * @param {Array<number>} [params.yc]
 * @param {Array<number>} [params.rc]
 * @param {{p1: number, p2: number}} [params.penalties]
 * @param {string} [params.referee]
 */
export async function updateMatchResult({
  matchId,
  goals1,
  goals2,
  playerGoalsInput = [],
  yc = [],
  rc = [],
  penalties = { p1: 0, p2: 0 },
  referee = ''
}) {
  ensureOnline();

  const { data: updated, error: updateError } = await supabase
    .from('matches')
    .update({
      goals1,
      goals2,
      yellow_cards: yc,
      red_cards: rc,
      penalties_p1: penalties.p1,
      penalties_p2: penalties.p2,
      referee
    })
    .eq('id', matchId);

  if (updateError) throw updateError;

  if (playerGoalsInput.length) {
    await supabase
      .from('player_goals')
      .delete()
      .eq('match_id', matchId);

    const toInsert = playerGoalsInput.map(pg => ({
      match_id:  matchId,
      player_id: pg.playerId,
      goals:     pg.goals
    }));

    const { error: pgError } = await supabase
      .from('player_goals')
      .insert(toInsert);

    if (pgError) console.error('Error registrando goles por jugador:', pgError);
  }

  return updated;
}
