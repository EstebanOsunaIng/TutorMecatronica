import React from 'react';

export default function NewsCard({ item }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="mb-2 text-xs uppercase tracking-widest text-brand-300">{item.category}</div>
      <h4 className="text-lg font-bold text-white">{item.title}</h4>
      <p className="mt-2 text-sm text-slate-300">{item.summary}</p>
      <div className="mt-3 text-xs text-slate-500">{new Date(item.date).toLocaleDateString()}</div>
    </div>
  );
}
