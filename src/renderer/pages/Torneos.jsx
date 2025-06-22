// src/renderer/pages/Torneos.jsx
import React, { useState } from 'react';

export default function Torneos({
  divisions,
  tournamentTeams,
  startedDivisions,
  startDates,
  allTeams,
  setStartDates,
  season,
  setSeason,
  seasons,
  doubleRounds,        // { [div]: boolean }
  setDoubleRounds,     // fn(div, value)
  loadingDivs,         // { [div]: boolean }
  handleStartDivision, // fn(div, startDate, isDouble)
  onConfigChange       // fn(div, { starters, subs })
}) {
  // estados globales de plantilla (por ahora valores por defecto; los guardas en onConfigChange)
  const [starterCountGlobal, setStarterCountGlobal] = useState(5);
  const [subsCountGlobal, setSubsCountGlobal]       = useState(6);

  return (
    <div className="content-box">
      <h2 style={{ color: '#F3F4F6', marginBottom: '1rem' }}>
        Iniciar Torneos
      </h2>

      {/* ======== Configuración de Plantilla ======== */}
      <div
        style={{
          display: 'flex',
          gap: '1.5rem',
          marginBottom: '1.5rem',
          alignItems: 'center'
        }}
      >
        <div>
          <label style={{ color: '#E5E7EB' }}>Titulares:</label>
          <input
            type="number"
            min="1"
            max="11"
            value={starterCountGlobal}
            onChange={e => setStarterCountGlobal(+e.target.value)}
            style={{ width: '4rem', marginLeft: '0.5rem' }}
          />
        </div>
        <div>
          <label style={{ color: '#E5E7EB' }}>Suplentes:</label>
          <input
            type="number"
            min="0"
            max="12"
            value={subsCountGlobal}
            onChange={e => setSubsCountGlobal(+e.target.value)}
            style={{ width: '4rem', marginLeft: '0.5rem' }}
          />
        </div>
      </div>

      {/* ======== Selección de Temporada ======== */}
      <label
        style={{
          color: '#E5E7EB',
          marginBottom: '0.5rem',
          display: 'block'
        }}
      >
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
        {seasons
          .filter(s => {
            const year = +s.split(' ')[1];
            if (year === new Date().getFullYear()) return true;
            // opcional: incluir temporadas históricas ya iniciadas
            return Object.values(startedDivisions).some(v => v);
          })
          .map(s => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
      </select>

      {/* ======== Cuadrícula de Divisiones ======== */}
      <div
        className="teams-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '2rem'
        }}
      >
        {divisions.map(div => {
          const started = !!startedDivisions[div];
          const loading = !!loadingDivs[div];

          // equipos activos o ya en tournamentTeams
          const list = allTeams.filter(
            t =>
              t.division === div &&
              (t.status === 'Activo' || tournamentTeams.includes(t.id))
          );

          return (
            <div
              key={div}
              style={{
                background: '#3A3A3A',
                borderRadius: '0.75rem',
                padding: '1rem'
              }}
            >
              <h3
                style={{ color: '#E5E7EB', marginBottom: '0.75rem' }}
              >
                {div}
              </h3>

              {/* Lista de equipos */}
              <ul className="teams-list">
                {list.length > 0 ? (
                  list.map(t => (
                    <li key={t.id} className="team-box">
                      {t.name}{' '}
                      {t.status !== 'Activo' && (
                        <em style={{ opacity: 0.6 }}>(inactivo)</em>
                      )}
                    </li>
                  ))
                ) : (
                  <li
                    style={{
                      color: '#9CA3AF',
                      fontStyle: 'italic'
                    }}
                  >
                    No hay equipos
                  </li>
                )}
              </ul>

              {/* Fecha de inicio */}
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
                disabled={started || loading}
                style={{
                  background: '#2A2A2A',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '0.375rem',
                  color: '#F3F4F6',
                  padding: '0.5rem',
                  width: '100%',
                  marginBottom: '0.75rem'
                }}
              />

              {/* Doble vuelta */}
              <label
                style={{
                  color: '#E5E7EB',
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '1rem'
                }}
              >
                <input
                  type="checkbox"
                  checked={!!doubleRounds[div]}
                  onChange={e =>
                    setDoubleRounds(div, e.target.checked)
                  }
                  disabled={started || loading}
                  style={{ marginRight: '0.5rem' }}
                />
                Doble vuelta
              </label>

              {/* Botón de inicio */}
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
                  className="btn success"
                  style={{
                    background: loading
                      ? '#4A7D32'
                      : '#16A34A',
                    color: '#FFF',
                    width: '100%',
                    padding: '0.75rem',
                    opacity: loading ? 0.7 : 1,
                    cursor: loading ? 'default' : 'pointer'
                  }}
                  disabled={loading}
                  onClick={() => {
                    // 1) guarda la config para esta división+temporada:
                    onConfigChange(div, {
                      starters: starterCountGlobal,
                      subs: subsCountGlobal
                    });
                    // 2) inicia el torneo:
                    handleStartDivision(
                      div,
                      startDates[div],
                      !!doubleRounds[div]
                    );
                  }}
                >
                  {loading ? 'Iniciando…' : 'COMENZAR TORNEO'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
