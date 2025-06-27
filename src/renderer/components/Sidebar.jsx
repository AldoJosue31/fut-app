// src/renderer/components/Sidebar.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import * as bootstrap from "bootstrap";
import {
  FaHome,
  FaUsers,
  FaListOl,
  FaEdit,
  FaFutbol,
  FaCalendarAlt,
  FaListUl,
  FaCog,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

import { getDivisions } from "../services/divisionsService";
import ConfigModal from "./ConfigModal";
import "../styles/sidebar.css";

const routes = [
  { id: 1, to: "/", Icon: FaHome,        label: "Inicio",       end: true },
  { id: 2, to: "/equipos", Icon: FaUsers,       label: "Equipos" },
  { id: 3, to: "/clasificacion", Icon: FaListOl,    label: "Clasificación" },
  { id: 4, to: "/editar", Icon: FaEdit,        label: "Editar" },
  { id: 5, to: "/partidos", Icon: FaFutbol,      label: "Partidos" },
  { id: 6, to: "/calendario", Icon: FaCalendarAlt,label: "Calendario" },
];

export default function Sidebar({ isOpen, onToggle }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [activeIndex, setActiveIndex] = useState(0);
  const [divisions, setDivisions]     = useState([]);
  const [currentDiv, setCurrentDiv]   = useState(0);
  const [showConfig, setShowConfig]   = useState(false);

  const tooltipsRef = useRef([]);

  // (Re)initialize tooltips when open/closed
  useEffect(() => {
    tooltipsRef.current.forEach(t => {
      try { t.hide(); t.dispose(); }
      catch {}
    });
    tooltipsRef.current = [];

    if (!isOpen) {
      const els = document.querySelectorAll('[data-bs-toggle="tooltip"]');
      tooltipsRef.current = Array.from(els).map(el =>
        new bootstrap.Tooltip(el, { animation: false })
      );
    }

    return () => {
      tooltipsRef.current.forEach(t => {
        try { t.hide(); t.dispose(); }
        catch {}
      });
      tooltipsRef.current = [];
    };
  }, [isOpen]);

  // Load divisions
  useEffect(() => {
    (async () => {
      const data = await getDivisions();
      setDivisions(data.map(d => d.name));
      const saved = localStorage.getItem("division");
      const idx   = data.findIndex(d => d.name === saved);
      if (idx >= 0) setCurrentDiv(idx);
    })();
  }, []);

  // Persist division
  useEffect(() => {
    const cur = divisions[currentDiv];
    if (cur) {
      localStorage.setItem("division", cur);
      window.dispatchEvent(new Event("divisionChange"));
    }
  }, [currentDiv, divisions]);

  // Active route
  useEffect(() => {
    const idx = routes.findIndex(r => r.to === location.pathname);
    if (idx !== -1) setActiveIndex(idx);
  }, [location.pathname]);

  // Scroll nav
  let scrollTimeout = null;
  const handleScroll = useCallback((e) => {
    if (scrollTimeout) return;
    const delta = e.deltaY > 0 ? 1 : -1;
    let newIndex = activeIndex + delta;
    newIndex = Math.max(0, Math.min(routes.length - 1, newIndex));
    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
      navigate(routes[newIndex].to);
    }
    scrollTimeout = setTimeout(() => { scrollTimeout = null; }, 200);
  }, [activeIndex, navigate]);

  return (
    <div className={`sidebar ${isOpen ? "open" : "closed"}`} onWheel={handleScroll}>
      <div className="sidebar-content d-flex flex-column">
        {/* Header */}
        <div className="sidebar-header text-center p-3 border-bottom">
          <FaFutbol size={32} className="text-primary" />
          {isOpen && <h4 className="text-white mt-2">Liga Amateur</h4>}
        </div>

        {/* Menu */}
        <nav className="nav flex-column mt-4">
          {routes.map(({ id, to, Icon, label }, idx) => (
            <NavLink
              key={id}
              to={to}
              end={to === "/"}
              className={`nav-link text-light py-3 ${idx === activeIndex ? "active" : ""}`}
              onClick={() => setActiveIndex(idx)}
              {...(!isOpen && {
                "data-bs-toggle": "tooltip",
                "data-bs-placement": "right",
                title: label
              })}
            >
              <Icon size={20} />
              {isOpen && <span className="ms-2">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* When open: show selector + config button */}
        {isOpen && (
          <div className="mt-auto p-3">
            <div className="form-group mb-3">
              <label htmlFor="ligaSelector" className="text-light mb-1">Liga:</label>
              <select
                id="ligaSelector"
                className="form-select bg-dark text-light border-secondary"
                value={currentDiv}
                onChange={e => setCurrentDiv(Number(e.target.value))}
              >
                {divisions.map((name,i) => (
                  <option key={i} value={i}>{name}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setShowConfig(true)}
              className="btn btn-outline-light w-100"
            >
              <FaCog className="me-2" />
              Configuración
            </button>
          </div>
        )}

        {/* When closed: show league & config icons at bottom */}
        {!isOpen && (
          <div className="sidebar-footer mt-auto">
            <FaListUl
              size={24}
              className="footer-icon text-light"
              data-bs-toggle="tooltip"
              data-bs-placement="right"
              title="Ligas"
              onClick={() => {}}
            />
            <FaCog
              size={24}
              className="footer-icon text-light"
              data-bs-toggle="tooltip"
              data-bs-placement="right"
              title="Configuración"
              onClick={() => setShowConfig(true)}
            />
          </div>
        )}
      </div>

      {/* Toggle */}
      <button
        className={`toggle-sidebar-btn ${isOpen ? "open" : "closed"}`}
        onClick={onToggle}
      >
        {isOpen ? <FaChevronLeft /> : <FaChevronRight />}
      </button>

      {showConfig && <ConfigModal onClose={() => setShowConfig(false)} />}
    </div>
  );
}
