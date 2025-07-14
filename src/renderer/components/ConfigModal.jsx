// src/renderer/components/ConfigModal.jsx
import React, { useState, useEffect } from 'react';
import {
  getGlobalLineupConfig,
  upsertGlobalLineupConfig
} from '../services/configService';
import {
  getDivisions,
  addDivision,
  updateDivision,
  deleteDivision,
  hasActiveTournament
} from '../services/divisionsService';

export default function ConfigModal({ onClose }) {
  const [activeTab, setActiveTab] = useState('lineup');

  // — Estado plantillas —
  const [starters, setStarters] = useState(5);
  const [subs, setSubs] = useState(6);
  const [loadingLineup, setLoadingLineup] = useState(false);

  // — Estado divisiones —
  const [divisions, setDivisions] = useState([]);
  const [divName, setDivName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [loadingDivs, setLoadingDivs] = useState(false);

  // Al montar, cargo ambas configuraciones
  useEffect(() => {
    getGlobalLineupConfig()
      .then(cfg => {
        setStarters(cfg.starters);
        setSubs(cfg.subs);
      })
      .catch(console.error);

    fetchDivisions();
  }, []);

  async function handleApplyLineup() {
    setLoadingLineup(true);
    try {
      await upsertGlobalLineupConfig(starters, subs);
      window.dispatchEvent(new Event('lineupConfigUpdated'));
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error al guardar configuración de plantilla');
    } finally {
      setLoadingLineup(false);
    }
  }

  async function fetchDivisions() {
    setLoadingDivs(true);
    try {
      const data = await getDivisions();
      setDivisions(data);
    } catch (err) {
      console.error(err);
      alert('No se pudieron cargar las divisiones');
    } finally {
      setLoadingDivs(false);
    }
  }

  async function handleSaveDivision(e) {
    e.preventDefault();
    if (!divName.trim()) return;
    setLoadingDivs(true);
    try {
      if (editingId) {
        await updateDivision(editingId, { name: divName });
      } else {
        await addDivision({ name: divName });
      }
      setDivName('');
      setEditingId(null);
      await fetchDivisions();
    } catch (err) {
      console.error(err);
      alert('Error al guardar división');
    } finally {
      setLoadingDivs(false);
    }
  }
async function handleDeleteDivision(id, name) {
  setLoadingDivs(true);
  try {
    // 1) Compruebo si hay torneo activo en esa división
    const occupied = await hasActiveTournament(name);
    if (occupied) {
      alert(`No se puede borrar la división "${name}" porque tiene un torneo activo.`);
      return;
    }

    // 2) Confirmación
    const ok = window.confirm(`¿Seguro que quieres borrar la división "${name}"?`);
    if (!ok) return;

    // 3) Borro y refresco lista
    await deleteDivision(id);
    await fetchDivisions();
  } catch (err) {
    console.error(err);
    alert('Error al borrar división');
  } finally {
    setLoadingDivs(false);
  }
}

  return (
    <div className="modal-overlay">
      <div className="modal-content config-modal">
        <div className="config-modal__header">
          <h2>Configuración</h2>
          <button className="config-modal__close" onClick={onClose}>×</button>
        </div>

        <div className="config-modal__tabs">
          <button
            className={`tab-btn ${activeTab==='lineup'?'active':''}`}
            onClick={() => setActiveTab('lineup')}
          >
            Plantilla
          </button>
          <button
            className={`tab-btn ${activeTab==='divisions'?'active':''}`}
            onClick={() => setActiveTab('divisions')}
          >
            Divisiones
          </button>
        </div>

        <div className="config-modal__body">
          {activeTab === 'lineup' && (
            <div className="tab-content">
              <div className="form-group">
                <label>Titulares</label>
                <input
                  type="number" min="1"
                  value={starters}
                  onChange={e => setStarters(+e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Suplentes</label>
                <input
                  type="number" min="0"
                  value={subs}
                  onChange={e => setSubs(+e.target.value)}
                />
              </div>
            </div>
          )}

          {activeTab === 'divisions' && (
            <div className="tab-content divisions-tab">
              <form className="division-form" onSubmit={handleSaveDivision}>
                <input
                  type="text"
                  placeholder="Nombre de la división"
                  value={divName}
                  onChange={e => setDivName(e.target.value)}
                />
                <button className="btn success" disabled={loadingDivs}>
                  {editingId ? 'Actualizar' : 'Agregar'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    className="btn cancel"
                    onClick={() => { setEditingId(null); setDivName(''); }}
                  >
                    Cancelar
                  </button>
                )}
              </form>

              <table className="divisions-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {divisions.map(div => (
                    <tr key={div.id}>
                      <td>{div.id}</td>
                      <td>{div.name}</td>
                      <td>
                        <button
                          className="btn small"
                          onClick={() => handleEditDivision(div)}
                        >
                          Editar
                        </button>
                               <button
         className="btn small danger"
         onClick={() => handleDeleteDivision(div.id, div.name)}
         disabled={loadingDivs}
       >
         Borrar
       </button>
                      </td>
                    </tr>
                  ))}
                  {divisions.length === 0 && (
                    <tr>
                      <td colSpan="3">No hay divisiones.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn cancel" onClick={onClose}>
            Cerrar
          </button>
          {activeTab === 'lineup' && (
            <button
              className="btn success"
              onClick={handleApplyLineup}
              disabled={loadingLineup}
            >
              {loadingLineup ? 'Guardando…' : 'Aplicar cambios'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
