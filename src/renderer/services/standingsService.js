// src/services/standingsService.js
import { supabase, ensureOnline } from '../supabaseClient.js';

export async function getStandings(division, season) {
  ensureOnline();

  // 1) Intentamos leer el torneo; si no existe, devolvemos array vacío
  const { data: tour, error: tourError } = await supabase
    .from('tournaments')
    .select('id')
    .eq('division', division)
    .eq('season', season)
    .maybeSingle();   // <- usa maybeSingle en lugar de single()
  if (tourError) throw tourError;
  if (!tour) {
    // No hay torneo iniciado para esa división/temporada
    return [];
  }

  // 2) Leemos las estadísticas de team_tournament_stats
  const { data: stats, error: statsError } = await supabase
    .from('team_tournament_stats')
    .select('team_id, wins, draws, losses, gf, gc')
    .eq('tournament_id', tour.id);
  if (statsError) throw statsError;

  // 3) Traemos los nombres de equipo
  const teamIds = stats.map(s => s.team_id);
  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .select('id,name')
    .in('id', teamIds);
  if (teamsError) throw teamsError;

  // 4) Formateamos y devolvemos ordenado
  const table = stats.map(s => {
    const team = teams.find(t => t.id === s.team_id);
    const PJ  = s.wins + s.draws + s.losses;
    const PTS = s.wins * 3 + s.draws;
    const DG  = s.gf - s.gc;
    return {
      id:   s.team_id,
      name: team?.name || '—',
      stats: {
        PJ,
        G:    s.wins,
        E:    s.draws,
        P:    s.losses,
        GF:   s.gf,
        GC:   s.gc,
        DG,
        PTS
      }
    };
  });

  // Orden descendente por puntos y luego por goles a favor
  return table.sort((a, b) =>
    b.stats.PTS - a.stats.PTS || b.stats.GF - a.stats.GF
  );
}

/**
 * Obtiene la clasificación acumulada hasta una jornada concreta.
 * @param {string} division
 * @param {string} season
 * @param {number} uptoJornadaId  // id numérico de la jornada “tope”
 */
export async function getStandingsByJornada(division, season, jornadaId) {
  ensureOnline();

  // 1) Traer IDs de jornadas <= jornadaId
  const { data: js, error: errJ } = await supabase
    .from('jornadas')
    .select('id')
    .eq('division', division)
    .eq('season', season)
    .lte('id', jornadaId);
  if (errJ) throw errJ;
  const jornadaIds = js.map(j => j.id);

  if (jornadaIds.length === 0) {
    return [];
  }

  // 2) Traer todos los partidos de esas jornadas
  const { data: matches, error: errM } = await supabase
    .from('matches')
    .select('team1_id,team2_id,goals1,goals2')
    .in('jornada_id', jornadaIds);
  if (errM) throw errM;

    // 2b) Ignorar partidos sin resultado (goals1 o goals2 === null)
  const played = matches.filter(m => m.goals1 != null && m.goals2 != null);


  // 3) Acumular stats por equipo
  const statsMap = {};
  function aseg(teamId) {
    if (!statsMap[teamId]) {
      statsMap[teamId] = { PJ:0, G:0, E:0, P:0, GF:0, GC:0 };
    }
    return statsMap[teamId];
  }

  for (const m of played) {
    const a = aseg(m.team1_id);
    const b = aseg(m.team2_id);
    a.PJ++; b.PJ++;
    a.GF += m.goals1;  a.GC += m.goals2;
    b.GF += m.goals2;  b.GC += m.goals1;

    if (m.goals1 > m.goals2) {
      a.G++; b.P++;
    } else if (m.goals1 < m.goals2) {
      b.G++; a.P++;
    } else {
      a.E++; b.E++;
    }
  }

  // 4) Traer nombres de equipos
  const teamIds = Object.keys(statsMap).map(id => +id);
  const { data: teams, error: errT } = await supabase
    .from('teams')
    .select('id,name')
    .in('id', teamIds);
  if (errT) throw errT;

  // 5) Formatear y ordenar
  const table = teamIds.map(id => {
    const s = statsMap[id];
    const team = teams.find(t => t.id === id);
    const PTS = s.G * 3 + s.E;
    return {
      id,
      name: team?.name || '–',
      stats: {
        PJ: s.PJ,
        G:  s.G,
        E:  s.E,
        P:  s.P,
        GF: s.GF,
        GC: s.GC,
        DG: s.GF - s.GC,
        PTS
      }
    };
  });

  return table.sort((a,b) =>
    b.stats.PTS - a.stats.PTS
    || b.stats.DG  - a.stats.DG
    || b.stats.GF  - a.stats.GF
  );
}
