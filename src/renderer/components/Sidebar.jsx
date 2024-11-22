import React, { useState } from 'react';
import {
  CDBSidebar,
  CDBSidebarContent,
  CDBSidebarFooter,
  CDBSidebarHeader,
  CDBSidebarMenu,
  CDBSidebarMenuItem,
} from 'cdbreact';
import { Nav } from 'react-bootstrap';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';  // Usamos react-icons para las flechas

function Sidebar() {
  const [division, setDivision] = useState('Primera');

  const handlePrevious = () => {
    setDivision((prev) => (prev === 'Primera' ? 'Segunda' : 'Primera'));
  };

  const handleNext = () => {
    setDivision((prev) => (prev === 'Primera' ? 'Segunda' : 'Primera'));
  };

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
            <Nav.Link href="/" style={{ color: 'inherit' }}>
              <CDBSidebarMenuItem icon="fas fa-home" iconType="solid">Inicio</CDBSidebarMenuItem>
            </Nav.Link>
            <Nav.Link href="/clasificacion" style={{ color: 'inherit' }}>
              <CDBSidebarMenuItem icon="fas fa-list-ol" iconType="solid">Clasificación</CDBSidebarMenuItem>
            </Nav.Link>
            <Nav.Link href="/editar" style={{ color: 'inherit' }}>
              <CDBSidebarMenuItem icon="fas fa-edit" iconType="solid">Editar</CDBSidebarMenuItem>
            </Nav.Link>
            <Nav.Link href="/partidos" style={{ color: 'inherit' }}>
              <CDBSidebarMenuItem icon="fas fa-futbol" iconType="solid">Partidos</CDBSidebarMenuItem>
            </Nav.Link>
            <Nav.Link href="/calendario" style={{ color: 'inherit' }}>
              <CDBSidebarMenuItem icon="fas fa-calendar-alt" iconType="solid">Calendario</CDBSidebarMenuItem>
            </Nav.Link>
          </CDBSidebarMenu>
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
              onClick={handlePrevious}
              style={{
                background: '#b0b0b0',
                border: 'none',
                borderRadius: '3px',
                padding: '5px 15px',
                marginRight: '10px',
                cursor: 'pointer',
              }}
            >
              <FaArrowLeft size={20} />  {/* Flecha izquierda de react-icons */}
            </button>
            <span
              style={{
                color: '#fff'
              }}
            >
              {division}
            </span>
            <button
              onClick={handleNext}
              style={{
                background: '#b0b0b0',
                border: 'none',
                borderRadius: '3px',
                padding: '5px 15px',
                marginLeft: '10px',
                cursor: 'pointer',
              }}
            >
              <FaArrowRight size={20} />  {/* Flecha derecha de react-icons */}
            </button>
          </div>
        </CDBSidebarFooter>
      </CDBSidebar>
    </div>
  );
}

export default Sidebar;
