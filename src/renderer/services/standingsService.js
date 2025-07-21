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
