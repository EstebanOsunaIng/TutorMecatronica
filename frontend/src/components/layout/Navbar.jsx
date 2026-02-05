import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useNotifications } from '../../context/NotificationContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { notifications } = useNotifications();

  return (
    <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 py-4 backdrop-blur">
      <div>
        <p className="text-sm text-slate-400">Hola,</p>
        <h2 className="text-xl font-bold text-white">{user?.name}</h2>
      </div>
      <div className="flex items-center gap-4">
        <div className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-200">
          Insignias: {user?.badgesCount || 0}
        </div>
        <div className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-200">
          Notificaciones: {notifications.length}
        </div>
        <button onClick={toggleTheme} className="rounded-lg bg-slate-800 px-3 py-2 text-xs">
          {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
        </button>
        <button onClick={logout} className="rounded-lg bg-red-500/20 px-3 py-2 text-xs text-red-200">
          Salir
        </button>
      </div>
    </div>
  );
}
