import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import Sidebar from './Sidebar.jsx';
import ChatDock from '../chatbot/ChatDock.jsx';

export default function RoleLayout({ sidebarItems }) {
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar items={sidebarItems} />
      <div className="flex flex-1 flex-col">
        <Navbar />
        <div className="flex flex-1">
          <main className="flex-1 p-6">
            <Outlet />
          </main>
          <div className="hidden w-[360px] border-l border-slate-800 lg:block">
            <ChatDock />
          </div>
        </div>
      </div>
    </div>
  );
}
