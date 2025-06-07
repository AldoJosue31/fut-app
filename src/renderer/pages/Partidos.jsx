// src/renderer/pages/Partidos.jsx
import React, { useState, useEffect } from 'react';
import '../styles/styles.css';
import { getTeams } from '../services/teamsService.js';
import { getPlayersByTeam } from '../services/playersService.js';
import { createMatch, getMatchesByJornada } from '../services/matchesService.js';
import { getJornadas, addJornada, deleteJornada } from '../services/jornadasService.js';
import { getDivisions } from '../services/divisionsService.js';

const tabs = ['Jornadas', 'Partidos'];

export default function Partidos() {
  const [activeTab, setActiveTab] = useState('Jornadas');
  const [divisions, setDivisions] = useState([]);
  const [teamsByDiv, setTeamsByDiv] = useState({});
  const [startedDivisions, setStartedDivisions] = useState({});
  const [startDates, setStartDates] = useState({});
  const [division, setDivision] = useState(localStorage.getItem('division') || 'Primera');
  const [jornadas, setJornadas] = useState([]);
  const [selectedJornada, setSelectedJornada] = useState(null);
  const [teamA, setTeamA] = useState(null);
  const [teamB, setTeamB] = useState(null);
  const [playersA, setPlayersA] = useState([]);
  const [playersB, setPlayersB] = useState([]);
  const [goalsA, setGoalsA] = useState(0);
  const [goalsB, setGoalsB] = useState(0);
  const [playerGoalsInput, setPlayerGoalsInput] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      const divs = await getDivisions();
      const divNames = divs.map(d => d.name);
      setDivisions(divNames);

      const allTeams = await getTeams();
      const byDiv = {};
      for (const div of divNames) {
        byDiv[div] = allTeams.filter(t => t.division === div && t.status === 'Activo');
      }
      setTeamsByDiv(byDiv);
    }
    loadData();
  }, []);

  async function handleStartDivision(div) {
    try {
      const activeTeams = teamsByDiv[div] || [];
      const count = activeTeams.length;
      if (count < 2) {
        alert(`La división \"${div}\" necesita al menos 2 equipos activos.`);
        return;
      }
      const numJornadas = count - 1;
      for (let i = 1; i <= numJornadas; i++) {
        await addJornada(`Jornada ${i}`, div);
      }
      setStartedDivisions(prev => ({ ...prev, [div]: true }));
      setStartDates(prev => ({ ...prev, [div]: prev[div] || new Date().toISOString().split('T')[0] }));
      if (div === division) refreshJornadas(div);
    } catch (err) {
      console.error(err);
      alert('Error al iniciar torneo para la división ' + div);
    }
  }

  async function refreshJornadas(div) {
    const data = await getJornadas();
    setJornadas(data.filter(j => j.division === div));
  }

  useEffect(() => {
    refreshJornadas(division);
  }, [division]);

  useEffect(() => {
    async function loadMatches() {
      if (!selectedJornada) { setMatches([]); return; }
      const data = await getMatchesByJornada(selectedJornada);
      setMatches(data);
    }
    loadMatches();
  }, [selectedJornada]);

  useEffect(() => {
    async function loadPlayersA() {
      if (teamA) {
        const data = await getPlayersByTeam(teamA);
        setPlayersA(data);
      } else {
        setPlayersA([]);
      }
    }
    async function loadPlayersB() {
      if (teamB) {
        const data = await getPlayersByTeam(teamB);
        setPlayersB(data);
      } else {
        setPlayersB([]);
      }
    }
    loadPlayersA();
    loadPlayersB();
  }, [teamA, teamB]);

  function handlePlayerGoalChange(playerId, value) {
    setPlayerGoalsInput(prev => {
      const updated = prev.filter(pg => pg.playerId !== playerId);
      const goals = parseInt(value, 10) || 0;
      if (goals > 0) updated.push({ playerId, goals });
      return updated;
    });
  }

  async function handleSubmitMatch(e) {
    e.preventDefault();
    if (!teamA || !teamB || !selectedJornada) return;
    setLoading(true);
    try {
      await createMatch({ team1Id: teamA, team2Id: teamB, goals1: goalsA, goals2: goalsB, playerGoalsInput, jornadaId: selectedJornada });
      const data = await getMatchesByJornada(selectedJornada);
      setMatches(data);
      setTeamA(null); setTeamB(null); setGoalsA(0); setGoalsB(0); setPlayerGoalsInput([]); setPlayersA([]); setPlayersB([]);
    } catch (err) {
      console.error(err);
      alert('Error al crear el partido.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="main" style={{ backgroundColor: '#1F1F1F', minHeight: '100vh' }}>
      <h1 className="title">Partidos</h1>
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

      {/* =========== PESTAÑA Jornadas =========== */}
      {activeTab === 'Jornadas' && (
        <div className="content-box">
          <h2 style={{ color: '#F3F4F6', marginBottom: '1rem' }}>Equipos activos</h2>
          <div className="teams-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
            {divisions.map(div => (
              <div key={div} style={{ background: '#3A3A3A', borderRadius: '0.75rem', padding: '1rem' }}>
                <h3 style={{ color: '#E5E7EB', marginBottom: '0.75rem' }}>{div} div</h3>
                <ul style={{ listStyle: 'none', padding: 0, marginBottom: '1rem' }}>
                  {(teamsByDiv[div] || []).map(t => (
                    <li key={t.id} style={{ color: '#F3F4F6', marginBottom: '0.5rem' }}>{t.name}</li>
                  ))}
                  {((teamsByDiv[div] || []).length === 0) && (
                    <li style={{ color: '#9CA3AF', fontStyle: 'italic' }}>No hay equipos</li>
                  )}
                </ul>

                <label style={{ color: '#E5E7EB', marginBottom: '0.25rem', display: 'block' }}>Fecha de inicio</label>
                <input
                  type="date"
                  value={startDates[div] || ''}
                  onChange={e => setStartDates(prev => ({ ...prev, [div]: e.target.value }))}
                  style={{
                    background: '#2A2A2A',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '0.375rem',
                    color: '#F3F4F6',
                    padding: '0.5rem',
                    width: '100%',
                    marginBottom: '1rem'
                  }}
                />

                {startedDivisions[div] ? (
                  <button
                    className="btn success"
                    style={{ background: '#6B7280', color: '#FFF', width: '100%', padding: '0.75rem', cursor: 'default' }}
                    disabled
                  >
                    COMENZADO
                  </button>
                ) : (
                  <button
                    onClick={() => handleStartDivision(div)}
                    className="btn success"
                    style={{ background: '#16A34A', color: '#FFF', width: '100%', padding: '0.75rem' }}
                  >
                    COMENZAR TORNEO
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========== PESTAÑA Partidos =========== */}
      {activeTab === 'Partidos' && (
        <div className="content-box">
          <h2 style={{ color: '#F3F4F6', marginBottom: '1rem' }}>Seleccionar Jornada - {division} div</h2>
          <ul className="jornadas-list" style={{ listStyle: 'none', padding: 0, marginBottom: '1rem' }}>
            {jornadas.map(j => (
              <li
                key={j.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#3A3A3A',
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                  marginBottom: '0.5rem',
                  cursor: 'pointer'
                }}
              >
                <span
                  onClick={() => setSelectedJornada(j.id)}
                  style={{
                    color: selectedJornada === j.id ? '#16A34A' : '#E5E7EB',
                    fontWeight: selectedJornada === j.id ? 600 : 500
                  }}
                >
                  {j.name}
                </span>
                <button
                  onClick={() => deleteJornada(j.id)}
                  className="btn small danger"
                  style={{ background: '#DC2626', color: '#FFF' }}
                >
                  ×
                </button>
              </li>
            ))}
            {jornadas.length === 0 && (
              <li style={{ color: '#9CA3AF', fontStyle: 'italic' }}>
                No hay jornadas definidas para {division}.
              </li>
            )}
          </ul>

          {selectedJornada && (
            <>
              <h2 style={{ color: '#F3F4F6', marginBottom: '1rem' }}>Crear Partido - {jornadas.find(j => j.id === selectedJornada)?.name}</h2>
              <form onSubmit={handleSubmitMatch} className="partidos-form">
                <div className="section" style={{ marginBottom: '1rem' }}>
                  <label style={{ color: '#E5E7EB' }}>Equipo A</label>
                  <select
                    value={teamA || ''}
                    onChange={e => setTeamA(parseInt(e.target.value) || null)}
                    style={{
                      background: '#2A2A2A',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '0.375rem',
                      color: '#F3F4F6',
                      padding: '0.5rem',
                      width: '100%'
                    }}
                  >
                    <option value="" disabled>Seleccione Equipo A</option>
                    {(teamsByDiv[division] || []).map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <label style={{ color: '#E5E7EB', marginTop: '0.5rem' }}>Goles A</label>
                  <input
                    type="number"
                    min="0"
                    value={goalsA}
                    onChange={e => setGoalsA(parseInt(e.target.value, 10) || 0)}
                    style={{
                      background: '#2A2A2A',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '0.375rem',
                      color: '#F3F4F6',
                      padding: '0.5rem',
                      width: '100%'
                    }}
                  />
                </div>

                <div className="section" style={{ marginBottom: '1rem' }}>
                  <label style={{ color: '#E5E7EB' }}>Equipo B</label>
                  <select
                    value={teamB || ''}
                    onChange={e => setTeamB(parseInt(e.target.value) || null)}
                    style={{
                      background: '#2A2A2A',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '0.375rem',
                      color: '#F3F4F6',
                      padding: '0.5rem',
                      width: '100%'
                    }}
                  >
                    <option value="" disabled>Seleccione Equipo B</option>
                    {(teamsByDiv[division] || []).filter(t => t.id !== teamA).map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <label style={{ color: '#E5E7EB', marginTop: '0.5rem' }}>Goles B</label>
                  <input
                    type="number"
                    min="0"
                    value={goalsB}
                    onChange={e => setGoalsB(parseInt(e.target.value, 10) || 0)}
                    style={{
                      background: '#2A2A2A',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '0.375rem',
                      color: '#F3F4F6',
                      padding: '0.5rem',
                      width: '100%'
                    }}
                  />
                </div>

                <div className="section goles-jugadores" style={{ marginBottom: '1rem' }}>
                  <h3 style={{ color: '#F3F4F6' }}>Goles por Jugador (Opcional)</h3>
                  <div className="jugadores-list">
                    {playersA.map(player => (
                      <div
                        key={player.id}
                        className="player-goal-row"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          background: '#3A3A3A',
                          borderRadius: '0.375rem',
                          padding: '0.5rem',
                          marginBottom: '0.5rem'
                        }}
                      >
                        <span style={{ color: '#E5E7EB', flex: 1 }}>
                          {player.nombre} {player.apellido}
                        </span>
                        <input
                          type="number"
                          min="0"
                          placeholder={`Goles de ${player.nombre}`}
                          onChange={e => handlePlayerGoalChange(player.id, e.target.value)}
                          style={{
                            background: '#2A2A2A',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '0.375rem',
                            color: '#F3F4F6',
                            padding: '0.5rem',
                            width: '4rem'
                          }}
                        />
                      </div>
                    ))}

                    {playersB.map(player => (
                      <div
                        key={player.id}
                        className="player-goal-row"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          background: '#3A3A3A',
                          borderRadius: '0.375rem',
                          padding: '0.5rem',
                          marginBottom: '0.5rem'
                        }}
                      >
                        <span style={{ color: '#E5E7EB', flex: 1 }}>
                          {player.nombre} {player.apellido}
                        </span>
                        <input
                          type="number"
                          min="0"
                          placeholder={`Goles de ${player.nombre}`}
                          onChange={e => handlePlayerGoalChange(player.id, e.target.value)}
                          style={{
                            background: '#2A2A2A',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '0.375rem',
                            color: '#F3F4F6',
                            padding: '0.5rem',
                            width: '4rem'
                          }}
                        />
                      </div>
                    ))}

                    {(playersA.length + playersB.length) === 0 && (
                      <p className="placeholder">Sin jugadores para registrar goles.</p>
                    )}
                  </div>
                </div>

                <div className="modal-actions" style={{ justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn success" disabled={loading}>
                    {loading ? 'Guardando...' : 'Guardar Partido'}
                  </button>
                </div>
              </form>

              <div className="matches-list" style={{ marginTop: '2rem' }}>
                <h3 style={{ color: '#F3F4F6' }}>Partidos Registrados</h3>
                {matches.length === 0 ? (
                  <p className="placeholder">No hay partidos registrados en esta jornada.</p>
                ) : (
                  <table className="classification-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Equipo A</th>
                        <th>Goles A</th>
                        <th>Equipo B</th>
                        <th>Goles B</th>
                        <th>Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matches.map((m, idx) => (
                        <tr key={m.id}>
                          <td>{idx + 1}</td>
                          <td style={{ color: '#E5E7EB' }}>
                            {teamsByDiv[division].find(t => t.id === m.team1_id)?.name}
                          </td>
                          <td style={{ color: '#E5E7EB' }}>{m.goals1}</td>
                          <td style={{ color: '#E5E7EB' }}>
                            {teamsByDiv[division].find(t => t.id === m.team2_id)?.name}
                          </td>
                          <td style={{ color: '#E5E7EB' }}>{m.goals2}</td>
                          <td style={{ color: '#E5E7EB' }}>{m.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
