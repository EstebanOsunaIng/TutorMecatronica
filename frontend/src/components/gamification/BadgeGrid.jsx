import React, { useMemo, useState } from 'react';
import Card from '../common/Card.jsx';
import Modal from '../common/Modal.jsx';

export default function BadgeGrid({ badges, unlocked }) {
  const unlockedSet = new Set((unlocked || []).map((id) => String(id)));
  const [open, setOpen] = useState(false);

  const preview = useMemo(() => (badges || []).slice(0, 4), [badges]);
  const hasMore = (badges || []).length > 4;

  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold uppercase tracking-widest text-brand-300">Insignias</h3>
        {hasMore && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-xl border border-cyan-100 bg-white/80 px-3 py-1.5 text-xs font-extrabold text-slate-700 transition hover:border-brand-300 hover:bg-brand-50 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Ver todas
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {preview.map((badge) => {
          const active = unlockedSet.has(String(badge._id));
          return (
            <div
              key={badge._id}
              className={`rounded-xl border p-3 text-center text-xs ${
                active
                  ? 'border-brand-300 bg-brand-500/10 text-slate-900 dark:border-brand-400 dark:text-brand-100'
                  : 'border-slate-200 bg-white/70 text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-500'
              }`}
            >
              <div className="mb-2 text-lg">🏅</div>
              <div className="font-bold">{badge.name}</div>
              <div className="mt-1 text-[10px] opacity-80">{active ? 'Desbloqueada' : 'Bloqueada'}</div>
            </div>
          );
        })}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} maxWidthClass="max-w-4xl">
        <div className="mb-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300">Coleccion</div>
          <h4 className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">Todas las insignias</h4>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {(badges || []).map((badge) => {
            const active = unlockedSet.has(String(badge._id));
            return (
              <div
                key={badge._id}
                className={`rounded-xl border p-3 text-center text-xs ${
                  active
                    ? 'border-brand-300 bg-brand-500/10 text-slate-900 dark:border-brand-400 dark:text-brand-100'
                    : 'border-slate-200 bg-white/70 text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-500'
                }`}
              >
                <div className="mb-2 text-lg">🏅</div>
                <div className="font-bold">{badge.name}</div>
                <div className="mt-1 text-[10px] opacity-80">{active ? 'Desbloqueada' : 'Bloqueada'}</div>
              </div>
            );
          })}
        </div>
      </Modal>
    </Card>
  );
}
