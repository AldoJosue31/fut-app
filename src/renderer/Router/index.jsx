import React, { lazy, Suspense } from 'react';
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  Navigate,
} from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

import MainLayout    from '../components/MainLayout';
import ErrorPage     from '../pages/ErrorPage';
import ProtectedRoute from '../ProtectedRoute';

const Home         = lazy(() => import('../pages/Home'));
const Calendario   = lazy(() => import('../pages/Calendario'));
const Equipos      = lazy(() => import('../pages/Equipos'));
const Clasificacion= lazy(() => import('../pages/Clasificacion'));
const Partidos     = lazy(() => import('../pages/Partidos'));
const Editar       = lazy(() => import('../pages/Editar'));
const Login        = lazy(() => import('../pages/Login'));
const Signup       = lazy(() => import('../pages/Signup'));

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
const LazyPage = (Comp) => (
  <Suspense fallback={<div>Cargando...</div>}>
    <PageWrapper>{Comp}</PageWrapper>
  </Suspense>
);

export const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      {/* 1) Ruta raíz: redirect automático a /login */}
      <Route index element={<Navigate to="/login" replace />} />

      {/* 2) Rutas públicas */}
      <Route path="/login"  element={LazyPage(<Login />)} />
      <Route path="/signup" element={LazyPage(<Signup />)} />

      {/* 3) Rutas protegidas */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
        errorElement={<ErrorPage />}
      >
        {/* estas rutas van dentro de MainLayout */}
        <Route index                element={LazyPage(<Home />)} />
        <Route path="calendario"    element={LazyPage(<Calendario />)} />
        <Route path="equipos"       element={LazyPage(<Equipos />)} />
        <Route path="clasificacion" element={LazyPage(<Clasificacion />)} />
        <Route path="partidos"      element={LazyPage(<Partidos />)} />
        <Route path="editar"        element={LazyPage(<Editar />)} />
      </Route>

      {/* 4) Cualquier otra ruta al login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </>
  )
);
