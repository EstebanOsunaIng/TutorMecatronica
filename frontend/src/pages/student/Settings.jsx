import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { usersApi } from '../../api/users.api.js';
import { authApi } from '../../api/auth.api.js';
import { useNavigate } from 'react-router-dom';

export default function StudentSettings() {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState(user?.phone || '');
  const [photo, setPhoto] = useState(user?.profilePhotoUrl || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const save = async (e) => {
    e.preventDefault();
    const { data } = await usersApi.updateMe({ phone, profilePhotoUrl: photo });
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    alert('Perfil actualizado.');
  };

  const changePassword = async (e) => {
    e.preventDefault();
    await authApi.changePassword({ currentPassword: oldPassword, newPassword });
    setOldPassword('');
    setNewPassword('');
    alert('Contraseña actualizada.');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Configuraciones</h2>
      <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-xs text-slate-600 dark:text-slate-400">Nombre</label>
          <input disabled className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white" value={user?.name || ''} />
        </div>
        <div>
          <label className="text-xs text-slate-600 dark:text-slate-400">Email</label>
          <input disabled className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white" value={user?.email || ''} />
        </div>
        <div>
          <label className="text-xs text-slate-600 dark:text-slate-400">Documento</label>
          <input disabled className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white" value={user?.document || ''} />
        </div>
        <div>
          <label className="text-xs text-slate-600 dark:text-slate-400">Telefono</label>
          <input className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white" value={phone} onChange={(e) => setPhone(e.target.value)} spellCheck autoCorrect="on" autoCapitalize="sentences" />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs text-slate-600 dark:text-slate-400">Foto de perfil (URL)</label>
          <input className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white" value={photo} onChange={(e) => setPhoto(e.target.value)} spellCheck autoCorrect="on" autoCapitalize="sentences" />
        </div>
        <div className="md:col-span-2 flex gap-3">
          <button className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-bold text-white">Guardar cambios</button>
          <button type="button" onClick={() => navigate(-1)} className="rounded-lg bg-slate-200 px-4 py-2 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-100">Regresar</button>
          <button type="button" onClick={logout} className="rounded-lg bg-red-100 px-4 py-2 text-sm text-red-700 dark:bg-red-500/20 dark:text-red-200">Salir</button>
        </div>
      </form>

      <form onSubmit={changePassword} className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-xs text-slate-600 dark:text-slate-400">Contraseña actual</label>
          <input type="password" className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-slate-600 dark:text-slate-400">Nueva contraseña</label>
          <input type="password" className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>
        <div>
          <button className="rounded-lg bg-emerald-100 px-4 py-2 text-sm text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200">Cambiar contraseña</button>
        </div>
      </form>
    </div>
  );
}
