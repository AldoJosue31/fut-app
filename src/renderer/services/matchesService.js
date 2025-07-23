// src/services/matchesService.js
import { supabase, ensureOnline } from '../supabaseClient.js';
import { getTournamentConfig }     from './tournamentService.js';

/**
 * Crea un partido asociado a una jornada concreta.
 */
export async function createMatch({
  team1Id, team2Id, goals1, goals2,
  playerGoalsInput = [], jornadaId,
  referee = ''
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
      referee,                // ← guardamos árbitro
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
  playerGoalsInput = [],
  referee = ''
}) {
  ensureOnline();

  // ── 0) Traer datos viejos para poder “deshacer” sus stats ──
  const { data: old, error: oldErr } = await supabase
    .from('matches')
    .select('goals1,goals2,team1_id,team2_id,jornada_id')
    .eq('id', matchId)
    .single();
  if (oldErr) console.error('Error fetch old match:', oldErr);

  // ── 1) Actualizamos goles ──
  const { data: updated, error: updErr } = await supabase
    .from('matches')
    .update({ goals1, goals2, referee })    // ← actualizamos referee
    .eq('id', matchId)
    .select('*')
    .single();
  if (updErr) throw updErr;

  // 2) Reemplazamos los registros de player_goals
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

  // —————————————————————————
  // 3) Incrementar team_tournament_stats vía RPC
  // —————————————————————————

  // ── 3) Anulamos primero los puntos viejos sólo si el partido NO era 0–0 ──
  if (old && (old.goals1 !== 0 || old.goals2 !== 0)) {
    const { data: jrOld } = await supabase
      .from('jornadas')
      .select('division,season')
      .eq('id', old.jornada_id)
      .single();
    const { data: tourOld } = await supabase
      .from('tournaments')
      .select('id')
      .eq('division', jrOld.division)
      .eq('season',   jrOld.season)
      .single();
    const tId = tourOld.id;
    // decide cómo revertir
    const decide = (g1, g2) => {
      if (g1 > g2)      return ['wins','losses'];
      if (g1 < g2)      return ['losses','wins'];
      return ['draws','draws'];
    };
    const [oldRes1,oldRes2] = decide(old.goals1, old.goals2);
    // RPC con signo negativo para revertir
    await supabase.rpc('increment_team_tournament_stats', {
      p_team_id: old.team1_id, p_tournament_id: tId,
      p_result_column: oldRes1,
      p_goals_for: -old.goals1, p_goals_against: -old.goals2
    });
    await supabase.rpc('increment_team_tournament_stats', {
      p_team_id: old.team2_id, p_tournament_id: tId,
      p_result_column: oldRes2,
      p_goals_for: -old.goals2, p_goals_against: -old.goals1
    });

    // ── 4) Ahora sumamos los nuevos ──
    const [newRes1,newRes2] = decide(goals1, goals2);
    await supabase.rpc('increment_team_tournament_stats', {
      p_team_id: updated.team1_id, p_tournament_id: tId,
      p_result_column: newRes1,
      p_goals_for: goals1, p_goals_against: goals2
    });
    await supabase.rpc('increment_team_tournament_stats', {
      p_team_id: updated.team2_id, p_tournament_id: tId,
      p_result_column: newRes2,
      p_goals_for: goals2, p_goals_against: goals1
    });
  }

  return updated;
}

export async function getMatchDetail(matchId) {
  ensureOnline();

  // 1) Traigo goles y referee del partido
  const { data: match, error: mErr } = await supabase
    .from('matches')
    .select('goals1,goals2,referee')      // ← pedimos referee
    .eq('id', matchId)
    .single();
  if (mErr) throw mErr;

  // 2) Traigo el lineup (player_goals)
  const { data: pGoals, error: pgErr } = await supabase
    .from('player_goals')
    .select('player_id,goals')
    .eq('match_id', matchId);
  if (pgErr) throw pgErr;

  // 3) Devuelvo todo
  return {
    goals1:   match.goals1,
    goals2:   match.goals2,
    referee:  match.referee,              // ← devolvemos referee
    lineup:   pGoals.map(pg => ({
      playerId: pg.player_id,
      goals:    pg.goals,
      // no sabemos si fue starter o sub: eso podrías guardarlo tú en player_goals o inferirlo
    }))
  };
}
