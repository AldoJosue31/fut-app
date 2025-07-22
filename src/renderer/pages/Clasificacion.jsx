// src/renderer/pages/Clasificacion.jsx
import React, { useState, useEffect } from 'react';
import '../styles/styles.css';
import { getStandings }   from '../services/standingsService.js';
import { getPlayersByTeam, getPlayerStats } from '../services/playersService.js';
import { getTeams }       from '../services/teamsService.js';

const tabs = ['Tabla','Jornadas','Goleadores'];

export default function Clasificacion() {
  const [activeTab, setActiveTab] = useState('Tabla');
  const [classificationData, setClassificationData] = useState([]);
  const [goleadoresData, setGoleadoresData] = useState([]);
  const [currentJornada, setCurrentJornada] = useState(0);

  async function fetchClassification() {
    try {
      const division = localStorage.getItem('division') || 'Primera';
      const season   = localStorage.getItem('season')   || 'Apertura 2025';
      const standings = await getStandings(division, season);

      if (standings.length === 0) {
        // torneo no iniciado o sin partidos: equipos activos con todo a 0
        const teams = await getTeams();
        const filtered = teams.filter(t => t.division===division && t.status==='Activo');
        const zeros = filtered.map(t => ({
          id:   t.id,
          name: t.name,
          stats:{ PJ:0,G:0,E:0,P:0,GF:0,GC:0,DG:0,PTS:0 }
        }));
        setClassificationData(zeros);
      } else {
        setClassificationData(standings);
      }
    } catch (err) {
      console.error('Error fetching classification:', err);
    }
  }

  async function fetchGoleadores() {
    try {
      const division = localStorage.getItem('division') || 'Primera';
      const teams = await getTeams();
      const filtered = teams.filter(t => t.division === division);
      const list = [];
      for (const team of filtered) {
        const players = await getPlayersByTeam(team.id);
        for (const p of players) {
          const stats = await getPlayerStats(p.id).catch(()=>({ total_goals:0 }));
          list.push({
            id:    p.id,
            name:  `${p.nombre} ${p.apellido}`,
            team:  team.name,
            goals: stats.total_goals
          });
        }
      }
      list.sort((a,b)=>b.goals-a.goals);
      setGoleadoresData(list);
    } catch (err) {
      console.error('Error fetching goleadores:', err);
    }
  }

  useEffect(() => {
    fetchClassification();
    fetchGoleadores();

    window.addEventListener('divisionChange', fetchClassification);
    window.addEventListener('statsUpdated',   fetchClassification);
    return () => {
      window.removeEventListener('divisionChange', fetchClassification);
      window.removeEventListener('statsUpdated',   fetchClassification);
    };
  }, []);

  const prevJ = () => setCurrentJornada(i=>Math.max(i-1,0));
  const nextJ = () => setCurrentJornada(i=>i+1);

  return (
    <div className="main">
      <h1 className="title">Clasificación</h1>
      <div className="content-box">
        <div className="tabs">
          {tabs.map(tab=>(
            <button
              key={tab}
              onClick={()=>setActiveTab(tab)}
              className={activeTab===tab?'tab active-tab':'tab'}
              disabled={tab==='Jornadas'}
            >{tab}</button>
          ))}
        </div>

        {activeTab==='Tabla' && (
          <div className="classification-container">
            <table className="classification-table">
              <thead>
                <tr>
                  <th>#</th><th>Equipo</th><th>PJ</th><th>G</th><th>E</th>
                  <th>P</th><th>GF</th><th>GC</th><th>DG</th><th>PTS</th>
                </tr>
              </thead>
              <tbody>
                {classificationData.map((team,idx)=>(
                  <tr key={team.id}>
                    <td>{idx+1}</td>
                    <td className="team-cell">
                      <span className="team-color"/>
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

        {activeTab==='Jornadas' && (
          <div className="jornadas-section">
            <div className="jornadas-nav">
              <button onClick={prevJ} className="team-btn" disabled>{'<'}</button>
              <span className="jornada-title">Sin Datos de Jornadas</span>
              <button onClick={nextJ} className="team-btn" disabled>{'>'}</button>
            </div>
          </div>
        )}

        {activeTab==='Goleadores' && (
          <div className="classification-container">
            <table className="classification-table">
              <thead>
                <tr><th>#</th><th>Nombre</th><th>Equipo</th><th>Goles</th></tr>
              </thead>
              <tbody>
                {goleadoresData.map((pl,idx)=>(
                  <tr key={pl.id}>
                    <td>{idx+1}</td>
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
