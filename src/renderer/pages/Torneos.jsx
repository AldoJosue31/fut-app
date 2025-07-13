// src/renderer/pages/Torneos.jsx
import React from 'react';
import { getGlobalLineupConfig } from '../services/configService';
import { TeamsTableSkeleton } from '../components/Skeletons.jsx';

// — Skeleton durante la primera carga de la vista —
function TorneosViewSkeleton({ rows = 3 }) {
  return (
    <div className="content-box">
      {/* Cabecera */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div className="skeleton skeleton-text" style={{ width: '150px', height: '2rem' }} />
      </div>

      {/* Configuración global */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="skeleton skeleton-text short" style={{ width: '80px' }} />
        <div className="skeleton skeleton-text short" style={{ width: '80px' }} />
      </div>

      {/* Selector de Temporada */}
      <div style={{ marginBottom: '2rem' }}>
        <div className="skeleton skeleton-input" style={{ width: '200px', height: '2.5rem' }} />
      </div>

      {/* Grid de divisiones */}
      <div
        className="teams-grid"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}
      >
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            style={{
              background: '#3A3A3A',
              borderRadius: '0.75rem',
              padding: '1rem',
              minHeight: '250px',
            }}
          >
            {/* Título de división */}
            <div className="skeleton skeleton-text medium" style={{ width: '100px', marginBottom: '1rem' }} />

            {/* Lista de equipos (3 ítems esqueléticos) */}
            <ul className="teams-list" style={{ marginBottom: '1rem' }}>
              {Array.from({ length: 3 }).map((_, j) => (
                <li key={j}>
                  <div className="skeleton skeleton-text short" style={{ width: '60%', margin: '0.5rem 0' }} />
                </li>
              ))}
            </ul>

            {/* Fecha de inicio */}
            <div className="skeleton skeleton-input" style={{ width: '100%', height: '2rem', marginBottom: '1rem' }} />

            {/* Checkbox de doble vuelta */}
            <div className="skeleton skeleton-checkbox" style={{ width: '1.2rem', height: '1.2rem', marginBottom: '1rem' }} />

            {/* Botón */}
            <div className="skeleton skeleton-button" style={{ width: '100%', height: '2.5rem' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

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
  const [viewLoading, setViewLoading] = React.useState(true);

  // 1) Leer configuración global
  React.useEffect(() => {
    getGlobalLineupConfig()
      .then(setLineup)
      .catch(console.error);
  }, []);

  // 2) Escuchar actualizaciones
  React.useEffect(() => {
    const handler = () => {
      getGlobalLineupConfig()
        .then(setLineup)
        .catch(console.error);
    };
    window.addEventListener('lineupConfigUpdated', handler);
    return () => window.removeEventListener('lineupConfigUpdated', handler);
  }, []);

  // 3) Cuando tengamos divisiones y equipos, quitamos el viewLoading
  React.useEffect(() => {
    if (divisions.length > 0 && allTeams.length > 0) {
      setViewLoading(false);
    }
  }, [divisions, allTeams]);

  // Si *todas* las divisiones están en loading, seguimos mostrando skeleton
  const allLoading = divisions.length > 0 && divisions.every(div => loadingDivs[div]);

  if (viewLoading || allLoading) {
    return <TorneosViewSkeleton rows={divisions.length || 3} />;
  }

  return (
    <div className="content-box">
      <h2 style={{ color: '#F3F4F6', marginBottom: '1rem' }}>
        Iniciar Torneos
      </h2>

      {/* ==== Configuración global ==== */}
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

          if (loading) {
            // Skeleton por división durante el inicio
            return (
              <div key={div} className="classification-table-wrapper">
                <table className="classification-table">
                  <thead>
                    <tr>
                      <th>División</th>
                      <th>Fecha de inicio</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <TeamsTableSkeleton rows={1} />
                </table>
              </div>
            );
          }

          const list = allTeams.filter(
            t => t.division === div && (t.status === 'Activo' || tournamentTeams.includes(t.id))
          );

          return (
            <div
              key={div}
              style={{ background: '#3A3A3A', borderRadius: '0.75rem', padding: '1rem' }}
            >
              <h3 style={{ color: '#E5E7EB', marginBottom: '0.75rem' }}>{div}</h3>

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
                  setStartDates(prev => ({ ...prev, [div]: e.target.value }))
                }
                disabled={started}
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
                  onChange={e => setDoubleRounds(div, e.target.checked)}
                  disabled={started}
                  style={{ marginRight: '0.5rem' }}
                />
                Doble vuelta
              </label>

              {started ? (
                <button
                  className="btn success"
                  disabled
                  style={{
                    background: '#6B7280',
                    color: '#FFF',
                    width: '100%',
                    padding: '0.75rem'
                  }}
                >
                  COMENZADO
                </button>
              ) : (
                <button
                  className="btn success"
                  disabled={loading}
                  onClick={() =>
                    handleStartDivision(div, startDates[div], !!doubleRounds[div])
                  }
                  style={{
                    background: '#16A34A',
                    color: '#FFF',
                    width: '100%',
                    padding: '0.75rem',
                    cursor: 'pointer'
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
