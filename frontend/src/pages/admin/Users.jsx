import React, { useEffect, useState } from 'react';
import { Pencil, Plus, Search, Trash2, UserRound } from 'lucide-react';
import Card from '../../components/common/Card.jsx';
import RobotLoader from '../../components/common/RobotLoader.jsx';
import { usersApi } from '../../api/users.api.js';
import { adminApi } from '../../api/admin.api.js';

const ROLE_LABELS = {
  ADMIN: 'Administrador',
  TEACHER: 'Docente',
  STUDENT: 'Estudiante'
};

const ROLE_BADGES = {
  ADMIN: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-100',
  TEACHER: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-100',
  STUDENT: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-100'
};

const EMPTY_EDIT_FORM = {
  role: 'STUDENT',
  name: '',
  lastName: '',
  document: '',
  email: '',
  phone: '',
  profilePhotoUrl: '',
  isActive: true
};

const EMPTY_CREATE_FORM = {
  role: 'STUDENT',
  name: '',
  lastName: '',
  document: '',
  email: '',
  phone: '',
  password: '',
  profilePhotoUrl: '',
  isActive: true
};

const SUCCESS_TIMEOUT_MS = 7000;

function formatDate(dateValue) {
  if (!dateValue) return 'Sin acceso';
  const date = new Date(dateValue);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState('');
  const [teacherCode, setTeacherCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM);
  const [deletingUser, setDeletingUser] = useState(null);
  const [creatingUser, setCreatingUser] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE_FORM);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await usersApi.list(q);
      setUsers(res.data.users || []);
    } catch (err) {
      setError(err?.response?.data?.error || 'No fue posible cargar los usuarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!success) return undefined;
    const timeoutId = setTimeout(() => {
      setSuccess('');
    }, SUCCESS_TIMEOUT_MS);
    return () => clearTimeout(timeoutId);
  }, [success]);

  const openEditModal = (user) => {
    setSuccess('');
    setError('');
    setEditingUser(user);
    setEditForm({
      role: user.role || 'STUDENT',
      name: user.name || '',
      lastName: user.lastName || '',
      document: user.document || '',
      email: user.email || '',
      phone: user.phone || '',
      profilePhotoUrl: user.profilePhotoUrl || '',
      isActive: Boolean(user.isActive)
    });
  };

  const closeEditModal = () => {
    if (busyId) return;
    setEditingUser(null);
    setEditForm(EMPTY_EDIT_FORM);
  };

  const saveEdit = async () => {
    if (!editingUser?._id) return;

    if (!editForm.name.trim() || !editForm.lastName.trim() || !editForm.email.trim() || !editForm.document.trim()) {
      setError('Completa nombre, apellido, documento y correo para guardar.');
      return;
    }

    setBusyId(editingUser._id);
    setError('');
    try {
      const payload = {
        role: editForm.role,
        name: editForm.name.trim(),
        lastName: editForm.lastName.trim(),
        document: editForm.document.trim(),
        email: editForm.email.trim().toLowerCase(),
        phone: editForm.phone.trim(),
        profilePhotoUrl: editForm.profilePhotoUrl.trim(),
        isActive: editForm.isActive
      };

      const res = await usersApi.update(editingUser._id, payload);
      const updatedUser = res?.data?.user || { ...editingUser, ...payload };

      setUsers((prev) => prev.map((u) => (u._id === editingUser._id ? updatedUser : u)));
      setEditingUser(null);
      setEditForm(EMPTY_EDIT_FORM);
      setSuccess('Perfil actualizado correctamente.');
    } catch (err) {
      setError(err?.response?.data?.error || 'No fue posible actualizar este perfil.');
    } finally {
      setBusyId('');
    }
  };

  const confirmDelete = async () => {
    if (!deletingUser?._id) return;

    setBusyId(deletingUser._id);
    setError('');
    try {
      await usersApi.remove(deletingUser._id);
      setUsers((prev) => prev.filter((u) => u._id !== deletingUser._id));
      setDeletingUser(null);
      setSuccess('Usuario eliminado de la base de datos.');
    } catch (err) {
      setError(err?.response?.data?.error || 'No fue posible eliminar el usuario.');
    } finally {
      setBusyId('');
    }
  };

  const closeCreateModal = () => {
    if (busyId === '__creating__') return;
    setCreatingUser(false);
    setCreateForm(EMPTY_CREATE_FORM);
    setCreateError('');
    setCreateSuccess('');
  };

  const createUser = async () => {
    if (
      !createForm.name.trim() ||
      !createForm.lastName.trim() ||
      !createForm.document.trim() ||
      !createForm.email.trim() ||
      !createForm.password.trim()
    ) {
      setCreateError('Completa todos los campos obligatorios para crear el perfil.');
      setCreateSuccess('');
      return;
    }

    if (createForm.password.trim().length < 6) {
      setCreateError('La contraseña debe tener al menos 6 caracteres.');
      setCreateSuccess('');
      return;
    }

    setBusyId('__creating__');
    setCreateError('');
    try {
      const payload = {
        role: createForm.role,
        name: createForm.name.trim(),
        lastName: createForm.lastName.trim(),
        document: createForm.document.trim(),
        email: createForm.email.trim().toLowerCase(),
        phone: createForm.phone.trim(),
        password: createForm.password,
        profilePhotoUrl: createForm.profilePhotoUrl.trim(),
        isActive: createForm.isActive
      };

      const res = await usersApi.create(payload);
      const newUser = res?.data?.user;
      setUsers((prev) => [newUser, ...prev]);
      await load();
      setCreateForm(EMPTY_CREATE_FORM);
      setCreateSuccess('Perfil creado correctamente.');
    } catch (err) {
      setCreateError(err?.response?.data?.error || 'No fue posible crear el perfil.');
      setCreateSuccess('');
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="space-y-5">
      <Card className="rounded-3xl border-cyan-100/80 bg-gradient-to-br from-sky-50/85 via-cyan-50/65 to-slate-50 dark:border-slate-800 dark:bg-slate-900/40 dark:bg-none">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-300">Panel de Usuarios</p>
            <h2 className="text-2xl font-bold tracking-tight">Gestion de perfiles</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Edita datos personales, roles y estado de cada usuario.</p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
            <div className="relative flex-1 lg:min-w-[280px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-brand-400 dark:border-slate-600 dark:bg-slate-800"
                placeholder="Buscar por nombre"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={load}
              className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition hover:brightness-110"
            >
              Buscar
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-cyan-100 bg-cyan-50/70 p-3 dark:border-slate-700 dark:bg-slate-800/70">
          <button
            type="button"
            onClick={() => {
              setError('');
              setSuccess('');
              setCreateError('');
              setCreateSuccess('');
              setCreatingUser(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white"
          >
            <Plus className="h-3.5 w-3.5" />
            Crear perfil
          </button>
          <button
            type="button"
            onClick={async () => {
              setError('');
              setSuccess('');
              try {
                const res = await adminApi.createTeacherCode();
                setTeacherCode(res.data.code);
              } catch (err) {
                setError(err?.response?.data?.error || 'No se pudo generar el codigo docente.');
              }
            }}
            className="rounded-lg bg-brand-500 px-3 py-2 text-xs font-bold text-white"
          >
            Generar codigo docente
          </button>
          {teacherCode && (
            <span className="rounded-lg bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-800 dark:bg-brand-500/20 dark:text-brand-100">
              Codigo: {teacherCode}
            </span>
          )}
        </div>

        {error && <p className="mt-4 rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700 dark:bg-red-500/20 dark:text-red-100">{error}</p>}
        {success && <p className="mt-4 rounded-lg bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100">{success}</p>}

        <div className="mt-4 overflow-x-auto rounded-2xl border border-cyan-100 dark:border-slate-700">
          <table className="min-w-[720px] w-full table-fixed text-left text-sm">
            <colgroup>
              <col className="w-1/5" />
              <col className="w-1/5" />
              <col className="w-1/5" />
              <col className="w-1/5" />
              <col className="w-1/5" />
            </colgroup>
            <thead className="bg-cyan-50 text-xs uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 text-center">Usuario</th>
                <th className="px-4 py-3 text-center">Rol</th>
                <th className="px-4 py-3 text-center">Ultimo acceso</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center">
                    <RobotLoader label="Cargando usuarios..." scale={0.7} />
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="border-t border-cyan-100 bg-white/60 dark:border-slate-700 dark:bg-slate-900/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-start gap-3 pl-2">
                        <div className="h-10 w-10 overflow-hidden rounded-full border border-cyan-100 bg-cyan-50 dark:border-slate-700 dark:bg-slate-800">
                          {u.profilePhotoUrl ? (
                            <img src={u.profilePhotoUrl} alt="perfil" className="h-full w-full object-cover" />
                          ) : (
                            <div className="grid h-full w-full place-items-center">
                              <UserRound className="h-5 w-5 text-slate-500 dark:text-slate-300" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-left font-semibold text-slate-800 dark:text-slate-100">{u.name} {u.lastName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${ROLE_BADGES[u.role] || 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-100'}`}>
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">{formatDate(u.lastLoginAt)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${u.isActive ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-100' : 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-100'}`}>
                        {u.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-4">
                        <button
                          type="button"
                          onClick={() => openEditModal(u)}
                          disabled={busyId === u._id}
                          title="Editar usuario"
                          className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500/15 text-brand-700 ring-1 ring-brand-300/40 transition hover:bg-brand-500/25 disabled:opacity-50 dark:text-brand-100"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSuccess('');
                            setError('');
                            setDeletingUser(u);
                          }}
                          disabled={busyId === u._id}
                          title="Eliminar usuario"
                          className="grid h-8 w-8 place-items-center rounded-lg bg-red-500/15 text-red-700 ring-1 ring-red-300/40 transition hover:bg-red-500/25 disabled:opacity-50 dark:text-red-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}

              {!loading && !users.length && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-300">
                    No hay usuarios para mostrar con ese filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-cyan-100 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold">Editar perfil de usuario</h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">Los cambios se guardan directamente en la base de datos.</p>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                disabled={busyId === editingUser._id}
                className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                Nombre
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400 dark:border-slate-600 dark:bg-slate-800"
                />
              </label>

              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                Apellido
                <input
                  value={editForm.lastName}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, lastName: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400 dark:border-slate-600 dark:bg-slate-800"
                />
              </label>

              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                Correo
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400 dark:border-slate-600 dark:bg-slate-800"
                />
              </label>

              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                Documento
                <input
                  value={editForm.document}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, document: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400 dark:border-slate-600 dark:bg-slate-800"
                />
              </label>

              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                Telefono
                <input
                  value={editForm.phone}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400 dark:border-slate-600 dark:bg-slate-800"
                />
              </label>

              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                Rol
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, role: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400 dark:border-slate-600 dark:bg-slate-800"
                >
                  <option value="STUDENT">Estudiante</option>
                  <option value="TEACHER">Docente</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </label>

              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300 sm:col-span-2">
                URL imagen de perfil
                <input
                  value={editForm.profilePhotoUrl}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, profilePhotoUrl: e.target.value }))}
                  placeholder="https://..."
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400 dark:border-slate-600 dark:bg-slate-800"
                />
              </label>

              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300 sm:col-span-2">
                Estado
                <select
                  value={String(editForm.isActive)}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, isActive: e.target.value === 'true' }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400 dark:border-slate-600 dark:bg-slate-800"
                >
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeEditModal}
                disabled={busyId === editingUser._id}
                className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-300 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveEdit}
                disabled={busyId === editingUser._id}
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
              >
                {busyId === editingUser._id ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4">
          <div className="w-full max-w-md rounded-2xl border border-cyan-100 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <h3 className="text-lg font-bold">Eliminar usuario</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Vas a eliminar a <span className="font-semibold">{deletingUser.name} {deletingUser.lastName}</span>. Esta accion no se puede deshacer.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  if (busyId === deletingUser._id) return;
                  setDeletingUser(null);
                }}
                disabled={busyId === deletingUser._id}
                className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-300 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={busyId === deletingUser._id}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
              >
                {busyId === deletingUser._id ? 'Eliminando...' : 'Eliminar usuario'}
              </button>
            </div>
          </div>
        </div>
      )}

      {creatingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-cyan-100 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold">Crear perfil</h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">Crea estudiantes o docentes desde administración.</p>
              </div>
              <button
                type="button"
                onClick={closeCreateModal}
                disabled={busyId === '__creating__'}
                className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {createError && (
                <p className="sm:col-span-2 rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700 dark:bg-red-500/20 dark:text-red-100">
                  {createError}
                </p>
              )}
              {createSuccess && (
                <p className="sm:col-span-2 rounded-lg bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100">
                  {createSuccess}
                </p>
              )}

              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                Nombre
                <input
                  value={createForm.name}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal normal-case outline-none focus:border-brand-400 dark:border-slate-600 dark:bg-slate-800"
                />
              </label>

              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                Apellido
                <input
                  value={createForm.lastName}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, lastName: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal normal-case outline-none focus:border-brand-400 dark:border-slate-600 dark:bg-slate-800"
                />
              </label>

              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                Correo
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal normal-case outline-none focus:border-brand-400 dark:border-slate-600 dark:bg-slate-800"
                />
              </label>

              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                Documento
                <input
                  value={createForm.document}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, document: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal normal-case outline-none focus:border-brand-400 dark:border-slate-600 dark:bg-slate-800"
                />
              </label>

              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                Telefono
                <input
                  value={createForm.phone}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, phone: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal normal-case outline-none focus:border-brand-400 dark:border-slate-600 dark:bg-slate-800"
                />
              </label>

              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                Rol
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, role: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal normal-case outline-none focus:border-brand-400 dark:border-slate-600 dark:bg-slate-800"
                >
                  <option value="STUDENT">Estudiante</option>
                  <option value="TEACHER">Docente</option>
                </select>
              </label>

              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300 sm:col-span-2">
                Contraseña
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, password: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal normal-case outline-none focus:border-brand-400 dark:border-slate-600 dark:bg-slate-800"
                />
              </label>

              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300 sm:col-span-2">
                URL imagen de perfil
                <input
                  value={createForm.profilePhotoUrl}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, profilePhotoUrl: e.target.value }))}
                  placeholder="https://..."
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal normal-case outline-none focus:border-brand-400 dark:border-slate-600 dark:bg-slate-800"
                />
              </label>

              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300 sm:col-span-2">
                Estado inicial
                <select
                  value={String(createForm.isActive)}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, isActive: e.target.value === 'true' }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal normal-case outline-none focus:border-brand-400 dark:border-slate-600 dark:bg-slate-800"
                >
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeCreateModal}
                disabled={busyId === '__creating__'}
                className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-300 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={createUser}
                disabled={busyId === '__creating__'}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
              >
                {busyId === '__creating__' ? 'Creando...' : 'Crear perfil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
