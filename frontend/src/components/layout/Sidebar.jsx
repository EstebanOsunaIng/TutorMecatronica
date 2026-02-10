import React, { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  BookOpen,
  Edit3,
  Home,
  LogOut,
  Newspaper,
  Settings,
  Users,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

const roleItems = {
  STUDENT: [
    { to: '/student/dashboard', label: 'Inicio', icon: Home },
    { to: '/student/courses', label: 'Cursos', icon: BookOpen },
    { to: '/student/news', label: 'Noticias', icon: Newspaper },
    { to: '/student/settings', label: 'Ajustes', icon: Settings }
  ],
  TEACHER: [
    { to: '/teacher/dashboard', label: 'Inicio', icon: Home },
    { to: '/teacher/students', label: 'Estudiantes', icon: Users },
    { to: '/teacher/news', label: 'Noticias', icon: Newspaper },
    { to: '/teacher/modules', label: 'Edicion de modulos', icon: Edit3 },
    { to: '/teacher/settings', label: 'Ajustes', icon: Settings }
  ],
  ADMIN: [
    { to: '/admin/dashboard', label: 'Inicio', icon: Home },
    { to: '/admin/users', label: 'Registro de usuarios', icon: Users },
    { to: '/admin/modules', label: 'Gestion de modulos', icon: Edit3 },
    { to: '/admin/stats', label: 'Estadisticas', icon: BarChart3 },
    { to: '/admin/settings', label: 'Ajustes', icon: Settings }
  ]
};

export default function Sidebar({
  isCollapsed,
  isMobileOpen,
  onCloseMobile
}) {
  const { user, logout } = useAuth();

  const items = useMemo(() => {
    if (!user?.role) return [];
    return roleItems[user.role] || [];
  }, [user?.role]);

  const showLabels = isMobileOpen || !isCollapsed;

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-black/60 transition-opacity md:hidden ${
          isMobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onCloseMobile}
        aria-hidden={!isMobileOpen}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-screen flex-col border-r border-slate-800 bg-slate-950/95 py-6 transition-all duration-300 md:sticky md:top-0 md:h-screen md:translate-x-0 md:pb-6 md:pt-[92px] ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${
          isCollapsed ? 'md:w-20 md:px-3' : 'md:w-64 md:px-6'
        } w-72 px-5`}
      >
        <div className="mb-8 flex items-center justify-start">
          <button
            onClick={onCloseMobile}
            className="ml-1 flex items-center justify-center rounded-lg border border-slate-800 bg-slate-900/70 p-2 text-slate-200 transition hover:bg-slate-800 md:hidden"
            aria-label="Cerrar menu"
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-2" aria-label="Sidebar">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onCloseMobile}
                title={showLabels ? undefined : item.label}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-xl border border-transparent px-3 py-3 text-sm font-semibold transition ${
                    showLabels ? 'justify-start' : 'justify-center'
                  } ${
                    isActive
                      ? 'bg-brand-500/20 text-brand-100 border-brand-500/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <Icon className="h-5 w-5" />
                <span
                  className={`transition-all ${
                    showLabels ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
                  }`}
                >
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-auto pt-4">
          <button
            onClick={() => {
              onCloseMobile();
              logout();
            }}
            className={`flex w-full items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-3 text-sm font-semibold text-red-200 transition hover:bg-red-500/20 ${
              showLabels ? 'justify-start' : 'justify-center'
            }`}
            title={showLabels ? undefined : 'Cerrar sesion'}
            type="button"
          >
            <LogOut className="h-5 w-5" />
            <span
              className={`transition-all ${
                showLabels ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
              }`}
            >
              Cerrar sesion
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
