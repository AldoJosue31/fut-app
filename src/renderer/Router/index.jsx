// src/renderer/router/index.jsx
import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

import ProtectedRoute from '../ProtectedRoute';
import MainLayout     from '../components/MainLayout';
import ErrorPage      from '../pages/ErrorPage';
import FootballLoader from '../components/FootballLoader';

const Login         = lazy(() => import('../pages/Login'));
const Signup        = lazy(() => import('../pages/Signup'));
const Home          = lazy(() => import('../pages/Home'));
const Calendario    = lazy(() => import('../pages/Calendario'));
const Equipos       = lazy(() => import('../pages/Equipos'));
const Clasificacion = lazy(() => import('../pages/Clasificacion'));
const Partidos      = lazy(() => import('../pages/Partidos'));
const Editar        = lazy(() => import('../pages/Editar'));

const PageWrapper = ({ children }) => {
  const loc = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={loc.pathname}
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

const Lazy = (Comp) => (
  <Suspense fallback={<FootballLoader />}>
    <PageWrapper>{Comp}</PageWrapper>
  </Suspense>
);

export default function AppRouter() {
  return (
    <Routes>
      {/* raíz → login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* públicas */}
      <Route path="/login"  element={Lazy(<Login />)} />
      <Route path="/signup" element={Lazy(<Signup />)} />

      {/* protegidas */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
        errorElement={<ErrorPage />}
      >
        <Route index                element={Lazy(<Home />)} />
        <Route path="calendario"    element={Lazy(<Calendario />)} />
        <Route path="equipos"       element={Lazy(<Equipos />)} />
        <Route path="clasificacion" element={Lazy(<Clasificacion />)} />
        <Route path="partidos"      element={Lazy(<Partidos />)} />
        <Route path="editar"        element={Lazy(<Editar />)} />
      </Route>

      {/* fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
