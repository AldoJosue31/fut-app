import React from 'react';
import {
  CDBSidebar,
  CDBSidebarContent,
  CDBSidebarFooter,
  CDBSidebarHeader,
  CDBSidebarMenu,
  CDBSidebarMenuItem,
} from 'cdbreact';
import { Nav } from 'react-bootstrap';

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
           <Nav.Link href="/equipos" activeClassName="activeClicked">
            <CDBSidebarMenuItem icon="users">Equipos</CDBSidebarMenuItem>
           </Nav.Link>
           <Nav.Link href="/jugadores" activeClassName="activeClicked">
            <CDBSidebarMenuItem icon="user">Jugadores</CDBSidebarMenuItem>
           </Nav.Link>
           <Nav.Link href="/calendario" activeClassName="activeClicked">
            <CDBSidebarMenuItem icon="calendar-alt">Calendario</CDBSidebarMenuItem>
           </Nav.Link>
           <Nav.Link href="/resultados" activeClassName="activeClicked">
            <CDBSidebarMenuItem icon="trophy">Resultados</CDBSidebarMenuItem>
           </Nav.Link>
           <Nav.Link href="/equipos" activeClassName="activeClicked">
            <CDBSidebarMenuItem icon="handshake">Coordinación</CDBSidebarMenuItem>
           </Nav.Link>
           <Nav.Link href="/equipos" activeClassName="activeClicked">
            <CDBSidebarMenuItem icon="edit">Inscripciones</CDBSidebarMenuItem>
           </Nav.Link>
           <Nav.Link href="/equipos" activeClassName="activeClicked">
            <CDBSidebarMenuItem icon="file-alt">Reportes</CDBSidebarMenuItem>
           </Nav.Link>
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
