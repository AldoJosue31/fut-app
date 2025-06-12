// src/renderer/pages/Partidos.jsx
import React, { useState, useEffect } from 'react';
import '../styles/styles.css';
import { getTeams } from '../services/teamsService.js';
import { getPlayersByTeam } from '../services/playersService.js';
import { createMatch, getMatchesByJornada } from '../services/matchesService.js';
import { getJornadas, addJornada, isTorneoComenzado } from '../services/jornadasService.js';
import { getDivisions } from '../services/divisionsService.js';
import { getTournamentTeams, addTournamentTeams } from '../services/tournamentService';

const tabs = ['Torneos', 'Jornadas'];
const years = Array.from({ length: 6 }, (_, i) => 2025 + i);
const seasons = years.flatMap(y => [`Clausura ${y}`, `Apertura ${y}`]);
const hours = ['18:00', '19:00', '20:00', '21:00', '22:00', '23:00'];


export default function Partidos() {
  const [activeTab, setActiveTab] = useState('Torneos');
  const [divisions, setDivisions] = useState([]);
  const [teamsByDiv, setTeamsByDiv] = useState({});
  const [startedDivisions, setStartedDivisions] = useState({});
  const [startDates, setStartDates] = useState({});
  const [activeDiv, setActiveDiv] = useState(null);
  const [season, setSeason] = useState(seasons[0]);
  const [jornadas, setJornadas] = useState([]);
  const [allJornadas, setAllJornadas] = useState([]);
  const [selectedJornada, setSelectedJornada] = useState(null);
  const [tournamentTeams, setTournamentTeams] = useState([]);
  const [scheduledMatches, setScheduledMatches] = useState({}); // key: "División-Temporada" → rounds[]
  const [tableSchedule, setTableSchedule] = useState({});    // key: "Div-Temp-Jornada" → { "fila-col": match }
  const [teamA, setTeamA] = useState(null);
  const [teamB, setTeamB] = useState(null);
  const [playersA, setPlayersA] = useState([]);
  const [playersB, setPlayersB] = useState([]);
  const [goalsA, setGoalsA] = useState(0);
  const [goalsB, setGoalsB] = useState(0);
  const [playerGoalsInput, setPlayerGoalsInput] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);

  // Round-robin generator
  function roundRobin(teams) {
    const list = [...teams];
    if (list.length % 2 === 1) list.push(null);
    const rounds = [];
    for (let i = 0; i < list.length - 1; i++) {
      const pairs = [];
      for (let j = 0; j < list.length / 2; j++) {
        const t1 = list[j], t2 = list[list.length - 1 - j];
        if (t1 && t2) pairs.push({ team1_id: t1.id, team2_id: t2.id });
      }
      rounds.push(pairs);
      list.splice(1, 0, list.pop());
    }
    return rounds;
  }

  // Load initial data
useEffect(() => {
    async function loadData() {
      const divs = await getDivisions();
      const divNames = divs.map(d => d.name);
      setDivisions(divNames);
      setActiveDiv(divNames[0] || null);

      const allTeams = await getTeams();
      setTeamsByDiv(Object.fromEntries(
        divNames.map(dv => [dv, allTeams.filter(t => t.division === dv && t.status === 'Activo')])
      ));

      const allJ = await getJornadas();
      setAllJornadas(allJ);
      setStartedDivisions(Object.fromEntries(
        allJ.filter(j => j.season === season).map(j => [j.division, true])
      ));

      const firstJ = allJ.filter(j => j.division === divNames[0] && j.season === season);
      setJornadas(firstJ);
      setSelectedJornada(firstJ[0]?.id || null);

      const tt = await getTournamentTeams(divNames[0], season);
      setTournamentTeams(tt.map(x => x.team_id));

      // Carga de schedule local
      const key = `${divNames[0]}-${season}`;
      const sch = JSON.parse(localStorage.getItem(`schedule-${key}`) || 'null');
      if (sch) setScheduledMatches(prev => ({ ...prev, [key]: sch }));

      // Carga de tableSchedule local
      const tableKey = `${divNames[0]}-${season}-${firstJ[0]?.id}`;
      const tbl = JSON.parse(localStorage.getItem(`table-${tableKey}`) || 'null');
      if (tbl) setTableSchedule(prev => ({ ...prev, [tableKey]: tbl }));
    }
    loadData();
  }, []);

  // Refresh on season change
 useEffect(() => {
    async function refresh() {
      const allJ = await getJornadas();
      setAllJornadas(allJ);
      setStartedDivisions(Object.fromEntries(
        allJ.filter(j => j.season === season).map(j => [j.division, true])
      ));
      if (!activeDiv) return;

      const js = allJ.filter(j => j.division === activeDiv && j.season === season);
      setJornadas(js);
      setSelectedJornada(js[0]?.id || null);

      const tt = await getTournamentTeams(activeDiv, season);
      setTournamentTeams(tt.map(x => x.team_id));

      const key = `${activeDiv}-${season}`;
      const sch = JSON.parse(localStorage.getItem(`schedule-${key}`) || 'null');
      if (sch) setScheduledMatches(prev => ({ ...prev, [key]: sch }));

      const tableKey = `${activeDiv}-${season}-${js[0]?.id}`;
      const tbl = JSON.parse(localStorage.getItem(`table-${tableKey}`) || 'null');
      if (tbl) setTableSchedule(prev => ({ ...prev, [tableKey]: tbl }));
    }
    refresh();
  }, [season, activeDiv]);

  // Refresh on activeDiv or tab change
  useEffect(() => {
    if (activeTab === 'Jornadas' && activeDiv) {
      const filtered = allJornadas.filter(j => j.division === activeDiv && j.season === season);
      setJornadas(filtered);
      setSelectedJornada(filtered[0]?.id || null);
      getTournamentTeams(activeDiv, season).then(tt => setTournamentTeams(tt.map(x => x.team_id)));
      const sch = JSON.parse(localStorage.getItem(`schedule-${activeDiv}-${season}`) || 'null');
      if (sch) setScheduledMatches(prev => ({ ...prev, [`${activeDiv}-${season}`]: sch }));
    }
  }, [activeTab, activeDiv, allJornadas, season]);

  // Start tournament
  async function handleStartDivision(div) {
    const equipos = teamsByDiv[div] || [];
    if (equipos.length < 2) return alert('Se requieren al menos 2 equipos activos.');
    if (await isTorneoComenzado(div, season)) return alert('Ya se inició ese torneo.');

    const rounds = roundRobin(equipos);
    const schedKey = `${div}-${season}`;
    localStorage.setItem(`schedule-${schedKey}`, JSON.stringify(rounds));
    setScheduledMatches(prev => ({ ...prev, [schedKey]: rounds }));

    // Crear jornadas en BD
    for (let i = 0; i < rounds.length; i++) {
      await addJornada(`Jornada ${i + 1}`, div, season);
    }
    // Snapshot de equipos
    const ids = equipos.map(t => t.id);
    await addTournamentTeams(div, season, ids);

    // Refrescar vistas
    const allJ = await getJornadas();
    const js = allJ.filter(j => j.division === div && j.season === season);
    setJornadas(js);
    setSelectedJornada(js[0]?.id || null);
    setStartedDivisions(prev => ({ ...prev, [div]: true }));
    setTournamentTeams(ids);
  }

  // Load matches for selected jornada
  useEffect(() => {
    async function loadMatches() {
      if (!selectedJornada) { setMatches([]); return; }
      const data = await getMatchesByJornada(selectedJornada);
      setMatches(data);
    }
    loadMatches();
  }, [selectedJornada]);

  // Load players when teams selected
  useEffect(() => {
    async function loadA() { teamA ? setPlayersA(await getPlayersByTeam(teamA)) : setPlayersA([]); }
    async function loadB() { teamB ? setPlayersB(await getPlayersByTeam(teamB)) : setPlayersB([]); }
    loadA(); loadB();
  }, [teamA, teamB]);

  // load cell-specific schedule when jornada changes
  useEffect(() => {
    if (activeDiv && selectedJornada) {
      const cellKey = `${activeDiv}-${season}-${selectedJornada}`;
      const saved = JSON.parse(localStorage.getItem(`table-${cellKey}`)) || {};
      setTableSchedule(prev => ({ ...prev, [cellKey]: saved }));
    }
  }, [activeDiv, season, selectedJornada]);

  // Handle match drop
function handleDrop(e, row, col) {
  e.preventDefault();

  // 1) Intentamos leer JSON; si es inválido, salimos sin hacer nada
  const json = e.dataTransfer.getData('application/json');
  if (!json) return;

  let data;
  try {
    data = JSON.parse(json);
  } catch {
    return;
  }
  const { pair, roundIdx, fromCell } = data; // fromCell será undefined si viene de la barra

  // 2) Si viene de la barra, lo quitamos de scheduledMatches
  if (roundIdx !== undefined) {
    const schedKey = `${activeDiv}-${season}`;
    const rounds = scheduledMatches[schedKey] || [];
    const updatedRounds = rounds.map((pairs, idx) =>
      idx === roundIdx
        ? pairs.filter(p => !(p.team1_id === pair.team1_id && p.team2_id === pair.team2_id))
        : pairs
    );
    localStorage.setItem(`schedule-${schedKey}`, JSON.stringify(updatedRounds));
    setScheduledMatches(prev => ({ ...prev, [schedKey]: updatedRounds }));
  }

  // 3) Si viene de otra celda, primero la limpiamos
  if (fromCell) {
    const tableKey = `${activeDiv}-${season}-${selectedJornada}`;
    const curr = tableSchedule[tableKey] || {};
    delete curr[fromCell];
    localStorage.setItem(`table-${tableKey}`, JSON.stringify(curr));
    setTableSchedule(prev => ({ ...prev, [tableKey]: { ...curr } }));
  }

  // 4) Insertamos en la nueva celda
  const tableKey = `${activeDiv}-${season}-${selectedJornada}`;
  const currTable = tableSchedule[tableKey] || {};
  const cellKey = `${row}-${col}`;
  currTable[cellKey] = pair;
  localStorage.setItem(`table-${tableKey}`, JSON.stringify(currTable));
  setTableSchedule(prev => ({ ...prev, [tableKey]: { ...currTable } }));
}

  // Submit match form
  async function handleSubmitMatch(e) {
    e.preventDefault();
    if (!teamA || !teamB || !selectedJornada) return;
    setLoading(true);
    try {
      await createMatch({
        team1Id: teamA,
        team2Id: teamB,
        goals1: goalsA,
        goals2: goalsB,
        playerGoalsInput,
        jornadaId: selectedJornada
      });
      setMatches(await getMatchesByJornada(selectedJornada));
      setTeamA(null); setTeamB(null); setGoalsA(0); setGoalsB(0);
      setPlayerGoalsInput([]); setPlayersA([]); setPlayersB([]);
    } catch {
      alert('Error al crear el partido.');
    } finally {
      setLoading(false);
    }
  }

  // Player goals change
  function handlePlayerGoalChange(playerId, value) {
    setPlayerGoalsInput(prev => {
      const u = prev.filter(pg => pg.playerId !== playerId);
      const g = parseInt(value, 10) || 0;
      if (g > 0) u.push({ playerId, goals: g });
      return u;
    });
  }

  return (
    <div className="main" style={{ backgroundColor: '#1F1F1F', minHeight: '100vh' }}>
      <h1 className="title">Partidos</h1>

      {/* Submenú */}
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

      {/* Torneos */}
      {activeTab === 'Torneos' && (
        <div className="content-box">
          <h2 style={{ color: '#F3F4F6', marginBottom: '1rem' }}>Iniciar Torneos</h2>
          <label style={{ color: '#E5E7EB', marginBottom: '0.5rem', display: 'block' }}>
            Temporada
          </label>
          <select
            value={season}
            onChange={e => setSeason(e.target.value)}
            style={{
              background: '#2A2A2A',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '0.375rem',
              color: '#F3F4F6',
              padding: '0.5rem',
              width: '200px',
              marginBottom: '1.5rem'
            }}
          >
            {seasons.map(s => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <div
            className="teams-grid"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}
          >
            {divisions.map(div => {
              const started = !!startedDivisions[div];
              return (
                <div
                  key={div}
                  style={{ background: '#3A3A3A', borderRadius: '0.75rem', padding: '1rem' }}
                >
                  <h3 style={{ color: '#E5E7EB', marginBottom: '0.75rem' }}>
                    {div} div
                  </h3>
                  <ul style={{ listStyle: 'none', padding: 0, marginBottom: '1rem' }}>
                    {(teamsByDiv[div] || []).map(t => (
                      <li key={t.id} style={{ color: '#F3F4F6', marginBottom: '0.5rem' }}>
                        {t.name}
                      </li>
                    ))}
                    {!(teamsByDiv[div] || []).length && (
                      <li style={{ color: '#9CA3AF', fontStyle: 'italic' }}>
                        No hay equipos
                      </li>
                    )}
                  </ul>
                  <label
                    style={{
                      color: '#E5E7EB',
                      marginBottom: '0.25rem',
                      display: 'block'
                    }}
                  >
                    Fecha de inicio
                  </label>
                  <input
                    type="date"
                    value={startDates[div] || ''}
                    onChange={e =>
                      setStartDates(prev => ({
                        ...prev,
                        [div]: e.target.value
                      }))
                    }
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
                  {started ? (
                    <button
                      className="btn success"
                      style={{
                        background: '#6B7280',
                        color: '#FFF',
                        width: '100%',
                        padding: '0.75rem'
                      }}
                      disabled
                    >
                      COMENZADO
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStartDivision(div)}
                      className="btn success"
                      style={{
                        background: '#16A34A',
                        color: '#FFF',
                        width: '100%',
                        padding: '0.75rem'
                      }}
                    >
                      COMENZAR TORNEO
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Jornadas */}
      {activeTab === 'Jornadas' && (
        <>
          <div className="tabs" style={{ marginBottom: '1rem' }}>
            {divisions
              .filter(d => startedDivisions[d])
              .map(div => {
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
          {(!activeDiv || !startedDivisions[activeDiv]) ? (
            <div style={{ color: '#E5E7EB', padding: '1rem' }}>
              Seleccione una división iniciada en "Torneos".
            </div>
          ) : (
            <div className="content-box">
              {/* Navegación de Jornadas */}
              <div className="jornadas-nav">
                <button
                  onClick={() => {
                    const idx = jornadas.findIndex(
                      j => j.id === selectedJornada
                    );
                    if (idx > 0)
                      setSelectedJornada(jornadas[idx - 1].id);
                  }}
                  className="team-btn"
                  disabled={!selectedJornada}
                >
                  {'<'}
                </button>
                <span
                  className="jornada-title"
                  style={{ margin: '0 1rem', color: '#F3F4F6' }}
                >
                  {selectedJornada
                    ? jornadas.find(j => j.id === selectedJornada)?.name
                    : 'Sin jornadas'}
                </span>
                <button
                  onClick={() => {
                    const idx = jornadas.findIndex(
                      j => j.id === selectedJornada
                    );
                    if (idx < jornadas.length - 1)
                      setSelectedJornada(jornadas[idx + 1].id);
                  }}
                  className="team-btn"
                  disabled={!selectedJornada}
                >
                  {'>'}
                </button>
              </div>

              {/* Tabla de horarios */}
             {selectedJornada && (
                <table className="classification-table">
                  <thead>
                    <tr><th>Hora</th>{['L','Ma','Mi','J','V','S'].map(d => <th key={d}>{d}</th>)}</tr>
                  </thead>
<tbody>
  {hours.map((hora, r) => (
    <tr key={r}>
      <td style={{ color: '#E5E7EB' }}>{`${hora} p.m.`}</td>
      {[0, 1, 2, 3, 4, 5].map(c => {
        const tableKey = `${activeDiv}-${season}-${selectedJornada}`;
        const cellKey = `${r}-${c}`;
        const match = (tableSchedule[tableKey] || {})[cellKey];

        return (
          <td
            key={c}
            onDragOver={e => e.preventDefault()}
            onDrop={e => handleDrop(e, r, c)}
            style={{ position: 'relative', border: '1px solid rgba(255,255,255,0.2)', height: '4rem' }}
          >
            {match && (
              <div
                draggable
                onDragStart={e => {
                  e.dataTransfer.setData(
                    'application/json',
                    JSON.stringify({ pair: match, fromCell: cellKey })
                  );
                }}
                className="match-card"
                style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  background: '#3A3A3A',
                  borderRadius: '0.375rem',
                  padding: '0.5rem',
                  color: '#F3F4F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'move'
                }}
              >
                {teamsByDiv[activeDiv].find(t => t.id === match.team1_id)?.name}
                {' vs '}
                {teamsByDiv[activeDiv].find(t => t.id === match.team2_id)?.name}
              </div>
            )}
          </td>
        );
      })}
    </tr>
  ))}
</tbody>
                </table>
              )}

              {/* Barra de partidos arrastrables */}
              {selectedJornada && (
                <div
                  className="matches-bar"
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    marginTop: '1rem',
                    padding: '1rem',
                    background: '#2A2A2A',
                    borderRadius: '0.5rem'
                  }}
                >
                  {(() => {
                    const key = `${activeDiv}-${season}`;
                    const rounds = scheduledMatches[key] || [];
                    const roundIdx = jornadas.findIndex(
                      j => j.id === selectedJornada
                    );
                    const pairs = rounds[roundIdx] || [];
                    return pairs.map((p, idx) => {
                      const t1 =
                        teamsByDiv[activeDiv].find(
                          t => t.id === p.team1_id
                        ) || {};
                      const t2 =
                        teamsByDiv[activeDiv].find(
                          t => t.id === p.team2_id
                        ) || {};
                      return (
                        <div
                          key={idx}
                          className="match-card"
                          draggable
                          onDragStart={e =>
                            e.dataTransfer.setData(
                              'application/json',
                              JSON.stringify({ pair: p, roundIdx })
                            )
                          }
                          style={{
                            background: '#3A3A3A',
                            borderRadius: '0.375rem',
                            padding: '0.75rem',
                            color: '#F3F4F6',
                            cursor: 'move'
                          }}
                        >
                          {t1.name} vs {t2.name}
                        </div>
                      );
                    });
                  })()}
                </div>
              )}

              {/* Confirmar jornada */}
              {selectedJornada && (
                <button
                  className="btn success"
                  style={{
                    background: '#16A34A',
                    color: '#FFF',
                    marginTop: '1rem',
                    padding: '0.75rem',
                    width: '100%'
                  }}
                >
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
