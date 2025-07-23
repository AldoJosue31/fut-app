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

const tabs = ['Tabla','Jornadas','Goleadores'];

export default function Clasificacion() {
  const [activeTab, setActiveTab]             = useState('Tabla');
  const [classificationData, setClassificationData] = useState([]);
  const [goleadoresData, setGoleadoresData]   = useState([]);
  const [jornadas, setJornadas]               = useState([]);
  const [lastPlayed, setLastPlayed]           = useState(null);
  const [selectedJornada, setSelectedJornada] = useState(null);

  // 1) Carga lista de jornadas al montar
  useEffect(() => {
    (async () => {
      const division = localStorage.getItem('division') || 'Primera';
      const season   = localStorage.getItem('season')   || 'Apertura 2025';
      const allJ = await getJornadas();
      const filtered = allJ
        .filter(j => j.division === division && j.season === season)
        .sort((a,b) => a.id - b.id);
      setJornadas(filtered);

      // Detectar la última jornada que tenga partidos (para "Todas")
      let maxPlayed = null;
      for (const j of filtered) {
        const matches = await getStandingsByJornada(division, season, j.id)
          .catch(() => []);
        if (matches.length > 0) {
          maxPlayed = j.id;
        }
      }
      setLastPlayed(maxPlayed);

      // valor null = “Todas las jornadas” (hasta la última jugada)
      setSelectedJornada(null);
    })();
  }, []);

  // 2) Cada vez que cambie selectedJornada, recargar la clasificación
  useEffect(() => {
    async function fetchClassification() {
      const division = localStorage.getItem('division') || 'Primera';
      const season   = localStorage.getItem('season')   || 'Apertura 2025';
      let data;
      if (selectedJornada == null) {
        // "Todas las jornadas" → hasta la última jornada existente
        const lastJ = jornadas[jornadas.length - 1]?.id;
        if (lastJ != null) {
          data = await getStandingsByJornada(division, season, lastJ);
        } else {
          data = []; // sin jornadas aún
        }
      } else {
        data = await getStandingsByJornada(division, season, selectedJornada);
      }
      setClassificationData(data);
    }
    fetchClassification();
  }, [selectedJornada]);

  // 3) Carga goleadores sólo una vez
  useEffect(() => {
    (async () => {
      const division = localStorage.getItem('division') || 'Primera';
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
      setGoleadoresData(list);
    })();
  }, []);

  // Navegación de jornadas para el selector sobre la tabla
  const prevJ = () => {
    // Si estoy en "Todas", voy a la última jornada jugada
    if (selectedJornada == null && lastPlayed != null) {
      setSelectedJornada(lastPlayed);
      return;
    }
    const idx = jornadas.findIndex(j => j.id === selectedJornada);
        // sólo retrocedo si hay jornada anterior y esa también fue jugada
    if (idx > 0 && jornadas[idx-1].id <= (lastPlayed ?? jornadas[jornadas.length-1].id)) {
      setSelectedJornada(jornadas[idx-1].id);
    } else {
      // si llegamos al principio, volvemos a "Todas"
      setSelectedJornada(null);
    }
  };
  const nextJ = () => {
    // Si estoy en "Todas", voy a la primera jornada jugada
    if (selectedJornada == null && lastPlayed != null) {
      setSelectedJornada(jornadas[0].id);
      return;
    }
    const idx = jornadas.findIndex(j => j.id === selectedJornada);
    // sólo avanzo si la siguiente jornada también fue jugada
    if (idx >= 0 && idx < jornadas.length - 1
        && jornadas[idx+1].id <= (lastPlayed ?? jornadas[jornadas.length-1].id)) {
      setSelectedJornada(jornadas[idx+1].id);
    } else {
      // si llegamos al final, volvemos a "Todas"
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
              <button onClick={prevJ} className="team-btn">
                {'<'}
              </button>
              <span className="jornada-title" style={{ margin: '0 1rem' }}>
                { selectedJornada == null
                    ? 'Todas las jornadas'
                    : (jornadas.find(j => j.id === selectedJornada)?.name || '–')
                }
              </span>
              <button onClick={nextJ} className="team-btn">
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
