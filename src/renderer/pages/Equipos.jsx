/* React Component (Clasificacion.jsx) */
import React, { useState } from 'react';
import '../styles/styles.css';


const teams = [
  { name: 'Equipo A', color: '#B91C1C', founded: '12/05/24', status: 'Activo', wins: 99, draws: 99, losses: 99 },
  { name: 'Equipo B', color: '#15803D', founded: '01/03/23', status: 'Activo', wins: 55, draws: 12, losses: 8 },
  // …más equipos
];

function Modal({ title, children, actions, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">{children}</div>
        {actions && <div className="modal-actions">{actions}</div>}
      </div>
    </div>
  );
}

export default function Equipos() {
  const [infoModal, setInfoModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [activeTeam, setActiveTeam] = useState(null);

  const openInfo = (team) => { setActiveTeam(team); setInfoModal(true); };
  const openDelete = (team) => { setActiveTeam(team); setDeleteModal(true); };

  return (
    <main className="main">
      <h1 className="title">Equipos</h1>
      <div className="content-box">
        <button className="add-btn">Agregar</button>
        <div className="team-list">
          {teams.map((team, idx) => (
            <div key={idx} className="team-item" onClick={() => openInfo(team)}>
              <div className="team-color" style={{ backgroundColor: team.color }} />
              <div className="team-info">
                <span className="team-name">{team.name}</span>
              </div>
              <div className="team-actions">
                <div className="team-btn red" onClick={(e) => { e.stopPropagation(); openDelete(team); }}>×</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {infoModal && activeTeam && (
        <Modal
          title="Información del Equipo"
          onClose={() => setInfoModal(false)}
          actions={(
            <button className="btn cancel" onClick={() => setInfoModal(false)}>Cerrar</button>
          )}
        >
          <p><strong>Nombre:</strong> {activeTeam.name}</p>
          <p><strong>Fundación:</strong> {activeTeam.founded}</p>
          <p><strong>Estado:</strong> {activeTeam.status}</p>
          <p>✅ Victorias: {activeTeam.wins}   ➖ Empates: {activeTeam.draws}   ❌ Derrotas: {activeTeam.losses}</p>
        </Modal>
      )}

      {deleteModal && activeTeam && (
        <Modal
          title="Eliminar Equipo"
          onClose={() => setDeleteModal(false)}
          actions={(
            <>
              <button className="btn cancel" onClick={() => setDeleteModal(false)}>Cancelar</button>
              <button className="btn danger" onClick={() => {/* eliminación */}}>Eliminar</button>
            </>
          )}
        >
          <p>¿Seguro que deseas eliminar <strong>{activeTeam.name}</strong>? Esta acción no se puede deshacer.</p>
        </Modal>
      )}
    </main>
  );
}


