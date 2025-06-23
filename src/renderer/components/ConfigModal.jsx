// src/renderer/components/ConfigModal.jsx
import React, { useState, useEffect } from 'react';
import { getGlobalLineupConfig, upsertGlobalLineupConfig } from '../services/configService';

export default function ConfigModal({ onClose }) {
  const [starters, setStarters] = useState(5);
  const [subs, setSubs]         = useState(6);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    getGlobalLineupConfig()
      .then(cfg => {
        setStarters(cfg.starters);
        setSubs(cfg.subs);
      })
      .catch(console.error);
  }, []);

  async function handleApply() {
    setLoading(true);
    try {
      await upsertGlobalLineupConfig(starters, subs);
      window.dispatchEvent(new Event('lineupConfigUpdated'));
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error al guardar configuración');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content config-modal">
        <div className="config-modal__header">
          <h2>Configuración Global de Plantilla</h2>
          <button className="config-modal__close" onClick={onClose}>×</button>
        </div>
        <div className="config-modal__body">
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
        <div className="modal-actions">
          <button className="btn cancel" onClick={onClose} disabled={loading}>Cerrar</button>
          <button className="btn success" onClick={handleApply} disabled={loading}>
            {loading ? 'Guardando…' : 'Aplicar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}
