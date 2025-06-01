import React, { useState, useEffect } from 'react';
import '../styles/styles.css';
import { getTeams, getTeamStats } from '../services/teamsService.js';
import { getPlayersByTeam, getPlayerStats } from '../services/playersService.js';

const tabs = ['Tabla', 'Jornadas', 'Goleadores'];

export default function Clasificacion() {
  const [activeTab, setActiveTab] = useState('Tabla');
  const [classificationData, setClassificationData] = useState([]);
  const [goleadoresData, setGoleadoresData] = useState([]);
  const [currentJornada, setCurrentJornada] = useState(0);

  // Función para obtener clasificación según división actual
  async function fetchClassification() {
    try {
      const teams = await getTeams();
      const division = localStorage.getItem('division') || 'Primera';
      const filtered = teams.filter(t => t.division === division);
      const formatted = await Promise.all(
        filtered.map(async team => {
          const stats = await getTeamStats(team.id);
          const PJ = (stats.total_wins || 0) + (stats.total_draws || 0) + (stats.total_losses || 0);
          const G = stats.total_wins || 0;
          const E = stats.total_draws || 0;
          const P = stats.total_losses || 0;
          const PTS = G * 3 + E;
          return {
            id: team.id,
            name: team.name,
            stats: { PJ, G, E, P, GF: 0, GC: 0, DG: 0, PTS },
          };
        })
      );
      formatted.sort((a, b) => b.stats.PTS - a.stats.PTS);
      setClassificationData(formatted);
    } catch (error) {
      console.error('Error fetching classification:', error);
    }
  }

  // Función para obtener goleadores según división actual
  async function fetchGoleadores() {
    try {
      const teams = await getTeams();
      const division = localStorage.getItem('division') || 'Primera';
      const filtered = teams.filter(t => t.division === division);
      const playersList = [];
      for (const team of filtered) {
        const players = await getPlayersByTeam(team.id);
        for (const jug of players) {
          let totalGoals = 0;
          try {
            const stats = await getPlayerStats(jug.id);
            totalGoals = stats.total_goals;
          } catch {
            totalGoals = 0;
          }
          playersList.push({
            id: jug.id,
            name: `${jug.nombre} ${jug.apellido}`,
            team: team.name,
            goals: totalGoals,
          });
        }
      }
      playersList.sort((a, b) => b.goals - a.goals);
      setGoleadoresData(playersList);
    } catch (error) {
      console.error('Error fetching goleadores:', error);
    }
  }

  // Ejecutar al montar y al cambiar división
  useEffect(() => {
    fetchClassification();
    window.addEventListener('divisionChange', fetchClassification);
    return () => window.removeEventListener('divisionChange', fetchClassification);
  }, []);

  useEffect(() => {
    fetchGoleadores();
    window.addEventListener('divisionChange', fetchGoleadores);
    return () => window.removeEventListener('divisionChange', fetchGoleadores);
  }, []);

  const prevJornada = () => setCurrentJornada(i => Math.max(i - 1, 0));
  const nextJornada = () => setCurrentJornada(i => i + 1);

  return (
    <div className="main">
      <h1 className="title">Clasificación</h1>
      <div className="content-box">
        <div className="tabs">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={activeTab === tab ? 'tab active-tab' : 'tab'}
              disabled={tab === 'Jornadas'} // Jornadas sin datos reales
            >
              {tab}
            </button>
          ))}
        </div>

        {/* TAB: Tabla de clasificación */}
        {activeTab === 'Tabla' && (
          <div className="classification-container">
            <table className="classification-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Equipo</th>
                  <th>PJ</th>
                  <th>G</th>
                  <th>E</th>
                  <th>P</th>
                  <th>GF</th>
                  <th>GC</th>
                  <th>DG</th>
                  <th>PTS</th>
                </tr>
              </thead>
              <tbody>
                {classificationData.map((team, idx) => (
                  <tr key={team.id}>
                    <td>{idx + 1}</td>
                    <td className="team-cell">
                      <span className="team-color"></span>
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

        {/* TAB: Jornadas (sin datos reales) */}
        {activeTab === 'Jornadas' && (
          <div className="jornadas-section">
            <div className="jornadas-nav">
              <button onClick={prevJornada} className="team-btn" disabled>{'<'}</button>
              <span className="jornada-title">Sin Datos de Jornadas</span>
              <button onClick={nextJornada} className="team-btn" disabled>{'>'}</button>
            </div>
          </div>
        )}

        {/* TAB: Goleadores */}
        {activeTab === 'Goleadores' && (
          <div className="classification-container">
            <table className="classification-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nombre</th>
                  <th>Equipo</th>
                  <th>Goles</th>
                </tr>
              </thead>
              <tbody>
                {goleadoresData.map((pl, idx) => (
                  <tr key={pl.id}>
                    <td>{idx + 1}</td>
                    <td className="team-cell">
                      <span className="team-color"></span>
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
