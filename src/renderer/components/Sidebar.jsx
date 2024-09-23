import React from 'react';
import { Navbar, Nav } from 'react-bootstrap';

const Sidebar = () => {
  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="d-flex flex-column vh-100 p-3" style={{ width: '250px' }}>
      <Navbar.Brand href="/">Liga Fútbol 5</Navbar.Brand>
      <Nav className="flex-column">
        <Nav.Link href="/equipos">Equipos</Nav.Link>
        <Nav.Link href="/jugadores">Jugadores</Nav.Link>
        <Nav.Link href="/calendario">Calendario</Nav.Link>
        <Nav.Link href="/resultados">Resultados</Nav.Link>
        <Nav.Link href="/coordinacion">Coordinación</Nav.Link>
        <Nav.Link href="/inscripciones">Inscripciones</Nav.Link>
        <Nav.Link href="/reportes">Reportes</Nav.Link>
      </Nav>
    </Navbar>
  );
};

export default Sidebar;
