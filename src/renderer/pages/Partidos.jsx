// src/renderer/pages/Partidos.jsx
import React, { useState, useEffect } from 'react';
import '../styles/styles.css';
import { getTeams } from '../services/teamsService.js';
import { getPlayersByTeam } from '../services/playersService.js';
import { createMatch, getMatchesByJornada } from '../services/matchesService.js';
import { getJornadas, addJornada, deleteJornada } from '../services/jornadasService.js';
import { getDivisions } from '../services/divisionsService.js';

const tabs = ['Torneos', 'Jornadas'];

export default function Partidos() {
  const [activeTab, setActiveTab] = useState('Torneos');
  const [divisions, setDivisions] = useState([]);
  const [teamsByDiv, setTeamsByDiv] = useState({});
  const [startedDivisions, setStartedDivisions] = useState({});
  const [startDates, setStartDates] = useState({});
  const [activeDiv, setActiveDiv] = useState(null);
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

  // Carga inicial: divisiones y equipos activos
  useEffect(() => {
    async function loadData() {
      const divs = await getDivisions();
      const divNames = divs.map(d => d.name);
      setDivisions(divNames);
      setActiveDiv(divNames[0] || null);
      const allTeams = await getTeams();
      const byDiv = {};
      divNames.forEach(dv => {
        byDiv[dv] = allTeams.filter(t => t.division === dv && t.status === 'Activo');
      });
      setTeamsByDiv(byDiv);
    }
    loadData();
  }, []);

  // Refrescar jornadas al cambiar división activa
  useEffect(() => {
    if (activeDiv) refreshJornadas(activeDiv);
  }, [activeDiv]);

  async function refreshJornadas(div) {
    const data = await getJornadas();
    const filtered = data.filter(j => j.division === div);
    setJornadas(filtered);
    setSelectedJornada(filtered.length > 0 ? filtered[0].id : null);
  }

  // Iniciar torneo para una división específica
  async function handleStartDivision(div) {
    const activeTeams = teamsByDiv[div] || [];
    if (activeTeams.length < 2) {
      alert(`La división "${div}" necesita al menos 2 equipos activos.`);
      return;
    }
    const numJornadas = activeTeams.length - 1;
    for (let i = 1; i <= numJornadas; i++) {
      await addJornada(`Jornada ${i}`, div);
    }
    setStartedDivisions(prev => ({ ...prev, [div]: true }));
    setStartDates(prev => ({ ...prev, [div]: prev[div] || new Date().toISOString().split('T')[0] }));
    if (div === activeDiv) refreshJornadas(div);
  }

  // Cargar partidos para jornada seleccionada
  useEffect(() => {
    async function loadMatches() {
      if (!selectedJornada) { setMatches([]); return; }
      const data = await getMatchesByJornada(selectedJornada);
      setMatches(data);
    }
    loadMatches();
  }, [selectedJornada]);

  // Cargar jugadores de equipo A y B
  useEffect(() => {
    async function loadPlayersA() {
      if (teamA) setPlayersA(await getPlayersByTeam(teamA)); else setPlayersA([]);
    }
    async function loadPlayersB() {
      if (teamB) setPlayersB(await getPlayersByTeam(teamB)); else setPlayersB([]);
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
      setMatches(await getMatchesByJornada(selectedJornada));
      setTeamA(null); setTeamB(null); setGoalsA(0); setGoalsB(0); setPlayerGoalsInput([]);
      setPlayersA([]); setPlayersB([]);
    } catch (err) {
      console.error(err);
      alert('Error al crear el partido.');
    } finally { setLoading(false); }
  }

  return (
    <div className="main" style={{ backgroundColor: '#1F1F1F', minHeight: '100vh' }}>
      <h1 className="title">Partidos</h1>
      {/* Submenú principal */}
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

      {/* === Pestaña: Torneos === */}
      {activeTab === 'Torneos' && (
        <div className="content-box">
          <h2 style={{ color: '#F3F4F6', marginBottom: '1rem' }}>Iniciar Torneos</h2>
          <div className="teams-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
            {divisions.map(div => {
              const started = !!startedDivisions[div];
              return (
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
                      background: '#2A2A2A', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '0.375rem', color: '#F3F4F6', padding: '0.5rem', width: '100%', marginBottom: '1rem'
                    }}
                  />
                  {started ? (
                    <button className="btn success" style={{ background: '#6B7280', color: '#FFF', width: '100%', padding: '0.75rem' }} disabled>COMENZADO</button>
                  ) : (
                    <button onClick={() => handleStartDivision(div)} className="btn success" style={{ background: '#16A34A', color: '#FFF', width: '100%', padding: '0.75rem' }}>COMENZAR TORNEO</button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* === Pestaña: Jornadas === */}
      {activeTab === 'Jornadas' && (
        <>
          {/* Submenú divisiones con opacidades */}
          <div className="tabs" style={{ marginBottom: '1rem' }}>
            {divisions.filter(d => startedDivisions[d]).map(div => {
              const isActive = div === activeDiv;
              return (
                <button
                  key={div}
                  onClick={() => setActiveDiv(div)}
                  className={isActive ? 'tab active-tab' : 'tab'}
                  style={{ opacity: isActive ? 1 : 0.7, cursor: 'pointer' }}
                >
                  {div}
                </button>
              );
            })}
          </div>

          {/* Si no hay división activa o no iniciada, mostrar mensaje */}
          {(!activeDiv || !startedDivisions[activeDiv]) ? (
            <div style={{ color: '#E5E7EB', padding: '1rem' }}>Seleccione una división iniciada en "Torneos".</div>
          ) : (
            <div className="content-box">
              {/* Selector de jornada */}
              <div className="jornadas-nav">
                <button
                  onClick={() => {
                    const idx = jornadas.findIndex(j => j.id === selectedJornada);
                    if (idx > 0) setSelectedJornada(jornadas[idx - 1].id);
                  }}
                  className="team-btn" disabled={!selectedJornada}
                >{'<'}</button>
                <span className="jornada-title" style={{ margin: '0 1rem', color: '#F3F4F6' }}>
                  {selectedJornada ? jornadas.find(j => j.id === selectedJornada)?.name : 'Sin jornadas'}
                </span>
                <button
                  onClick={() => {
                    const idx = jornadas.findIndex(j => j.id === selectedJornada);
                    if (idx < jornadas.length - 1) setSelectedJornada(jornadas[idx + 1].id);
                  }}
                  className="team-btn" disabled={!selectedJornada}
                >{'>'}</button>
              </div>

              {/* Tabla de planificación */}
              {selectedJornada && (
                <table className="classification-table" style={{ marginTop: '1rem', width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Hora</th>
                      <th>Lunes</th>
                      <th>Martes</th>
                      <th>Miércoles</th>
                      <th>Jueves</th>
                      <th>Viernes</th>
                      <th>Sábado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['18:00', '19:00', '20:00', '21:00', '22:00', '23:00'].map((hora, r) => (
                      <tr key={r}>
                        <td style={{ color: '#E5E7EB' }}>{`${hora} p.m.`}</td>
                        {[0,1,2,3,4,5].map(c => (
                          <td key={c} style={{ height: '4rem', border: '1px solid rgba(255,255,255,0.2)' }} />
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Barra de partidos arrastrables */}
              {selectedJornada && (
                <div className="matches-bar" style={{ display: 'flex', gap: '1rem', marginTop: '1rem', padding: '1rem', background: '#2A2A2A', borderRadius: '0.5rem' }}>
                  {teamsByDiv[activeDiv].map((t, idx) => (
                    <div key={idx} className="match-card" draggable style={{ background: '#3A3A3A', borderRadius: '0.375rem', padding: '0.75rem', color: '#F3F4F6', cursor: 'move' }}>
                      {t.name}
                    </div>
                  ))}
                </div>
              )}

              {/* Botón Confirmar */}
              {selectedJornada && (
                <button className="btn success" style={{ background: '#16A34A', color: '#FFF', marginTop: '1rem', padding: '0.75rem', width: '100%' }}>
                  Confirmar
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
