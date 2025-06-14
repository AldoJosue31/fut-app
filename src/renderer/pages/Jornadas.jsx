// src/renderer/pages/Jornadas.jsx
import React, { useMemo } from 'react';

export default function Jornadas({
  divisions,
  startedDivisions,
  activeDiv,
  setActiveDiv,
  season,
  jornadas,
  selectedJornada,
  setSelectedJornada,
  teamsByDiv,
  scheduledMatches,
  tableSchedule,
  confirmLoaded,
  confirmedJornadas,
  handleDrop,
  handleReturnMatch,
  hours,
  loading,
  handleConfirmJornada
}) {
  // 1) Solo jornadas confirmadas + la próxima no confirmada
  const activeJornadas = useMemo(() => {
    const keyFor = j => `${activeDiv}-${season}-${j.id}`;
    const idxNext = jornadas.findIndex(j => !confirmedJornadas[keyFor(j)]);
    return idxNext === -1
      ? jornadas
      : jornadas.slice(0, idxNext + 1);
  }, [jornadas, confirmedJornadas, activeDiv, season]);

  // 2) Preparamos la barra de partidos (ronda actual + pendientes), sin duplicados
  const itemsForBar = useMemo(() => {
    if (!selectedJornada) return [];
    const roundIdx = activeJornadas.findIndex(j => j.id === selectedJornada);
    const schedKey = `${activeDiv}-${season}`;
    const rounds = scheduledMatches[schedKey] || [];
    const placed = Object.values(
      tableSchedule[`${activeDiv}-${season}-${selectedJornada}`] || {}
    );

    // Helper: identificador único de un par + ronda origen
    const idOf = (p, origin) => `${p.team1_id}-${p.team2_id}-r${origin}`;

    // 2.A) pares de la ronda actual
    const list = (rounds[roundIdx] || []).map(p => ({
      pair: p,
      origin: roundIdx,
      label: null
    }));

    // 2.B) pendientes de rondas anteriores ya confirmadas
    for (let i = 0; i < roundIdx; i++) {
      const prevJ = activeJornadas[i];
      const keyPrev = `${activeDiv}-${season}-${prevJ.id}`;
      if (!confirmLoaded[keyPrev] || !confirmedJornadas[keyPrev]) continue;
      (rounds[i] || []).forEach(p => {
        const wasPlaced = placed.some(r =>
          r.team1_id === p.team1_id &&
          r.team2_id === p.team2_id
        );
        if (!wasPlaced) {
          list.push({
            pair: p,
            origin: i,
            label: `(Pendiente J${i + 1})`
          });
        }
      });
    }

    // 2.C) quitar duplicados por idOf
    const seen = new Set();
    return list.filter(({ pair, origin, label }) => {
      const key = idOf(pair, origin);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [
    activeJornadas,
    selectedJornada,
    scheduledMatches,
    tableSchedule,
    activeDiv,
    season,
    confirmLoaded,
    confirmedJornadas
  ]);

  return (
    <>
      {/* División */}
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

      {/* Si no hay jornadas activas */}
      {activeJornadas.length === 0 ? (
        <div style={{ color: '#E5E7EB', padding: '1rem' }}>
          No hay torneos iniciados en esta división.
        </div>
      ) : (
        <div className="content-box">
          {/* Navegación */}
          <div className="jornadas-nav">
            <button
              onClick={() => {
                const idx = activeJornadas.findIndex(j => j.id === selectedJornada);
                if (idx > 0) setSelectedJornada(activeJornadas[idx - 1].id);
              }}
              className="team-btn"
              disabled={activeJornadas.findIndex(j => j.id === selectedJornada) <= 0}
            >
              {'<'}
            </button>
            <span className="jornada-title" style={{ margin: '0 1rem', color: '#F3F4F6' }}>
              {selectedJornada
                ? activeJornadas.find(j => j.id === selectedJornada)?.name
                : 'Sin jornadas'}
            </span>
            <button
              onClick={() => {
                const idx = activeJornadas.findIndex(j => j.id === selectedJornada);
                if (idx < activeJornadas.length - 1)
                  setSelectedJornada(activeJornadas[idx + 1].id);
              }}
              className="team-btn"
              disabled={activeJornadas.findIndex(j => j.id === selectedJornada) >= activeJornadas.length - 1}
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
                <table
                  className="classification-table"
                  style={{ visibility: isLoaded ? 'visible' : 'hidden' }}
                >
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
                                      const roundIdx = activeJornadas.findIndex(
                                        j => j.id === selectedJornada
                                      );
                                      e.dataTransfer.setData(
                                        'application/json',
                                        JSON.stringify({
                                          pair: match,
                                          fromCell: cellKey,
                                          roundIdx
                                        })
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
          {selectedJornada && itemsForBar.length > 0 && (
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
              onDragOver={e => {
                if (e.dataTransfer.types.includes('application/json')) e.preventDefault();
              }}
              onDrop={handleReturnMatch}
            >
              {itemsForBar.map(({ pair, origin, label }, idx) => {
                const t1 = teamsByDiv[activeDiv].find(t => t.id === pair.team1_id) || {};
                const t2 = teamsByDiv[activeDiv].find(t => t.id === pair.team2_id) || {};
                return (
                  <div
                    key={`${pair.team1_id}-${pair.team2_id}-${origin}`}
                    className="match-card"
                    draggable
                    onDragStart={e => {
                      e.dataTransfer.setData(
                        'application/json',
                        JSON.stringify({ pair, roundIdx: origin, fromCell: null })
                      );
                    }}
                    style={{
                      background: '#3A3A3A',
                      borderRadius: '0.375rem',
                      padding: '0.75rem',
                      color: '#F3F4F6',
                      cursor: 'move'
                    }}
                  >
                    {t1.name} vs {t2.name}
                    {label && <em style={{ marginLeft: '0.5rem' }}>{label}</em>}
                  </div>
                );
              })}
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
              onClick={handleConfirmJornada}
              disabled={
                loading ||
                confirmedJornadas[`${activeDiv}-${season}-${selectedJornada}`]
              }
            >
              {confirmedJornadas[`${activeDiv}-${season}-${selectedJornada}`]
                ? 'Confirmado'
                : loading ? 'Guardando…' : 'Confirmar Jornada'}
            </button>
          )}
        </div>
      )}
    </>
  );
}
