// src/components/MainLayout.jsx
import React, { useState, useRef, useEffect } from 'react';
import Sidebar from './Sidebar';
import CurrentRouteLogger from './CurrentRouteLogger';
import { Outlet } from 'react-router-dom';

const MainLayout = () => {
  // Inicia el sidebar cerrado por defecto
  const [isOpen, setIsOpen] = useState(false);
  const mainRef = useRef(null);

  // Efecto para cerrar el sidebar al hacer clic fuera de él (en el contenido)
  useEffect(() => {
    function handleClickOutside(event) {
      if (isOpen && mainRef.current && mainRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const contentStyle = {
    marginLeft: isOpen ? '240px' : '70px', // Ajusta según el ancho de tu sidebar abierto/cerrado
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
        onToggle={() => setIsOpen(open => !open)}
      />

      <main ref={mainRef} style={contentStyle}>
        <Outlet />
      </main>
    </>
  );
};

export default MainLayout;
