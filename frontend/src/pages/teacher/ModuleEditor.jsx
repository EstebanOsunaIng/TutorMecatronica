import React, { useEffect, useState } from 'react';
import Card from '../../components/common/Card.jsx';
import { modulesApi } from '../../api/modules.api.js';

export default function ModuleEditor() {
  const [modules, setModules] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', level: 'Básico' });

  const load = async () => {
    const res = await modulesApi.list();
    setModules(res.data.modules || []);
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    await modulesApi.create(form);
    setForm({ title: '', description: '', level: 'Básico' });
    load();
  };

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-xl font-bold">Crear modulo</h2>
        <form onSubmit={submit} className="mt-4 grid gap-4 md:grid-cols-2">
          <input
            className="rounded-lg bg-slate-900 px-3 py-2"
            placeholder="Titulo"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <select
            className="rounded-lg bg-slate-900 px-3 py-2"
            value={form.level}
            onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
          >
            <option>Básico</option>
            <option>Intermedio</option>
            <option>Avanzado</option>
          </select>
          <textarea
            className="md:col-span-2 rounded-lg bg-slate-900 px-3 py-2"
            placeholder="Descripcion"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <button className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-bold">Crear</button>
        </form>
      </Card>

      <Card>
        <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-brand-300">Modulos existentes</h3>
        <div className="space-y-3">
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
    </div>
  );
}
