import React, { useEffect, useState } from 'react';
import Card from '../../components/common/Card.jsx';
import { usersApi } from '../../api/users.api.js';
import { adminApi } from '../../api/admin.api.js';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState('');
  const [teacherCode, setTeacherCode] = useState('');

  const load = async () => {
    const res = await usersApi.list(q);
    setUsers(res.data.users || []);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#173f74] dark:text-slate-100">Usuarios</h2>
        <div className="flex gap-2">
          <input
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            placeholder="Filtrar por nombre"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button onClick={load} className="rounded-lg bg-brand-500 px-3 py-2 text-sm font-bold text-white">Buscar</button>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={async () => {
            const res = await adminApi.createTeacherCode();
            setTeacherCode(res.data.code);
          }}
          className="rounded-lg bg-brand-500 px-3 py-2 text-xs font-bold text-white"
        >
          Generar codigo docente
        </button>
        {teacherCode && <span className="text-xs text-[#173f74] dark:text-brand-200">Codigo: {teacherCode}</span>}
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-slate-600 dark:text-slate-400">
            <tr>
              <th className="py-2">Nombre</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Ultima actividad</th>
              <th>Progreso</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-t border-slate-200 text-slate-800 dark:border-slate-800 dark:text-slate-100">
                <td className="py-2">{u.name} {u.lastName}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : '-'}</td>
                <td>{u.badgesCount || 0} insignias</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
