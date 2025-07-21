// src/services/matchesService.js
import { supabase, ensureOnline } from '../supabaseClient.js';
import { getTournamentConfig }     from './tournamentService.js';

/**
 * Crea un partido asociado a una jornada concreta.
 */
export async function createMatch({
  team1Id, team2Id, goals1, goals2,
  playerGoalsInput = [], jornadaId
}) {
  ensureOnline();

  // 1) Insertamos el partido
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

  // 2) Insertamos goles por jugador
  if (playerGoalsInput.length) {
    const rows = playerGoalsInput.map(pg => ({
      match_id:  matchId,
      player_id: pg.playerId,
      goals:     pg.goals
    }));
    const { error: pgError } = await supabase
      .from('player_goals')
      .insert(rows);
    if (pgError) console.error('Error en player_goals:', pgError);
  }

  return matchData;
}

/**
 * Recupera todos los partidos de una jornada dada.
 */
export async function getMatchesByJornada(jornadaId) {
  ensureOnline();
  if (!jornadaId) return [];

  // 1) Trayendo división y temporada de la jornada
  const { data: jornada, error: errJ } = await supabase
    .from('jornadas')
    .select('division,season')
    .eq('id', jornadaId)
    .single();
  if (errJ) throw errJ;

  // 2) Leemos configuración de lineup
  let starters = 5, subs = 6;
  try {
    const cfg = await getTournamentConfig(jornada.division, jornada.season);
    starters = cfg.starters;
    subs     = cfg.subs;
  } catch {
    // fallback
  }

  // 3) Leemos los partidos
  const { data: matches, error: errM } = await supabase
    .from('matches')
    .select('*')
    .eq('jornada_id', jornadaId)
    .order('date', { ascending: true });
  if (errM) throw errM;

  // 4) Devolvemos cada match con su config
  return matches.map(m => ({
    ...m,
    config: { starters, subs }
  }));
}

/**
 * Actualiza el resultado de un partido ya creado
 * y, opcionalmente, incrementa las stats de torneo vía RPC.
 */
export async function updateMatchResult({
  matchId,
  goals1,
  goals2,
  playerGoalsInput = []
}) {
  ensureOnline();

  // 1) Actualizamos únicamente goles *y* pedimos que nos devuelva la fila actualizada
  const { data: updated, error: updErr } = await supabase
    .from('matches')
    .update({ goals1, goals2 })
    .eq('id', matchId)
    .select('*')
    .single();
  if (updErr) throw updErr;

  // 2) Reemplazamos los registros de player_goals
  //    (si no tienes columna referee ni tarjetas, no las toques)
  await supabase
    .from('player_goals')
    .delete()
    .eq('match_id', matchId);

  if (playerGoalsInput.length) {
    const rows = playerGoalsInput.map(pg => ({
      match_id:  matchId,
      player_id: pg.playerId,
      goals:     pg.goals
    }));
    const { error: pgErr } = await supabase
      .from('player_goals')
      .insert(rows);
    if (pgErr) console.error('Error registrando goles por jugador:', pgErr);
  }

  return updated;
}
