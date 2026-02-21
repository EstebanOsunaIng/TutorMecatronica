import React, { useEffect, useMemo, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, MessageCircle, X } from 'lucide-react';
import Navbar from './Navbar.jsx';
import Sidebar from './Sidebar.jsx';
import ChatDock from '../chatbot/ChatDock.jsx';
import { presenceApi } from '../../api/presence.api.js';

const SIDEBAR_STORAGE_KEY = 'sidebar:collapsed';

export default function RoleLayout() {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true';
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleToggleSidebar = () => setIsCollapsed((prev) => !prev);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return undefined;

    let cancelled = false;
    const ping = async () => {
      try {
        await presenceApi.ping();
      } catch {
        // ignore
      }
    };

    ping();
    const id = window.setInterval(() => {
      if (!cancelled) ping();
    }, 15000);

    const onBeforeUnload = () => {
      // best-effort
      ping();
    };
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      cancelled = true;
      window.clearInterval(id);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, []);

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
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--light-divider)] bg-white/85 text-slate-700 shadow-sm transition hover:bg-cyan-50/80 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:hover:bg-slate-800"
          aria-label="Colapsar o expandir menu"
          type="button"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
      <Sidebar {...sidebarHandlers} />
      <div className="flex flex-1 flex-col pt-[72px]">
        <Navbar onOpenSidebar={onOpenMobile} />
        <div className="flex flex-1 items-start">
          <main className="min-w-0 flex-1 bg-sky-50/45 p-6 dark:bg-transparent">
            <Outlet />
          </main>
          <div className="hidden w-[360px] border-l border-[color:var(--light-divider)] bg-sky-50/55 lg:sticky lg:top-[72px] lg:block lg:h-[calc(100vh-72px)] lg:flex-shrink-0 dark:border-slate-800 dark:bg-transparent">
            <ChatDock />
          </div>
        </div>
      </div>

      <div className="fixed bottom-5 right-5 z-50 lg:hidden">
        <button
          type="button"
          onClick={() => setIsChatOpen((prev) => !prev)}
          className="grid h-14 w-14 place-items-center rounded-full bg-brand-500 text-white shadow-xl shadow-brand-500/30"
          aria-label="Abrir chat"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      </div>

      <div className={`fixed inset-0 z-[60] lg:hidden ${isChatOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <button
          type="button"
          onClick={() => setIsChatOpen(false)}
          className={`absolute inset-0 bg-slate-950/55 transition ${isChatOpen ? 'opacity-100' : 'opacity-0'}`}
          aria-label="Cerrar chat"
        />
        <div
          className={`absolute bottom-0 right-0 h-[78vh] w-full max-w-[420px] p-3 transition sm:right-3 sm:bottom-3 sm:h-[72vh] ${
            isChatOpen ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
          }`}
        >
          <div className="relative h-full">
            <button
              type="button"
              onClick={() => setIsChatOpen(false)}
              className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-full bg-slate-900/70 text-white"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
            <ChatDock />
          </div>
        </div>
      </div>
    </div>
  );
}
