// src/renderer/pages/Torneos.jsx
import React from 'react';

export default function Torneos({
  divisions,
  tournamentTeams,      // ← nuevo
  startedDivisions,
  startDates,
  allTeams,
  setStartDates,
  season,
  seasons,
  doubleRounds,           // { [div]: boolean }
  setDoubleRounds,        // fn(div, value)
  loadingDivs,            // { [div]: boolean }
  handleStartDivision     // fn(div, startDate, isDouble)
}) {
  return (
    <div className="content-box">
      <h2 style={{ color: '#F3F4F6', marginBottom: '1rem' }}>Iniciar Torneos</h2>

      {/* Temporada */}
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
            {seasons
      // mostramos sólo los dos del año actual, más los "season" que ya arrancaron
      .filter(s => {
        const year = parseInt(s.split(' ')[1], 10);
        if (year === new Date().getFullYear()) return true;
        // si en startedDivisions ya existe alguna jornada con esa season,
        // la incluimos (históricas)
        return Object.values(startedDivisions).some((_v, i) => seasons[i] === s);
      })
      .map(s => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      <div
        className="teams-grid"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}
      >
        {divisions.map(div => {
          const started = !!startedDivisions[div];
          const loading = !!loadingDivs[div];

          // 1) saco la lista de equipos visibles:
          //    a) todos los activos
          //    b) más los inactivos que ya estén en tournamentTeams
           const list = allTeams.filter(t =>
             t.division === div &&
             (t.status === 'Activo' || tournamentTeams.includes(t.id))
           );

          return (
            <div key={div} style={{ background: '#3A3A3A', borderRadius: '0.75rem', padding: '1rem' }}>
              <h3 style={{ color: '#E5E7EB', marginBottom: '0.75rem' }}>{div} div</h3>

              <ul className="teams-list">
                {list.map(t => (
                  <li key={t.id} className="team-box">
                    {t.name} {t.status !== 'Activo' && <em style={{ opacity: 0.6 }}>(inactivo)</em>}
                  </li>
                ))}
                {!list.length && (
                  <li style={{ color: '#9CA3AF', fontStyle: 'italic' }}>No hay equipos</li>
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
                  setStartDates(prev => ({ ...prev, [div]: e.target.value }))
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

              {/* Checkbox Doble vuelta */}
              <label style={{ color: '#E5E7EB', display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                <input
                  type="checkbox"
                  checked={!!doubleRounds[div]}
                  onChange={e => setDoubleRounds(div, e.target.checked)}
                  disabled={started || loading}
                  style={{ marginRight: '0.5rem' }}
                />
                Doble vuelta
              </label>

              {/* Botón */}
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
                  onClick={() => handleStartDivision(div, startDates[div], !!doubleRounds[div])}
                  className="btn success"
                  disabled={loading}
                  style={{
                    background: loading ? '#4A7D32' : '#16A34A',
                    color: '#FFF',
                    width: '100%',
                    padding: '0.75rem',
                    opacity: loading ? 0.7 : 1,
                    cursor: loading ? 'default' : 'pointer'
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
