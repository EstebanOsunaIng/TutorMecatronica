import React from 'react';

export default function Card({ children, className = '' }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white/85 p-5 text-slate-800 shadow-sm dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-100 ${className}`}
    >
      {children}
    </div>
  );
}
