// src/renderer/pages/Partidos.jsx
import React, { useState, useEffect } from 'react';
import '../styles/styles.css';
import Torneos from './Torneos';
import Jornadas from './Jornadas';
import { getTeams } from '../services/teamsService.js';
import { getPlayersByTeam } from '../services/playersService.js';
import { createMatch, getMatchesByJornada } from '../services/matchesService.js';
import { getJornadas, addJornada, isTorneoComenzado } from '../services/jornadasService.js';
import { getGlobalLineupConfig } from '../services/configService.js';
import { getDivisions } from '../services/divisionsService.js';
import { getTournamentTeams, addTournamentTeams } from '../services/tournamentService';
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
      setStartedDivisions(Object.fromEntries(
        allJ.filter(j => j.season === season).map(j => [j.division, true])
      ));

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
    }
  }, [activeTab, activeDiv, allJornadas, season]);

  // Lógica para iniciar torneo
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

    // ── Evitar iniciar dos torneos simultáneos ──
    const { data: ttData, error: ttError } = await supabase
      .from('tournament_teams')
      .select('id')
      .eq('division', div)
      .eq('season', season)
      .limit(1);
    if (ttError) {
      console.error('Error comprobando torneo existente:', ttError);
      return alert('No se pudo verificar si ya existe un torneo.');
    }
    if (ttData.length > 0) {
      return alert(`Ya hay un torneo activo de la división ${div} en ${season}.`);
    }

    // ── Bloquear doble click ──
    setLoadingDivs(prev => ({ ...prev, [div]: true }));

   // ── Leer configuración de plantilla DESDE LA DB ──
   let cfg;
   try {
     cfg = await getGlobalLineupConfig();
   } catch (err) {
     console.error('No se pudo leer configuración de plantilla, usando 5/6 por defecto', err);
     cfg = { starters: 5, subs: 6 };
   }

   // ── Guardar esa config en el estado con clave división-temporada ──
   const key = `${div}-${season}`;
   setTemplateConfig(prev => ({
     ...prev,
     [key]: { starters: cfg.starters, subs: cfg.subs }
   }));

    // ── Leer configuración de plantilla antes de crear el torneo ──
    const starters = parseInt(localStorage.getItem('numStarters'), 10) || 5;
    const subs     = parseInt(localStorage.getItem('numSubs'), 10)     || 6;

    let tournamentId;
    try {
      // 1) Crear torneo
      const { data: tour, error: tourError } = await supabase
        .from('tournaments')
        .insert([{ name: `${div} - ${season}`, start_date: startDate, end_date: null }])
        .select('id')
        .single();
      if (tourError) throw tourError;
      tournamentId = tour.id;

      // 2) Snapshot de equipos y tournament_teams
      const teamIds = equipos.map(t => t.id);
      await addTournamentTeams(div, season, teamIds, tournamentId);

      // 3) Generar rondas
      let rounds = roundRobin(equipos);
      if (isDouble) {
        const reversed = rounds.map(pairs =>
          pairs.map(p => ({ team1_id: p.team2_id, team2_id: p.team1_id }))
        );
        rounds = [...rounds, ...reversed];
      }

      // 4) Guardar schedule
      const schedKey = `${div}-${season}`;
      localStorage.setItem(`schedule-${schedKey}`, JSON.stringify(rounds));
      setScheduledMatches(prev => ({ ...prev, [schedKey]: rounds }));

      // 5) Crear jornadas en la BD
      for (let i = 0; i < rounds.length; i++) {
        await addJornada(`Jornada ${i + 1}`, div, season);
      }

      // 6) Capturar la configuración de plantillas PARA ESTE torneo
      setTemplateConfig(prev => ({
        ...prev,
        [`${div}-${season}`]: { starters, subs }
      }));

      // 7) Refrescar vistas
      const allJ = await getJornadas();
      const js = allJ.filter(j => j.division === div && j.season === season);
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
    async function loadMatches() {
      if (!selectedJornada) {
        setMatches([]);
        return;
      }
      const data = await getMatchesByJornada(selectedJornada);
      setMatches(data);
    }
    loadMatches();
  }, [selectedJornada]);

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

  // 5) Guardar en la base y marcarla confirmada
  setLoading(true);
  try {
   for (const [, cell] of entries) {
     // EXTRAEMOS el par real
     const { team1_id, team2_id } = cell.pair;
     await createMatch({
       team1Id: team1_id,
       team2Id: team2_id,
        goals1: 0,
        goals2: 0,
        playerGoalsInput: [],
        jornadaId: selectedJornada
      });
    }
    setConfirmedJornadas(prev => ({ ...prev, [key]: true }));
    alert('Jornada confirmada y partidos guardados.');
  } catch (err) {
    console.error(err);
    alert('Error al guardar los partidos en la base de datos.');
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
function handleSelectMatch(entryObj) {
  // buscamos el partido en la DB para obtener su match.id
  const found = matches.find(m =>
    m.jornada_id === entryObj.jornadaId &&
    m.team1_id   === entryObj.pair.team1_id &&
    m.team2_id   === entryObj.pair.team2_id
  );

  if (!found) {
    return alert('No se encontró el partido en la base de datos.');
  }

  setSelectedMatchEntry({
    ...entryObj,
    id: found.id,
    team1Name: teamMap[entryObj.pair.team1_id].name,
    team2Name: teamMap[entryObj.pair.team2_id].name
  });
  setShowResultModal(true);
}


function handleCloseResultModal() {
  setShowResultModal(false);
  setSelectedMatchEntry(null);    // ← aquí limpiamos también el entry
}


  return (
    <div className="main" >
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
          tournamentTeams={tournamentTeams}      // ← nuevo
          startedDivisions={startedDivisions}
          startDates={startDates}
          allTeams={allTeams}
          setStartDates={setStartDates}
          season={season}
          seasons={seasons}
          handleStartDivision={handleStartDivision}
          doubleRounds={doubleRounds}             // ← nuevo
          setDoubleRounds={handleSetDouble}        // ← nuevo
          loadingDivs={loadingDivs}                // ← nuevo
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
          jornadas={jornadas}
          selectedJornada={selectedJornada}
          setSelectedJornada={setSelectedJornada}
          tournamentTeams={tournamentTeams}
          teamsByDiv={teamsByDiv}
          scheduledMatches={scheduledMatches}
          tableSchedule={tableSchedule}
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
          { /* ── Modal de Resultado ── */ }
    {showResultModal && selectedMatchEntry && (
      <ResultModal
        entry={selectedMatchEntry}
        onClose={handleCloseResultModal}
        // aquí recuperamos la config para la división y la temporada actuales
        config={templateConfig[`${activeDiv}-${season}`]}
      />
    )}

    </div>
  );
}
