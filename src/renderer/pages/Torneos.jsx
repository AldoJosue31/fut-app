import React from 'react';
import { getGlobalLineupConfig } from '../services/configService';

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
  doubleRounds,
  setDoubleRounds,
  loadingDivs,
  handleStartDivision
}) {
  const [lineup, setLineup] = React.useState({ starters: 5, subs: 6 });

  // 1) Al montar, leer la configuración global
  React.useEffect(() => {
    getGlobalLineupConfig()
      .then(setLineup)
      .catch(console.error);
  }, []);

  // 2) Escuchar actualizaciones desde el Sidebar
  React.useEffect(() => {
    function handler() {
      getGlobalLineupConfig()
        .then(setLineup)
        .catch(console.error);
    }
    window.addEventListener('lineupConfigUpdated', handler);
    return () => window.removeEventListener('lineupConfigUpdated', handler);
  }, []);

  return (
    <div className="content-box">
      <h2 style={{ color: '#F3F4F6', marginBottom: '1rem' }}>
        Iniciar Torneos
      </h2>

      {/* ==== Mostrar la configuración global ==== */}
      <div style={{ marginBottom: '1.5rem', color: '#E5E7EB' }}>
        <strong>Titulares:</strong> {lineup.starters} &nbsp;|&nbsp;
        <strong>Suplentes:</strong> {lineup.subs}
      </div>

      {/* ==== Selección de Temporada ==== */}
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
          .filter(s => {
            const year = +s.split(' ')[1];
            if (year === new Date().getFullYear()) return true;
            return Object.values(startedDivisions).some(v => v);
          })
          .map(s => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
      </select>

      {/* ==== Cuadrícula de Divisiones ==== */}
      <div
        className="teams-grid"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}
      >
        {divisions.map(div => {
          const started = !!startedDivisions[div];
          const loading = !!loadingDivs[div];
          const list = allTeams.filter(
            t => t.division === div && (t.status === 'Activo' || tournamentTeams.includes(t.id))
          );

          return (
            <div key={div} style={{ background: '#3A3A3A', borderRadius: '0.75rem', padding: '1rem' }}>
              <h3 style={{ color: '#E5E7EB', marginBottom: '0.75rem' }}>{div}</h3>

              <ul className="teams-list">
                {list.length > 0 ? (
                  list.map(t => (
                    <li key={t.id} className="team-box">
                      {t.name} {t.status !== 'Activo' && <em style={{ opacity: 0.6 }}>(inactivo)</em>}
                    </li>
                  ))
                ) : (
                  <li style={{ color: '#9CA3AF', fontStyle: 'italic' }}>No hay equipos</li>
                )}
              </ul>

              <label style={{ color: '#E5E7EB', marginBottom: '0.25rem', display: 'block' }}>
                Fecha de inicio
              </label>
              <input
                type="date"
                value={startDates[div] || ''}
                onChange={e => setStartDates(prev => ({ ...prev, [div]: e.target.value }))}
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

              {started ? (
                <button className="btn success" disabled style={{
                  background: '#6B7280',
                  color: '#FFF',
                  width: '100%',
                  padding: '0.75rem'
                }}>
                  COMENZADO
                </button>
              ) : (
                <button
                  className="btn success"
                  disabled={loading}
                  onClick={() => handleStartDivision(div, startDates[div], !!doubleRounds[div])}
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
