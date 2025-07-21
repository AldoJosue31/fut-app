import { supabase, ensureOnline } from '../supabaseClient';

/**
 * Inicia (o actualiza) un torneo/división: guarda fecha, doble vuelta
 * y la configuración de titulares/subs en la tabla `tournaments`.
 *
 * @param {string} division
 * @param {string} season
 * @param {string} startDate   // 'YYYY-MM-DD'
 * @param {boolean} doubleRound
 * @param {{starters:number, subs:number}} config
 */

export async function startDivision(
  division,
  season,
  startDate,
  doubleRound,            // ← nuevo
  config
) {
   ensureOnline();
  // Aquí ibas a insertar en tournament_teams; ahora lo haremos en `tournaments`
  // Guardamos en la tabla `tournaments` la configuración completa:
  // 1) Upsert en `tournaments`, devolviendo el ID para usarlo si lo necesitas
  const payload = {
    // nombre legible del torneo
    name:         `${division} - ${season}`,
    division,
    season,
    start_date:   startDate,
    double_round: doubleRound,   // ← incluimos el flag en la tabla
    starters:     config.starters,
    subs:         config.subs

  };
  // Le pedimos que nos devuelva id, starters y subs
  const { data: tour, error: tourError } = await supabase
    .from('tournaments')
    .upsert(payload, { onConflict: ['division','season'] })
    .select('id, starters, subs')
    .single();
  if (tourError) throw tourError;
  // opcional: si luego necesitas el ID:
  // Ahora `tour` tiene { id, starters, subs }
  return tour;
 }
  export async function getTournamentConfig(division, season) {
   ensureOnline();
  const { data, error } = await supabase
    .from('tournaments')
    .select('starters,subs')
    .eq('division', division)
    .eq('season', season)
    .maybeSingle();   // NO rompe si no hay filas
   if (error) throw error;
     if (!data) {
    // si no hay torneo guardado, usamos la config global
    return getGlobalLineupConfig();
  }
  return { starters: data.starters, subs: data.subs };
 }

// Obtener equipos que forman parte de un torneo (por división y temporada)
export async function getTournamentTeams(division, season) {
  ensureOnline(); // Lanza error si no hay conexión
  const { data, error } = await supabase
    .from('tournament_teams')
    .select('team_id')
    .eq('division', division)
    .eq('season', season);
  if (error) throw error;
  // Devuelve un array de objetos { team_id }
  return data;
}

// Insertar varios equipos en un torneo (snapshot)
export async function addTournamentTeams(division, season, teamIds) {
  ensureOnline(); // Lanza error si no hay conexión
  if (!teamIds || teamIds.length === 0) return;
  const rows = teamIds.map(id => ({ division, season, team_id: id }));
  const { error } = await supabase
    .from('tournament_teams')
    .insert(rows);
  if (error) throw error;
}

export async function deleteTournamentTeamsByTeam(teamId) {
  ensureOnline(); // Lanza error si no hay conexión
  const { error } = await supabase
    .from('tournament_teams')
    .delete()
    .eq('team_id', teamId);
  if (error) throw error;
}
