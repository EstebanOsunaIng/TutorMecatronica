import React from 'react';
import Card from '../common/Card.jsx';

export default function BadgeGrid({ badges, unlocked }) {
  const unlockedSet = new Set((unlocked || []).map((id) => String(id)));
  return (
    <Card>
      <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-brand-300">Insignias</h3>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {badges.map((badge) => {
          const active = unlockedSet.has(String(badge._id));
          return (
            <div
              key={badge._id}
              className={`rounded-xl border p-3 text-center text-xs ${
                active
                  ? 'border-brand-400 bg-brand-500/10 text-brand-100'
                  : 'border-slate-800 bg-slate-900/40 text-slate-500'
              }`}
            >
              <div className="mb-2 text-lg">🏅</div>
              <div className="font-bold">{badge.name}</div>
              <div className="mt-1 text-[10px] opacity-80">{active ? 'Desbloqueada' : 'Bloqueada'}</div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
