// src/renderer/pages/Clasificacion.jsx
import React, { useState, useEffect } from 'react';
import { ClassificationTableSkeleton } from '../components/Skeletons.jsx';

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

  // 1) Cargo todas las jornadas y filtro las jugadas
  useEffect(() => {
    (async () => {
      const division = localStorage.getItem('division') || 'Primera';
      const season   = localStorage.getItem('season')   || 'Apertura 2025';
      const allJ = await getJornadas();
      let filtered = allJ
        .filter(j => j.division === division && j.season === season)
        .sort((a,b) => a.id - b.id);
      if (filtered.length === 0) {
        filtered = allJ.sort((a,b) => a.id - b.id);
      }
      setJornadas(filtered);

      // busco qué jornadas tienen al menos un partido con resultado
      const { data: ms } = await supabase
        .from('matches')
        .select('jornada_id')
        .not('goals1','is',null)
        .not('goals2','is',null)
        .in('jornada_id', filtered.map(j => j.id));
      const playedIds = new Set(ms.map(m => m.jornada_id));
      setPlayedJornadas(filtered.filter(j => playedIds.has(j.id)));

      // por defecto muestro “Última jornada…”
      setSelectedJornada(null);
    })();
  }, []);

  // 2) Recalculo la tabla cada vez que cambia la jornada seleccionada
  useEffect(() => {
    (async () => {
      const division = localStorage.getItem('division') || 'Primera';
      const season   = localStorage.getItem('season')   || 'Apertura 2025';
      let data;

      if (selectedJornada == null) {
        // si no hay jornada concreta: tomar la última jugada
        if (playedJornadas.length > 0) {
          const lastJ = playedJornadas[playedJornadas.length - 1].id;
          data = await getStandingsByJornada(division, season, lastJ);
        } else {
          // si no hay ninguna jornada jugada, tabla vacía
          data = [];
        }
      } else {
        // clasificación hasta la jornada concreta
        data = await getStandingsByJornada(division, season, selectedJornada);
      }

      setClassificationData(data);
    })();
  }, [selectedJornada, playedJornadas]);

  // 3) Carga goleadores una vez
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

  // Navegación de jornadas en el selector
  const prevJ = () => {
    if (selectedJornada == null) {
      // pasar de “null” a la última jugada
      const last = playedJornadas[playedJornadas.length - 1];
      if (last) setSelectedJornada(last.id);
    } else {
      const idx = playedJornadas.findIndex(j => j.id === selectedJornada);
      if (idx > 0) setSelectedJornada(playedJornadas[idx - 1].id);
      else setSelectedJornada(null);
    }
  };
  const nextJ = () => {
    if (selectedJornada == null) {
      const first = playedJornadas[0];
      if (first) setSelectedJornada(first.id);
    } else {
      const idx = playedJornadas.findIndex(j => j.id === selectedJornada);
      if (idx < playedJornadas.length - 1) {
        setSelectedJornada(playedJornadas[idx + 1].id);
      } else {
        setSelectedJornada(null);
      }
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
        {/* — TAB “Tabla” — */}
        {activeTab === 'Tabla' && (
          <div className="classification-container">

            {/* Selector de jornada */}
            <div className="jornadas-nav" style={{ marginBottom: '1rem' }}>
              <button onClick={prevJ} className="team-btn"
                disabled={playedJornadas.length === 0}>{'<'}</button>
              <span className="jornada-title" style={{ margin: '0 1rem' }}>
                {selectedJornada == null
                  ? `Última jornada (hasta ${playedJornadas[playedJornadas.length - 1]?.name || '–'})`
                  : jornadas.find(j => j.id === selectedJornada)?.name
                }
              </span>
              <button onClick={nextJ} className="team-btn"
                disabled={playedJornadas.length === 0}>{'>'}</button>
            </div>
{classificationData.length === 0 ? (
  <table className="classification-table">
    {/* Ponemos el tbody que devuelve el skeleton dentro de una tabla */}
    <ClassificationTableSkeleton rows={10} />
  </table>
) : (
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
)}


          </div>
        )}


        {/* — TAB “Jornadas” — */}
        {activeTab === 'Jornadas' && (
          <div className="jornadas-section">
            <p style={{ color: '#ccc' }}>
              Aquí podrías mostrar un detalle por jornada usando los mismos datos.
            </p>
          </div>
        )}

        {/* — TAB “Goleadores” — */}
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
                      <span className="team-color"/>
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
