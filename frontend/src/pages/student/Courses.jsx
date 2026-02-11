import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card.jsx';
import { modulesApi } from '../../api/modules.api.js';

export default function Courses() {
  const [modules, setModules] = useState([]);

  useEffect(() => {
    modulesApi.listPublished().then((res) => setModules(res.data.modules || []));
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Cursos</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {modules.map((m) => (
          <Card key={m._id} className="flex h-[220px] flex-col">
            <h3 className="line-clamp-2 text-lg font-bold">{m.title}</h3>
            <p
              className="mt-2 line-clamp-4 text-sm text-slate-400"
              title={m.description || 'Sin descripcion.'}
            >
              {m.description || 'Sin descripcion.'}
            </p>
            <Link to={`/student/courses/${m._id}`} className="mt-auto inline-block pt-3 text-sm text-brand-300">
              Ver modulo
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
