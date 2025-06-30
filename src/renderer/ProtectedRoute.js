import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';  // ajusta ruta si cambias ubicación

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Cargando...</div>;
  return user ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
