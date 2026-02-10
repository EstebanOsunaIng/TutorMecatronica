import React, { useEffect, useState } from 'react';
import Card from '../../components/common/Card.jsx';
import { modulesApi } from '../../api/modules.api.js';

export default function AdminModules() {
  const [modules, setModules] = useState([]);
  const [busyId, setBusyId] = useState('');

  const load = async () => {
    const res = await modulesApi.list();
    setModules(res.data.modules || []);
  };

  useEffect(() => {
    load();
  }, []);

  const togglePublish = async (m) => {
    if (!m?._id) return;
    setBusyId(m._id);
    try {
      await modulesApi.update(m._id, { isPublished: !m.isPublished });
      await load();
    } finally {
      setBusyId('');
    }
  };

  const remove = async (m) => {
    if (!m?._id) return;
    if (!confirm('Eliminar este modulo? Esta accion no se puede deshacer.')) return;
    setBusyId(m._id);
    try {
      await modulesApi.remove(m._id);
      await load();
    } finally {
      setBusyId('');
    }
  };

  return (
    <Card>
      <h2 className="text-xl font-bold text-[#173f74] dark:text-slate-100">Gestion de modulos</h2>
      <div className="mt-4 space-y-3">
        {modules.map((m) => (
          <div key={m._id} className="flex items-center justify-between">
            <div>
              <div className="font-semibold">{m.title}</div>
              <div className="text-xs text-slate-600 dark:text-slate-400">{m.level} · {m.isPublished ? 'Publicado' : 'No publicado'}</div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => togglePublish(m)}
                disabled={busyId === m._id}
                className="rounded-lg bg-brand-500/20 px-3 py-2 text-xs text-[#173f74] disabled:opacity-50 dark:text-brand-200"
              >
                {m.isPublished ? 'Ocultar' : 'Publicar'}
              </button>
              <button
                onClick={() => remove(m)}
                disabled={busyId === m._id}
                className="rounded-lg bg-red-100 px-3 py-2 text-xs text-red-700 disabled:opacity-50 dark:bg-red-500/20 dark:text-red-200"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
