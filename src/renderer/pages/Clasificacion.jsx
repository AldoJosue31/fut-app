import React, { useState } from 'react';
import '../styles/styles.css';

const tabs = ['Tabla', 'Jornadas', 'Goleadores'];

// Datos de clasificación
const classificationData = [
  { id: 1, name: 'Equipo A', stats: { PJ: 10, G: 7, E: 2, P: 1, GF: 25, GC: 10, DG: 15, PTS: 23 } },
  { id: 2, name: 'Equipo B', stats: { PJ: 10, G: 6, E: 3, P: 1, GF: 20, GC: 8, DG: 12, PTS: 21 } },
  // ... más equipos ...
];

// Datos de jornadas con ejemplos de partidos
const jornadasData = [
  {
    id: 1,
    title: 'J1',
    dates: [
      {
        date: 'Jueves 03 de Noviembre',
        matches: [
          { home: 'Equipo A', away: 'Equipo B', time: '9:00 pm' },
          { home: 'Equipo C', away: 'Equipo D', time: '10:00 pm' },
          { home: 'Equipo E', away: 'Equipo F', time: '11:00 pm' }
        ]
      },
      {
        date: 'Viernes 04 de Noviembre',
        matches: [
          { home: 'Equipo G', away: 'Equipo H', time: '9:00 pm' },
          { home: 'Equipo I', away: 'Equipo J', time: '10:00 pm' },
          { home: 'Equipo K', away: 'Equipo L', time: '11:00 pm' }
        ]
      }
    ]
  },
  {
    id: 2,
    title: 'J2',
    dates: [
      {
        date: 'Lunes 07 de Noviembre',
        matches: [
          { home: 'Equipo A', away: 'Equipo C', result: '2-1' },
          { home: 'Equipo B', away: 'Equipo D', result: '0-0' },
          { home: 'Equipo E', away: 'Equipo G', result: '3-2' }
        ]
      },
      {
        date: 'Martes 08 de Noviembre',
        matches: [
          { home: 'Equipo F', away: 'Equipo H', result: '1-1' },
          { home: 'Equipo I', away: 'Equipo K', result: '0-2' },
          { home: 'Equipo J', away: 'Equipo L', result: '4-0' }
        ]
      }
    ]
  }
  // ... más jornadas ...
];

// Datos de goleadores
const goleadoresData = [
  { id: 1, name: 'Juan Pérez', team: 'Equipo A', goals: 8 },
  { id: 2, name: 'Luis Gómez', team: 'Equipo C', goals: 7 },
  // ... más goleadores ...
];

const Clasificacion = () => {
  const [activeTab, setActiveTab] = useState('Tabla');
  const [currentJornada, setCurrentJornada] = useState(0);

  const prevJornada = () => setCurrentJornada(i => Math.max(i - 1, 0));
  const nextJornada = () => setCurrentJornada(i => Math.min(i + 1, jornadasData.length - 1));

  return (
    <div className="main">
      <h1 className="title">Clasificación</h1>
      <div className="content-box">
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

        {/* TAB: Tabla de clasificación */}
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

        {/* TAB: Jornadas */}
        {activeTab === 'Jornadas' && (
          <div className="jornadas-section">
            <div className="jornadas-nav">
              <button onClick={prevJornada} className="team-btn" disabled={currentJornada === 0}>&lt;</button>
              <span className="jornada-title">{jornadasData[currentJornada].title}</span>
              <button onClick={nextJornada} className="team-btn" disabled={currentJornada === jornadasData.length - 1}>&gt;</button>
            </div>
            {jornadasData[currentJornada].dates.map(day => (
              <div key={day.date} className="jornada-day">
                <h3 className="jornada-day-title">{day.date}</h3>
                {day.matches.map((m, i) => (
                  <div key={i} className="match-row">
                    <span className="match-team">{m.home}</span>
                    <span className="team-color"></span>
                    <span className="match-result">
                      {m.result ? m.result : m.time}
                    </span>
                    <span className="team-color"></span>
                    <span className="match-team">{m.away}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* TAB: Goleadores */}
        {activeTab === 'Goleadores' && (
          <div className="classification-container">
            <table className="classification-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nombre</th>
                  <th>Equipo</th>
                  <th>Goles</th>
                </tr>
              </thead>
              <tbody>
                {goleadoresData.map(pl => (
                  <tr key={pl.id}>
                    <td>{pl.id}</td>
                    <td className="team-cell">
                      <span className="team-color"></span>
                      <span className="team-name">{pl.name}</span>
                    </td>
                    <td>{pl.team}</td>
                    <td>{pl.goals}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
};

export default Clasificacion;
