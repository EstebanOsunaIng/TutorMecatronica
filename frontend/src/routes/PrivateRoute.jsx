import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function PrivateRoute({ children }) {
  const { user, authReady } = useAuth();
  if (!authReady) {
    return <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-300">Validando sesion...</div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
