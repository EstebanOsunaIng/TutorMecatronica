import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { authApi } from '../api/auth.api.js';
import { useToast } from './ToastContext.jsx';

const AuthContext = createContext(null);
const IDLE_LIMIT_MS = 20 * 60 * 1000;
const IDLE_WARNING_MS = 19 * 60 * 1000;
const LOGOUT_REASON_KEY = 'auth:logout-reason';

export function AuthProvider({ children }) {
  const toast = useToast();
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  });
  const idleTimerRef = useRef(null);
  const idleWarningTimerRef = useRef(null);

  const login = async (email, password) => {
    const { data } = await authApi.login({ email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    sessionStorage.removeItem(LOGOUT_REASON_KEY);
    setUser(data.user);
  };

  const logout = (reason = 'manual') => {
    if (reason === 'inactive') {
      sessionStorage.setItem(LOGOUT_REASON_KEY, 'inactive');
    } else {
      sessionStorage.removeItem(LOGOUT_REASON_KEY);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);

    if (reason === 'inactive' && window.location.pathname !== '/login') {
      window.location.assign('/login');
    }
  };

  const register = async (payload) => {
    const { data } = await authApi.register(payload);
    return data;
  };

  useEffect(() => {
    const clearIdleTimer = () => {
      if (idleTimerRef.current) {
        window.clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      if (idleWarningTimerRef.current) {
        window.clearTimeout(idleWarningTimerRef.current);
        idleWarningTimerRef.current = null;
      }
    };

    if (!user) {
      clearIdleTimer();
      return undefined;
    }

    const scheduleIdleLogout = () => {
      clearIdleTimer();

      idleWarningTimerRef.current = window.setTimeout(() => {
        toast.warning('Sesion inactiva', 'Si no detectamos actividad en 1 minuto, se cerrara la sesión.');
      }, IDLE_WARNING_MS);

      idleTimerRef.current = window.setTimeout(() => {
        logout('inactive');
      }, IDLE_LIMIT_MS);
    };

    const onActivity = () => scheduleIdleLogout();

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((eventName) => window.addEventListener(eventName, onActivity, { passive: true }));
    scheduleIdleLogout();

    return () => {
      events.forEach((eventName) => window.removeEventListener(eventName, onActivity));
      clearIdleTimer();
    };
  }, [user, toast]);

  const value = useMemo(() => ({ user, setUser, login, logout, register }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
