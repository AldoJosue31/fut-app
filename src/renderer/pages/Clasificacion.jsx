// src/renderer/pages/Clasificacion.jsx
import React, { useState, useEffect } from 'react';
import '../styles/styles.css';
import {
  getStandings,
  getStandingsByJornada
} from '../services/standingsService.js';
import { getPlayersByTeam, getPlayerStats } from '../services/playersService.js';
import { getTeams }       from '../services/teamsService.js';
import { getJornadas }    from '../services/jornadasService.js';
import { supabase }       from '../supabaseClient.js';

const tabs = ['Tabla','Jornadas','Goleadores'];

export default function Clasificacion() {
  const [activeTab, setActiveTab] = useState('Tabla');
  const [classificationData, setClassificationData] = useState([]);
  const [goleadoresData, setGoleadoresData] = useState([]);
  const [jornadas, setJornadas] = useState([]);
  const [playedJornadas, setPlayedJornadas] = useState([]);
  const [selectedJornada, setSelectedJornada] = useState(null);

  // ── DEBUG: ping rápido a Supabase ──
  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from('teams')
          .select('id')
          .limit(1);
        console.log('[DEBUG] supabase teams ping:', { data, error });
      } catch (err) {
        console.error('[DEBUG] supabase ping error:', err);
      }
    })();
  }, []);

  // 1) Carga lista de jornadas y detecta cuáles tienen partidos ya jugados
  useEffect(() => {
    (async () => {
      try {
        const division = localStorage.getItem('division') || 'Primera';
        const season   = localStorage.getItem('season')   || 'Apertura 2025';
        console.log('[DEBUG] cargando jornadas para', { division, season });

        const allJ = await getJornadas();
  let filtered = allJ
    .filter(j => j.division === division && j.season === season)
    .sort((a,b) => a.id - b.id);
  // si no encontramos nada para division+season, hacemos fallback a TODAS
  if (filtered.length === 0) {
    console.warn('[Clasificación] no hay jornadas para', division, season, '; mostrando todas');
    filtered = allJ.sort((a,b) => a.id - b.id);
  }
        console.log('[DEBUG] jornadas encontradas:', filtered);
        setJornadas(filtered);

        const { data: ms, error: msError } = await supabase
          .from('matches')
          .select('jornada_id')
          .not('goals1', 'is', null)
          .not('goals2', 'is', null)
          .in('jornada_id', filtered.map(j => j.id));
        if (msError) console.error('❌ Error fetch matches:', msError);

        const playedIds = new Set(ms.map(m => m.jornada_id));
        const pj = filtered.filter(j => playedIds.has(j.id));
        console.log('[DEBUG] jornadas jugadas:', pj);
        setPlayedJornadas(pj);

        setSelectedJornada(null);  // arrancamos en "Todas"
      } catch (err) {
        console.error('❌ Error cargando jornadas o matches:', err);
      }
    })();
  }, []);

  // 2) Recalcula la clasificación cada vez que cambie la jornada seleccionada
  useEffect(() => {
    async function fetchClassification() {
      try {
        const division = localStorage.getItem('division') || 'Primera';
        const season   = localStorage.getItem('season')   || 'Apertura 2025';
        let data;
    if (selectedJornada == null) {
      // "Todas las jornadas" → clasificación global completa
      data = await getStandings(division, season);
    } else {
      // clasificación hasta jornada seleccionada
      data = await getStandingsByJornada(division, season, selectedJornada);
    }
        console.log('[DEBUG] clasificación recibida:', data);
        setClassificationData(data);
      } catch (err) {
        console.error('❌ Error fetchClassification:', err);
      }
    }
    fetchClassification();
  }, [selectedJornada, playedJornadas]);

  // 3) Carga goleadores sólo una vez
  useEffect(() => {
    (async () => {
      try {
        const division = localStorage.getItem('division') || 'Primera';
        console.log('[DEBUG] cargando goleadores para división', division);
        const teams = await getTeams();
        const filtered = teams.filter(t => t.division === division);
        const list = [];
        for (const team of filtered) {
          const players = await getPlayersByTeam(team.id);
          for (const p of players) {
            const stats = await getPlayerStats(p.id).catch(() => ({ total_goals: 0 }));
            list.push({
              id:    p.id,
              name:  `${p.nombre} ${p.apellido}`,
              team:  team.name,
              goals: stats.total_goals
            });
          }
        }
        list.sort((a,b) => b.goals - a.goals);
        console.log('[DEBUG] goleadores:', list);
        setGoleadoresData(list);
      } catch (err) {
        console.error('❌ Error cargando goleadores:', err);
      }
    })();
  }, []);

  // Navegación de jornadas para el selector sobre la tabla
  const prevJ = () => {
    if (selectedJornada == null) {
      const last = playedJornadas[playedJornadas.length - 1];
      if (last) setSelectedJornada(last.id);
      return;
    }
    const idx = playedJornadas.findIndex(j => j.id === selectedJornada);
    if (idx > 0) {
      setSelectedJornada(playedJornadas[idx - 1].id);
    } else {
      setSelectedJornada(null);
    }
  };
  const nextJ = () => {
    if (selectedJornada == null) {
      const first = playedJornadas[0];
      if (first) setSelectedJornada(first.id);
      return;
    }
    const idx = playedJornadas.findIndex(j => j.id === selectedJornada);
    if (idx >= 0 && idx < playedJornadas.length - 1) {
      setSelectedJornada(playedJornadas[idx + 1].id);
    } else {
      setSelectedJornada(null);
    }
  };

  return (
    <div className="main">
      <h1 className="title">Clasificación</h1>
      <div className="content-box">

        {/* Pestañas */}
        <div className="tabs">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={activeTab === tab ? 'tab active-tab' : 'tab'}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* --- TAB “Tabla” --- */}
        {activeTab === 'Tabla' && (
          <div className="classification-container">

            {/* Selector de jornada encima de la tabla */}
            <div className="jornadas-nav" style={{ marginBottom: '1rem' }}>
              <button onClick={prevJ} className="team-btn"
                disabled={playedJornadas.length === 0}>
                {'<'}
              </button>
              <span className="jornada-title" style={{ margin: '0 1rem' }}>
                { selectedJornada == null
                    ? `Última jornada (hasta ${playedJornadas[playedJornadas.length - 1]?.name || '–'})`
                    : (jornadas.find(j => j.id === selectedJornada)?.name || '–')
                }
              </span>
              <button onClick={nextJ} className="team-btn"
                disabled={playedJornadas.length === 0}>
                {'>'}
              </button>
            </div>

            <table className="classification-table">
              <thead>
                <tr>
                  <th>#</th><th>Equipo</th><th>PJ</th><th>G</th><th>E</th>
                  <th>P</th><th>GF</th><th>GC</th><th>DG</th><th>PTS</th>
                </tr>
              </thead>
              <tbody>
                {classificationData.map((team, idx) => (
                  <tr key={team.id}>
                    <td>{idx + 1}</td>
                    <td className="team-cell">
                      <span className="team-color" />
                      <span className="team-name">{team.name}</span>
                    </td>
                    <td>{team.stats.PJ}</td>
                    <td>{team.stats.G}</td>
                    <td>{team.stats.E}</td>
                    <td>{team.stats.P}</td>
                    <td>{team.stats.GF}</td>
                    <td>{team.stats.GC}</td>
                    <td>{team.stats.DG}</td>
                    <td>{team.stats.PTS}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* --- TAB “Jornadas” --- */}
        {activeTab === 'Jornadas' && (
          <div className="jornadas-section">
            <p style={{ color: '#ccc' }}>
              Aquí podrías mostrar un resumen específico por jornada,
              usando los mismos datos de <code>classificationData</code>.
            </p>
          </div>
        )}

        {/* --- TAB “Goleadores” --- */}
        {activeTab === 'Goleadores' && (
          <div className="classification-container">
            <table className="classification-table">
              <thead>
                <tr><th>#</th><th>Nombre</th><th>Equipo</th><th>Goles</th></tr>
              </thead>
              <tbody>
                {goleadoresData.map((pl, idx) => (
                  <tr key={pl.id}>
                    <td>{idx + 1}</td>
                    <td className="team-cell">
                      <span className="team-color" />
                      <span className="team-name">{pl.name}</span>
                    </td>
                    <td>{pl.team}</td>
                    <td>{pl.goals}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
