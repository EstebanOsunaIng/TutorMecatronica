import React from 'react';
import Card from '../common/Card.jsx';

export default function MyRankCard({ position, total, badgesCount }) {
  return (
    <Card>
      <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-brand-300">Mi posicion</h3>
      <div className="text-3xl font-extrabold text-white">#{position || '-'}</div>
      <div className="mt-2 text-sm text-slate-400">Insignias: {badgesCount || 0}</div>
      <div className="text-xs text-slate-500">Total estudiantes: {total || 0}</div>
    </Card>
  );
}
