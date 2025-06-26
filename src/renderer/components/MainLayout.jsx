// src/components/MainLayout.jsx
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import CurrentRouteLogger from "./CurrentRouteLogger";
import { Outlet } from 'react-router-dom';

const MainLayout = () => {
  // Estado levantado aquí:
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // estilo dinámico para el contenido
  const contentStyle = {
    marginLeft: isSidebarOpen ? '250px' : '70px',
    transition: 'margin-left 0.3s ease-in-out',
    padding: '20px',
    backgroundColor: '#2D2D2D',
    color: 'white',
    height: '100vh',
    overflow: 'auto',
  };

  return (
    <div>
      <CurrentRouteLogger />
      <div>
        <Sidebar
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(o => !o)}
        />
        <div style={contentStyle}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
