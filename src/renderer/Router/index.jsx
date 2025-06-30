import React, { lazy, Suspense } from 'react';
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  Outlet,
  Navigate
} from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

import MainLayout from '../components/MainLayout';
import ErrorPage from '../pages/ErrorPage';

// Context y ruta protegida
import { AuthProvider } from '../../contexts/AuthContext';
import ProtectedRoute from '../ProtectedRoute';

// Páginas lazy-loaded
const Home        = lazy(() => import('../pages/Home'));
const Calendario  = lazy(() => import('../pages/Calendario'));
const Equipos     = lazy(() => import('../pages/Equipos'));
const Clasificacion = lazy(() => import('../pages/Clasificacion'));
const Partidos    = lazy(() => import('../pages/Partidos'));
const Editar      = lazy(() => import('../pages/Editar'));
const Login       = lazy(() => import('../pages/Login'));
const Signup      = lazy(() => import('../pages/Signup'));

// Animaciones y Suspense
const PageWrapper = ({ children }) => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

const LazyPage = (Element) => (
  <Suspense fallback={<div>Cargando...</div>}>
    <PageWrapper>{Element}</PageWrapper>
  </Suspense>
);

export const router = createBrowserRouter(
  createRoutesFromElements(
    // Agrupamos todo bajo AuthProvider
   <Route>

      {/* Rutas públicas */}
      <Route path="/login"  element={LazyPage(<Login />)} />
      <Route path="/signup" element={LazyPage(<Signup />)} />

      {/* Rutas protegidas */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
        errorElement={<ErrorPage />}
      >
        <Route index                element={LazyPage(<Home />)} />
        <Route path="calendario"    element={LazyPage(<Calendario />)} />
        <Route path="equipos"       element={LazyPage(<Equipos />)} />
        <Route path="clasificacion" element={LazyPage(<Clasificacion />)} />
        <Route path="partidos"      element={LazyPage(<Partidos />)} />
        <Route path="editar"        element={LazyPage(<Editar />)} />
        <Route path="*"             element={<ErrorPage />} />
      </Route>
    </Route>
  )
);
