import React, { useState, useEffect, useCallback, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as bootstrap from 'bootstrap';
import {
  FaHome,
  FaUsers,
  FaListOl,
  FaEdit,
  FaFutbol,
  FaCalendarAlt,
  FaArrowLeft,
  FaArrowRight,
  FaCog,
  FaChevronLeft,
  FaChevronRight,
} from 'react-icons/fa';

import { getDivisions } from '../services/divisionsService';
import ConfigModal from './ConfigModal';
import '../styles/sidebar.css';
import '../styles/styles.css';

const ROUTES = [
  { id: 1, to: '/',          Icon: FaHome,       label: 'Inicio',      end: true },
  { id: 2, to: '/equipos',   Icon: FaUsers,      label: 'Equipos' },
  { id: 3, to: '/clasificacion', Icon: FaListOl,  label: 'Clasificación' },
  { id: 4, to: '/editar',     Icon: FaEdit,       label: 'Editar' },
  { id: 5, to: '/partidos',   Icon: FaFutbol,     label: 'Partidos' },
  { id: 6, to: '/calendario', Icon: FaCalendarAlt,label: 'Calendario' },
];

export default function Sidebar({ isOpen, onToggle }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [divs, setDivs]             = useState([]);
  const [currentDiv, setCurrentDiv] = useState(0);
  const [activeIdx, setActiveIdx]   = useState(0);
  const [showConfig, setShowConfig] = useState(false);
  const tooltipRefs = useRef([]);

  // carga divisiones
  useEffect(() => {
    (async () => {
      const data = await getDivisions();
      const names = data.map(d => d.name);
      setDivs(names);
      const saved = localStorage.getItem('division');
      const idx = names.indexOf(saved);
      if (idx >= 0) setCurrentDiv(idx);
    })();
  }, []);

  // persiste división
  useEffect(() => {
    const cur = divs[currentDiv];
    if (cur) {
      localStorage.setItem('division', cur);
      window.dispatchEvent(new Event('divisionChange'));
    }
  }, [currentDiv, divs]);

  // ruta activa
  useEffect(() => {
    const idx = ROUTES.findIndex(r => r.to === location.pathname);
    if (idx >= 0) setActiveIdx(idx);
  }, [location.pathname]);

  // tooltips
  useEffect(() => {
    tooltipRefs.current.forEach(t => t.dispose());
    tooltipRefs.current = [];
    if (!isOpen) {
      document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
        tooltipRefs.current.push(new bootstrap.Tooltip(el, { animation: false }));
      });
    }
    return () => {
      tooltipRefs.current.forEach(t => t.dispose());
      tooltipRefs.current = [];
    };
  }, [isOpen]);

  // scroll nav
  const wheelTimer = useRef();
  const onWheel = useCallback(e => {
    if (wheelTimer.current) return;
    const delta = e.deltaY > 0 ? 1 : -1;
    let nxt = activeIdx + delta;
    nxt = Math.max(0, Math.min(ROUTES.length - 1, nxt));
    if (nxt !== activeIdx) {
      setActiveIdx(nxt);
      navigate(ROUTES[nxt].to);
    }
    wheelTimer.current = setTimeout(() => (wheelTimer.current = null), 200);
  }, [activeIdx, navigate]);

  // flechas de división
  const prevDiv = () => setCurrentDiv(i => (i - 1 + divs.length) % divs.length);
  const nextDiv = () => setCurrentDiv(i => (i + 1) % divs.length);
  const initial = divs[currentDiv]?.charAt(0).toUpperCase() || '';

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`} onWheel={onWheel}>
      {/* HEADER */}
      <div className="sidebar-header">
        <FaFutbol className="logo-icon" />
        {isOpen && <h4 className="logo-text">Liga Amateur</h4>}
      </div>

      {/* NAV */}
      <nav className="sidebar-nav">
        {ROUTES.map(({ id, to, Icon, label }, idx) => (
          <NavLink
            key={id}
            to={to}
            end={to === '/'}
            className={`nav-link ${idx === activeIdx ? 'active' : ''}`}
            onClick={() => setActiveIdx(idx)}
            {...(!isOpen && {
              'data-bs-toggle': 'tooltip',
              'data-bs-placement': 'right',
              title: label,
            })}
          >
            <Icon className="nav-icon" />
            {isOpen && <span className="nav-label">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* FOOTER */}
      {isOpen ? (
        <div className="sidebar-footer open">
          <div className="divider" />
          <div className="selector">
            <label htmlFor="ligaSelector">Liga:</label>
            <select
              id="ligaSelector"
              value={currentDiv}
              onChange={e => setCurrentDiv(Number(e.target.value))}
            >
              {divs.map((n,i) => (
                <option key={i} value={i}>{n}</option>
              ))}
            </select>
          </div>
          <button className="btn-config" onClick={() => setShowConfig(true)}>
            <FaCog className="config-icon" />
            Configuración
          </button>
        </div>
      ) : (
        <div className="sidebar-footer closed">
          <div className="divider" />
          <div className="icon-selector">
            <button
              className="arrow-btn"
              onClick={prevDiv}
              data-bs-toggle="tooltip"
              title="Anterior división"
            >
              <FaArrowLeft />
            </button>
            <div
              className="div-initial"
              data-bs-toggle="tooltip"
              title={divs[currentDiv]}
            >
              {initial}
            </div>
            <button
              className="arrow-btn"
              onClick={nextDiv}
              data-bs-toggle="tooltip"
              title="Siguiente división"
            >
              <FaArrowRight />
            </button>
          </div>
          <button
            className="footer-config-btn"
            onClick={() => setShowConfig(true)}
            data-bs-toggle="tooltip"
            title="Configuración"
          >
            <FaCog />
          </button>
        </div>
      )}

      {/* TOGGLE */}
      <button className="toggle-btn" onClick={onToggle}>
        {isOpen ? <FaChevronLeft /> : <FaChevronRight />}
      </button>

      {showConfig && <ConfigModal onClose={() => setShowConfig(false)} />}
    </aside>
  );
}
