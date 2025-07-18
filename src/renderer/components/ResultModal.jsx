// src/renderer/components/ResultModal.jsx
import React, { useState, useEffect } from 'react';
import { getPlayersByTeam } from '../services/playersService';
import { updateMatchResult } from '../services/matchesService';
import '../styles/styles.css';

export default function ResultModal({ entry, onClose, config }) {
  const {
    pair: { team1_id, team2_id },
    team1Name,
    team2Name,
    id: matchId
  } = entry;

  // Extraemos de config o usamos valores por defecto
  const numStarters = config.starters;
  const numSubs     = config.subs;

  // Creación dinámica de arrays vacíos
  const emptySlots = count =>
    Array.from({ length: count }, () => ({ playerId: '', goals: 0 }));

  // Estados básicos
  const [goals1, setGoals1]     = useState(0);
  const [goals2, setGoals2]     = useState(0);
  const [players1, setPlayers1] = useState([]);
  const [players2, setPlayers2] = useState([]);
  const [referee, setReferee]   = useState('');

  // Estados de plantillas, inicializados una sola vez con la cantidad correcta
  const [starters1, setStarters1] = useState(() => emptySlots(numStarters));
  const [subs1,      setSubs1]      = useState(() => emptySlots(numSubs));
  const [starters2, setStarters2] = useState(() => emptySlots(numStarters));
  const [subs2,      setSubs2]      = useState(() => emptySlots(numSubs));

  // Carga de jugadores en mount
  useEffect(() => {
    getPlayersByTeam(team1_id).then(setPlayers1);
    getPlayersByTeam(team2_id).then(setPlayers2);
  }, [team1_id, team2_id]);

  // Actualiza un slot concreto
  function updateSlot(team, type, idx, field, value) {
    const key = `${team}-${type}`;
    const setters = {
      '1-starters': setStarters1,
      '1-subs':     setSubs1,
      '2-starters': setStarters2,
      '2-subs':     setSubs2
    };
    const arrays = {
      '1-starters': starters1,
      '1-subs':     subs1,
      '2-starters': starters2,
      '2-subs':     subs2
    };
    const copy = [...arrays[key]];
    copy[idx] = { ...copy[idx], [field]: value };
    setters[key](copy);
  }

  // Filtra los jugadores ya seleccionados para un bloque
  function availablePlayers(teamPlayers, team, type) {
    const key = `${team}-${type}`;
    const selected = (key === '1-starters' ? starters1
                    : key === '1-subs'     ? subs1
                    : key === '2-starters' ? starters2
                                            : subs2)
                     .map(s => s.playerId)
                     .filter(Boolean);
    return teamPlayers.filter(p => !selected.includes(p.id));
  }

  // Construye el lineup y lo envía
  async function handleSave() {
    const lineup = [
      ...starters1.map(s => ({ ...s, team: 1, role: 'starter' })),
      ...subs1    .map(s => ({ ...s, team: 1, role: 'sub'     })),
      ...starters2.map(s => ({ ...s, team: 2, role: 'starter' })),
      ...subs2    .map(s => ({ ...s, team: 2, role: 'sub'     }))
    ].filter(s => s.playerId);

    await updateMatchResult({
      matchId,
      goals1, goals2,
      lineup,
      referee
    });
    onClose();
  }

  // Renderiza un bloque de slots (titulares o suplentes)
  function renderSlots(teamPlayers, team, type, slots, label) {
    return (
      <div className="form-group">
        <h4>{label}</h4>
        {slots.map((slot, idx) => {
          // Si hay un jugador actualmente asignado, lo colocamos primero
          const current = teamPlayers.find(p => p.id === slot.playerId);
          const avail   = availablePlayers(teamPlayers, team, type);
          const options = current ? [current, ...avail] : avail;

          return (
            <div key={idx} className="slot-row">
              <select
                value={slot.playerId}
                onChange={e =>
                  updateSlot(team, type, idx, 'playerId', +e.target.value)
                }
              >
                <option value="">— Jugador —</option>
                {options.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} {p.apellido}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="0"
                placeholder="Goles"
                value={slot.goals}
                onChange={e =>
                  updateSlot(team, type, idx, 'goals', +e.target.value)
                }
              />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '90vw', width: '800px' }}>
        {/* Header */}
        <div className="modal-header">
          <h2>Resultado: {team1Name} vs {team2Name}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Goles */}
          <div className="inline-group">
            <div className="form-group">
              <label>{team1Name} Goles:</label>
              <input
                type="number" min="0"
                value={goals1}
                onChange={e => setGoals1(+e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>{team2Name} Goles:</label>
              <input
                type="number" min="0"
                value={goals2}
                onChange={e => setGoals2(+e.target.value)}
              />
            </div>
          </div>

          {/* Árbitro */}
          <div className="form-group">
            <label>Árbitro:</label>
            <input
              type="text"
              value={referee}
              onChange={e => setReferee(e.target.value)}
              placeholder="Nombre del árbitro"
            />
          </div>

          {/* Plantillas */}
          <div className="teams-lineup">
            <div className="team-block">
              <h3>{team1Name}</h3>
              {renderSlots(players1, 1, 'starters', starters1, 'Titulares')}
              {renderSlots(players1, 1, 'subs',      subs1,      'Suplentes')}
            </div>
            <div className="team-block">
              <h3>{team2Name}</h3>
              {renderSlots(players2, 2, 'starters', starters2, 'Titulares')}
              {renderSlots(players2, 2, 'subs',      subs2,      'Suplentes')}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="modal-actions">
          <button className="btn cancel" onClick={onClose}>Cancelar</button>
          <button className="btn success" onClick={handleSave}>Guardar</button>
        </div>
      </div>
    </div>
  );
}
