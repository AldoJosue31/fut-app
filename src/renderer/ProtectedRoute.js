// src/renderer/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // 1) Si no hay conexión, forzamos logout → login
  if (!window.navigator.onLine) {
    return <Navigate to="/login" replace />;
  }

  // 2) Mientras rehidrata la sesión, no renderiza nada
  if (loading) return null;

  // 3) Si hay usuario, renderiza el contenido; sino redirige al login
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
