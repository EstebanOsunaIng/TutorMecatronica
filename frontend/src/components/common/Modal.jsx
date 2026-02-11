import React from 'react';

export default function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 text-slate-800 shadow-2xl ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700">
        <div className="flex justify-end">
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">x</button>
        </div>
        {children}
      </div>
    </div>
  );
}
