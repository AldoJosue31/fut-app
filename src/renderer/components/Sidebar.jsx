// src/renderer/components/Sidebar.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  CDBSidebar,
  CDBSidebarContent,
  CDBSidebarFooter,
  CDBSidebarHeader,
  CDBSidebarMenu,
  CDBSidebarMenuItem,
} from 'cdbreact';
import { NavLink } from 'react-router-dom';
import { FaArrowLeft, FaArrowRight, FaCog, FaBars } from 'react-icons/fa';
import {
  getDivisions,
  addDivision,
  updateDivision,
  deleteDivision,
} from '../services/divisionsService';
import '../styles/styles.css';

function Modal({ title, children, actions, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content config-modal">
        <div className="config-modal__header">
          <h2>{title}</h2>
          <button className="config-modal__close" onClick={onClose}>×</button>
        </div>
        <div className="config-modal__body">
          {children}
        </div>
        <div className="modal-actions">
          {actions}
        </div>
      </div>
    </div>
  );
}

const routes = [
  { to: '/', icon: 'fas fa-home', label: 'Inicio', end: true },
  { to: '/equipos', icon: 'fas fa-users', label: 'Equipos' },
  { to: '/clasificacion', icon: 'fas fa-list-ol', label: 'Clasificación' },
  { to: '/editar', icon: 'fas fa-edit', label: 'Editar' },
  { to: '/partidos', icon: 'fas fa-futbol', label: 'Partidos' },
  { to: '/calendario', icon: 'fas fa-calendar-alt', label: 'Calendario' },
];
const DEFAULT_LINEUP = { starters: 5, subs: 6 };


export default function Sidebar() {
  // ─── Estados generales ─────────────────────────────────────────────
  const [divisions, setDivisions]       = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [collapsed, setCollapsed]       = useState(true);
  const [showConfig, setShowConfig]     = useState(false);

  // ─── CRUD Divisiones ────────────────────────────────────────────────
  const [newName, setNewName]   = useState('');
  const [editId, setEditId]     = useState(null);
  const [editName, setEditName] = useState('');

  // ─── Configuración de plantilla (titulares/suplentes) ─────────────
  const [activeTab, setActiveTab] = useState('divisiones'); // pestañas
  const [templateConfig, setTemplateConfig] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('lineupConfig')) || {};
    } catch {
      return {};
    }
  });
  const currentDiv    = divisions[currentIndex]?.name;
  const currentSeason = localStorage.getItem('season') || 'Clausura 2025';
  const configKey     = `${currentDiv}-${currentSeason}`;

   // 1) persistir season si cambia en algún momento
 useEffect(() => {
   localStorage.setItem('season', currentSeason);
 }, [currentSeason]);

   // 2) reinicializar contadores al cambiar configKey
  useEffect(() => {
   const saved = JSON.parse(localStorage.getItem('lineupConfig')) || {};
   const cfg   = saved[configKey] || DEFAULT_LINEUP;
   setStartersCount(cfg.starters);
   setSubsCount(cfg.subs);
 }, [configKey]);

  const initial       = templateConfig[configKey] || { starters: 5, subs: 6 };
  const [startersCount, setStartersCount] = useState(initial.starters);
  const [subsCount,     setSubsCount]     = useState(initial.subs);

  // ─── Efectos de carga ───────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const data = await getDivisions();
      setDivisions(data);
      const saved = localStorage.getItem('division');
      const idx   = data.findIndex(d => d.name === saved);
      if (idx >= 0) setCurrentIndex(idx);
    })();
  }, []);

  useEffect(() => {
    // persistir división actual
    if (currentDiv) {
      localStorage.setItem('division', currentDiv);
      window.dispatchEvent(new Event('divisionChange'));
    }
  }, [currentDiv]);

  // ─── Funciones CRUD Divisiones ──────────────────────────────────────
  const refreshDivs = async () => {
    const data = await getDivisions();
    setDivisions(data);
  };

  const handleAddDivision = async () => {
    if (!newName.trim()) return;
    await addDivision({ name: newName });
    setNewName('');
    refreshDivs();
  };

  const startEditDivision = d => {
    setEditId(d.id);
    setEditName(d.name);
  };

  const handleUpdateDivision = async () => {
    if (!editName.trim()) return;
    await updateDivision(editId, { name: editName });
    setEditId(null);
    setEditName('');
    refreshDivs();
  };

  const handleDeleteDivision = async id => {
    await deleteDivision(id);
    refreshDivs();
  };

  // ─── Funciones Configuración Plantilla ─────────────────────────────
  const handleApplyConfig = () => {
    const updated = {
      ...templateConfig,
      [configKey]: { starters: startersCount, subs: subsCount }
    };
    setTemplateConfig(updated);
    localStorage.setItem('lineupConfig', JSON.stringify(updated));
       //  también guardamos la season para que currentSeason sea consistente
   localStorage.setItem('season', currentSeason);
    setShowConfig(false);
  };

  // ─── Render rutas ───────────────────────────────────────────────────
  const menuItems = useMemo(() =>
    routes.map(({ to, icon, label, end }) => (
      <NavLink
        key={to}
        to={to}
        end={end}
        className="text-decoration-none"
        style={({ isActive }) => ({
          display: 'flex',
          alignItems: 'center',
          color: isActive ? '#fff' : '#b0b0b0',
          textDecoration: 'none'
        })}
      >
        <CDBSidebarMenuItem icon={icon} iconType="solid">{label}</CDBSidebarMenuItem>
      </NavLink>
    ))
  , [routes]);

  return (
    <>
      <div style={{ display: 'flex', height: '100vh', overflow: 'auto' }}>
        <CDBSidebar collapsed={collapsed} textColor="#b0b0b0" backgroundColor="#444343">
          <CDBSidebarHeader
            prefix={<FaBars style={{ cursor: 'pointer' }} onClick={() => setCollapsed(!collapsed)} />}
          >
            {!collapsed && (
              <NavLink to="/" className="text-decoration-none" style={{ color: '#fff', fontWeight: 'bold' }}>
                Mi App
              </NavLink>
            )}
          </CDBSidebarHeader>

          <CDBSidebarContent className="sidebar-content">
            <CDBSidebarMenu>{menuItems}</CDBSidebarMenu>
          </CDBSidebarContent>

          <CDBSidebarFooter style={{ textAlign: 'center', padding: '10px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: '#5a5a5a',
              borderRadius: '5px',
              padding: '5px 10px'
            }}>
              <button onClick={() => setCurrentIndex(i => (i - 1 + divisions.length) % divisions.length)}
                className="btn text"><FaArrowLeft size={20}/></button>
              <span style={{ color: '#fff', fontWeight: '500', margin: '0 10px' }}>
                {currentDiv || 'Cargando...'}
              </span>
              <button onClick={() => setCurrentIndex(i => (i + 1) % divisions.length)}
                className="btn text"><FaArrowRight size={20}/></button>
              <button onClick={() => setShowConfig(true)}
                style={{ background: 'none', border: 'none', color: '#b0b0b0', marginLeft: '10px', cursor: 'pointer' }}
                title="Configuración"
              ><FaCog size={20}/></button>
            </div>
          </CDBSidebarFooter>
        </CDBSidebar>
      </div>

      {showConfig && (
        <Modal
          title="Configuración"
          onClose={() => setShowConfig(false)}
          actions={[
            <button key="apply" className="btn success" onClick={handleApplyConfig}>Aplicar cambios</button>,
            <button key="close" className="btn cancel" onClick={() => setShowConfig(false)}>Cerrar</button>
          ]}
        >
          {/* PESTAÑAS */}
          <div className="tabs">
            <button
              className={activeTab === 'divisiones' ? 'tab active-tab' : 'tab'}
              onClick={() => setActiveTab('divisiones')}
            >
              Divisiones
            </button>
            <button
              className={activeTab === 'plantilla' ? 'tab active-tab' : 'tab'}
              onClick={() => setActiveTab('plantilla')}
            >
              Plantilla
            </button>
          </div>

          {/* CONTENIDO PESTAÑAS */}
          {activeTab === 'divisiones' && (
            <>
              {/* --- Agregar División --- */}
              <section className="config-modal__new">
                <label>Nueva División</label>
                <div className="config-modal__new-input">
                  <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="Nombre..."
                  />
                  <button onClick={handleAddDivision} className="btn success">Agregar</button>
                </div>
              </section>

              {/* --- Lista Divisiones Existentes --- */}
              <section className="config-modal__list">
                <h3>Divisiones Existentes</h3>
                <ul>
                  {divisions.map(d => (
                    <li key={d.id} className="config-modal__item">
                      {editId === d.id ? (
                        <div className="config-modal__edit">
                          <input
                            className="config-modal__edit-input"
                            type="text"
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                          />
                          <button onClick={handleUpdateDivision} className="btn success">Guardar</button>
                          <button onClick={() => setEditId(null)} className="btn cancel">Cancelar</button>
                        </div>
                      ) : (
                        <div className="config-modal__display">
                          <span className="config-modal__name">{d.name}</span>
                          <div className="config-modal__actions">
                            <button onClick={() => startEditDivision(d)} className="btn text">Editar</button>
                            <button onClick={() => handleDeleteDivision(d.id)} className="btn text danger">Eliminar</button>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}

          {activeTab === 'plantilla' && (
            <section className="section">
              <h3>Plantilla: {currentDiv} / {currentSeason}</h3>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group">
                  <label>Titulares</label>
                  <input
                    type="number" min="1"
                    value={startersCount}
                    onChange={e => setStartersCount(+e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Suplentes</label>
                  <input
                    type="number" min="0"
                    value={subsCount}
                    onChange={e => setSubsCount(+e.target.value)}
                  />
                </div>
              </div>
            </section>
          )}
        </Modal>
      )}
    </>
  );
}
