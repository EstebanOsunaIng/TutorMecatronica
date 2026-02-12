import React, { useEffect } from 'react';

export default function Modal({ open, onClose, children, maxWidthClass = 'max-w-3xl' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (

    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className={`w-full ${maxWidthClass} rounded-2xl border border-cyan-100 bg-white/95 p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900`}>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label="Cerrar"
          >
            x
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
