import React from 'react';
import {
  CDBSidebar,
  CDBSidebarContent,
  CDBSidebarFooter,
  CDBSidebarHeader,
  CDBSidebarMenu,
  CDBSidebarMenuItem,
} from 'cdbreact';
import { NavLink } from 'react-router-dom';

function Sidebar() {
  return (
    <div
      style={{ display: 'flex', height: '100vh', overflow: 'scroll initial' }}
    >
      <CDBSidebar textColor="#fff" backgroundColor="#333">
        <CDBSidebarHeader prefix={<i className="fa fa-bars fa-large" />}>
          <a
            href="/"
            className="text-decoration-none"
            style={{ color: 'inherit' }}
          >
            APP-FUT
          </a>
        </CDBSidebarHeader>

        <CDBSidebarContent className="sidebar-content">
          <CDBSidebarMenu>
            <NavLink to="/equipos" className={({ isActive }) => isActive ? "activeClicked" : undefined}>
              <CDBSidebarMenuItem icon="users">Equipos</CDBSidebarMenuItem>
            </NavLink>
            <NavLink to="/jugadores" className={({ isActive }) => isActive ? "activeClicked" : undefined}>
              <CDBSidebarMenuItem icon="user">Jugadores</CDBSidebarMenuItem>
            </NavLink>
            <NavLink to="/calendario" className={({ isActive }) => isActive ? "activeClicked" : undefined}>
              <CDBSidebarMenuItem icon="calendar-alt">Calendario</CDBSidebarMenuItem>
            </NavLink>
            <NavLink to="/resultados" className={({ isActive }) => isActive ? "activeClicked" : undefined}>
              <CDBSidebarMenuItem icon="trophy">Resultados</CDBSidebarMenuItem>
            </NavLink>
            <NavLink to="/coordinacion" className={({ isActive }) => isActive ? "activeClicked" : undefined}>
              <CDBSidebarMenuItem icon="handshake">Coordinación</CDBSidebarMenuItem>
            </NavLink>
            <NavLink to="/inscripciones" className={({ isActive }) => isActive ? "activeClicked" : undefined}>
              <CDBSidebarMenuItem icon="edit">Inscripciones</CDBSidebarMenuItem>
            </NavLink>
            <NavLink to="/reportes" className={({ isActive }) => isActive ? "activeClicked" : undefined}>
              <CDBSidebarMenuItem icon="file-alt">Reportes</CDBSidebarMenuItem>
            </NavLink>
          </CDBSidebarMenu>
        </CDBSidebarContent>

        <CDBSidebarFooter style={{ textAlign: 'center' }}>
          <div
            style={{
              padding: '20px 5px',
            }}
          >
            Sidebar Footer
          </div>
        </CDBSidebarFooter>
      </CDBSidebar>
    </div>
  );
}

export default Sidebar;
