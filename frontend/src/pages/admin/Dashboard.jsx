import React, { useEffect, useState } from 'react';
import Card from '../../components/common/Card.jsx';
import WeeklyParticipationChart from '../../components/charts/WeeklyParticipationChart.jsx';
import ProgressChart from '../../components/charts/ProgressChart.jsx';
import { usersApi } from '../../api/users.api.js';

const weekly = [
  { week: 'Lun', students: 18 },
  { week: 'Mar', students: 25 },
  { week: 'Mie', students: 28 },
  { week: 'Jue', students: 32 },
  { week: 'Vie', students: 20 }
];

const progress = [
  { week: 'Mod 1', percentage: 40 },
  { week: 'Mod 2', percentage: 65 },
  { week: 'Mod 3', percentage: 20 }
];

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    usersApi.list().then((res) => setUsers(res.data.users || []));
  }, []);

  const students = users.filter((u) => u.role === 'STUDENT').length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="text-xs uppercase tracking-widest text-[#173f74] dark:text-brand-300">Total estudiantes</div>
          <div className="mt-2 text-3xl font-bold">{students}</div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-widest text-[#173f74] dark:text-brand-300">Promedio tiempo por modulo</div>
          <div className="mt-2 text-3xl font-bold">35 min</div>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-[#173f74] dark:text-brand-300">Participacion semanal</h3>
          <WeeklyParticipationChart data={weekly} />
        </Card>
        <Card>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-[#173f74] dark:text-brand-300">Progreso por modulo</h3>
          <ProgressChart data={progress} />
        </Card>
      </div>
    </div>
  );
}
