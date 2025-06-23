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

import ConfigModal from './ConfigModal';
import '../styles/styles.css';

const routes = [
  { to: '/', icon: 'fas fa-home', label: 'Inicio', end: true },
  { to: '/equipos', icon: 'fas fa-users', label: 'Equipos' },
  { to: '/clasificacion', icon: 'fas fa-list-ol', label: 'Clasificación' },
  { to: '/editar', icon: 'fas fa-edit', label: 'Editar' },
  { to: '/partidos', icon: 'fas fa-futbol', label: 'Partidos' },
  { to: '/calendario', icon: 'fas fa-calendar-alt', label: 'Calendario' },
];

export default function Sidebar() {
  const [divisions, setDivisions]       = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [collapsed, setCollapsed]       = useState(true);
  const [showConfig, setShowConfig]     = useState(false);

  // CRUD Divisiones
  const [newName, setNewName]   = useState('');
  const [editId, setEditId]     = useState(null);
  const [editName, setEditName] = useState('');

  // Carga divisiones al montar
  useEffect(() => {
    (async () => {
      const data = await getDivisions();
      setDivisions(data);
      const saved = localStorage.getItem('division');
      const idx   = data.findIndex(d => d.name === saved);
      if (idx >= 0) setCurrentIndex(idx);
    })();
  }, []);

  // Persistir división seleccionada
  useEffect(() => {
    const cur = divisions[currentIndex]?.name;
    if (cur) {
      localStorage.setItem('division', cur);
      window.dispatchEvent(new Event('divisionChange'));
    }
  }, [currentIndex, divisions]);

  const refreshDivs = async () => setDivisions(await getDivisions());
  const handleAddDivision = async () => {
    if (!newName.trim()) return;
    await addDivision({ name: newName });
    setNewName('');
    refreshDivs();
  };
  const startEditDivision = d => { setEditId(d.id); setEditName(d.name); };
  const handleUpdateDivision = async () => {
    if (!editName.trim()) return;
    await updateDivision(editId, { name: editName });
    setEditId(null); setEditName('');
    refreshDivs();
  };
  const handleDeleteDivision = async id => {
    await deleteDivision(id);
    refreshDivs();
  };

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
  , []);

  return (
    <>
      <div style={{ display: 'flex', height: '100vh', overflow: 'auto' }}>
        <CDBSidebar collapsed={collapsed} textColor="#b0b0b0" backgroundColor="#444343">
          <CDBSidebarHeader
            prefix={
              <FaBars
                style={{ cursor: 'pointer' }}
                onClick={() => setCollapsed(!collapsed)}
              />
            }
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
              display: 'flex', alignItems: 'center',
              background: '#5a5a5a', borderRadius: '5px', padding: '5px 10px'
            }}>
              <button
                onClick={() => setCurrentIndex(i => (i - 1 + divisions.length) % divisions.length)}
                className="btn text"
              ><FaArrowLeft size={20}/></button>
              <span style={{ color: '#fff', fontWeight: '500', margin: '0 10px' }}>
                {divisions[currentIndex]?.name || 'Cargando...'}
              </span>
              <button
                onClick={() => setCurrentIndex(i => (i + 1) % divisions.length)}
                className="btn text"
              ><FaArrowRight size={20}/></button>
              <button
                onClick={() => setShowConfig(true)}
                style={{ background: 'none', border: 'none', color: '#b0b0b0', marginLeft: '10px', cursor: 'pointer' }}
                title="Configuración"
              ><FaCog size={20}/></button>
            </div>
          </CDBSidebarFooter>
        </CDBSidebar>
      </div>

      {showConfig && <ConfigModal onClose={() => setShowConfig(false)} />}
    </>
  );
}
