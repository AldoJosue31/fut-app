import React, { useState } from 'react';
import '../styles/styles.css';

const tabs = ['Tabla', 'Jornadas', 'Goleadores'];

const classificationData = [
  { id: 1, name: 'Equipo A', stats: { PJ: 99, G: 99, E: 99, P: 99, GF: 99, GC: 99, DG: 99, PTS: 99 } },
  // ... resto de equipos
];

const Clasificacion = () => {
  const [activeTab, setActiveTab] = useState('Tabla');

  return (
    <div className="main">
      <h1 className="title">Clasificación</h1>

      <div className="content-box">
        {/* Tabs */}
        <div className="tabs">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={activeTab === tab ? 'tab active-tab' : 'tab'}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Contenido de pestañas */}
        {activeTab === 'Tabla' && (
          <div className="classification-container">
            <table className="classification-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Equipo</th>
                  <th>PJ</th>
                  <th>G</th>
                  <th>E</th>
                  <th>P</th>
                  <th>GF</th>
                  <th>GC</th>
                  <th>DG</th>
                  <th>PTS</th>
                </tr>
              </thead>
              <tbody>
                {classificationData.map(team => (
                  <tr key={team.id}>
                    <td>{team.id}</td>
                    <td className="team-cell">
                      <span className="team-color"></span>
                      <span className="team-name">{team.name}</span>
                    </td>
                    <td>{team.stats.PJ}</td>
                    <td>{team.stats.G}</td>
                    <td>{team.stats.E}</td>
                    <td>{team.stats.P}</td>
                    <td>{team.stats.GF}</td>
                    <td>{team.stats.GC}</td>
                    <td>{team.stats.DG}</td>
                    <td>{team.stats.PTS}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {activeTab === 'Jornadas' && <div className="placeholder">Vista de Jornadas aún no implementada.</div>}
        {activeTab === 'Goleadores' && <div className="placeholder">Vista de Goleadores aún no implementada.</div>}
      </div>
    </div>
  );
};

export default Clasificacion;
