import React from 'react';

export default function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-slate-900 p-6 shadow-2xl">
        <div className="flex justify-end">
          <button onClick={onClose} className="text-slate-400 hover:text-white">x</button>
        </div>
        {children}
      </div>
    </div>
  );
}
