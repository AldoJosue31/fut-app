// src/renderer/pages/Torneos.jsx
import React from 'react';
import { getGlobalLineupConfig } from '../services/configService';
import { getTournamentConfig, deleteTournament } from '../services/tournamentService.js';
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
            className="content-box"
            style={{ minHeight: 200, borderRadius: '0.75rem', padding: '0.75rem' }}
          >
            {/* Título de división */}
            <div className="skeleton skeleton-text medium" style={{ width: '100px', marginBottom: '1rem' }} />

            {/* Lista de equipos (3 ítems esqueléticos) */}
            <ul className="teams-list" style={{ marginBottom: '0.75rem' }}>
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

// Modal de configuración del torneo — usa tus clases del main.css y añade opción para eliminar torneo si ya comenzó
function TournamentConfigModal({ open, onClose, division, season, initial, onSave, started }) {
  const [form, setForm] = React.useState({ name: '', starters: 5, subs: 6, doubleRound: false });
  const [deleting, setDeleting] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    if (initial) setForm(prev => ({ ...prev, ...initial }));
  }, [open, initial]);

  React.useEffect(() => {
    if (!open) setForm({ name: '', starters: 5, subs: 6, doubleRound: false });
  }, [open]);

  if (!open) return null;

  function updateField(k, v) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  async function handleSave() {
    try {
      const key = `tournament-config-${division}-${season}`;
      localStorage.setItem(key, JSON.stringify(form));
      window.dispatchEvent(new CustomEvent('tournamentConfigSaved', { detail: { division, season, config: form } }));
      if (onSave) onSave(form);
      onClose();
    } catch (err) {
      console.error('Error guardando config local:', err);
      alert('No se pudo guardar la configuración.');
    }
  }

  async function handleDelete() {
    const ok = window.confirm(`¿Eliminar el torneo de ${division} (${season})? Esta acción borrará datos asociados y no podrá deshacerse.`);
    if (!ok) return;
    setDeleting(true);
    try {
      // llama al servicio que debe encargarse de borrar torneo + tablas relacionadas
      if (typeof deleteTournament === 'function') {
        await deleteTournament(division, season);
      } else {
        console.warn('deleteTournament no está disponible en tournamentService.');
        // como fallback, intentamos borrar algunas claves locales
      }

      // limpiar cachés/localStorage que use la app
      try {
        localStorage.removeItem(`tournament-config-${division}-${season}`);
        localStorage.removeItem(`schedule-${division}-${season}`);
        // borrar cualquier tabla-... almacenada
        Object.keys(localStorage).forEach(k => {
          if (k.startsWith(`table-${division}-${season}`) || k.startsWith(`${division}-${season}`)) {
            localStorage.removeItem(k);
          }
        });
      } catch (e) { console.warn('No se pudo limpiar localStorage completamente', e); }

      // notificar al resto de la app
      window.dispatchEvent(new CustomEvent('tournamentDeleted', { detail: { division, season } }));

      if (onSave) onSave({ ...form, deleted: true });
      onClose();
      alert('Torneo eliminado correctamente.');
    } catch (err) {
      console.error('Error eliminando torneo:', err);
      alert('No se pudo eliminar el torneo. Revisa la consola.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="modal-overlay config-modal" role="dialog" aria-modal="true">
      <div className="modal-content">
        <div className="config-modal__header">
          <h2>{division} — Configurar torneo</h2>
          <button className="config-modal__close" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        <div className="config-modal__body">
          <div className="form-group">
            <label>Nombre del torneo</label>
            <input className="config-modal__edit-input" value={form.name} onChange={e => updateField('name', e.target.value)} />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Titulares</label>
              <input type="number" min={1} className="config-modal__edit-input" value={form.starters} onChange={e => updateField('starters', Number(e.target.value))} />
            </div>
            <div className="form-group" style={{ width: 120 }}>
              <label>Suplentes</label>
              <input type="number" min={0} className="config-modal__edit-input" value={form.subs} onChange={e => updateField('subs', Number(e.target.value))} />
            </div>
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input id="doubleRound" type="checkbox" checked={!!form.doubleRound} onChange={e => updateField('doubleRound', e.target.checked)} />
            <label htmlFor="doubleRound" style={{ margin: 0 }}>Doble vuelta</label>
          </div>

          <div className="modal-actions">
            <button className="btn cancel" onClick={onClose}>Cancelar</button>
            <button className="btn success" onClick={handleSave}>Guardar</button>
            {started && (
              <button className="btn danger" onClick={handleDelete} disabled={deleting} style={{ marginLeft: 8 }}>
                {deleting ? 'Eliminando...' : 'Eliminar torneo'}
              </button>
            )}
          </div>
        </div>
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
  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalDivision, setModalDivision] = React.useState(null);
  const [modalInitial, setModalInitial] = React.useState(null);
  const [modalStarted, setModalStarted] = React.useState(false);

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

  async function openConfigModal(div) {
    setModalDivision(div);
    setModalInitial(null);
    setModalStarted(!!startedDivisions[div]);
    try {
      const remote = await getTournamentConfig(div, season).catch(() => null);
      const localKey = `tournament-config-${div}-${season}`;
      const local = JSON.parse(localStorage.getItem(localKey) || 'null');
      const initial = remote || local || { name: `${div} ${season}`, starters: lineup.starters, subs: lineup.subs, doubleRound: !!doubleRounds[div] };
      setModalInitial(initial);
    } catch (err) {
      console.error('Error leyendo configuración de torneo:', err);
      setModalInitial({ name: `${div} ${season}`, starters: lineup.starters, subs: lineup.subs, doubleRound: !!doubleRounds[div] });
    }
    setModalOpen(true);
  }

  function handleModalSave(form) {
    // sync doubleRounds checkbox with parent
    if (typeof setDoubleRounds === 'function') {
      setDoubleRounds(modalDivision, !!form.doubleRound);
    }

    // si el modal indicó borrado, emitimos evento adicional para que Partidos.jsx refresque
    if (form && form.deleted) {
      window.dispatchEvent(new CustomEvent('tournamentDeleted', { detail: { division: modalDivision, season } }));
    }
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
          border: '1px solid rgba(255,255,255,0.4)',
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
              className="content-box"
              style={{ borderRadius: '0.75rem', padding: '0.75rem' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h3 style={{ color: '#E5E7EB', margin: 0, fontSize: '1.05rem' }}>{div}</h3>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <div style={{ padding: '2px 8px', borderRadius: 999, background: '#0EA5A4', color: '#012', fontSize: 12 }}>{list.length} equipos</div>
                  <button className="btn text" onClick={() => openConfigModal(div)}>⚙ Configurar</button>
                </div>
              </div>

              <ul className="teams-list" style={{ marginBottom: '0.75rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {list.length > 0 ? (
                  list.map(t => (
                    <li key={t.id} className="team-box team-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.375rem 0.75rem' }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <div className="team-color small" style={{ background: '#0EA5A4', color: '#021', fontWeight: 700 }}>{t.name.slice(0,2).toUpperCase()}</div>
                        <div>
                          <div className="team-name" style={{ fontSize: '0.95rem' }}>{t.name}</div>
                          {t.status !== 'Activo' && <div style={{ color: '#94A3B8', fontSize: 11 }}>inactivo</div>}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {t.category ? <span className="placeholder" style={{ fontSize: 12 }}>{t.category}</span> : null}
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="placeholder">No hay equipos</li>
                )}
              </ul>

              <label style={{ color: '#E5E7EB', marginBottom: '0.25rem', display: 'block' }}>
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
                    padding: '0.65rem'
                  }}
                >
                  COMENZADO
                </button>
              ) : (
                <button
                  className="btn success"
                  disabled={loading}
                  onClick={() =>
                    // ahora pasamos también lineup (titulares y suplentes)
  handleStartDivision(
    div,
    startDates[div],
    !!doubleRounds[div],
    { starters: lineup.starters, subs: lineup.subs }
  )
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

      <TournamentConfigModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        division={modalDivision}
        season={season}
        initial={modalInitial}
        onSave={handleModalSave}
        started={modalStarted}
      />
    </div>
  );
}
