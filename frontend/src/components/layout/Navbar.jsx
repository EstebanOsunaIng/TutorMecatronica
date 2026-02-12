import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  ArrowDown,
  ArrowUp,
  Bell,
  BellOff,
  ChevronDown,
  Crown,
  LogOut,
  MinusCircle,
  Menu,
  Moon,
  PlusCircle,
  RefreshCcw,
  Settings,
  Sun,
  Trash2,
  TrendingDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useNotifications } from '../../context/NotificationContext.jsx';

const settingsByRole = {
  STUDENT: '/student/settings',
  TEACHER: '/teacher/settings',
  ADMIN: '/admin/settings'
};

const roleLabels = {
  STUDENT: 'Estudiante',
  TEACHER: 'Docente',
  ADMIN: 'Admin'
};

export default function Navbar({ onOpenSidebar = () => {} }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, isMuted, toggleMuted, markRead, markAllRead, hasNew } = useNotifications();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [hasAvatarError, setHasAvatarError] = useState(false);
  const profileMenuRef = useRef(null);
  const notificationsMenuRef = useRef(null);

  const isStudent = user?.role === 'STUDENT';
  const logoSrc = theme === 'dark' ? '/assets/universitaria-logo-on-dark.png' : '/assets/universitaria-logo-on-light.png';
  const avatarSrc = user?.profilePhotoUrl || user?.avatarUrl || user?.photoUrl || '';
  const userName = user?.name || 'Usuario';
  const userNameDisplay = userName.toUpperCase();
  const userRole = roleLabels[user?.role] || 'Usuario';

  const userInitials = useMemo(() => {
    const parts = userName
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (!parts.length) return 'U';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }, [userName]);

  useEffect(() => {
    setHasAvatarError(false);
  }, [avatarSrc]);

  const notificationsCount = unreadCount;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
      if (notificationsMenuRef.current && !notificationsMenuRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleGoToSettings = () => {
    setIsProfileMenuOpen(false);
    navigate(settingsByRole[user?.role] || '/');
  };

  const handleLogout = () => {
    setIsProfileMenuOpen(false);
    logout();
  };

  const notificationVisuals = (type) => {
    switch (type) {
      case 'RANKING_SUBIO':
        return { Icon: ArrowUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
      case 'RANKING_BAJO':
        return { Icon: ArrowDown, color: 'text-rose-500', bg: 'bg-rose-500/10' };
      case 'INSIGNIA_OBTENIDA':
        return { Icon: Award, color: 'text-amber-500', bg: 'bg-amber-500/10' };
      case 'MODULO_CREADO':
        return { Icon: PlusCircle, color: 'text-sky-500', bg: 'bg-sky-500/10' };
      case 'MODULO_EDITADO':
        return { Icon: RefreshCcw, color: 'text-sky-500', bg: 'bg-sky-500/10' };
      case 'MODULO_ELIMINADO':
        return { Icon: MinusCircle, color: 'text-rose-500', bg: 'bg-rose-500/10' };
      case 'TOP_1':
        return { Icon: Crown, color: 'text-amber-500', bg: 'bg-amber-500/10' };
      case 'FUE_SUPERADO':
        return { Icon: TrendingDown, color: 'text-slate-500', bg: 'bg-slate-500/10' };
      default:
        return { Icon: Bell, color: 'text-slate-500', bg: 'bg-slate-500/10' };
    }
  };

  return (
    <header className="sticky top-0 z-40 h-[72px] border-b border-cyan-100/80 bg-sky-50/80 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 sm:px-6">
      <div className="grid h-full grid-cols-[auto_1fr_auto] items-center gap-4">
        <button
          onClick={onOpenSidebar}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:hover:bg-slate-800 md:hidden"
          aria-label="Abrir o cerrar menu"
          type="button"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden h-10 w-10 md:block" aria-hidden="true" />

        <div className="flex justify-center">
          <img src={logoSrc} alt="Logo UD" className="h-11 w-auto object-contain" />
        </div>

        <div className="flex items-center justify-end gap-2 sm:gap-3">
          {isStudent && (
            <button
              type="button"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-700 transition hover:bg-amber-100 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200 dark:hover:bg-amber-500/20"
              aria-label="Insignias"
            >
              <Award className="h-5 w-5" />
              <span className="absolute -right-1.5 -top-1.5 min-w-5 rounded-full border border-amber-300/50 bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold leading-none text-amber-100 dark:bg-slate-800">
                {user?.badgesCount || 0}
              </span>
            </button>
          )}

          <div className="relative" ref={notificationsMenuRef}>
            <button
              type="button"
              onClick={() => setIsNotificationsOpen((prev) => !prev)}
              className={`relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:hover:bg-slate-800 ${
                hasNew && !isMuted ? 'animate-bounce' : ''
              }`}
              aria-label="Notificaciones"
            >
              {isMuted ? <BellOff className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
              {notificationsCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 min-w-5 rounded-full bg-brand-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                  {notificationsCount}
                </span>
              )}
            </button>
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-100">
                  <span>Notificaciones</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={markAllRead}
                      className="rounded-full px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Marcar todo
                    </button>
                    <button
                      type="button"
                      onClick={toggleMuted}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                        isMuted
                          ? 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                          : 'bg-sky-500 text-white'
                      }`}
                    >
                      {isMuted ? 'Silenciadas' : 'Silenciar'}
                    </button>
                  </div>
                </div>
                <div className="max-h-[320px] overflow-y-auto">
                  {notifications.length === 0 && (
                    <div className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                      No tienes notificaciones nuevas.
                    </div>
                  )}
                  {notifications.map((item) => {
                    const { Icon, color, bg } = notificationVisuals(item.type);
                    return (
                    <button
                      type="button"
                      key={item._id}
                      onClick={() => markRead(item._id)}
                      className={`w-full border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60 ${
                        item.isRead ? 'opacity-80' : 'bg-sky-50/40 dark:bg-sky-500/5'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full ${bg}`}>
                          <Icon className={`h-4 w-4 ${color}`} />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{item.title}</div>
                          <div className="mt-1 text-xs text-slate-600 dark:text-slate-300 line-clamp-2">{item.message}</div>
                          <div className="mt-2 text-[11px] uppercase tracking-wider text-slate-400">
                            {new Date(item.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                  })}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:hover:bg-slate-800"
            aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            type="button"
          >
            {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>

          <div className="hidden max-w-[180px] flex-col text-right sm:flex">
            <span className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{userNameDisplay}</span>
            <span className="truncate text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{userRole}</span>
          </div>

          <div className="relative" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white p-1 pr-2 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/80 dark:hover:bg-slate-800"
              aria-label="Abrir menu de perfil"
            >
              {avatarSrc && !hasAvatarError ? (
                <img
                  src={avatarSrc}
                  alt={`Avatar de ${userName}`}
                  onError={() => setHasAvatarError(true)}
                  className="h-8 w-8 rounded-full border border-slate-200 object-cover dark:border-slate-700"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">
                  {userInitials}
                </div>
              )}
              <ChevronDown className="h-4 w-4 text-slate-500 dark:text-slate-300" />
            </button>

            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                <button
                  type="button"
                  onClick={handleGoToSettings}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  <Settings className="h-4 w-4" />
                  Ajustes
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-500/20"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar sesion
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
  const notificationVisuals = (type) => {
    switch (type) {
      case 'RANKING_SUBIO':
        return { Icon: ArrowUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
      case 'RANKING_BAJO':
        return { Icon: ArrowDown, color: 'text-rose-500', bg: 'bg-rose-500/10' };
      case 'INSIGNIA_OBTENIDA':
        return { Icon: Award, color: 'text-amber-500', bg: 'bg-amber-500/10' };
      case 'MODULO_CREADO':
        return { Icon: PlusCircle, color: 'text-sky-500', bg: 'bg-sky-500/10' };
      case 'MODULO_ELIMINADO':
        return { Icon: Trash2, color: 'text-slate-500', bg: 'bg-slate-500/10' };
      case 'TOP_1':
        return { Icon: Crown, color: 'text-amber-500', bg: 'bg-amber-500/10' };
      default:
        return { Icon: Bell, color: 'text-slate-500', bg: 'bg-slate-500/10' };
    }
  };
