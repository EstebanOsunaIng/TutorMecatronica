import React, { useEffect, useState } from 'react';
import Card from '../../components/common/Card.jsx';
import { modulesApi } from '../../api/modules.api.js';

export default function AdminModules() {
  const [modules, setModules] = useState([]);

  useEffect(() => {
    modulesApi.list().then((res) => setModules(res.data.modules || []));
  }, []);

  return (
    <Card>
      <h2 className="text-xl font-bold">Gestion de modulos</h2>
      <div className="mt-4 space-y-3">
        {modules.map((m) => (
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
  );
}
