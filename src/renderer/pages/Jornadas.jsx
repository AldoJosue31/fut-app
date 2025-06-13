// src/renderer/pages/Jornadas.jsx
import React from 'react';

export default function Jornadas({
  divisions,
  startedDivisions,
  activeDiv,
  setActiveDiv,
  season,
  setSeason,
  jornadas,
  selectedJornada,
  setSelectedJornada,
  tournamentTeams,
  teamsByDiv,
  scheduledMatches,
  tableSchedule,
  confirmLoaded,
  confirmedJornadas,
  handleDrop,
  hours,
  loading,
  handleConfirmJornada,
  // Se quitan props relacionadas con registro manual de partidos
  // teamA, setTeamA, teamB, setTeamB, playersA, playersB,
  // goalsA, setGoalsA, goalsB, setGoalsB,
  // handleSubmitMatch, handlePlayerGoalChange, getPlayersByTeam,
  // getMatchesByJornada, setMatches
}) {
  return (
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
                const idx = jornadas.findIndex(j => j.id === selectedJornada);
                if (idx > 0) setSelectedJornada(jornadas[idx - 1].id);
              }}
              className="team-btn"
              disabled={!selectedJornada}
            >
              {'<'}
            </button>
            <span className="jornada-title" style={{ margin: '0 1rem', color: '#F3F4F6' }}>
              {selectedJornada
                ? jornadas.find(j => j.id === selectedJornada)?.name
                : 'Sin jornadas'}
            </span>
            <button
              onClick={() => {
                const idx = jornadas.findIndex(j => j.id === selectedJornada);
                if (idx < jornadas.length - 1) setSelectedJornada(jornadas[idx + 1].id);
              }}
              className="team-btn"
              disabled={!selectedJornada}
            >
              {'>'}
            </button>
          </div>

          {/* Tabla de horarios */}
          {selectedJornada && (() => {
            const key = `${activeDiv}-${season}-${selectedJornada}`;
            const isLoaded = confirmLoaded[key];
            const isConfirmed = confirmedJornadas[key];

            return (
              <div className="classification-table-wrapper">
                {!isLoaded && (
                  <div className="loading-overlay">
                    <span>Cargando estado…</span>
                  </div>
                )}

                <table className="classification-table" style={{ visibility: isLoaded ? 'visible' : 'hidden' }}>
                  <thead>
                    <tr>
                      <th>Hora</th>
                      {['L','Ma','Mi','J','V','S'].map(d => <th key={d}>{d}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {hours.map((hora, r) => (
                      <tr key={r}>
                        <td style={{ color: '#E5E7EB' }}>{`${hora} p.m.`}</td>
                        {[0,1,2,3,4,5].map(c => {
                          const cellKey = `${r}-${c}`;
                          const match = (tableSchedule[key] || {})[cellKey];
                          return (
                            <td
                              key={c}
                              style={{
                                position: 'relative',
                                border: '1px solid rgba(255,255,255,0.2)',
                                height: '4rem'
                              }}
                              onDragOver={e => {
                                if (isLoaded && !isConfirmed && !match) e.preventDefault();
                              }}
                              onDrop={e => {
                                if (isLoaded && !isConfirmed && !match) handleDrop(e, r, c);
                              }}
                            >
                              {match && (
                                <div
                                  draggable={!isConfirmed}
                                  onDragStart={e => {
                                    if (!isConfirmed) {
                                      e.dataTransfer.setData(
                                        'application/json',
                                        JSON.stringify({ pair: match, fromCell: cellKey })
                                      );
                                    }
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
                                    cursor: isConfirmed ? 'default' : 'move',
                                    opacity: isConfirmed ? 0.7 : 1
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
              </div>
            );
          })()}

          {/* Barra de partidos arrastrables */}
          {selectedJornada && (() => {
            const key = `${activeDiv}-${season}-${selectedJornada}`;
            if (!confirmLoaded[key]) return null;
            const isConfirmed = !!confirmedJornadas[key];
            return (
              <div
                className="matches-bar"
                style={{
                  display: 'flex',
                  gap: '1rem',
                  marginTop: '1rem',
                  padding: '1rem',
                  background: '#2A2A2A',
                  borderRadius: '0.5rem',
                  opacity: isConfirmed ? 0.5 : 1,
                  pointerEvents: isConfirmed ? 'none' : 'auto'
                }}
              >
                {scheduledMatches[`${activeDiv}-${season}`]?.[jornadas.findIndex(j => j.id === selectedJornada)]?.map((p, idx) => {
                  const t1 = teamsByDiv[activeDiv].find(t => t.id === p.team1_id) || {};
                  const t2 = teamsByDiv[activeDiv].find(t => t.id === p.team2_id) || {};
                  return (
                    <div
                      key={idx}
                      className="match-card"
                      draggable={!isConfirmed}
                      onDragStart={e => {
                        if (!isConfirmed) {
                          e.dataTransfer.setData(
                            'application/json',
                            JSON.stringify({ pair: p, roundIdx: jornadas.findIndex(j => j.id === selectedJornada) })
                          );
                        }
                      }}
                      style={{
                        background: '#3A3A3A',
                        borderRadius: '0.375rem',
                        padding: '0.75rem',
                        color: '#F3F4F6',
                        cursor: isConfirmed ? 'default' : 'move'
                      }}
                    >
                      {t1.name} vs {t2.name}
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Confirmar jornada */}
          {selectedJornada && (() => {
            const key = `${activeDiv}-${season}-${selectedJornada}`;
            const isConfirmed = !!confirmedJornadas[key];
            return (
              <button
                className="btn success"
                style={{
                  background: '#16A34A',
                  color: '#FFF',
                  marginTop: '1rem',
                  padding: '0.75rem',
                  width: '100%'
                }}
                onClick={handleConfirmJornada}
                disabled={loading || isConfirmed}
              >
                { isConfirmed ? 'Confirmado' : (loading ? 'Guardando...' : 'Confirmar Jornada') }
              </button>
            );
          })()}

          {/* Se eliminó el formulario de registro manual de partidos */}
        </div>
      )}
    </>
  );
}
