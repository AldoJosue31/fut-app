import { supabase, ensureOnline } from '../supabaseClient.js';

/**
 * Busca el ID de torneo a partir de división+temporada.
 */
async function getTournamentId(division, season) {
  ensureOnline();
  const { data, error } = await supabase
    .from('tournaments')
    .select('id')
    .eq('division', division)
    .eq('season', season)
    .single();
  if (error) throw error;
  return data.id;
}

/**
 * Genera el calendario round‑robin de forma idempotente.
 */
export async function initRoundRobinSchedule(tournamentId, teams, isDouble = false) {
  ensureOnline();
  await supabase.from('scheduled_matches').delete().eq('tournament_id', tournamentId);
  const list = [...teams];
  if (list.length % 2) list.push({ id: null });
  const rounds = [];
  for (let i = 0; i < list.length - 1; i++) {
    const pairs = [];
    for (let j = 0; j < list.length / 2; j++) {
      const a = list[j], b = list[list.length - 1 - j];
      if (a.id && b.id) pairs.push({ team1_id: a.id, team2_id: b.id });
    }
    rounds.push(pairs);
    list.splice(1, 0, list.pop());
  }
  if (isDouble) {
    rounds.push(...rounds.map(r => r.map(p => ({
      team1_id: p.team2_id,
      team2_id: p.team1_id
    }))));
  }
  const cols = 6;
  const inserts = [];
  for (let r = 0; r < rounds.length; r++) {
    for (let c = 0; c < rounds[r].length; c++) {
      inserts.push({
        tournament_id: tournamentId,
        jornada_id:    null,
        team1_id:      rounds[r][c].team1_id,
        team2_id:      rounds[r][c].team2_id,
        slot_index:    r * cols + c
      });
    }
  }
  const { error } = await supabase.from('scheduled_matches').insert(inserts);
  if (error) throw error;
}

/**
 * Devuelve el round‑robin “base” para un torneo.
 */
export async function getRoundRobinSchedule(division, season) {
  ensureOnline();
  const tId = await getTournamentId(division, season);
  const { data, error } = await supabase
    .from('scheduled_matches')
    .select('id, team1_id, team2_id, slot_index')
    .eq('tournament_id', tId)
    .order('slot_index', { ascending: true });
  if (error) throw error;
  return data;
}

/**
 * Recupera, para una jornada ya confirmada, todos los slots y los partidos
 * realmente jugados, y los fusiona por team1_id/team2_id.
 */
export async function getScheduledMatchesByJornada(jornadaId) {
  ensureOnline();
  // 1) Slots programados en esta jornada
  const { data: scheds, error: e1 } = await supabase
    .from('scheduled_matches')
    .select('id, team1_id, team2_id, slot_index')
    .eq('jornada_id', jornadaId)
    .order('slot_index', { ascending: true });
  if (e1) throw e1;

  // 2) Partidos confirmados en esta jornada
  const { data: matches, error: e2 } = await supabase
    .from('matches')
    .select('id, team1_id, team2_id, goals1, goals2')
    .eq('jornada_id', jornadaId);
  if (e2) throw e2;

  // 3) Fusionar
  return scheds.map(s => {
    const m = matches.find(m =>
      m.team1_id === s.team1_id && m.team2_id === s.team2_id
    );
    return {
      scheduledId: s.id,
      matchId:     m?.id     ?? null,
      team1_id:    s.team1_id,
      team2_id:    s.team2_id,
      slot_index:  s.slot_index,
      goals1:      m?.goals1 ?? null,
      goals2:      m?.goals2 ?? null
    };
  });
}

/**
 * Mueve un partido ya existente a una nueva posición.
 */
export async function moveScheduledMatch(scheduledId, newSlotIndex) {
  ensureOnline();
  const { data, error } = await supabase
    .from('scheduled_matches')
    .update({ slot_index: newSlotIndex })
    .eq('id', scheduledId);
  if (error) throw error;
  return data;
}

/**
 * Confirma todos los partidos programados de una jornada:
 *  - Inserta un registro en matches para cada slot.
 *  - Actualiza scheduled_matches.jornada_id.
 */
export async function confirmJornadaSchedule(jornadaId) {
  ensureOnline();
  // 1) Leer división/season
  const { data: jr } = await supabase
    .from('jornadas')
    .select('division,season')
    .eq('id', jornadaId)
    .single();
  // 2) Obtener tournament_id
  const { data: tour } = await supabase
    .from('tournaments')
    .select('id')
    .eq('division', jr.division)
    .eq('season', jr.season)
    .single();
  const tId = tour.id;

  // 3) Slots pendientes (jornada_id IS NULL)
  const { data: scheds } = await supabase
    .from('scheduled_matches')
    .select('id, team1_id, team2_id')
    .eq('tournament_id', tId)
    .is('jornada_id', null);

  // 4) Crear partidos y actualizar jornada_id
  for (const s of scheds) {
    const { data: match } = await supabase
      .from('matches')
      .insert([{
        team1_id, team2_id: s.team2_id,
        goals1: null, goals2: null,
        jornada_id: jornadaId
      }])
      .select('id')
      .single();
    await supabase
      .from('scheduled_matches')
      .update({ jornada_id: jornadaId })
      .eq('id', s.id);
  }
  return true;
}
