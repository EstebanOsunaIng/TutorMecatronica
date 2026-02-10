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
          <Card key={m._id}>
            <h3 className="text-lg font-bold">{m.title}</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{m.description}</p>
            <Link to={`/student/courses/${m._id}`} className="mt-3 inline-block text-sm text-brand-300">
              Ver modulo
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
