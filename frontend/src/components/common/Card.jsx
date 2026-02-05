import React from 'react';

export default function Card({ children, className = '' }) {
  return (
    <div className={`rounded-2xl border border-slate-200/10 bg-white/5 p-5 ${className}`}>
      {children}
    </div>
  );
}
