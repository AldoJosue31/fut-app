import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import '../styles/styles.css';

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
  const [teams, setTeams] = useState([]);
  const [infoModal, setInfoModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [activeTeam, setActiveTeam] = useState(null);
  const [newTeam, setNewTeam] = useState({
    name: '',
    color: '#000000',
    founded: '',
    status: 'Activo',
    wins: 0,
    draws: 0,
    losses: 0
  });

  const fetchTeams = async () => {
    const { data, error } = await supabase.from('teams').select('*').order('name', { ascending: true });
    if (error) console.error('Error cargando equipos:', error);
    else setTeams(data);
  };

  useEffect(() => { fetchTeams(); }, []);

  const openInfo = (team) => { setActiveTeam(team); setInfoModal(true); };
  const openDelete = (team) => { setActiveTeam(team); setDeleteModal(true); };

  const handleAddTeam = async () => {
    const { data, error } = await supabase.from('teams').insert([newTeam]).single();
    if (error) console.error('Error añadiendo equipo:', error);
    else {
      setAddModal(false);
      setNewTeam({ name: '', color: '#000000', founded: '', status: 'Activo', wins: 0, draws: 0, losses: 0 });
      fetchTeams();
    }
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('teams').delete().eq('id', id);
    if (error) console.error('Error eliminando equipo:', error);
    else {
      setDeleteModal(false);
      fetchTeams();
    }
  };

  return (
    <main className="main">
      <h1 className="title">Equipos</h1>
      <div className="content-box">
        <button className="add-btn" onClick={() => setAddModal(true)}>Agregar</button>

        <div className="classification-container">
          <table className="classification-table">
            <thead>
              <tr>
                <th>Color</th>
                <th>Nombre</th>
                <th>Fundación</th>
                <th>Estado</th>
                <th>V</th>
                <th>E</th>
                <th>D</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {teams.map(team => (
                <tr key={team.id}>
                  <td><div className="team-color small" style={{ backgroundColor: team.color }} /></td>
                  <td className="team-cell"><span className="team-name">{team.name}</span></td>
                  <td>{team.founded}</td>
                  <td>{team.status}</td>
                  <td>{team.wins}</td>
                  <td>{team.draws}</td>
                  <td>{team.losses}</td>
                  <td>
                    <button className="team-btn" onClick={() => openInfo(team)}>ℹ</button>
                    <button className="team-btn red" onClick={() => handleDelete(team.id)}>×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {addModal && (
        <Modal
          title="Agregar Equipo"
          onClose={() => setAddModal(false)}
          actions={(
            <>
              <button className="btn cancel" onClick={() => setAddModal(false)}>Cancelar</button>
              <button className="btn success" onClick={handleAddTeam}>Guardar</button>
            </>
          )}
        >
          <div className="form-group">
            <label>Nombre</label>
            <input type="text" value={newTeam.name} onChange={e => setNewTeam({ ...newTeam, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Color</label>
            <input type="color" value={newTeam.color} onChange={e => setNewTeam({ ...newTeam, color: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Fundación</label>
            <input type="date" value={newTeam.founded} onChange={e => setNewTeam({ ...newTeam, founded: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Estado</label>
            <select value={newTeam.status} onChange={e => setNewTeam({ ...newTeam, status: e.target.value })}>
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </div>
        </Modal>
      )}

      {infoModal && activeTeam && (
        <Modal
          title="Información del Equipo"
          onClose={() => setInfoModal(false)}
          actions={<button className="btn cancel" onClick={() => setInfoModal(false)}>Cerrar</button>}
        >
          <p><strong>Nombre:</strong> {activeTeam.name}</p>
          <p><strong>Fundación:</strong> {activeTeam.founded}</p>
          <p><strong>Estado:</strong> {activeTeam.status}</p>
          <p>✅ Victorias: {activeTeam.wins}   ➖ Empates: {activeTeam.draws}   ❌ Derrotas: {activeTeam.losses}</p>
        </Modal>
      )}
    </main>
  );
}
