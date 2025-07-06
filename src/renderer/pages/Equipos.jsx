// src/renderer/pages/Equipos.jsx
import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import '../styles/styles.css'

import CajaEquipo from '../components/CajaEquipo.jsx'
import {
  getTeamsWithStats,
  addTeam,
  updateTeam,
  deleteTeam,
  getTeamTournamentStats
} from '../services/teamsService.js'
import {
  getPlayersByTeam,
  addPlayers,
  getPlayerStats
} from '../services/playersService.js'

// — Skeleton mientras cargan los datos
function TeamsTableSkeleton({ rows = 7 }) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, i) => (
                <tr
          key={i}
          className="skeleton-row"
          style={{ '--index': i }}
        >
          <td><div className="skeleton skeleton-text short" /></td>
          <td><div className="skeleton skeleton-text medium" /></td>
          <td><div className="skeleton skeleton-text long" /></td>
          <td><div className="skeleton skeleton-button" /></td>
        </tr>
      ))}
    </tbody>
  )
}

// — Modal para crear/editar
function Modal({ title, children, actions, onClose, loading }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose} disabled={loading}>
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {actions && (
          <div className="modal-actions">
            {loading ? <span className="loader">Cargando…</span> : actions}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Equipos() {
  const queryClient = useQueryClient()

  // 1) División reactiva (localStorage + evento divisionChange)
  const [division, setDivision] = useState(
    () => localStorage.getItem('division') || 'Primera'
  )
  useEffect(() => {
    const onDivChange = () => {
      const nueva = localStorage.getItem('division') || 'Primera'
      setDivision(nueva)
      refetch() // recarga la Query
    }
    window.addEventListener('divisionChange', onDivChange)
    return () => window.removeEventListener('divisionChange', onDivChange)
  }, [])

  // 2) Estados del modal/form
  const [showForm, setShowForm]   = useState(false)
  const [tab, setTab]             = useState('equipo')
  const [statsView, setStatsView] = useState('historical')
  const [stats, setStats]         = useState({ wins: 0, draws: 0, losses: 0 })

  // 3) FormTeam (nuevo o editar)
  const today = new Date().toISOString().split('T')[0]
  const [formTeam, setFormTeam] = useState({
    id:       null,
    name:     '',
    color:    '#000000',
    founded:  today,
    status:   'Activo',
    division
  })

  // 4) Jugadores existentes + nuevos
  const [existingPlayers, setExistingPlayers] = useState([])
  const [newPlayers, setNewPlayers]           = useState([{ nombre: '', apellido: '' }])

  // -------------------------------------------------------
  // 5) React‑Query: cargar equipos+stats para la división
  // -------------------------------------------------------
  const {
    data: teams = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['teams', division],
    queryFn:  () => getTeamsWithStats(division),
    keepPreviousData: true
  })

  // -------------------------------------------------------
  // 6) React‑Query: mutaciones (guardar y eliminar)
  // -------------------------------------------------------
  const mutateSave = useMutation({
    mutationFn: async payload => {
      if (payload.id) {
        const { id, ...data } = payload
        return updateTeam(id, data)
      } else {
        const { name, color, founded, status, division } = payload
        return addTeam({ name, color, founded, status, division })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['teams', division])
      setShowForm(false)
    }
  })

  const mutateDelete = useMutation({
    mutationFn: id => deleteTeam(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['teams', division])
    }
  })

  // -------------------------------------------------------
  // 7) Abrir modal (nuevo o editar)
  // -------------------------------------------------------
  async function openForm(team = null) {
    setTab('equipo')
    setStatsView('historical')
    setStats({ wins: 0, draws: 0, losses: 0 })

    if (!team) {
      // **Nuevo**
      setFormTeam({
        id:       null,
        name:     '',
        color:    '#000000',
        founded:  today,
        status:   'Activo',
        division
      })
      setExistingPlayers([])
      setNewPlayers([{ nombre: '', apellido: '' }])
    } else {
      // **Editar**
      const { histWins, histDraws, histLosses, ...base } = team
      setFormTeam(base)

      // Cargar jugadores y sus goles históricos
      const players = await getPlayersByTeam(team.id)
      const enriched = await Promise.all(
        players.map(async p => {
          let histGoals = 0
          try {
            const { total_goals } = await getPlayerStats(p.id)
            histGoals = total_goals
          } catch {}
          return { ...p, histGoals }
        })
      )
      setExistingPlayers(enriched)

      // Estadísticas globales (ya vienen en `teams`)
      const found = teams.find(t => t.id === team.id)
      if (found) {
        setStats({
          wins:  found.wins,
          draws: found.draws,
          losses: found.losses
        })
      }

      setNewPlayers([{ nombre: '', apellido: '' }])
    }

    setShowForm(true)
  }

  // -------------------------------------------------------
  // 8) Handlers de inputs
  // -------------------------------------------------------
  const handleTeamChange = e => {
    const { name, value } = e.target
    setFormTeam(ft => ({ ...ft, [name]: value }))
  }
  const handlePlayerChange = (i, field, val) => {
    const arr = [...newPlayers]
    arr[i][field] = val
    if (i === arr.length - 1 && arr[i].nombre && arr[i].apellido) {
      arr.push({ nombre: '', apellido: '' })
    }
    setNewPlayers(arr)
  }
  const removePlayerRow = i => {
    const arr = newPlayers.filter((_, idx) => idx !== i)
    setNewPlayers(arr.length ? arr : [{ nombre: '', apellido: '' }])
  }

  // -------------------------------------------------------
  // 9) Guardar equipo + jugadores nuevos
  // -------------------------------------------------------
  const onSave = async () => {
    const payload = {
      id:       formTeam.id,
      name:     formTeam.name,
      color:    formTeam.color,
      founded:  formTeam.founded,
      status:   formTeam.status,
      division: formTeam.division
    }
    const result = await mutateSave.mutateAsync(payload)

    // Si fue creación, result.id trae el nuevo ID
    const teamId = payload.id || result.id

    // Insertar jugadores nuevos
    const toAdd = newPlayers
      .filter(p => p.nombre && p.apellido)
      .map(p => ({ nombre: p.nombre, apellido: p.apellido, equipo_id: teamId }))
    if (toAdd.length) {
      await addPlayers(toAdd)
    }
  }

  // -------------------------------------------------------
  // 10) Eliminar
  // -------------------------------------------------------
  const handleDelete = team => {
    if (window.confirm(`¿Eliminar equipo "${team.name}"?`)) {
      mutateDelete.mutate(team.id)
    }
  }

  // -------------------------------------------------------
  // 11) Cargar estadísticas por torneo
  // -------------------------------------------------------
  const loadTournamentStats = async (teamId, torneoId) => {
    const { wins, draws, losses } = await getTeamTournamentStats(teamId, torneoId)
    setStats({ wins, draws, losses })
  }

  // — Renderizado —
  if (isLoading) {
    return (
      <main className="main">
        <h1 className="title">Equipos — {division}</h1>
        <div className="content-box">
          <table className="classification-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Estado</th>
                <th>Fundación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <TeamsTableSkeleton rows={7} />
          </table>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="main">
        <h1 className="title">Equipos — {division}</h1>
        <div className="content-box">
          <p style={{ color: 'red' }}>Error al cargar: {error.message}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="main">
      <h1 className="title">Equipos — {division}</h1>
      <div className="content-box">
        <button
          className="add-btn"
          onClick={() => openForm(null)}
          disabled={mutateSave.isLoading || mutateDelete.isLoading}
        >
          Agregar
        </button>
        <table className="classification-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Estado</th>
              <th>Fundación</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {teams.map(team => (
              <CajaEquipo
                key={team.id}
                team={team}
                onOpenForm={openForm}
                onDelete={handleDelete}
                disabled={mutateSave.isLoading || mutateDelete.isLoading}
              />
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal
          title={formTeam.id ? 'Editar Equipo' : 'Registrar Equipo'}
          onClose={() => setShowForm(false)}
          loading={mutateSave.isLoading}
          actions={
            <>
              <button
                className="btn cancel"
                onClick={() => setShowForm(false)}
                disabled={mutateSave.isLoading}
              >
                Cancelar
              </button>
              <button
                className="btn success"
                onClick={onSave}
                disabled={mutateSave.isLoading || !formTeam.name.trim()}
              >
                Guardar
              </button>
            </>
          }
        >
          {/* — TABS — */}
          <div className="tabs">
            <button
              className={`tab ${tab === 'equipo'    ? 'active-tab' : ''}`}
              onClick={() => setTab('equipo')}
              disabled={mutateSave.isLoading}
            >
              Equipo
            </button>
            <button
              className={`tab ${tab === 'jugadores' ? 'active-tab' : ''}`}
              onClick={() => setTab('jugadores')}
              disabled={mutateSave.isLoading}
            >
              Jugadores
            </button>
            {formTeam.id && (
              <button
                className={`tab ${tab === 'estadisticas' ? 'active-tab' : ''}`}
                onClick={() => setTab('estadisticas')}
                disabled={mutateSave.isLoading}
              >
                Estadísticas
              </button>
            )}
          </div>

          {/* — CONTENIDO POR TAB — */}
          {tab === 'equipo' && (
            <div className="section">
              <label>Nombre</label>
              <input
                name="name"
                value={formTeam.name}
                onChange={handleTeamChange}
              />
              <label>Color</label>
              <input
                type="color"
                name="color"
                value={formTeam.color}
                onChange={handleTeamChange}
              />
              <label>Fundación</label>
              <input
                type="date"
                name="founded"
                value={formTeam.founded}
                onChange={handleTeamChange}
              />
              <label>Estado</label>
              <select
                name="status"
                value={formTeam.status}
                onChange={handleTeamChange}
              >
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
                  {existingPlayers.map(p => (
                    <li key={p.id}>
                      {p.nombre} {p.apellido} — Goles: {p.histGoals}
                    </li>
                  ))}
                </ul>
              )}
              {newPlayers.map((p, i) => (
                <div key={i} className="player-row">
                  <input
                    placeholder="Nombre"
                    value={p.nombre}
                    onChange={e => handlePlayerChange(i, 'nombre', e.target.value)}
                  />
                  <input
                    placeholder="Apellido"
                    value={p.apellido}
                    onChange={e => handlePlayerChange(i, 'apellido', e.target.value)}
                  />
                  {i < newPlayers.length - 1 && (
                    <button
                      className="btn small danger"
                      onClick={() => removePlayerRow(i)}
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === 'estadisticas' && (
            <div className="section">
              <h3>Estadísticas</h3>
              <select
                value={statsView}
                onChange={e => setStatsView(e.target.value)}
              >
                <option value="historical">Global</option>
                <option value="tournament">Por Torneo</option>
              </select>
              {statsView === 'tournament' && (
                <select
                  onChange={e => loadTournamentStats(formTeam.id, e.target.value)}
                >
                  <option value="">Selecciona torneo</option>
                  <option value="1">Apertura</option>
                  <option value="2">Clausura</option>
                </select>
              )}
              <div className="stats-grid">
                <div>Victorias: {stats.wins}</div>
                <div>Empates:  {stats.draws}</div>
                <div>Derrotas: {stats.losses}</div>
              </div>
            </div>
          )}
        </Modal>
      )}
    </main>
  )
}
