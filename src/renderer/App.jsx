import React from 'react';
import Sidebar from './components/Sidebar';
import Routes from './Routes'; // Importa el archivo de rutas
import 'bootstrap/dist/css/bootstrap.min.css'; // Importa los estilos de Bootstrap

function App() {
  return (
    <div className="d-flex">
      <Sidebar />
      <div className="content p-4" style={{ flexGrow: 1 }}>
        <Routes />
      </div>
    </div>
  );
}

export default App;
