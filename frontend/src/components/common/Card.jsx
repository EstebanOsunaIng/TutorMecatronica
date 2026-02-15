import React from 'react';

export default function Card({ children, className = '', ...props }) {
  return (
    <div className={`min-w-0 max-w-full rounded-2xl border border-cyan-100 bg-white/90 p-5 dark:border-slate-800 dark:bg-white/5 ${className}`} {...props}>
      {children}
    </div>
  );
}
