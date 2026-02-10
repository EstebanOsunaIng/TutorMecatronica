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

  const labelClass = 'text-xs text-slate-500 dark:text-slate-400';
  const inputClass = 'mt-1 w-full rounded-lg border border-cyan-100 bg-white/90 px-3 py-2 text-slate-800 outline-none transition focus:border-brand-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100';
  const inputDisabledClass = `${inputClass} opacity-80`;

  return (
    <div className="space-y-6 rounded-3xl border border-cyan-100/80 bg-gradient-to-br from-sky-50/85 via-cyan-50/65 to-slate-50 p-5 text-slate-900 shadow-inner dark:border-slate-800 dark:bg-slate-900/40 dark:bg-none dark:text-slate-100 md:p-6">
      <h2 className="text-2xl font-bold">Configuraciones</h2>
      <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
        <div>
          <label className={labelClass}>Nombre</label>
          <input disabled className={inputDisabledClass} value={user?.name || ''} />
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input disabled className={inputDisabledClass} value={user?.email || ''} />
        </div>
        <div>
          <label className={labelClass}>Documento</label>
          <input disabled className={inputDisabledClass} value={user?.document || ''} />
        </div>
        <div>
          <label className={labelClass}>Telefono</label>
          <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <label className={labelClass}>Foto de perfil (URL)</label>
          <input className={inputClass} value={photo} onChange={(e) => setPhoto(e.target.value)} />
        </div>
        <div className="md:col-span-2 flex gap-3">
          <button className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-bold text-white">Guardar cambios</button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg border border-cyan-100 bg-white/90 px-4 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            Regresar
          </button>
          <button
            type="button"
            onClick={logout}
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/20 dark:text-red-200"
          >
            Salir
          </button>
        </div>
      </form>

      <form onSubmit={changePassword} className="grid gap-4 md:grid-cols-2">
        <div>
          <label className={labelClass}>Contraseña actual</label>
          <input type="password" className={inputClass} value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Nueva contraseña</label>
          <input type="password" className={inputClass} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>
        <div>
          <button className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/20 dark:text-emerald-200">
            Cambiar contraseña
          </button>
        </div>
      </form>
    </div>
  );
}
