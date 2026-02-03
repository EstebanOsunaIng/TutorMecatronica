
import React from 'react';
import { UserRole } from '../types';

interface SidebarProps {
  currentView: string;
  setView: (view: string) => void;
  role: UserRole;
  userName: string;
  userRoleLabel: string;
  avatar: string;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, role, userName, userRoleLabel, avatar }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', roles: [UserRole.STUDENT, UserRole.ADMIN, UserRole.SUPERADMIN] },
    { id: 'modules', label: role === UserRole.ADMIN ? 'Gestión Módulos' : 'Ruta Aprendizaje', icon: role === UserRole.ADMIN ? 'edit_document' : 'auto_stories', roles: [UserRole.STUDENT, UserRole.ADMIN, UserRole.SUPERADMIN] },
    { id: 'progress', label: 'Reportes', icon: 'monitoring', roles: [UserRole.STUDENT, UserRole.ADMIN, UserRole.SUPERADMIN] },
    { id: 'settings', label: 'Ajustes', icon: 'settings', roles: [UserRole.STUDENT, UserRole.ADMIN, UserRole.SUPERADMIN] },
  ];

  return (
    <aside className="w-64 h-full border-r border-[#233c48] flex flex-col shrink-0 bg-surface z-20">
      <div className="flex flex-col h-full p-6">
        <div className="flex gap-3 mb-10 items-center">
          <div className="bg-primary-500 rounded-lg size-10 flex items-center justify-center text-white shadow-lg shadow-primary-500/30">
            <span className="material-symbols-outlined font-bold">precision_manufacturing</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-white text-lg font-black leading-none tracking-tight">TuVir</h1>
            <p className="text-primary-400 text-[10px] font-bold uppercase tracking-widest mt-1">U. de Colombia</p>
          </div>
        </div>

        <nav className="flex flex-col gap-2 flex-1">
          {menuItems.filter(item => item.roles.includes(role)).map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group ${
                currentView === item.id 
                ? 'bg-primary-500 text-white shadow-xl shadow-primary-500/10' 
                : 'text-slate-400 hover:bg-surface-light hover:text-white'
              }`}
            >
              <span className={`material-symbols-outlined text-xl ${currentView === item.id ? 'text-white' : 'text-slate-500 group-hover:text-primary-400'}`}>
                {item.icon}
              </span>
              <span className="text-xs font-black tracking-[0.1em] uppercase">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-[#233c48]">
          <div className="flex items-center gap-3 p-3 bg-surface-light rounded-2xl border border-[#233c48]">
            <img src={avatar} className="size-10 rounded-full border-2 border-primary-500/20" alt="user" />
            <div className="flex flex-col min-w-0">
              <p className="text-white text-xs font-black truncate">{userName}</p>
              <p className="text-primary-500 text-[9px] font-bold uppercase tracking-wider">{userRoleLabel}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
