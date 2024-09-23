import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Equipos from './pages/Equipos';
import Jugadores from './pages/Jugadores';
import Calendario from './pages/Calendario';
import Resultados from './pages/Resultados';
import Coordinacion from './pages/Coordinacion';
import Inscripciones from './pages/Inscripciones';
import Reportes from './pages/Reportes';

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/equipos" element={<Equipos />} />
        <Route path="/jugadores" element={<Jugadores />} />
        <Route path="/calendario" element={<Calendario />} />
        <Route path="/resultados" element={<Resultados />} />
        <Route path="/coordinacion" element={<Coordinacion />} />
        <Route path="/inscripciones" element={<Inscripciones />} />
        <Route path="/reportes" element={<Reportes />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
