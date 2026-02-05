import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Sidebar({ items, title = 'TuVir' }) {
  return (
    <aside className="w-64 shrink-0 border-r border-slate-800 bg-slate-950/90 p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-white">{title}</h1>
        <p className="text-xs uppercase tracking-widest text-brand-300">Universitaria de Colombia</p>
      </div>
      <nav className="flex flex-col gap-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `rounded-xl px-4 py-3 text-sm font-semibold transition ${
                isActive ? 'bg-brand-500/20 text-brand-100' : 'text-slate-300 hover:bg-slate-800'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
