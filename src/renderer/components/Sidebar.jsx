import React, { useState, useMemo } from 'react';
import {
  CDBSidebar,
  CDBSidebarContent,
  CDBSidebarFooter,
  CDBSidebarHeader,
  CDBSidebarMenu,
  CDBSidebarMenuItem,
} from 'cdbreact';
import { NavLink } from 'react-router-dom';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';

const routes = [
  { to: '/', icon: 'fas fa-home', label: 'Inicio', end: true },
  { to: '/equipos', icon: 'fas fa-calendar-alt', label: 'Equipos' },
  { to: '/clasificacion', icon: 'fas fa-list-ol', label: 'Clasificación' },
  { to: '/editar', icon: 'fas fa-edit', label: 'Editar' },
  { to: '/partidos', icon: 'fas fa-futbol', label: 'Partidos' },
  { to: '/calendario', icon: 'fas fa-calendar-alt', label: 'Calendario' },
];

function Sidebar() {
  const [division, setDivision] = useState('Primera');

  const handleToggleDivision = () => {
    setDivision((prev) => (prev === 'Primera' ? 'Segunda' : 'Primera'));
  };

  const menuItems = useMemo(
    () =>
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
            textDecoration: 'none',
          })}
        >
          <CDBSidebarMenuItem icon={icon} iconType="solid">
            {label}
          </CDBSidebarMenuItem>
        </NavLink>
      )),
    [],
  );

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'auto' }}>
      <CDBSidebar textColor="#b0b0b0" backgroundColor="#444343">
        <CDBSidebarHeader prefix={<i className="fa fa-bars fa-large" />}>
          <NavLink to="/" className="text-decoration-none" style={{ color: '#fff', fontSize: '1.2em', fontWeight: 'bold' }}>
            Nombre
          </NavLink>
        </CDBSidebarHeader>

        <CDBSidebarContent className="sidebar-content">
          <CDBSidebarMenu>{menuItems}</CDBSidebarMenu>
        </CDBSidebarContent>

        <CDBSidebarFooter style={{ textAlign: 'center', padding: '10px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#5a5a5a',
              borderRadius: '5px',
              padding: '5px 10px',
            }}
          >
            <button
              onClick={handleToggleDivision}
              style={{
                background: '#b0b0b0',
                border: 'none',
                borderRadius: '3px',
                padding: '5px 15px',
                marginRight: '10px',
                cursor: 'pointer',
              }}
            >
              <FaArrowLeft size={20} />
            </button>
            <span style={{ color: '#fff' }}>{division}</span>
            <button
              onClick={handleToggleDivision}
              style={{
                background: '#b0b0b0',
                border: 'none',
                borderRadius: '3px',
                padding: '5px 15px',
                marginLeft: '10px',
                cursor: 'pointer',
              }}
            >
              <FaArrowRight size={20} />
            </button>
          </div>
        </CDBSidebarFooter>
      </CDBSidebar>
    </div>
  );
}

export default React.memo(Sidebar);
