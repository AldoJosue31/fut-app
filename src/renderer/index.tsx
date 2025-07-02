import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, useNavigate } from 'react-router-dom';

import AppRouter   from './router';               // ahora sin BrowserRouter
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import FootballLoader             from './components/FootballLoader';
import ErrorBoundary              from './components/ErrorBoundary';
import './styles/styles.css';

// —————————————————————————————————————————————————
// NetworkMonitor (ahora SÍ dentro de <BrowserRouter>)
// —————————————————————————————————————————————————
const NetworkMonitor: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const navigate    = useNavigate();
  const { signOut } = useAuth();
  const [online, setOnline] = useState(window.navigator.onLine);

  useEffect(() => {
    let tid: number;

    const goOffline = () => {
      setOnline(false);
      // tras 15s sin conexión, desloguea y redirige a /login
      tid = window.setTimeout(async () => {
        if (!navigator.onLine) {
          await signOut();
          navigate('/login', { replace: true });
        }
      }, 15000);
    };

    const goOnline = () => {
      setOnline(true);
      clearTimeout(tid);
    };

    window.addEventListener('offline', goOffline);
    window.addEventListener('online',  goOnline);

    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online',  goOnline);
      clearTimeout(tid);
    };
  }, [navigate, signOut]);

  return (
    <>
      {!online && (
        <div style={{
          position:       'fixed',
          top:            0, left: 0, right: 0,
          backgroundColor:'#DC2626',
          color:          '#FFF',
          padding:        '0.75rem',
          textAlign:      'center',
          zIndex:         9999,
          fontWeight:     '600',
        }}>
          ⚠️ Sin conexión a Internet. Reintentando…
        </div>
      )}
      <div style={{ paddingTop: !online ? '3rem' : 0 }}>
        {children}
      </div>
    </>
  );
};

// —————————————————————————————————————————————————
// Loader mientras se rehidrata la sesión
// —————————————————————————————————————————————————
const AppWithAuthLoader: React.FC = () => {
  const { loading } = useAuth();
  return loading ? <FootballLoader /> : <AppRouter />;
};

// —————————————————————————————————————————————————
// Render principal
// —————————————————————————————————————————————————
const container = document.getElementById('root')!;
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <ErrorBoundary>
          <NetworkMonitor>
            <AppWithAuthLoader />
          </NetworkMonitor>
        </ErrorBoundary>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);

// Comunicación con preload de Electron
window.electron.ipcRenderer.once('ipc-example', arg => console.log(arg));
window.electron.ipcRenderer.sendMessage('ipc-example', ['ping']);
