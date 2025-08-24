import { supabase, ensureOnline } from '../supabaseClient.js';
import { getGlobalLineupConfig } from './configService.js'; // para el fallback

export async function startDivision(division, season, startDate, doubleRound, config) {
  ensureOnline();
  const payload = {
    name:         `${division} - ${season}`,
    division,
    season,
    start_date:   startDate,
    double_round: doubleRound,
    starters:     config.starters,
    subs:         config.subs
  };
  const { data: tour, error: tourError } = await supabase
    .from('tournaments')
    .upsert(payload, { onConflict: ['division','season'] })
    .select('id, starters, subs')
    .single();
  if (tourError) throw tourError;
  return tour;
}

export async function getTournamentConfig(division, season) {
  ensureOnline();
  const { data, error } = await supabase
    .from('tournaments')
    .select('starters,subs')
    .eq('division', division)
    .eq('season',   season)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    return getGlobalLineupConfig();
  }
  return { starters: data.starters, subs: data.subs };
}

export async function addTournamentTeams(division, season, teamIds, tournamentId) {
  ensureOnline();
  if (!teamIds?.length) return;
  // insertar en tournament_teams
  const rowsTT = teamIds.map(id => ({ division, season, team_id: id }));
  const { error: e1 } = await supabase.from('tournament_teams').insert(rowsTT);
  if (e1) throw e1;
  // inicializar stats
  const rowsStats = teamIds.map(team_id => ({
    tournament_id: tournamentId,
    team_id,
    wins:   0, draws: 0, losses: 0, gf: 0, gc: 0
  }));
  const { error: e2 } = await supabase.from('team_tournament_stats').insert(rowsStats);
  if (e2) console.error('No se pudieron inicializar stats:', e2);
}

/**
 * Recupera los equipos YA snapshot de un torneo en curso.
 */
export async function getTournamentTeams(division, season) {
  ensureOnline();
  const { data, error } = await supabase
    .from('tournament_teams')
    .select('team_id')
    .eq('division', division)
    .eq('season',   season);
  if (error) throw error;
  // devuelve [{ team_id: 1 },…]
  return data;
}

/**
 * Borra un torneo y sus datos relacionados para la division+season indicadas.
 * NOTA: esto elimina datos permanentemente. Hacer backup si es necesario.
 */
export async function deleteTournament(division, season) {
  ensureOnline();

  // 1) obtener el torneo
  const { data: tour, error: tourErr } = await supabase
    .from('tournaments')
    .select('id')
    .eq('division', division)
    .eq('season', season)
    .maybeSingle();
  if (tourErr) throw tourErr;
  if (!tour) {
    // no hay torneo: nada que borrar
    return null;
  }
  const tournamentId = tour.id;

  // 2) obtener jornadas relacionadas (si las hay)
  const { data: jornadas = [], error: jErr } = await supabase
    .from('jornadas')
    .select('id')
    .eq('division', division)
    .eq('season', season);
  if (jErr) throw jErr;
  const jornadaIds = (jornadas || []).map(j => j.id);

  // 3) obtener los partidos de esas jornadas
  let matchIds = [];
  if (jornadaIds.length) {
    const { data: matches = [], error: mErr } = await supabase
      .from('matches')
      .select('id')
      .in('jornada_id', jornadaIds);
    if (mErr) throw mErr;
    matchIds = matches.map(m => m.id);
  }

  // 4) borrar player_goals -> matches -> scheduled_matches -> stats -> tournament_teams -> jornadas -> tournament
  try {
    // 4.1 player_goals
    if (matchIds.length) {
      const { error: pgErr } = await supabase
        .from('player_goals')
        .delete()
        .in('match_id', matchIds);
      if (pgErr) throw pgErr;
    }

    // 4.2 matches
    if (matchIds.length) {
      const { error: delMErr } = await supabase
        .from('matches')
        .delete()
        .in('id', matchIds);
      if (delMErr) throw delMErr;
    }

    // 4.3 scheduled_matches (por tournament_id)
    const { error: delSchedByTErr } = await supabase
      .from('scheduled_matches')
      .delete()
      .eq('tournament_id', tournamentId);
    if (delSchedByTErr) throw delSchedByTErr;

    // 4.3b scheduled_matches (por jornada_id) — por si hay filas sin tournament_id
    if (jornadaIds.length) {
      const { error: delSchedByJErr } = await supabase
        .from('scheduled_matches')
        .delete()
        .in('jornada_id', jornadaIds);
      if (delSchedByJErr) throw delSchedByJErr;
    }

    // 4.4 team_tournament_stats
    const { error: delStatsErr } = await supabase
      .from('team_tournament_stats')
      .delete()
      .eq('tournament_id', tournamentId);
    if (delStatsErr) throw delStatsErr;

    // 4.5 tournament_teams (por division+season)
    const { error: delTTErr } = await supabase
      .from('tournament_teams')
      .delete()
      .eq('division', division)
      .eq('season', season);
    if (delTTErr) throw delTTErr;

    // 4.6 jornadas
    if (jornadaIds.length) {
      const { error: delJErr } = await supabase
        .from('jornadas')
        .delete()
        .in('id', jornadaIds);
      if (delJErr) throw delJErr;
    }

    // 4.7 finalmente eliminar el torneo
    const { error: delTErr } = await supabase
      .from('tournaments')
      .delete()
      .eq('id', tournamentId);
    if (delTErr) throw delTErr;

    return true;
  } catch (err) {
    // Re-throw para que el frontend lo maneje
    throw err;
  }
}
