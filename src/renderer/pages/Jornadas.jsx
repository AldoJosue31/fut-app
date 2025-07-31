// src/renderer/pages/Jornadas.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { getGlobalLineupConfig } from '../services/configService';
import {
  moveScheduledMatch,
  confirmJornadaSchedule
} from '../services/scheduleService.js';

export default function Jornadas({
  divisions,
  startedDivisions,
  activeDiv,
  setActiveDiv,
  season,
  jornadas,
  selectedJornada,
  setSelectedJornada,
  allTeams,
  scheduledMatches,      // << aquí viene tu calendario base round-robin
  tableSchedule,
  setTableSchedule,
  confirmLoaded,
  confirmedJornadas,
  handleDrop,
  handleReturnMatch,
  hours,
  loading,
  handleConfirmJornada,
  onSelectMatch,
  showResultModal,
  onCloseResultModal,
  selectedMatchEntry,
  templateConfig
}) {
  // 0) Config global alineaciones
  const [lineupConfig, setLineupConfig] = useState({ starters: 5, subs: 6 });
  useEffect(() => {
    getGlobalLineupConfig().then(setLineupConfig).catch(console.error);
  }, []);

  // 1) Mapa id → equipo
  const teamMap = useMemo(
    () => Object.fromEntries(allTeams.map(t => [t.id, t])),
    [allTeams]
  );

  // 2) Sólo jornadas confirmadas + la siguiente no confirmada
  const activeJornadas = useMemo(() => {
    const keyFor = j => `${activeDiv}-${season}-${j.id}`;
    const idxNext = jornadas.findIndex(j => !confirmedJornadas[keyFor(j)]);
    return idxNext < 0
      ? jornadas
      : jornadas.slice(0, idxNext + 1);
  }, [jornadas, confirmedJornadas, activeDiv, season]);

  const roundIdx = activeJornadas.findIndex(j => j.id === selectedJornada);
  const isLast   = roundIdx === activeJornadas.length - 1;

  // 3) Barra de partidos: ronda actual + pendientes de previas
  const [itemsForBar, setItemsForBar] = useState([]);
  useEffect(() => {
    if (!selectedJornada) {
      setItemsForBar([]);
      return;
    }
    const schedKey = `${activeDiv}-${season}`;
    const rounds = scheduledMatches[schedKey] || [];

    // pares de la ronda actual
    const bar = (rounds[roundIdx] || []).map(pair => ({
      pair,
      origin: roundIdx,
      label: null
    }));

    // detectamos pendientes de rondas anteriores
    const placed = Object.values(
      tableSchedule[`${activeDiv}-${season}-${selectedJornada}`] || {}
    ).map(cell => cell.pair);

    for (let i = 0; i < roundIdx; i++) {
      (rounds[i] || []).forEach(pair => {
        const exists = placed.some(
          p => p.team1_id === pair.team1_id && p.team2_id === pair.team2_id
        );
        if (!exists) {
          bar.push({
            pair,
            origin: i,
            label: `(P.J ${i + 1})`
          });
        }
      });
    }

    // eliminar duplicados en caso de que haya
    const seen = new Set();
    const deduped = bar.filter(({ pair, origin }) => {
      const key = `${pair.team1_id}-${pair.team2_id}-r${origin}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    setItemsForBar(deduped);
  }, [
    scheduledMatches,
    activeDiv,
    season,
    selectedJornada,
    tableSchedule,
    roundIdx
  ]);

  // 4) Escuchar resultados en vivo para actualizar la tabla
  useEffect(() => {
    const handler = e => {
      const { matchId, goals1, goals2 } = e.detail;
      const key = `${activeDiv}-${season}-${selectedJornada}`;
      const curr = { ...(tableSchedule[key] || {}) };
      let changed = false;

      Object.entries(curr).forEach(([cell, obj]) => {
        if (obj.id === matchId) {
          curr[cell] = {
            ...obj,
            result: { goals1, goals2 }
          };
          changed = true;
        }
      });

      if (changed) {
        setTableSchedule(ps => ({ ...ps, [key]: curr }));
      }
    };

    window.addEventListener('matchResultUpdated', handler);
    return () =>
      window.removeEventListener('matchResultUpdated', handler);
  }, [activeDiv, season, selectedJornada, tableSchedule, setTableSchedule]);

  return (
    <>
      {/* -- Selector de división -- */}
      <div className="tabs" style={{ marginBottom: '1rem' }}>
        {divisions.filter(d => startedDivisions[d]).map(div => (
          <button
            key={div}
            onClick={() => setActiveDiv(div)}
            className={div === activeDiv ? 'tab active-tab' : 'tab'}
          >
            {div}
          </button>
        ))}
      </div>

      {/* -- Si no hay jornadas activas -- */}
      {activeJornadas.length === 0 ? (
        <div style={{ padding: '1rem', color: '#aaa' }}>
          No hay torneos iniciados en esta división.
        </div>
      ) : (
        <div className="content-box">
          {/* -- Navegación de jornadas -- */}
          <div className="jornadas-nav">
            <button
              onClick={() =>
                roundIdx > 0 &&
                setSelectedJornada(
                  activeJornadas[roundIdx - 1].id
                )
              }
              disabled={roundIdx <= 0}
              className="team-btn"
            >
              ‹
            </button>
            <span style={{ margin: '0 1rem', color: '#F3F4F6' }}>
              {activeJornadas[roundIdx]?.name}
            </span>
            <button
              onClick={() =>
                roundIdx < activeJornadas.length - 1 &&
                setSelectedJornada(
                  activeJornadas[roundIdx + 1].id
                )
              }
              disabled={roundIdx >= activeJornadas.length - 1}
              className="team-btn"
            >
              ›
            </button>
          </div>

          {/* -- Tabla de horarios -- */}
          {selectedJornada && (() => {
            const key = `${activeDiv}-${season}-${selectedJornada}`;
            const isLoaded    = confirmLoaded[key];
            const isConfirmed = confirmedJornadas[key];

            return (
              <div className="classification-table-wrapper">
                {!isLoaded && (
                  <div className="loading-overlay">
                    <span>Cargando estado…</span>
                  </div>
                )}
                <table
                  className="classification-table"
                  style={{
                    visibility: isLoaded ? 'visible' : 'hidden'
                  }}
                >
                  <thead>
                    <tr>
                      <th>Hora</th>
                      {['L','Ma','Mi','J','V','S'].map(d => (
                        <th key={d}>{d}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {hours.map((hora, r) => (
                      <tr key={r}>
                        <td style={{ color: '#E5E7EB' }}>
                          {hora} p.m.
                        </td>
                        {[0,1,2,3,4,5].map(c => {
                          const cell = `${r}-${c}`;
                          const raw  = (tableSchedule[key]||{})[cell];
                          if (!raw) {
                            return (
                              <td
                                key={c}
                                style={{
                                  position: 'relative',
                                  border: '1px solid rgba(255,255,255,0.2)',
                                  height: '4rem'
                                }}
                                onDragOver={e =>
                                  isLoaded &&
                                  !isConfirmed &&
                                  e.preventDefault()
                                }
                                onDrop={e =>
                                  isLoaded &&
                                  !isConfirmed &&
                                  handleDrop(e, r, c)
                                }
                              />
                            );
                          }

                          // ya hay algo en esta celda
                          const entryObj = raw;

                          return (
                            <td
                              key={c}
                              style={{
                                position: 'relative',
                                border: '1px solid rgba(255,255,255,0.2)',
                                height: '4rem'
                              }}
                              onDragOver={e =>
                                isLoaded &&
                                !isConfirmed &&
                                e.preventDefault()
                              }
                              onDrop={e =>
                                isLoaded &&
                                !isConfirmed &&
                                handleDrop(e, r, c)
                              }
                            >
                              <div
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
                                  cursor: isConfirmed
                                    ? 'pointer'
                                    : 'move',
                                  opacity: isConfirmed ? 0.7 : 1
                                }}
                                draggable={!isConfirmed}
                                onDragStart={e => {
                                  if (!isConfirmed) {
                                    e.dataTransfer.setData(
                                      'application/json',
                                      JSON.stringify({
                                        pair: entryObj.pair,
                                        roundIdx: entryObj.origin,
                                        fromCell: cell
                                      })
                                    );
                                  }
                                }}
                                onClick={() => {
                                  if (isConfirmed) {
                                    onSelectMatch({
                                      ...entryObj,
                                      jornadaId: selectedJornada,
                                      team1Name:
                                        teamMap[
                                          entryObj.pair.team1_id
                                        ].name,
                                      team2Name:
                                        teamMap[
                                          entryObj.pair.team2_id
                                        ].name,
                                      id: entryObj.id,
                                      config: templateConfig
                                    });
                                  }
                                }}
                              >
                                {entryObj.result
                                  ? `${teamMap[entryObj.pair.team1_id].name} ${
                                      entryObj.result.goals1
                                    }-${
                                      entryObj.result.goals2
                                    } ${teamMap[entryObj.pair.team2_id].name}`
                                  : `${teamMap[entryObj.pair.team1_id].name} vs ${teamMap[entryObj.pair.team2_id].name}`
                                }
                                {entryObj.origin < roundIdx && (
                                  <em style={{ marginLeft:'0.5rem', fontSize:'0.75rem' }}>
                                    (P.J {entryObj.origin + 1})
                                  </em>
                                )}
                              </div>
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

          {/* -- Barra de partidos disponibles para arrastrar -- */}
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
            {itemsForBar.map(({ pair, origin, label }) => {
              const t1 = teamMap[pair.team1_id];
              const t2 = teamMap[pair.team2_id];
              return (
                <div
                  key={`${pair.team1_id}-${pair.team2_id}-${origin}`}
                  className="match-card"
                  draggable
                  onDragStart={e =>
                    e.dataTransfer.setData(
                      'application/json',
                      JSON.stringify({ pair, roundIdx: origin })
                    )
                  }
                >
                  {t1.name} vs {t2.name} {label}
                </div>
              );
            })}
          </div>

          {/* -- Botón confirmar jornada -- */}
          <button
            className="btn success"
            style={{
              marginTop: '1rem',
              width: '100%',
              background: isLast && itemsForBar.length
                ? '#A0A0A0'
                : '#16A34A',
              cursor: isLast && itemsForBar.length
                ? 'not-allowed'
                : 'pointer'
            }}
            onClick={handleConfirmJornada}
            disabled={
              loading ||
              confirmedJornadas[`${activeDiv}-${season}-${selectedJornada}`] ||
              (isLast && itemsForBar.length)
            }
          >
            {confirmedJornadas[`${activeDiv}-${season}-${selectedJornada}`]
              ? 'Confirmado'
              : loading
              ? 'Guardando…'
              : 'Confirmar Jornada'}
          </button>
        </div>
      )}
    </>
  );
}
