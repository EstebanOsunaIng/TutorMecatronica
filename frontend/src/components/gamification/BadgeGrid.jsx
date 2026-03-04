import React, { useMemo, useState } from 'react';
import Card from '../common/Card.jsx';
import Modal from '../common/Modal.jsx';

export default function BadgeGrid({ badges, unlocked }) {
  const unlockedSet = new Set((unlocked || []).map((id) => String(id)));
  const [open, setOpen] = useState(false);

  const preview = useMemo(() => (badges || []).slice(0, 4), [badges]);
  const hasMore = (badges || []).length > 4;
  const normalizeName = (name = '') => name.replace(/^Insignia:\s*/i, '').trim();
  const moduleName = (name = '') => normalizeName(name).replace(/^curso\s+de\s*/i, 'Modulo ');
  const shortTitle = (name = '') => {
    const compact = moduleName(name);
    if (!compact) return 'Insignia';
    const words = compact.split(/\s+/).slice(0, 2).join(' ');
    return words.length > 16 ? `${words.slice(0, 16)}...` : words;
  };

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
          const badgeName = moduleName(badge.name);
          const badgeDescription = (badge.description || '').replace(/\bcurso\s+de\b/gi, 'modulo').trim();
          return (
            <div
              key={badge._id}
              tabIndex={0}
              className={`group relative rounded-2xl border p-3 text-center text-xs transition focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-400/30 ${
                active
                  ? 'border-brand-300 bg-gradient-to-b from-brand-500/15 via-white to-white text-slate-900 shadow-sm dark:border-brand-400 dark:from-brand-500/20 dark:via-slate-900/60 dark:to-slate-900/40 dark:text-brand-100'
                  : 'border-slate-200 bg-white/80 text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-500'
              }`}
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/95 text-xl shadow-inner ring-1 ring-slate-200 dark:bg-slate-950/60 dark:ring-white/10">
                {badge.iconUrl ? (
                  <img src={badge.iconUrl} alt={badgeName || 'Insignia'} className="h-8 w-8 object-contain" />
                ) : (
                  <span aria-hidden="true">🏅</span>
                )}
              </div>
              <div className="mt-2 line-clamp-1 text-[11px] font-extrabold tracking-wide text-slate-700 dark:text-slate-200">
                {shortTitle(badge.name)}
              </div>

              <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-60 -translate-x-1/2 translate-y-1 opacity-0 transition duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
                <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 text-left shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
                  <div className="flex items-center gap-2 border-b border-slate-200/80 bg-gradient-to-r from-sky-50 to-cyan-50 p-3 dark:border-slate-700 dark:from-slate-900 dark:to-slate-800">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-lg ring-1 ring-slate-200 dark:bg-slate-950/70 dark:ring-white/10">
                      {badge.iconUrl ? (
                        <img src={badge.iconUrl} alt={badgeName || 'Insignia'} className="h-7 w-7 object-contain" />
                      ) : (
                        <span aria-hidden="true">🏅</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="line-clamp-1 text-sm font-bold text-slate-900 dark:text-slate-100">{badgeName || 'Insignia'}</div>
                      <div className="text-[11px] font-medium text-slate-500 dark:text-slate-300">Insignia de progreso</div>
                    </div>
                  </div>

                  <div className="space-y-2 p-3">
                    <div className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                      {badgeDescription || (active ? `Completaste el modulo ${badgeName}.` : `Completa el modulo ${badgeName} para desbloquearla.`)}
                    </div>
                    <div className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                      {active ? 'Desbloqueada' : 'Bloqueada'}
                    </div>
                  </div>
                </div>
              </div>
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
