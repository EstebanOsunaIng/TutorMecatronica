import React, { useEffect, useMemo, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Navbar from './Navbar.jsx';
import Sidebar from './Sidebar.jsx';
import ChatDock from '../chatbot/ChatDock.jsx';

const SIDEBAR_STORAGE_KEY = 'sidebar:collapsed';

export default function RoleLayout() {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true';
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleToggleSidebar = () => setIsCollapsed((prev) => !prev);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isCollapsed));
  }, [isCollapsed]);

  const sidebarHandlers = useMemo(
    () => ({
      isCollapsed,
      isMobileOpen,
      onOpenMobile: () => setIsMobileOpen(true),
      onCloseMobile: () => setIsMobileOpen(false)
    }),
    [isCollapsed, isMobileOpen]
  );

  const { onOpenMobile } = sidebarHandlers;

  return (

    <div className="flex min-h-screen bg-gradient-to-br from-sky-50/90 via-cyan-50/70 to-slate-50 text-slate-900 dark:bg-slate-950 dark:bg-none dark:text-slate-100">
      <div className="fixed left-0 top-0 z-50 hidden md:flex md:h-[72px] md:w-20 md:items-center md:justify-center">
        <button
          onClick={handleToggleSidebar}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-100 bg-white/85 text-slate-700 shadow-sm transition hover:bg-cyan-50/80 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:hover:bg-slate-800"
          aria-label="Colapsar o expandir menu"
          type="button"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
      <Sidebar {...sidebarHandlers} />
      <div className="flex flex-1 flex-col">
        <Navbar onOpenSidebar={onOpenMobile} />
        <div className="flex flex-1 items-start">
          <main className="min-w-0 flex-1 bg-sky-50/45 p-6 dark:bg-transparent">
            <Outlet />
          </main>
          <div className="hidden w-[360px] border-l border-cyan-100/80 bg-sky-50/55 lg:sticky lg:top-[72px] lg:block lg:h-[calc(100vh-72px)] lg:flex-shrink-0 dark:border-slate-800 dark:bg-transparent">
            <ChatDock />
          </div>
        </div>
      </div>
    </div>
  );
}
