import React from 'react';
import Card from '../../components/common/Card.jsx';
import ProgressChart from '../../components/charts/ProgressChart.jsx';

const data = [
  { week: 'Semana 1', percentage: 20 },
  { week: 'Semana 2', percentage: 40 },
  { week: 'Semana 3', percentage: 55 },
  { week: 'Semana 4', percentage: 70 }
];

export default function AdminStats() {
  return (
    <Card>
      <h2 className="text-xl font-bold text-[#173f74] dark:text-slate-100">Estadisticas</h2>
      <div className="mt-4">
        <ProgressChart data={data} />
      </div>
    </Card>
  );
}
