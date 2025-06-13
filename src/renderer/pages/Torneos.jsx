// src/renderer/pages/Torneos.jsx
import React from 'react';

export default function Torneos({
  divisions,
  teamsByDiv,
  startedDivisions,
  startDates,
  setStartDates,
  season,
  seasons,
  handleStartDivision
}) {
  return (
    <div className="content-box">
      <h2 style={{ color: '#F3F4F6', marginBottom: '1rem' }}>Iniciar Torneos</h2>
      <label style={{ color: '#E5E7EB', marginBottom: '0.5rem', display: 'block' }}>
        Temporada
      </label>
      <select
        value={season}
        onChange={e => {
          // Partidos.jsx controla setSeason, si es necesario exponer:
          // setSeason(e.target.value)
        }}
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
  );
}
