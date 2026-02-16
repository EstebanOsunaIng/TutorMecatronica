import React from 'react';

export default function Card({ children, className = '', ...props }) {
  return (
    <div className={`min-w-0 max-w-full rounded-2xl border border-cyan-100 bg-white/90 p-5 shadow-[0_14px_34px_-22px_rgba(14,116,144,0.45)] dark:border-slate-800 dark:bg-white/5 dark:shadow-[0_18px_40px_-26px_rgba(56,189,248,0.28)] ${className}`} {...props}>
      {children}
    </div>
  );
}
