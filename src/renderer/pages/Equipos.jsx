import React, { useState, useEffect } from 'react';
import '../styles/styles.css';
import {
  getTeams,
  addTeam,
  deleteTeam,
  updateTeam,
  getTeamStats,
  getTeamTournamentStats
} from '../services/teamsService.js';
import {
  getPlayersByTeam,
  addPlayers,
  getPlayerStats
} from '../services/playersService.js';

function Modal({ title, children, actions, onClose, loading }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose} disabled={loading}>×</button>
        </div>
        <div className="modal-body">{children}</div>
        {actions && <div className="modal-actions">{loading ? <span className="loader">Cargando...</span> : actions}</div>}
      </div>
    </div>
  );
}

export default function Equipos() {
  const today = new Date().toISOString().split('T')[0];
  const storedDivision = localStorage.getItem('division') || 'Primera';

  const [division, setDivision] = useState(storedDivision);
  const [teams, setTeams] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState('equipo');
  const [statsView, setStatsView] = useState('historical');
  const [selectedTournament, setSelectedTournament] = useState(null);

  const [formTeam, setFormTeam] = useState({ id: null, name: '', color: '#000000', founded: today, status: 'Activo', division: storedDivision });
  const [existingPlayers, setExistingPlayers] = useState([]);
  const [stats, setStats] = useState({ wins: 0, draws: 0, losses: 0 });
  const [newPlayers, setNewPlayers] = useState([{ nombre: '', apellido: '' }]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadTeams() {
      const current = localStorage.getItem('division') || 'Primera';
      setDivision(current);
      setFormTeam(prev => ({ ...prev, division: current }));
      const data = await getTeams();
      const filtered = data.filter(t => t.division === current).sort((a, b) => a.name.localeCompare(b.name));
      const withStats = await Promise.all(filtered.map(async team => {
        const hist = await getTeamStats(team.id);
        return { ...team, histWins: hist.total_wins, histDraws: hist.total_draws, histLosses: hist.total_losses };
      }));
      setTeams(withStats);
    }
    loadTeams();
    window.addEventListener('divisionChange', loadTeams);
    return () => window.removeEventListener('divisionChange', loadTeams);
  }, []);

  async function openForm(team = null) {
    setTab('equipo');
    setStatsView('historical');
    setSelectedTournament(null);
    setStats({ wins: 0, draws: 0, losses: 0 });
    if (team) {
      setFormTeam({ ...team });
      const players = await getPlayersByTeam(team.id);
      const enriched = await Promise.all(players.map(async p => {
        let histGoals = 0;
        try {
          const hist = await getPlayerStats(p.id);
          histGoals = hist.total_goals;
        } catch (err) {
          console.warn('No se encontraron estadísticas de goles para el jugador', p.id);
        }
        return { ...p, histGoals };
      }));
      setExistingPlayers(enriched);
      const hist = await getTeamStats(team.id);
      setStats({ wins: hist.total_wins, draws: hist.total_draws, losses: hist.total_losses });
    } else {
      setFormTeam({ id: null, name: '', color: '#000000', founded: today, status: 'Activo', division });
      setExistingPlayers([]);
    }
    setNewPlayers([{ nombre: '', apellido: '' }]);
    setShowForm(true);
  }

  function handleTeamChange(e) {
    const { name, value } = e.target;
    setFormTeam(prev => ({ ...prev, [name]: value }));
  }

  function handlePlayerChange(index, field, value) {
    const arr = [...newPlayers];
    arr[index][field] = value;
    if (index === arr.length - 1 && arr[index].nombre && arr[index].apellido) arr.push({ nombre: '', apellido: '' });
    setNewPlayers(arr);
  }

  function removePlayerRow(index) {
    const arr = newPlayers.filter((_, i) => i !== index);
    setNewPlayers(arr.length ? arr : [{ nombre: '', apellido: '' }]);
  }

  async function save() {
    setLoading(true);
    try {
      let teamId = formTeam.id;
      const { id, ...payload } = formTeam;
      if (teamId) await updateTeam(teamId, payload);
      else {
        const created = await addTeam(payload);
        teamId = created.id;
      }
      const toAdd = newPlayers.filter(p => p.nombre && p.apellido)
        .map(p => ({ nombre: p.nombre, apellido: p.apellido, equipo_id: teamId }));
      if (toAdd.length) await addPlayers(toAdd);
      const data = await getTeams();
      const filtered = data.filter(t => t.division === division).sort((a, b) => a.name.localeCompare(b.name));
      const withStats = await Promise.all(filtered.map(async team => {
        const hist = await getTeamStats(team.id);
        return { ...team, histWins: hist.total_wins, histDraws: hist.total_draws, histLosses: hist.total_losses };
      }));
      setTeams(withStats);
      setShowForm(false);
    } catch (e) {
      console.error(e);
      alert(e.message || 'Ocurrió un error al guardar.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(team) {
    setLoading(true);
    try {
      await deleteTeam(team.id);
      const data = await getTeams();
      const filtered = data.filter(t => t.division === division).sort((a, b) => a.name.localeCompare(b.name));
      setTeams(filtered);
    } catch (e) {
      console.error(e);
      alert('No se pudo eliminar el equipo.');
    } finally {
      setLoading(false);
    }
  }

  async function loadTournamentStats(teamId, tournamentId) {
    const tstats = await getTeamTournamentStats(teamId, tournamentId);
    setStats({ wins: tstats.wins, draws: tstats.draws, losses: tstats.losses });
  }

  return (
    <main className="main">
      <h1 className="title">Equipos - {division}</h1>
      <div className="content-box">
        <button className="add-btn" onClick={() => openForm()} disabled={loading}>Agregar</button>
        <table className="classification-table">
          <thead>
            <tr>
              <th>Nombre</th><th>Estado</th><th>Fundación</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {teams.map(team => (
              <tr key={team.id} className="team-row" onClick={() => openForm(team)}>
                <td>{team.name}</td>
                <td>{team.status}</td>
                <td>{team.founded}</td>
                <td><button className="team-btn delete-btn" onClick={e => { e.stopPropagation(); handleDelete(team); }} disabled={loading}>×</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal title={formTeam.id ? 'Editar Equipo' : 'Registrar Equipo'} onClose={() => setShowForm(false)} loading={loading} actions={
          <>
            <button className="btn cancel" onClick={() => setShowForm(false)} disabled={loading}>Cancelar</button>
            <button className="btn success" onClick={save} disabled={loading || !formTeam.name.trim()}>Guardar</button>
          </>
        }>
          <div className="tabs">
            <button className={`tab ${tab === 'equipo' ? 'active-tab' : ''}`} onClick={() => setTab('equipo')} disabled={loading}>Equipo</button>
            <button className={`tab ${tab === 'jugadores' ? 'active-tab' : ''}`} onClick={() => setTab('jugadores')} disabled={loading}>Jugadores</button>
            {formTeam.id && <button className={`tab ${tab === 'estadisticas' ? 'active-tab' : ''}`} onClick={() => setTab('estadisticas')} disabled={loading}>Estadísticas</button>}
          </div>

          {tab === 'equipo' && (
            <div className="section">
              <label>Nombre</label>
              <input name="name" value={formTeam.name} onChange={handleTeamChange} />
              <label>Color</label>
              <input type="color" name="color" value={formTeam.color} onChange={handleTeamChange} />
              <label>Fundación</label>
              <input type="date" name="founded" value={formTeam.founded} onChange={handleTeamChange} />
              <label>Estado</label>
              <select name="status" value={formTeam.status} onChange={handleTeamChange}>
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </div>
          )}

          {tab === 'jugadores' && (
            <div className="section">
              <h3>Jugadores</h3>
              {existingPlayers.length > 0 && (
                <ul className="jugadores-list">
                  {existingPlayers.map(j => <li key={j.id}>{j.nombre} {j.apellido}</li>)}
                </ul>
              )}
              {newPlayers.map((p, i) => (
                <div key={i} className="player-row">
                  <input placeholder="Nombre" value={p.nombre} onChange={e => handlePlayerChange(i, 'nombre', e.target.value)} />
                  <input placeholder="Apellido" value={p.apellido} onChange={e => handlePlayerChange(i, 'apellido', e.target.value)} />
                  {i < newPlayers.length - 1 && (
                    <button className="btn small danger" onClick={() => removePlayerRow(i)}>Eliminar</button>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === 'estadisticas' && (
            <div className="section">
              <h3>Estadísticas</h3>
              <select value={statsView} onChange={e => setStatsView(e.target.value)}>
                <option value="historical">Histórico</option>
                <option value="tournament">Por Torneo</option>
              </select>
              {statsView === 'tournament' && (
                <select onChange={e => { setSelectedTournament(e.target.value); loadTournamentStats(formTeam.id, e.target.value); }}>
                  <option value="1">Torneo Apertura</option>
                  <option value="2">Torneo Clausura</option>
                </select>
              )}
              <div className="stats-grid">
                <div>Victorias: {stats.wins}</div>
                <div>Empates: {stats.draws}</div>
                <div>Derrotas: {stats.losses}</div>
              </div>
            </div>
          )}
        </Modal>
      )}
    </main>
  );
}
