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
