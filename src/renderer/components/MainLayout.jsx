// src/components/MainLayout.jsx
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import CurrentRouteLogger from "./CurrentRouteLogger";
import { Outlet } from 'react-router-dom';

const MainLayout = () => {
  const [isOpen, setIsOpen] = useState(true);

  const contentStyle = {
    marginLeft: '70px',                // Siempre 70px, contenido fijo
    transition: 'margin-left 0.3s ease-in-out',
    padding: '20px',
    backgroundColor: '#2D2D2D',
    color: 'white',
    minHeight: '100vh',
    overflow: 'auto',
  };

  return (
    <>
      <CurrentRouteLogger />

      <Sidebar
        isOpen={isOpen}
        onToggle={() => setIsOpen(o => !o)}
      />

      <main style={contentStyle}>
        <Outlet />
      </main>
    </>
  );
};

export default MainLayout;
