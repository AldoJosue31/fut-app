// src/renderer/pages/Partidos.jsx
import React, { useState, useEffect } from 'react';
import '../styles/styles.css';
import Torneos from './Torneos';
import Jornadas from './Jornadas';
import { getTeams } from '../services/teamsService.js';
import { getPlayersByTeam } from '../services/playersService.js';
import { createMatch, getMatchesByJornada } from '../services/matchesService.js';
import { getJornadas, addJornada, isTorneoComenzado } from '../services/jornadasService.js';
import { getDivisions } from '../services/divisionsService.js';
import { getTournamentTeams, addTournamentTeams } from '../services/tournamentService';
import { supabase } from '../supabaseClient.js';

const tabs = ['Torneos', 'Jornadas'];
const years = Array.from({ length: 6 }, (_, i) => 2025 + i);
const seasons = years.flatMap(y => [`Clausura ${y}`, `Apertura ${y}`]);
const hours = ['18:00', '19:00', '20:00', '21:00', '22:00', '23:00'];

export default function Partidos() {
  const [activeTab, setActiveTab] = useState('Torneos');
  // Estados compartidos
  const [divisions, setDivisions] = useState([]);
  const [teamsByDiv, setTeamsByDiv] = useState({});
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

  // Carga inicial y efectos
  useEffect(() => {
    async function loadData() {
      const divs = await getDivisions();
      const divNames = divs.map(d => d.name);
      setDivisions(divNames);
      setActiveDiv(divNames[0] || null);

      const allTeams = await getTeams();
      setTeamsByDiv(Object.fromEntries(
        divNames.map(dv => [dv, allTeams.filter(t => t.division === dv && t.status === 'Activo')])
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
  async function handleStartDivision(div) {
    const equipos = teamsByDiv[div] || [];
    if (equipos.length < 2) return alert('Se requieren al menos 2 equipos activos.');
    if (await isTorneoComenzado(div, season)) {
      return alert(`Ya existe un torneo iniciado para ${div} en ${season}.`);
    }
    const rounds = roundRobin(equipos);
    const schedKey = `${div}-${season}`;
    localStorage.setItem(`schedule-${schedKey}`, JSON.stringify(rounds));
    setScheduledMatches(prev => ({ ...prev, [schedKey]: rounds }));
    for (let i = 0; i < rounds.length; i++) {
      await addJornada(`Jornada ${i + 1}`, div, season);
    }
    const ids = equipos.map(t => t.id);
    await addTournamentTeams(div, season, ids);
    const allJ = await getJornadas();
    const js = allJ.filter(j => j.division === div && j.season === season);
    setJornadas(js);
    setSelectedJornada(js[0]?.id || null);
    setStartedDivisions(prev => ({ ...prev, [div]: true }));
    setTournamentTeams(ids);
  }

  // Carga de partidos y jugadores
  useEffect(() => {
    async function loadMatches() {
      if (!selectedJornada) { setMatches([]); return; }
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
    const json = e.dataTransfer.getData('application/json');
    if (!json) return; let data;
    try { data = JSON.parse(json); } catch { return; }
    const { pair, roundIdx, fromCell } = data;
    if (roundIdx !== undefined) {
      const schedKey = `${activeDiv}-${season}`;
      const rounds = scheduledMatches[schedKey] || [];
      const updatedRounds = rounds.map((pairs, idx) =>
        idx === roundIdx
          ? pairs.filter(p => !(p.team1_id === pair.team1_id && p.team2_id === pair.team2_id))
          : pairs
      );
      localStorage.setItem(`schedule-${schedKey}`, JSON.stringify(updatedRounds));
      setScheduledMatches(prev => ({ ...prev, [schedKey]: updatedRounds }));
    }
    if (fromCell) {
      const tableKey = `${activeDiv}-${season}-${selectedJornada}`;
      const curr = tableSchedule[tableKey] || {};
      delete curr[fromCell];
      localStorage.setItem(`table-${tableKey}`, JSON.stringify(curr));
      setTableSchedule(prev => ({ ...prev, [tableKey]: { ...curr } }));
    }
    const tableKey = `${activeDiv}-${season}-${selectedJornada}`;
    const currTable = tableSchedule[tableKey] || {};
    const cellKey = `${row}-${col}`;
    currTable[cellKey] = pair;
    localStorage.setItem(`table-${tableKey}`, JSON.stringify(currTable));
    setTableSchedule(prev => ({ ...prev, [tableKey]: { ...currTable } }));
  }

  async function handleConfirmJornada() {
    if (!selectedJornada) return;
    const key = `${activeDiv}-${season}-${selectedJornada}`;
    if (confirmedJornadas[key]) return;
    const ok = window.confirm(
      '¿Estás seguro de que quieres confirmar esta jornada? ' +
      'Una vez confirmada ya no podrás volver a editarla.'
    );
    if (!ok) return;
    const table = tableSchedule[key] || {};
    const entries = Object.entries(table);
    if (entries.length === 0) {
      return alert('Arrastra al menos un partido para confirmar.');
    }
    setLoading(true);
    try {
      for (const [, pair] of entries) {
        await createMatch({
          team1Id: pair.team1_id,
          team2Id: pair.team2_id,
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

  return (
    <div className="main" style={{ backgroundColor: '#1F1F1F', minHeight: '100vh' }}>
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
          startedDivisions={startedDivisions}
          startDates={startDates}
          setStartDates={setStartDates}
          season={season}
          seasons={seasons}
          handleStartDivision={handleStartDivision}
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
        />
      )}
    </div>
  );
}
