// IMPORTS AL PRINCIPIO DEL FICHERO
import React, { useState, useEffect } from 'react';
import '../styles/styles.css';
import Torneos from './Torneos';
import Jornadas from './Jornadas';
import { getMatchDetail } from '../services/matchesService.js';
import { getTeams } from '../services/teamsService.js';
import { getPlayersByTeam } from '../services/playersService.js';
import { createMatch, getMatchesByJornada } from '../services/matchesService.js';
import { getJornadas, addJornada, isTorneoComenzado } from '../services/jornadasService.js';
import { getGlobalLineupConfig } from '../services/configService.js';
import { getDivisions } from '../services/divisionsService.js';

import {
  startDivision,
  addTournamentTeams,
  getTournamentTeams,
  getTournamentConfig
} from '../services/tournamentService.js';

import { supabase } from '../supabaseClient.js';
import ResultModal from '../components/ResultModal.jsx';



const tabs = ['Torneos', 'Jornadas'];
const years = Array.from({ length: 6 }, (_, i) => 2025 + i);
const seasons = years.flatMap(y => [`Clausura ${y}`, `Apertura ${y}`]);
const hours = ['17:00','18:00', '19:00', '20:00', '21:00', '22:00', '23:00'];

export default function Partidos() {
  const [activeTab, setActiveTab] = useState('Torneos');
  const [doubleRounds, setDoubleRounds] = useState({});    // ← nuevo
  const [loadingDivs, setLoadingDivs] = useState({});      // ← nuevo
  // Estados compartidos
  const [selectedMatchEntry, setSelectedMatchEntry] = useState(null);
const [showResultModal, setShowResultModal] = useState(false);
  const [divisions, setDivisions] = useState([]);
    const [teamsByDiv, setTeamsByDiv] = useState({});          // ← sólo activos
  const [allTeams, setAllTeams] = useState([]);
  const [startedDivisions, setStartedDivisions] = useState({});
  const [startDates, setStartDates] = useState({});
  const [activeDiv, setActiveDiv] = useState(null);
  const [season, setSeason] = useState(seasons[0]);
  const [jornadas, setJornadas] = useState([]);
  const [allJornadas, setAllJornadas] = useState([]);
  const [selectedJornada, setSelectedJornada] = useState(null);
  const [tournamentTeams, setTournamentTeams] = useState([]);
  const [scheduledMatches, setScheduledMatches] = useState({});
  const [tableSchedule, setTableSchedule] = useState({});
  const [teamA, setTeamA] = useState(null);
  const [teamB, setTeamB] = useState(null);
  const [playersA, setPlayersA] = useState([]);
  const [playersB, setPlayersB] = useState([]);
  const [goalsA, setGoalsA] = useState(0);
  const [goalsB, setGoalsB] = useState(0);
  const [playerGoalsInput, setPlayerGoalsInput] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmedJornadas, setConfirmedJornadas] = useState({});
  const [confirmLoaded, setConfirmLoaded] = useState({});
  const teamMap = Object.fromEntries(allTeams.map(t => [t.id, t]));
 const [templateConfig, setTemplateConfig] = useState({});
 const [tournamentId, setTournamentId] = useState(null);

  // Generador round-robin
  function roundRobin(teams) {
    const list = [...teams];
    if (list.length % 2) list.push(null);
    const rounds = [];
    for (let i = 0; i < list.length - 1; i++) {
      const pairs = [];
      for (let j = 0; j < list.length / 2; j++) {
        const t1 = list[j], t2 = list[list.length - 1 - j];
        if (t1 && t2) pairs.push({ team1_id: t1.id, team2_id: t2.id });
      }
      rounds.push(pairs);
      list.splice(1, 0, list.pop());
    }
    return rounds;
  }
    function handleSetDouble(div, value) {
    setDoubleRounds(prev => ({ ...prev, [div]: value }));
  }

  // Carga inicial y efectos
  useEffect(() => {
    async function loadData() {
      const divs = await getDivisions();
      const divNames = divs.map(d => d.name);
      setDivisions(divNames);
      setActiveDiv(divNames[0] || null);

     const equipos = await getTeams();
     setAllTeams(equipos);
     setTeamsByDiv(Object.fromEntries(
       divNames.map(dv => [
         dv,
         equipos.filter(t => t.division===dv && t.status==='Activo')
       ])
     ));

      const allJ = await getJornadas();
      setAllJornadas(allJ);
      const started = Object.fromEntries(
        allJ.filter(j => j.season === season).map(j => [j.division, true])
      );
      setStartedDivisions(started);

      // Si ya había un torneo para la primera división, carga su config:
      if (started[divNames[0]]) {
        const tc = await getTournamentConfig(divNames[0], season);
        setTemplateConfig(prev => ({
          ...prev,
          [`${divNames[0]}-${season}`]: tc
        }));
           // guardamos el tournamentId para luego pasarlo a Jornadas
    setTournamentId(tc.id);
      }
      const firstJ = allJ.filter(j => j.division === divNames[0] && j.season === season);
      setJornadas(firstJ);
      setSelectedJornada(firstJ[0]?.id || null);

      const tt = await getTournamentTeams(divNames[0], season);
      setTournamentTeams(tt.map(x => x.team_id));

      // Carga schedule y tableSchedule desde localStorage
      const key = `${divNames[0]}-${season}`;
      const sch = JSON.parse(localStorage.getItem(`schedule-${key}`) || 'null');
      if (sch) setScheduledMatches(prev => ({ ...prev, [key]: sch }));

      const tableKey = `${divNames[0]}-${season}-${firstJ[0]?.id}`;
      const tbl = JSON.parse(localStorage.getItem(`table-${tableKey}`) || 'null');
      if (tbl) setTableSchedule(prev => ({ ...prev, [tableKey]: tbl }));
      try {
        const db = await getMatchesByJornada(firstJ[0]?.id);
        setConfirmedJornadas(prev => ({ ...prev, [tableKey]: db.length > 0 }));
      } catch {
        setConfirmedJornadas(prev => ({ ...prev, [tableKey]: false }));
      } finally {
        setConfirmLoaded(prev => ({ ...prev, [tableKey]: true }));
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (!activeDiv || !selectedJornada) return;
    const key = `${activeDiv}-${season}-${selectedJornada}`;
    setConfirmLoaded(prev => ({ ...prev, [key]: false }));
    getMatchesByJornada(selectedJornada)
      .then(data => setConfirmedJornadas(prev => ({ ...prev, [key]: data.length > 0 })))
      .catch(() => setConfirmedJornadas(prev => ({ ...prev, [key]: false })))
      .finally(() => setConfirmLoaded(prev => ({ ...prev, [key]: true })));
  }, [activeDiv, season, selectedJornada]);

  useEffect(() => {
    async function refresh() {
      const allJ = await getJornadas();
      setAllJornadas(allJ);
      setStartedDivisions(Object.fromEntries(
        allJ.filter(j => j.season === season).map(j => [j.division, true])
      ));
      if (!activeDiv) return;
      const js = allJ.filter(j => j.division === activeDiv && j.season === season);
      setJornadas(js);
      setSelectedJornada(js[0]?.id || null);
      const tt = await getTournamentTeams(activeDiv, season);
      setTournamentTeams(tt.map(x => x.team_id));
      const key = `${activeDiv}-${season}`;
      const sch = JSON.parse(localStorage.getItem(`schedule-${key}`) || 'null');
      if (sch) setScheduledMatches(prev => ({ ...prev, [key]: sch }));
      const tableKey = `${activeDiv}-${season}-${js[0]?.id}`;
      const tbl = JSON.parse(localStorage.getItem(`table-${tableKey}`) || 'null');
      if (tbl) setTableSchedule(prev => ({ ...prev, [tableKey]: tbl }));
    }
    refresh();
  }, [season, activeDiv]);

  useEffect(() => {
    if (activeTab === 'Jornadas' && activeDiv) {
      const filtered = allJornadas.filter(j => j.division === activeDiv && j.season === season);
      setJornadas(filtered);
      setSelectedJornada(filtered[0]?.id || null);
      getTournamentTeams(activeDiv, season).then(tt => setTournamentTeams(tt.map(x => x.team_id)));
      const sch = JSON.parse(localStorage.getItem(`${activeDiv}-${season}`) || 'null');
      if (sch) setScheduledMatches(prev => ({ ...prev, [`${activeDiv}-${season}`]: sch }));

    // 2) Cada vez que cambias división o temporada, recarga también su config:
    if (startedDivisions[ activeDiv ]) {
      getTournamentConfig(activeDiv, season).then(tc => {
        setTemplateConfig(prev => ({
          ...prev,
          [`${activeDiv}-${season}`]: tc
        }));
      }).catch(console.error);
    }

    // ── 3) Cada vez que cambias división/temporada, recarga también su configuración de starters/subs ──
    if (startedDivisions[activeDiv]) {
      getTournamentConfig(activeDiv, season)
        .then(tc => setTemplateConfig(prev => ({
          ...prev,
          [`${activeDiv}-${season}`]: tc
        })))
        .catch(console.error);
    }

    }
  }, [activeTab, activeDiv, allJornadas, season]);

  // ---- insertar: escuchar evento global cuando un torneo es eliminado ----
  useEffect(() => {
    async function onTournamentDeleted(e) {
      try {
        const detail = e?.detail || {};
        const division = detail.division;
        const deletedSeason = detail.season || season;
        if (!division) return;

        // 1) marcar la división como no iniciada
        setStartedDivisions(prev => ({ ...(prev || {}), [division]: false }));

        // 2) si la división borrada es la activa, limpiar estados asociados
        if (division === activeDiv) {
          setTournamentTeams([]);

          // quitar schedule guardado en estado
          const key = `${division}-${deletedSeason}`;
          setScheduledMatches(prev => {
            const next = { ...(prev || {}) };
            delete next[key];
            return next;
          });

          // limpiar tablas (table-division-season-...)
          setTableSchedule(prev => {
            const next = { ...(prev || {}) };
            Object.keys(next).forEach(k => {
              if (k.startsWith(`${division}-${deletedSeason}`)) delete next[k];
            });
            return next;
          });

          // limpiar templateConfig para esa division/season
          setTemplateConfig(prev => {
            const next = { ...(prev || {}) };
            delete next[`${division}-${deletedSeason}`];
            return next;
          });

          // forzar recarga de jornadas desde la BD
          try {
            const allJ = await getJornadas();
            setAllJornadas(allJ);
            setStartedDivisions(Object.fromEntries(
              allJ.filter(j => j.season === season).map(j => [j.division, true])
            ));
            const js = allJ.filter(j => j.division === activeDiv && j.season === season);
            setJornadas(js);
            setSelectedJornada(js[0]?.id || null);
          } catch (err) {
            console.warn('Error recargando jornadas tras borrar torneo:', err);
          }
        } else {
          // si no es la division visible, refrescamos allJornadas para mantener consistencia
          try {
            const allJ = await getJornadas();
            setAllJornadas(allJ);
            setStartedDivisions(Object.fromEntries(
              allJ.filter(j => j.season === season).map(j => [j.division, true])
            ));
          } catch (err) {
            console.warn('Error recargando jornadas tras torneoDeleted:', err);
          }
        }

        // emitir evento adicional por si otros módulos necesitan reaccionar
        window.dispatchEvent(new CustomEvent('appTournamentDeleted', { detail: { division, season: deletedSeason } }));
      } catch (err) {
        console.error('onTournamentDeleted handler error:', err);
      }
    }

    window.addEventListener('tournamentDeleted', onTournamentDeleted);
    return () => window.removeEventListener('tournamentDeleted', onTournamentDeleted);
  }, [activeDiv, season]);

// ... tus otros imports

  async function handleStartDivision(div, startDate, isDouble = false) {
    if (!startDate) {
      return alert('Debes seleccionar fecha de inicio antes de iniciar el torneo.');
    }
    const equipos = teamsByDiv[div] || [];
    if (equipos.length < 2) {
      return alert('Se requieren al menos 2 equipos activos.');
    }
    if (await isTorneoComenzado(div, season)) {
      return alert(`Ya existe un torneo iniciado para ${div} en ${season}.`);
    }

    setLoadingDivs(prev => ({ ...prev, [div]: true }));

    let cfg;
    try {
      cfg = await getGlobalLineupConfig();
    } catch (err) {
      console.error('Error leyendo config global:', err);
      cfg = { starters: 5, subs: 6 };
    }

    const key = `${div}-${season}`;
    setTemplateConfig(prev => ({
      ...prev,
      [key]: { starters: cfg.starters, subs: cfg.subs }
    }));

    try {
      // 1) Crear/actualizar torneo y obtener su id
      const tour = await startDivision(div, season, startDate, isDouble, cfg);
      const tournamentId = tour.id;
      setTournamentId(tournamentId);

      // 2) Snapshot de equipos + stats iniciales
      const teamIds = equipos.map(t => t.id);
      await addTournamentTeams(div, season, teamIds, tournamentId);

      // 3) Generar y guardar rondas...
      let rounds = roundRobin(equipos);
      if (isDouble) {
        const reversed = rounds.map(pairs =>
          pairs.map(p => ({ team1_id: p.team2_id, team2_id: p.team1_id }))
        );
        rounds = [...rounds, ...reversed];
      }
      const schedKey = `${div}-${season}`;
      localStorage.setItem(`schedule-${schedKey}`, JSON.stringify(rounds));
      setScheduledMatches(prev => ({ ...prev, [schedKey]: rounds }));

      // 4) Crear jornadas en BD
      for (let i = 0; i < rounds.length; i++) {
        await addJornada(`Jornada ${i + 1}`, div, season);
      }

      // 5) Refrescar vistas
      const allJ = await getJornadas();
      const js   = allJ.filter(j => j.division === div && j.season === season);
      setJornadas(js);
      setSelectedJornada(js[0]?.id || null);
      setStartedDivisions(prev => ({ ...prev, [div]: true }));
      setTournamentTeams(teamIds);

      alert('Torneo iniciado correctamente.');
    } catch (err) {
      console.error('Error creando torneo:', err);
      alert('No se pudo crear este torneo en la DB.');
    } finally {
      setLoading(false);
      setLoadingDivs(prev => ({ ...prev, [div]: false }));
    }
  }


  // Carga de partidos y jugadores
 useEffect(() => {
   // Solo cargar cuando estemos viendo el tab "Jornadas"
   if (activeTab !== 'Jornadas' || !selectedJornada) {
     setMatches([]);          // limpiamos la lista para que no queden datos viejos
     return;
   }
   (async () => {
     try {
       const data = await getMatchesByJornada(selectedJornada);
       setMatches(data);
     } catch (err) {
       console.error('Error cargando partidos:', err);
       setMatches([]);
     }
   })();
 }, [activeTab, selectedJornada]);

   // ── Sincronizar tabla de horario con resultados reales ──
  useEffect(() => {
    if (!selectedJornada) return;
    const key = `${activeDiv}-${season}-${selectedJornada}`;
    // Leemos la tabla actual solo a la hora de ejecutar
    const prevTable = tableSchedule[key] || {};
    const curr = { ...prevTable };
    let changed = false;

    matches.forEach(m => {
   // sólo si el partido ya tiene goles (no null) lo reflejamos
   if (m.goals1 != null && m.goals2 != null) {
     Object.entries(curr).forEach(([cellKey, cell]) => {
       if (
         cell.id === m.id ||
         (!cell.id
           && cell.pair.team1_id === m.team1_id
           && cell.pair.team2_id === m.team2_id)
       ) {
         curr[cellKey] = {
           ...cell,
           id:     m.id,
           result: { goals1: m.goals1, goals2: m.goals2 }
         };
         changed = true;
       }
     });
   }
    });

    if (changed) {
      localStorage.setItem(`table-${key}`, JSON.stringify(curr));
      setTableSchedule(prevAll => ({
        ...prevAll,
        [key]: curr
      }));
    }
  }, [matches, activeDiv, season, selectedJornada]);

  useEffect(() => {
    async function loadA() { teamA ? setPlayersA(await getPlayersByTeam(teamA)) : setPlayersA([]); }
    async function loadB() { teamB ? setPlayersB(await getPlayersByTeam(teamB)) : setPlayersB([]); }
    loadA(); loadB();
  }, [teamA, teamB]);

  useEffect(() => {
    if (activeDiv && selectedJornada) {
      const cellKey = `${activeDiv}-${season}-${selectedJornada}`;
      const saved = JSON.parse(localStorage.getItem(`table-${cellKey}`)) || {};
      setTableSchedule(prev => ({ ...prev, [cellKey]: saved }));
    }
  }, [activeDiv, season, selectedJornada]);

function handleDrop(e, row, col) {
  e.preventDefault();
  const data = JSON.parse(e.dataTransfer.getData('application/json'));
  const { pair, roundIdx: fromRound, fromCell, label: fromLabel } = data;

  // 1) Si viene de la barra, lo quita de scheduledMatches...
  if (fromRound !== undefined) {
    const schedKey = `${activeDiv}-${season}`;
    const rounds = scheduledMatches[schedKey] || [];
    const updatedRounds = rounds.map((pairs, idx) =>
      idx === fromRound
        ? pairs.filter(p =>
            !(p.team1_id === pair.team1_id && p.team2_id === pair.team2_id)
          )
        : pairs
    );
    localStorage.setItem(`schedule-${schedKey}`, JSON.stringify(updatedRounds));
    setScheduledMatches(prev => ({ ...prev, [schedKey]: updatedRounds }));
  }

  // 2) Si viene de otra celda, la limpia
  if (fromCell) {
    const tableKey = `${activeDiv}-${season}-${selectedJornada}`;
    const curr = { ...(tableSchedule[tableKey] || {}) };
    delete curr[fromCell];
    localStorage.setItem(`table-${tableKey}`, JSON.stringify(curr));
    setTableSchedule(prev => ({ ...prev, [tableKey]: curr }));
  }

  // 3) Inserta EN LA NUEVA CELDA, guardando pair, origin y label
  const tableKey = `${activeDiv}-${season}-${selectedJornada}`;
  setTableSchedule(prev => {
    const curr = { ...(prev[tableKey] || {}) };
    const cellKey = `${row}-${col}`;
    curr[cellKey] = {
      pair,
      origin: fromRound,
      label: fromLabel ?? null
    };
    localStorage.setItem(`table-${tableKey}`, JSON.stringify(curr));
    return { ...prev, [tableKey]: curr };
  });
}


async function handleConfirmJornada() {
  if (!selectedJornada) return;

  const key = `${activeDiv}-${season}-${selectedJornada}`;
  const allRounds = scheduledMatches[`${activeDiv}-${season}`] || [];
  const roundIdx = allRounds.findIndex((_, i) => jornadas[i]?.id === selectedJornada);
  const lastIdx = allRounds.length - 1;

  // 1) Si estoy en la última jornada, compruebo pendientes de todas las anteriores
  if (roundIdx === lastIdx) {
    // A) pares de todas las rondas previas
    const prevRounds = allRounds.slice(0, lastIdx).flat();
    // B) pares ya "colocados" en las tablas de TODAS las jornadas
    const placed = [];
    jornadas.forEach(j => {
      const k = `${activeDiv}-${season}-${j.id}`;
      const tbl = tableSchedule[k] || {};
      Object.values(tbl).forEach(p => placed.push(p));
    });
    // C) detecto cuáles prevRounds NO están en placed → pendientes
    const pending = prevRounds.filter(p =>
      !placed.some(q =>
        q.team1_id === p.team1_id && q.team2_id === p.team2_id
      )
    );
    if (pending.length) {
      return alert(
        `Aún tienes ${pending.length} partidos pendientes de rondas anteriores.\n` +
        `Por favor, arrástralos a alguna jornada antes de confirmar la última.`
      );
    }
  }

  // 2) Comprobación normal: si ya está confirmada, no hacemos nada
  if (confirmedJornadas[key]) return;

  // 3) Confirmación por parte del usuario
  const ok = window.confirm(
    '¿Estás seguro de que quieres confirmar esta jornada?\n' +
    'Una vez confirmada ya no podrás volver a editarla.'
  );
  if (!ok) return;

  // 4) Validar que haya al menos un partido en esta jornada
  const entries = Object.entries(tableSchedule[key] || {});
  if (entries.length === 0) {
    return alert('Arrastra al menos un partido para confirmar.');
  }

// 5) Guardar en la base, almacenar IDs y resultado inicial, y marcar confirmada
setLoading(true);
try {
  // clonamos la tabla actual para ir montando la nueva
  const newTable = { ...(tableSchedule[key] || {}) };

  // insertamos cada partido y guardamos su id + resultado 0‑0
  for (const [cellKey, cell] of entries) {
    const { team1_id, team2_id } = cell.pair;
    // volvemos a goals1:0, goals2:0 para cumplir la NOT NULL constraint
    const matchData = await createMatch({
      team1Id: team1_id,
      team2Id: team2_id,
        // ahora insertamos NULL para “sin resultado”
        goals1: null,
        goals2: null,
      playerGoalsInput: [],
      jornadaId: selectedJornada
    });
    newTable[cellKey] = {
      ...cell,
      id: matchData.id,
      // no ponemos result aquí, lo añadiremos sólo tras la edición real
    };
  }

  // 5.3) volcamos el nuevo schedule a estado y localStorage
  localStorage.setItem(`table-${key}`, JSON.stringify(newTable));
  setTableSchedule(prev => ({ ...prev, [key]: newTable }));
  setConfirmedJornadas(prev => ({ ...prev, [key]: true }));

      // ↪ recargamos inmediatamente los partidos confirmados,
    //   para que handleSelectMatch los encuentre
    const nuevos = await getMatchesByJornada(selectedJornada);
    setMatches(nuevos);




  alert('✅ Jornada confirmada y partidos guardados.');
} catch (err) {
  console.error(err);
  alert('❌ Error al guardar los partidos en la base de datos.');
} finally {
  setLoading(false);
}

}


  async function handleSubmitMatch(e) {
    e.preventDefault();
    if (!teamA || !teamB || !selectedJornada) return;
    setLoading(true);
    try {
      await createMatch({
        team1Id: teamA,
        team2Id: teamB,
        goals1: goalsA,
        goals2: goalsB,
        playerGoalsInput,
        jornadaId: selectedJornada
      });
      setMatches(await getMatchesByJornada(selectedJornada));
      setTeamA(null); setTeamB(null); setGoalsA(0); setGoalsB(0);
      setPlayerGoalsInput([]); setPlayersA([]); setPlayersB([]);
    } catch {
      alert('Error al crear el partido.');
    } finally {
      setLoading(false);
    }
  }

  function handlePlayerGoalChange(playerId, value) {
    setPlayerGoalsInput(prev => {
      const u = prev.filter(pg => pg.playerId !== playerId);
      const g = parseInt(value, 10) || 0;
      if (g > 0) u.push({ playerId, goals: g });
      return u;
    });
  }

async function handleReturnMatch(e) {
  e.preventDefault();
  const data = JSON.parse(e.dataTransfer.getData('application/json'));
  const { pair, fromCell, roundIdx, label } = data;
  if (!fromCell || roundIdx === undefined) return;

  // 1) Quitar de tableSchedule
  const tableKey = `${activeDiv}-${season}-${selectedJornada}`;
  const curr = { ...(tableSchedule[tableKey] || {}) };
  delete curr[fromCell];
  localStorage.setItem(`table-${tableKey}`, JSON.stringify(curr));
  setTableSchedule(prev => ({ ...prev, [tableKey]: curr }));

  // 2) Volver a agregar en scheduledMatches en su ronda original
  const schedKey = `${activeDiv}-${season}`;
  const rounds = scheduledMatches[schedKey] || [];
  const newRounds = rounds.map((pairs, idx) =>
    idx === roundIdx
      ? [...pairs, pair]
      : pairs
  );
  localStorage.setItem(`schedule-${schedKey}`, JSON.stringify(newRounds));
  setScheduledMatches(prev => ({ ...prev, [schedKey]: newRounds }));
}
async function handleSelectMatch(entryObj) {
  // buscamos el partido en la DB para obtener su match.id
  const found = matches.find(m =>
    m.jornada_id === entryObj.jornadaId &&
    m.team1_id   === entryObj.pair.team1_id &&
    m.team2_id   === entryObj.pair.team2_id
  );

  if (!found) {
    return alert('No se encontró el partido en la base de datos.');
  }
    // ── 3) Recupero detalle completo (goles y referee y lineup) ──
  let detail;
  try {
    detail = await getMatchDetail(found.id);
  } catch (err) {
    console.error('Error cargando detalle del partido:', err);
    detail = { goals1: found.goals1, goals2: found.goals2, referee:'', lineup: [] };
  }


  setSelectedMatchEntry({
    ...entryObj,
    id: found.id,
    team1Name: teamMap[entryObj.pair.team1_id].name,
    team2Name: teamMap[entryObj.pair.team2_id].name,
    config:    found.config,
    goals1:    detail.goals1,
    goals2:    detail.goals2,
    referee:   detail.referee,    // ← inyectamos referee
    lineup:    detail.lineup
  });
  setShowResultModal(true);
}


function handleCloseResultModal() {
  setShowResultModal(false);
  setSelectedMatchEntry(null);    // ← aquí limpiamos también el entry
}


    return (
    <div className="main">
      <h1 className="title">Partidos</h1>
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
      {activeTab === 'Torneos' && (
        <Torneos
          divisions={divisions}
          teamsByDiv={teamsByDiv}
          tournamentTeams={tournamentTeams}
          startedDivisions={startedDivisions}
          startDates={startDates}
          allTeams={allTeams}
          setStartDates={setStartDates}
          season={season}
          seasons={seasons}
          handleStartDivision={handleStartDivision}
          doubleRounds={doubleRounds}
          setDoubleRounds={handleSetDouble}
          loadingDivs={loadingDivs}
        />
      )}
      {activeTab === 'Jornadas' && (
        <Jornadas
          divisions={divisions}
          startedDivisions={startedDivisions}
          activeDiv={activeDiv}
          setActiveDiv={setActiveDiv}
          season={season}
         setSeason={setSeason}
        tournamentId={tournamentId}
          jornadas={jornadas}
          selectedJornada={selectedJornada}
          setSelectedJornada={setSelectedJornada}
          tournamentTeams={tournamentTeams}
          teamsByDiv={teamsByDiv}
          scheduledMatches={scheduledMatches}
          tableSchedule={tableSchedule}
          setTableSchedule={setTableSchedule}
          confirmLoaded={confirmLoaded}
          confirmedJornadas={confirmedJornadas}
          handleDrop={handleDrop}
          allTeams={allTeams}
          hours={hours}
          loading={loading}
          handleConfirmJornada={handleConfirmJornada}
          teamA={teamA}
          setTeamA={setTeamA}
          teamB={teamB}
          setTeamB={setTeamB}
          playersA={playersA}
          playersB={playersB}
          goalsA={goalsA}
          setGoalsA={setGoalsA}
          goalsB={goalsB}
          setGoalsB={setGoalsB}
          handleSubmitMatch={handleSubmitMatch}
          handlePlayerGoalChange={handlePlayerGoalChange}
          getPlayersByTeam={getPlayersByTeam}
          getMatchesByJornada={getMatchesByJornada}
          setMatches={setMatches}
          handleReturnMatch={handleReturnMatch}
          onSelectMatch={handleSelectMatch}
          showResultModal={showResultModal}
          onCloseResultModal={handleCloseResultModal}
          selectedMatchEntry={selectedMatchEntry}
          templateConfig={templateConfig[`${activeDiv}-${season}`]}
        />
      )}
      {showResultModal && selectedMatchEntry && (
        <ResultModal
          entry={selectedMatchEntry}
          onClose={handleCloseResultModal}
          config={selectedMatchEntry.config}
        />
      )}
    </div>
  );
}
