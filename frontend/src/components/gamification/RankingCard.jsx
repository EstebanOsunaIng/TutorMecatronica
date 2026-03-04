import React from 'react';
import Card from '../common/Card.jsx';

function coinStyles(idx) {
  if (idx === 0) {
    return {
      ring: 'ring-amber-400/70',
      bg: 'bg-gradient-to-br from-yellow-100 via-amber-300 to-orange-400 text-amber-950 shadow-[0_12px_20px_-12px_rgba(217,119,6,0.95)]',
      darkBg: 'dark:from-yellow-100 dark:via-amber-300 dark:to-orange-400 dark:text-amber-950',
      accent: 'shadow-[0_0_0_2px_rgba(251,191,36,0.25),0_0_18px_rgba(245,158,11,0.45)]'
    };
  }
  if (idx === 1) {
    return {
      ring: 'ring-slate-300/75',
      bg: 'bg-gradient-to-br from-zinc-50 via-slate-100 to-slate-300 text-slate-800 shadow-[0_10px_18px_-12px_rgba(71,85,105,0.9)]',
      darkBg: 'dark:from-zinc-100 dark:via-slate-200 dark:to-slate-300 dark:text-slate-900',
      accent: 'shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]'
    };
  }
  if (idx === 2) {
    return {
      ring: 'ring-orange-500/65',
      bg: 'bg-gradient-to-br from-orange-100 via-orange-300 to-rose-400 text-orange-950 shadow-[0_12px_20px_-12px_rgba(194,65,12,0.9)]',
      darkBg: 'dark:from-orange-100 dark:via-orange-300 dark:to-rose-400 dark:text-orange-950',
      accent: 'shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]'
    };
  }
  return {
    ring: 'ring-slate-200/55',
    bg: 'bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 text-slate-500 shadow-[0_8px_16px_-12px_rgba(100,116,139,0.65)]',
    darkBg: 'dark:from-slate-700 dark:via-slate-800 dark:to-slate-900 dark:text-slate-300',
    accent: 'opacity-90'
  };
}

export default function RankingCard({ top }) {
  // Backend already returns the ranking ordered.
  const ranked = [...(top || [])].slice(0, 5);

  return (
    <Card className="border-cyan-100/70 bg-gradient-to-br from-sky-50/85 via-cyan-50/60 to-slate-50 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:bg-none dark:text-slate-100">
      <div className="mb-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300">Competencia</div>
          <h3 className="mt-0.5 text-base font-extrabold">Top 5 Ranking</h3>
        </div>
      </div>

      <div className="space-y-2">
        {ranked.map((user, idx) => {
          const s = coinStyles(idx);
          return (
            <div
              key={user._id}
              className="flex items-center rounded-2xl border border-cyan-100 bg-white/85 px-3 py-3 shadow-sm transition hover:border-brand-300/60 hover:bg-brand-50 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:bg-slate-800"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={
                    `relative flex shrink-0 items-center justify-center rounded-full ring-1 ${idx < 3 ? 'h-10 w-10' : 'h-9 w-9'} ${s.ring} ${s.bg} ${s.darkBg} ${s.accent} ${idx === 0 ? 'animate-pulse' : ''}`
                  }
                >
                  <span className="pointer-events-none absolute inset-[2px] rounded-full border border-white/50 dark:border-white/15" aria-hidden="true" />
                  <span className={`${idx < 3 ? 'text-[17px]' : 'text-base'} font-extrabold leading-none tracking-tight drop-shadow-[0_1px_1px_rgba(15,23,42,0.25)]`}>
                    {idx + 1}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-extrabold">
                    {user.name} {user.lastName}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-300">Insignias: {user.badgesCount || 0}</div>
                </div>
              </div>
            </div>
          );
        })}

        {(!ranked || ranked.length === 0) && (
          <div className="rounded-2xl border border-cyan-100 bg-white/70 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
            Aun no hay ranking disponible.
          </div>
        )}
      </div>
    </Card>
  );
}
