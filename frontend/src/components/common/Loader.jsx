import React from 'react';

export default function Loader() {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-400">
      <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-brand-400" />
      Cargando...
    </div>
  );
}
