// src/renderer/components/CajaEquipo.jsx
import React from 'react'
import PropTypes from 'prop-types'

export default function CajaEquipo({ team, onOpenForm, onDelete, disabled }) {
  return (
    <tr onClick={() => onOpenForm(team)}>
      <td>{team.name}</td>
      <td>{team.status}</td>
      <td>{team.founded}</td>
      <td>
        <button
          className="team-btn delete-btn"
          onClick={e => {
            e.stopPropagation()
            onDelete(team)
          }}
          disabled={disabled}
        >
          ×
        </button>
      </td>
    </tr>
  )
}

CajaEquipo.propTypes = {
  team: PropTypes.shape({
    id:       PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name:     PropTypes.string.isRequired,
    status:   PropTypes.string.isRequired,
    founded:  PropTypes.string.isRequired
  }).isRequired,
  onOpenForm: PropTypes.func.isRequired,
  onDelete:   PropTypes.func.isRequired,
  disabled:   PropTypes.bool
}

CajaEquipo.defaultProps = {
  disabled: false
}
