// src/services/matchesService.js
import { supabase } from '../supabaseClient.js';
import { getTeams } from './teamsService.js';

const TOURNAMENT_NAME = 'Clausura 2025';

// Busca o crea el torneo “Clausura 2025”
export async function getOrCreateTournament() {
  const { data: tournament, error } = await supabase
    .from('tournaments')
    .select('id')
    .eq('name', TOURNAMENT_NAME)
    .single();
  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching tournament:', error);
    return null;
  }
  if (!tournament) {
    const today = new Date();
    const start = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
    const end = new Date(today.getFullYear(), 11, 31).toISOString().split('T')[0];
    const { data, error: insertErr } = await supabase
      .from('tournaments')
      .insert([{ name: TOURNAMENT_NAME, start_date: start, end_date: end }])
      .select('id')
      .single();
    if (insertErr) {
      console.error('Error inserting tournament:', insertErr);
      return null;
    }
    return data.id;
  }
  return tournament.id;
}

// Crea un partido en la jornada indicada y actualiza estadísticas
export async function createMatch({ team1Id, team2Id, goals1, goals2, playerGoalsInput, jornadaId }) {
  const tournamentId = await getOrCreateTournament();
  if (!tournamentId) throw new Error('No se pudo obtener torneo');

  // Insertar en “matches”
  const { data: matchData, error: matchErr } = await supabase
    .from('matches')
    .insert([{
      team1_id: team1Id,
      team2_id: team2Id,
      goals1,
      goals2,
      tournament_id: tournamentId,
      jornada_id: jornadaId,
      date: new Date().toISOString().split('T')[0]
    }])
    .select('id')
    .single();
  if (matchErr) {
    console.error('Error inserting match:', matchErr);
    throw matchErr;
  }

  // Actualizar stats en team_tournament_stats y en teams.wins/draws/losses
  const teamsStats = [
    { teamId: team1Id, goalsFor: goals1, goalsAgainst: goals2 },
    { teamId: team2Id, goalsFor: goals2, goalsAgainst: goals1 }
  ];

  for (const ts of teamsStats) {
    const { data: existing, error: fetchErr } = await supabase
      .from('team_tournament_stats')
      .select('id, wins, draws, losses')
      .match({ team_id: ts.teamId, tournament_id: tournamentId })
      .single();
    if (fetchErr && fetchErr.code !== 'PGRST116') {
      console.error('Error fetching team_tournament_stats:', fetchErr);
      continue;
    }
    let wins = 0, draws = 0, losses = 0;
    if (existing) {
      wins = existing.wins;
      draws = existing.draws;
      losses = existing.losses;
    }
    if (ts.goalsFor > ts.goalsAgainst) wins += 1;
    else if (ts.goalsFor < ts.goalsAgainst) losses += 1;
    else draws += 1;
    if (existing) {
      await supabase
        .from('team_tournament_stats')
        .update({ wins, draws, losses })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('team_tournament_stats')
        .insert([{ team_id: ts.teamId, tournament_id, wins, draws, losses }]);
    }
    const updateField = ts.goalsFor > ts.goalsAgainst
      ? 'wins' : ts.goalsFor < ts.goalsAgainst ? 'losses' : 'draws';
    await supabase
      .from('teams')
      .update({ [updateField]: supabase.raw("?? + 1", ['teams.' + updateField]) })
      .eq('id', ts.teamId);
  }

  // Registrar goles por jugador en player_goals
  for (const pg of playerGoalsInput) {
    if (pg.goals > 0) {
      await supabase
        .from('player_goals')
        .insert([{ player_id: pg.playerId, goals: pg.goals }]);
    }
  }

  return matchData.id;
}

// Obtener todos los partidos de una jornada
export async function getMatchesByJornada(jornadaId) {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('jornada_id', jornadaId)
    .order('date', { ascending: true });
  if (error) throw error;
  return data;
}
