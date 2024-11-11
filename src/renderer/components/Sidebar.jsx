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
import { FaHome, FaTable, FaEdit, FaCalendarAlt } from 'react-icons/fa';

function Sidebar() {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'scroll initial' }}>
      <CDBSidebar textColor="#b0b0b0" backgroundColor="#444343">
        <CDBSidebarHeader prefix={<i className="fa fa-bars fa-large" />}>
          <a
            href="/"
            className="text-decoration-none"
            style={{ color: '#fff', fontSize: '1.2em', fontWeight: 'bold' }}
          >
            Nombre
          </a>
        </CDBSidebarHeader>

        <CDBSidebarContent className="sidebar-content">
          <CDBSidebarMenu>
            <Nav.Link href="/inicio" style={{ color: 'inherit' }}>
              <CDBSidebarMenuItem icon={<FaHome />} iconType="solid">Inicio</CDBSidebarMenuItem>
            </Nav.Link>
            <Nav.Link href="/clasificacion" style={{ color: 'inherit' }}>
              <CDBSidebarMenuItem icon={<FaTable />} iconType="solid">Clasificación</CDBSidebarMenuItem>
            </Nav.Link>
            <Nav.Link href="/editar" style={{ color: 'inherit' }}>
              <CDBSidebarMenuItem icon={<FaEdit />} iconType="solid">Editar</CDBSidebarMenuItem>
            </Nav.Link>
            <Nav.Link href="/partidos" style={{ color: 'inherit' }}>
              <CDBSidebarMenuItem icon={<FaCalendarAlt />} iconType="solid">Partidos</CDBSidebarMenuItem>
            </Nav.Link>
          </CDBSidebarMenu>
        </CDBSidebarContent>

        <CDBSidebarFooter style={{ textAlign: 'center' }}>
          <div style={{ padding: '10px', fontSize: '0.9em', color: '#b0b0b0' }}>
            <span>Primera</span>
            <button
              style={{
                background: 'none',
                border: 'none',
                color: '#b0b0b0',
                marginLeft: '5px',
                fontSize: '1.2em',
              }}
            >
              ◀
            </button>
            <button
              style={{
                background: 'none',
                border: 'none',
                color: '#b0b0b0',
                marginLeft: '5px',
                fontSize: '1.2em',
              }}
            >
              ▶
            </button>
          </div>
        </CDBSidebarFooter>
      </CDBSidebar>
    </div>
  );
}

export default Sidebar;
