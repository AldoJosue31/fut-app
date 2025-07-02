// src/renderer/components/Sidebar.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';  // ← IMPORTA useAuth
import 'bootstrap/dist/css/bootstrap.min.css';
import * as bootstrap from 'bootstrap';
import {
  FaHome,
  FaUsers,
  FaListOl,
  FaEdit,
  FaFutbol,
  FaCalendarAlt,
  FaCog,
  FaSignOutAlt,  // ← icono para cerrar sesión
  FaChevronLeft,
  FaChevronRight,
} from 'react-icons/fa';

import { getDivisions } from '../services/divisionsService';
import ConfigModal from './ConfigModal';
import '../styles/Sidebar.css';

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
  const { signOut } = useAuth();

  const [divs, setDivs]             = useState([]);
  const [currentDiv, setCurrentDiv] = useState(0);
  const [activeIdx, setActiveIdx]   = useState(0);
  const [showConfig, setShowConfig] = useState(false);
  const tooltipRefs = useRef([]);

  // Carga divisiones
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

  // Persiste división
  useEffect(() => {
    const cur = divs[currentDiv];
    if (cur) {
      localStorage.setItem('division', cur);
      window.dispatchEvent(new Event('divisionChange'));
    }
  }, [currentDiv, divs]);

  // Ruta activa
  useEffect(() => {
    const idx = ROUTES.findIndex(r => r.to === location.pathname);
    if (idx >= 0) setActiveIdx(idx);
  }, [location.pathname]);

  // Tooltips
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

  // Navegación con rueda
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

  // Avanzar/Retroceder división
  const prevDiv = () => setCurrentDiv(i => (i - 1 + divs.length) % divs.length);
  const nextDiv = () => setCurrentDiv(i => (i + 1) % divs.length);
  const initial = divs[currentDiv]?.charAt(0).toUpperCase() || '';

    const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`} onWheel={onWheel}>
      {/* HEADER */}
      <div className="sidebar-header">
        <FaFutbol className="logo-icon"/>
        {isOpen && <h4 className="logo-text">Liga Amateur</h4>}
      </div>

      {/* NAV */}
      <nav className="sidebar-nav">
        {ROUTES.map(({ id, to, Icon, label }, idx) => (
          <NavLink
            key={id}
            to={to} end={to === '/'}
            className={`nav-link ${idx === activeIdx ? 'active' : ''}`}
            onClick={() => setActiveIdx(idx)}
            {...(!isOpen && {
              'data-bs-toggle':'tooltip','data-bs-placement':'right',title:label
            })}
          >
            <Icon className="nav-icon"/>
            {isOpen && <span className="nav-label">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* FOOTER */}
      {isOpen ? (
        <div className="sidebar-footer open">
          <div className="divider"/>
          <div className="selector">
            <label htmlFor="ligaSelector">Liga:</label>
            <select
              id="ligaSelector"
              value={currentDiv}
              onChange={e=>setCurrentDiv(Number(e.target.value))}
            >
              {divs.map((n,i)=>(
                <option key={i} value={i}>{n}</option>
              ))}
            </select>
          </div>
          <button className="btn-config" onClick={()=>setShowConfig(true)}>
            <FaCog className="config-icon"/>
            Configuración
          </button>
          <button
           className="btn-logout"
           onClick={handleLogout}
           style={{ marginTop: '1rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
           >
           <FaSignOutAlt style={{ marginRight: '0.5rem' }}/>
           Cerrar Sesión
         </button>
        </div>
      ) : (
        <div className="sidebar-footer closed">
          <div/>
          {/* Botón izquierdo vacío */}
          <button
            className="arrow-btn"
            onClick={prevDiv}
            data-bs-toggle="tooltip"
            title="Anterior división"
          />
          {/* Indicador de división */}
          <div
            className="div-initial"
            data-bs-toggle="tooltip"
            title={divs[currentDiv]}
            onClick={nextDiv}
          >
            {initial}
          </div>
          <button
            className="arrow-btn"
            onClick={nextDiv}
            data-bs-toggle="tooltip"
            title="Siguiente división"
          />
          <button
            className="footer-config-btn"
            onClick={()=>setShowConfig(true)}
            data-bs-toggle="tooltip"
            title="Configuración"
          >
            <FaCog/>
          </button>
        {/* Cerramos sesión incluso en estado cerrado */}
         <button
           className="footer-logout-btn"
           onClick={handleLogout}
           data-bs-toggle="tooltip"
           title="Cerrar Sesión"
         >
           <FaSignOutAlt />
         </button>
        </div>
      )}

      {/* TOGGLE */}
      <button className="toggle-btn" onClick={onToggle}>
        {isOpen? <FaChevronLeft/> : <FaChevronRight/>}
      </button>

      {showConfig && <ConfigModal onClose={()=>setShowConfig(false)}/>}
    </aside>
  );
}
