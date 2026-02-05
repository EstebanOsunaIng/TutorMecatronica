import React, { useEffect, useState } from 'react';
import Card from '../../components/common/Card.jsx';
import { modulesApi } from '../../api/modules.api.js';

export default function TeacherDashboard() {
  const [modules, setModules] = useState([]);

  useEffect(() => {
    modulesApi.list().then((res) => setModules(res.data.modules || []));
  }, []);

  const lastThree = modules.slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="text-xs uppercase tracking-widest text-brand-300">Total modulos</div>
          <div className="mt-2 text-3xl font-bold">{modules.length}</div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-widest text-brand-300">Actualizaciones</div>
          <div className="mt-2 text-sm text-slate-300">Cambios recientes en modulos.</div>
        </Card>
      </div>
      <Card>
        <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-brand-300">Ultimos 3 modulos</h3>
        <div className="space-y-3">
          {lastThree.map((m) => (
            <div key={m._id} className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{m.title}</div>
                <div className="text-xs text-slate-400">{m.level}</div>
              </div>
              <div className="text-xs text-slate-400">Editar / Eliminar</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
