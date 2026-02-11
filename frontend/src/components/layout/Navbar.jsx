import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, Bell, ChevronDown, LogOut, Menu, Moon, Settings, Sun } from 'lucide-react';
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
  const { notifications } = useNotifications();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [hasAvatarError, setHasAvatarError] = useState(false);
  const profileMenuRef = useRef(null);

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

  const notificationsCount = useMemo(() => {
    if (!user?.role) return notifications.length;
    return notifications.filter((notification) => {
      if (Array.isArray(notification.roles)) return notification.roles.includes(user.role);
      if (typeof notification.role === 'string') return notification.role === user.role;
      if (typeof notification.targetRole === 'string') return notification.targetRole === user.role;
      return true;
    }).length;
  }, [notifications, user?.role]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
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

          <button
            type="button"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:hover:bg-slate-800"
            aria-label="Notificaciones"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute -right-1.5 -top-1.5 min-w-5 rounded-full bg-brand-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
              {notificationsCount}
            </span>
          </button>

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
