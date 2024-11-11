// src/components/MainLayout.jsx
import React from 'react';
import Sidebar from './Sidebar';
import CurrentRouteLogger from "./CurrentRouteLogger"; 
import { Outlet } from 'react-router-dom';

const MainLayout = () => {
  return (
    <div>
      <CurrentRouteLogger />
      {  <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={{ flex: 1, padding: '20px', backgroundColor: '#2D2D2D', color: 'white'}}>
        <Outlet /> {/* Este es el espacio donde se cargarán las páginas */}
      </div>
    </div>}
    </div>
  
  );
};

export default MainLayout;
