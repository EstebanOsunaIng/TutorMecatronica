import React from 'react';
import Card from '../common/Card.jsx';

export default function RankingCard({ top }) {
  return (
    <Card>
      <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-brand-300">Top 5 Ranking</h3>
      <div className="space-y-3">
        {top.map((user, idx) => (
          <div key={user._id} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-brand-500/20 text-center text-xs font-bold leading-8">
                {idx + 1}
              </div>
              <div>
                <div className="font-semibold">{user.name} {user.lastName}</div>
                <div className="text-xs text-slate-400">Insignias: {user.badgesCount || 0}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
