// src/renderer/pages/Jornadas.jsx
import React, { useMemo } from 'react';


export default function Jornadas({
  divisions,
  startedDivisions,
  activeDiv,
  setActiveDiv,
  season,
  jornadas,
  selectedJornada,
  setSelectedJornada,
  allTeams,               // lista completa de equipos (activos e inactivos)
  scheduledMatches,
  tableSchedule,
  confirmLoaded,
  confirmedJornadas,
  handleDrop,
  handleReturnMatch,
  hours,
  loading,
  handleConfirmJornada,
  onSelectMatch,
  showResultModal,
  onCloseResultModal,
  selectedMatchEntry
}) {
  // 0) Mapa id → equipo
  const teamMap = useMemo(
    () => Object.fromEntries(allTeams.map(t => [t.id, t])),
    [allTeams]
  );

  // 1) Sólo jornadas confirmadas + la siguiente no confirmada
  const activeJornadas = useMemo(() => {
    const keyFor = j => `${activeDiv}-${season}-${j.id}`;
    const idxNext = jornadas.findIndex(j => !confirmedJornadas[keyFor(j)]);
    return idxNext === -1 ? jornadas : jornadas.slice(0, idxNext + 1);
  }, [jornadas, confirmedJornadas, activeDiv, season]);

  // Índices y flags
  const roundIdx = activeJornadas.findIndex(j => j.id === selectedJornada);
  const schedKey  = `${activeDiv}-${season}`;
  const rounds    = scheduledMatches[schedKey] || [];
  const lastIdx   = rounds.length - 1;
  const isLast    = roundIdx === lastIdx;

  // 2) Construir barra: emparejamientos de la ronda + pendientes de rondas previas
  const itemsForBar = useMemo(() => {
    if (roundIdx < 0) return [];
    const placed = Object.values(
      tableSchedule[`${activeDiv}-${season}-${selectedJornada}`] || {}
    );
    const idOf = (p, origin) => `${p.team1_id}-${p.team2_id}-r${origin}`;
    const list = (rounds[roundIdx] || []).map(p => ({
      pair: p,
      origin: roundIdx,
      label: null
    }));
    for (let i = 0; i < roundIdx; i++) {
      const keyPrev = `${activeDiv}-${season}-${activeJornadas[i].id}`;
      if (!confirmLoaded[keyPrev] || !confirmedJornadas[keyPrev]) continue;
      (rounds[i] || []).forEach(p => {
        if (!placed.some(r => r.team1_id === p.team1_id && r.team2_id === p.team2_id)) {
          list.push({
            pair: p,
            origin: i,
            label: `(PJ${i + 1})`
          });
        }
      });
    }
    // dedupe
    const seen = new Set();
    return list.filter(({ pair, origin }) => {
      const k = idOf(pair, origin);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [
    activeJornadas, roundIdx,
    scheduledMatches, tableSchedule,
    activeDiv, season,
    confirmLoaded, confirmedJornadas,
    selectedJornada
  ]);

  // 3) Crear un mapa rápido de pair → label para render en tabla
  const barLabelMap = useMemo(() => {
    const m = {};
    itemsForBar.forEach(({ pair, origin, label }) => {
      const key = `${pair.team1_id}-${pair.team2_id}-r${origin}`;
      m[key] = label;
    });
    return m;
  }, [itemsForBar]);

  // helper para key
  const idOf = (p, origin) => `${p.team1_id}-${p.team2_id}-r${origin}`;

  return (
    <>
      {/* División selector */}
      <div className="tabs" style={{ marginBottom: '1rem' }}>
        {divisions.filter(d => startedDivisions[d]).map(div => (
          <button
            key={div}
            onClick={() => setActiveDiv(div)}
            className={div === activeDiv ? 'tab active-tab' : 'tab'}
          >
            {div}
          </button>
        ))}
      </div>

      {/* No hay jornadas */}
      {activeJornadas.length === 0 ? (
        <div style={{ color: '#E5E7EB', padding: '1rem' }}>
          No hay torneos iniciados en esta división.
        </div>
      ) : (
        <div className="content-box">

          {/* Navegación de jornadas */}
          <div className="jornadas-nav">
            <button
              onClick={() => roundIdx > 0 && setSelectedJornada(activeJornadas[roundIdx - 1].id)}
              disabled={roundIdx <= 0}
              className="team-btn"
            >{'<'}</button>

            <span className="jornada-title" style={{ margin: '0 1rem', color: '#F3F4F6' }}>
              {activeJornadas.find(j => j.id === selectedJornada)?.name || 'Sin jornadas'}
            </span>

            <button
              onClick={() => roundIdx < activeJornadas.length - 1 && setSelectedJornada(activeJornadas[roundIdx + 1].id)}
              disabled={roundIdx >= activeJornadas.length - 1}
              className="team-btn"
            >{'>'}</button>
          </div>

          {/* Tabla de horarios */}
          {selectedJornada && (() => {
            const key = `${activeDiv}-${season}-${selectedJornada}`;
            const isLoaded    = confirmLoaded[key];
            const isConfirmed = confirmedJornadas[key];
            return (
              <div className="classification-table-wrapper">
                {!isLoaded && (
                  <div className="loading-overlay">
                    <span>Cargando estado…</span>
                  </div>
                )}
                <table
                  className="classification-table"
                  style={{ visibility: isLoaded ? 'visible' : 'hidden' }}
                >
                  <thead>
                    <tr>
                      <th>Hora</th>
                      {['L','Ma','Mi','J','V','S'].map(d => <th key={d}>{d}</th>)}
                    </tr>
                  </thead>
                  <tbody>
{hours.map((hora, r) => (
  <tr key={r}>
    <td style={{ color: '#E5E7EB' }}>{`${hora} p.m.`}</td>
    {[0,1,2,3,4,5].map(c => {
      const cell = `${r}-${c}`;
      const raw = (tableSchedule[key] || {})[cell];
      if (!raw) {
        return (
          <td
            key={c}
            style={{
              position: 'relative',
              border: '1px solid rgba(255,255,255,0.2)',
              height: '4rem'
            }}
            onDragOver={e => isLoaded && !isConfirmed && e.preventDefault()}
            onDrop={e => isLoaded && !isConfirmed && handleDrop(e, r, c)}
          />
        );
      }
      // normalizar raw en entryObj
      const entryObj = raw.pair
        ? raw
        : { pair: raw, origin: roundIdx, label: null };

      return (
        <td
          key={c}
          style={{
            position: 'relative',
            border: '1px solid rgba(255,255,255,0.2)',
            height: '4rem'
          }}
          onDragOver={e => isLoaded && !isConfirmed && e.preventDefault()}
          onDrop={e => isLoaded && !isConfirmed && handleDrop(e, r, c)}
        >
         {/* Si la jornada está confirmada, al hacer click abrimos el modal */}
         <div
           className="match-card"
           style={{
             position:'absolute', top:0, left:0, right:0, bottom:0,
             background:'#3A3A3A', borderRadius:'0.375rem', padding:'0.5rem',
             color:'#F3F4F6', display:'flex', alignItems:'center',
             justifyContent:'center',
             cursor: isConfirmed ? 'pointer' : 'move',
             opacity: isConfirmed ? 0.7 : 1
           }}
           draggable={!isConfirmed}
           onDragStart={e => {
             if (!isConfirmed) {
               e.dataTransfer.setData(
                 'application/json',
                 JSON.stringify({
                   pair: entryObj.pair,
                   roundIdx: entryObj.origin,
                   fromCell: cell
                 })
               );
             }
           }}
onClick={() => {
  if (isConfirmed) {
    onSelectMatch({
      ...entryObj,
      jornadaId: selectedJornada,
      team1Name: teamMap[entryObj.pair.team1_id].name,
      team2Name: teamMap[entryObj.pair.team2_id].name,
      id: entryObj.id  // asegúrate de tener el id de la DB aquí
    });
  }
}}

         >
           {teamMap[entryObj.pair.team1_id]?.name} vs {' '}
           {teamMap[entryObj.pair.team2_id]?.name}
           {entryObj.origin < roundIdx && (
             <em style={{ marginLeft:'0.5rem', fontSize:'0.75rem' }}>
               (P.P. J{entryObj.origin + 1})
             </em>
           )}
         </div>
        </td>
      );
    })}
  </tr>
))}



                  </tbody>
                </table>
              </div>
            );
          })()}

          {/* Barra de partidos (siempre visible) */}
{selectedJornada && (
  <div
    className="matches-bar"
    onDragOver={e => e.dataTransfer.types.includes('application/json') && e.preventDefault()}
    onDrop={handleReturnMatch}
                  style={{
                display:'flex',
                gap:'1rem',
                marginTop:'1rem',
                padding:'1rem',
                background:'#2A2A2A',
                borderRadius:'0.5rem'
              }}
  >
{itemsForBar.map(({ pair, origin }) => {
  const t1 = teamMap[pair.team1_id] || {};
  const t2 = teamMap[pair.team2_id] || {};
  return (
    <div
      key={`${pair.team1_id}-${pair.team2_id}-${origin}`}
      className="match-card"
      draggable
      onDragStart={e => {
        e.dataTransfer.setData(
          'application/json',
          JSON.stringify({ pair, roundIdx: origin, fromCell: null })
        );
      }}
      style={{
        background:'#3A3A3A',
        borderRadius:'0.375rem',
        padding:'0.75rem',
        color:'#F3F4F6',
        cursor:'move'
      }}
    >
      {t1.name} vs {t2.name}
      {origin < roundIdx && (
        <em style={{ marginLeft: '0.5rem' }}>
          (Partido pendiente J{origin + 1})
        </em>
      )}
    </div>
  );
})}


  </div>
)}

          {/* Botón Confirmar jornada */}
          {selectedJornada && (
            <button
              className="btn success"
              style={{
                background: isLast && itemsForBar.length > 0 ? '#A0A0A0' : '#16A34A',
                cursor: isLast && itemsForBar.length > 0 ? 'not-allowed' : 'pointer',
                marginTop:'1rem',
                padding:'0.75rem',
                width:'100%'
              }}
              onClick={() => {
                if (isLast && itemsForBar.length > 0) {
                  alert(
                    'En la última jornada debes programar TODOS los partidos antes de confirmar.\n' +
                    'Arrástralos todos a la tabla de horario.'
                  );
                } else {
                  handleConfirmJornada();
                }
              }}
              disabled={
                loading ||
                confirmedJornadas[`${activeDiv}-${season}-${selectedJornada}`] ||
                (isLast && itemsForBar.length > 0)
              }
            >
              {confirmedJornadas[`${activeDiv}-${season}-${selectedJornada}`]
                ? 'Confirmado'
                : loading ? 'Guardando…' : 'Confirmar Jornada'}
            </button>
          )}
        </div>
      )}
    </>
  );
}
