import React from 'react';
import Card from '../common/Card.jsx';
import { Award, Crown } from 'lucide-react';

function coinStyles(idx) {
  if (idx === 0) {
    return {
      ring: 'ring-amber-300/40',
      bg: 'bg-amber-300/14 text-amber-500',
      darkBg: 'dark:bg-amber-300/12 dark:text-amber-300'
    };
  }
  if (idx === 1) {
    return {
      ring: 'ring-slate-300/45',
      bg: 'bg-slate-300/16 text-slate-500',
      darkBg: 'dark:bg-slate-200/14 dark:text-slate-200'
    };
  }
  if (idx === 2) {
    return {
      ring: 'ring-orange-300/45',
      bg: 'bg-orange-300/14 text-orange-500',
      darkBg: 'dark:bg-orange-300/12 dark:text-orange-300'
    };
  }
  return {
    ring: 'ring-slate-300/35',
    bg: 'bg-white/65 text-slate-500',
    darkBg: 'dark:bg-slate-200/12 dark:text-slate-300'
  };
}

export default function RankingCard({ top }) {
  const ranked = [...(top || [])]
    .sort((a, b) => (Number(b.badgesCount || 0) - Number(a.badgesCount || 0)))
    .slice(0, 5);

  return (
    <Card className="border-cyan-100/70 bg-gradient-to-br from-sky-50/85 via-cyan-50/60 to-slate-50 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:bg-none dark:text-slate-100">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300">Competencia</div>
          <h3 className="mt-0.5 text-base font-extrabold">Top 5 Ranking</h3>
        </div>
        <span className="inline-flex items-center gap-2 rounded-2xl bg-white/80 px-3 py-2 text-xs font-bold text-slate-700 shadow-sm dark:bg-slate-800/70 dark:text-slate-200">
          <Crown className="h-4 w-4 text-amber-500" />
          Lideres
        </span>
      </div>

      <div className="space-y-2">
        {ranked.map((user, idx) => {
          const s = coinStyles(idx);
          return (
            <div
              key={user._id}
              className="flex items-center justify-between rounded-2xl border border-cyan-100 bg-white/85 px-3 py-3 shadow-sm transition hover:border-brand-300/60 hover:bg-brand-50 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:bg-slate-800"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={
                    `flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-1 ${s.ring} ${s.bg} ${s.darkBg}`
                  }
                >
                  <Award className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-extrabold">
                    {user.name} {user.lastName}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-300">Insignias: {user.badgesCount || 0}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-300">Puesto</div>
                <div className="text-sm font-black">#{idx + 1}</div>
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
