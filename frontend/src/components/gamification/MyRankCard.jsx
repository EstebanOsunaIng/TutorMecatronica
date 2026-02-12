import React from 'react';
import Card from '../common/Card.jsx';

export default function MyRankCard({ position, total, badgesCount }) {
  return (
    <Card>
      <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-brand-300">Mi posicion</h3>
      <div className="text-3xl font-extrabold text-slate-900 dark:text-white">#{position || '-'}</div>
    </Card>
  );
}
