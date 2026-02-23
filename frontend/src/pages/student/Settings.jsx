import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, ImagePlus, Link2, Shield, UserRound, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { usersApi } from '../../api/users.api.js';
import { authApi } from '../../api/auth.api.js';
import RobotLoader from '../../components/common/RobotLoader.jsx';

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function StudentSettings() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [phone, setPhone] = useState(user?.phone || '');
  const [photo, setPhoto] = useState(user?.profilePhotoUrl || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState('');
  const [phoneInputHint, setPhoneInputHint] = useState('');

  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [photoDraft, setPhotoDraft] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);

  const roleBase = useMemo(() => {
    if (user?.role === 'ADMIN') return '/admin/settings';
    if (user?.role === 'TEACHER') return '/teacher/settings';
    return '/student/settings';
  }, [user?.role]);

  const isSecurityView = location.pathname.endsWith('/security');
  const userInitials = `${user?.name?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || 'U';
  const isAdminView = user?.role === 'ADMIN';
  const settingsPanelClass = isAdminView
    ? 'space-y-5 rounded-3xl border border-cyan-100/80 bg-gradient-to-br from-sky-50/85 via-cyan-50/65 to-slate-50 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40 dark:bg-none md:p-6'
    : 'space-y-5 rounded-3xl border border-cyan-100 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 md:p-6';

  const labelClass = 'text-sm font-semibold text-slate-800 dark:text-slate-200';
  const inputClass =
    'mt-1.5 w-full rounded-xl border border-cyan-100 bg-white/95 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-200/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-brand-400/20';

  const syncUser = (nextUser) => {
    localStorage.setItem('user', JSON.stringify(nextUser));
    setUser(nextUser);
  };

  useEffect(() => {
    let active = true;
    const loadMe = async () => {
      setIsPageLoading(true);
      try {
        const { data } = await usersApi.me();
        if (!active) return;
        const nextUser = data?.user;
        if (nextUser) {
          setPhone(nextUser.phone || '');
          setPhoto(nextUser.profilePhotoUrl || '');
          syncUser(nextUser);
        }
      } finally {
        if (active) setIsPageLoading(false);
      }
    };
    loadMe();
    return () => {
      active = false;
    };
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const { data } = await usersApi.updateMe({ phone, profilePhotoUrl: photo });
      syncUser(data.user);
      toast.success('Perfil actualizado', 'Los cambios se guardaron correctamente.');
    } catch (err) {
      toast.error('No se pudo actualizar', 'Intenta nuevamente en unos segundos.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  useEffect(() => {
    if (!phoneInputHint) return undefined;
    const timer = setTimeout(() => setPhoneInputHint(''), 1600);
    return () => clearTimeout(timer);
  }, [phoneInputHint]);

  const changePassword = async (e) => {
    e.preventDefault();
    setPasswordFeedback('');
    if (!oldPassword.trim() || !newPassword.trim()) {
      setPasswordFeedback('Completa la contraseña actual y la nueva contraseña.');
      return;
    }
    setIsSavingPassword(true);
    try {
      await authApi.changePassword({ currentPassword: oldPassword, newPassword });
      setOldPassword('');
      setNewPassword('');
      toast.success('Cambio de contraseña exitoso', 'Tu nueva contraseña ya fue guardada.');
    } catch (error) {
      const message = error?.response?.data?.error || 'No se pudo actualizar la contraseña.';
      setPasswordFeedback(message);
      toast.error('No se pudo actualizar', message);
    } finally {
      setIsSavingPassword(false);
    }
  };

  const openPhotoModal = () => {
    setPhotoDraft(photo || '');
    setIsPhotoModalOpen(true);
  };

  const closePhotoModal = () => {
    setIsPhotoModalOpen(false);
    setIsDragging(false);
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Solo puedes arrastrar archivos de imagen.');
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    setPhotoDraft(dataUrl);
  };

  const handleFileInput = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Selecciona un archivo de imagen valido.');
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    setPhotoDraft(dataUrl);
  };

  const applyPhoto = async () => {
    const nextPhoto = photoDraft.trim();
    setIsSavingPhoto(true);
    try {
      const { data } = await usersApi.updateMe({ profilePhotoUrl: nextPhoto });
      setPhoto(data.user.profilePhotoUrl || '');
      syncUser(data.user);
      setIsPhotoModalOpen(false);
    } finally {
      setIsSavingPhoto(false);
    }
  };

  const isSavingAny = isSavingProfile || isSavingPassword || isSavingPhoto;

  return (
    <>
      {isPageLoading && <RobotLoader label="Cargando configuración..." scale={0.9} overlay />}
      <div className="mx-auto max-w-4xl space-y-4 pb-3">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mt-1 rounded-lg p-1.5 text-slate-700 transition hover:bg-white/70 dark:text-slate-200 dark:hover:bg-slate-800"
            aria-label="Volver"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-[1.875rem] font-black tracking-tight text-slate-900 dark:text-slate-100">Configuración de Cuenta</h1>
            <p className="text-base text-slate-600 dark:text-slate-300">Administra tu información personal y seguridad</p>
          </div>
        </div>

        <div className="w-full max-w-md rounded-2xl border border-cyan-100 bg-cyan-50/60 p-1 dark:border-slate-800 dark:bg-slate-900">
          <div className="grid grid-cols-2 gap-1">
            <Link
              to={roleBase}
              className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                !isSecurityView
                  ? 'bg-sky-100 text-sky-900 shadow-sm ring-1 ring-sky-200 dark:bg-sky-500/20 dark:text-sky-100 dark:ring-sky-400/30'
                  : 'text-slate-600 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-slate-800/70'
              }`}
            >
              <UserRound className="h-4 w-4" />
              Información Personal
            </Link>
            <Link
              to={`${roleBase}/security`}
              className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                isSecurityView
                  ? 'bg-sky-100 text-sky-900 shadow-sm ring-1 ring-sky-200 dark:bg-sky-500/20 dark:text-sky-100 dark:ring-sky-400/30'
                  : 'text-slate-600 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-slate-800/70'
              }`}
            >
              <Shield className="h-4 w-4" />
              Seguridad
            </Link>
          </div>
        </div>

        {!isSecurityView ? (
          <form
            onSubmit={save}
            className={`relative ${settingsPanelClass}`}
          >
            {isSavingAny && (
              <div className="absolute inset-0 z-20 grid place-items-center rounded-3xl bg-white/70 dark:bg-slate-950/60">
                <RobotLoader label="Guardando..." scale={0.85} />
              </div>
            )}
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">Información Personal</h2>

            <div className="flex flex-wrap items-center gap-4 border-b border-cyan-100 pb-4 dark:border-slate-700">
              <button
                type="button"
                onClick={openPhotoModal}
                className="group relative rounded-full"
                aria-label="Cambiar foto de perfil"
              >
                {photo ? (
                  <img
                    src={photo}
                    alt="Foto de perfil"
                    className="h-20 w-20 rounded-full border border-cyan-200 object-cover dark:border-slate-700"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-800 text-3xl font-semibold text-white">
                    {userInitials}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 rounded-full bg-brand-700 p-2 text-white shadow transition group-hover:bg-brand-600">
                  <Camera className="h-3.5 w-3.5" />
                </span>
              </button>
              <div>
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100">Foto de Perfil</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">Haz clic en el icono para cambiar tu foto</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>Nombre</label>
                <input disabled className={`${inputClass} opacity-80`} value={user?.name || ''} />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Correo Electrónico</label>
                <input disabled className={`${inputClass} opacity-80`} value={user?.email || ''} />
              </div>

              <div>
                <label className={labelClass}>Teléfono</label>
                <div className="relative mt-1.5">
                  <input
                    className={`${inputClass} mt-0`}
                    value={phone}
                    onBeforeInput={(e) => {
                      if (!e.data) return;
                      if (!/^\d+$/.test(e.data)) {
                        e.preventDefault();
                        setPhoneInputHint('Solo se aceptan numeros');
                        return;
                      }
                      if ((phone || '').length >= 10) {
                        e.preventDefault();
                        setPhoneInputHint('Maximo 10 digitos');
                      }
                    }}
                    onPaste={(e) => {
                      const pasted = e.clipboardData.getData('text') || '';
                      const digits = pasted.replace(/\D/g, '');
                      e.preventDefault();
                      if (!digits) {
                        setPhoneInputHint('Solo se aceptan numeros');
                        return;
                      }
                      const next = `${phone || ''}${digits}`.slice(0, 10);
                      setPhone(next);
                      if (digits !== pasted) setPhoneInputHint('Solo se aceptan numeros');
                    }}
                    onChange={(e) => setPhone(String(e.target.value || '').replace(/\D/g, '').slice(0, 10))}
                  />
                  {phoneInputHint && (
                    <div className="pointer-events-none absolute left-0 top-full z-20 mt-1 rounded-lg bg-slate-800 px-2.5 py-1.5 text-[11px] font-semibold text-sky-100 ring-1 ring-sky-500/30" role="status" aria-live="polite">
                      {phoneInputHint}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className={labelClass}>Identificación</label>
                <input disabled className={`${inputClass} opacity-80`} value={user?.document || ''} />
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2.5">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="rounded-xl border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button className="rounded-xl bg-brand-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-600">
                Guardar Cambios
              </button>
            </div>
          </form>
        ) : (
          <form
            onSubmit={changePassword}
            className={`relative ${settingsPanelClass}`}
          >
            {isSavingAny && (
              <div className="absolute inset-0 z-20 grid place-items-center rounded-3xl bg-white/70 dark:bg-slate-950/60">
                <RobotLoader label="Guardando..." scale={0.85} />
              </div>
            )}
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">Cambiar Contraseña</h2>

            <div className="space-y-4">
              {passwordFeedback && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
                  {passwordFeedback}
                </div>
              )}
              <div>
                <label className={labelClass}>Contraseña Actual</label>
                <div className="relative mt-1.5">
                  <input
                    type={showOldPassword ? 'text' : 'password'}
                    className={`${inputClass} mt-0 pr-12`}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-500 transition hover:text-slate-800 dark:text-slate-300 dark:hover:text-white"
                    aria-label={showOldPassword ? 'Ocultar contraseña actual' : 'Mostrar contraseña actual'}
                  >
                    {showOldPassword ? (
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 3l18 18" />
                        <path d="M10.58 10.58a2 2 0 012.83 2.83" />
                        <path d="M9.88 5.09A10.94 10.94 0 0112 5c5.05 0 9.27 3.11 11 7-1.03 2.28-2.84 4.19-5.14 5.29" />
                        <path d="M6.11 6.11C4.18 7.24 2.71 8.98 2 12c1.73 3.89 5.95 7 11 7 1.22 0 2.4-.18 3.51-.52" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className={labelClass}>Nueva Contraseña</label>
                <div className="relative mt-1.5">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    className={`${inputClass} mt-0 pr-12`}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-500 transition hover:text-slate-800 dark:text-slate-300 dark:hover:text-white"
                    aria-label={showNewPassword ? 'Ocultar nueva contraseña' : 'Mostrar nueva contraseña'}
                  >
                    {showNewPassword ? (
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 3l18 18" />
                        <path d="M10.58 10.58a2 2 0 012.83 2.83" />
                        <path d="M9.88 5.09A10.94 10.94 0 0112 5c5.05 0 9.27 3.11 11 7-1.03 2.28-2.84 4.19-5.14 5.29" />
                        <path d="M6.11 6.11C4.18 7.24 2.71 8.98 2 12c1.73 3.89 5.95 7 11 7 1.22 0 2.4-.18 3.51-.52" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2.5">
              <button
                type="button"
                onClick={() => navigate(roleBase)}
                className="rounded-xl border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                disabled={isSavingPassword}
                className="rounded-xl bg-brand-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
              >
                {isSavingPassword ? 'Actualizando...' : 'Actualizar Contraseña'}
              </button>
            </div>
          </form>
        )}
      </div>

      {isPhotoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-cyan-100 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Actualizar foto de perfil</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">Arrastra una imagen o pega una URL.</p>
              </div>
              <button
                type="button"
                onClick={closePhotoModal}
                className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                aria-label="Cerrar ventana"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              className={`mb-4 rounded-2xl border-2 border-dashed p-4 text-center transition ${
                isDragging
                  ? 'border-brand-400 bg-brand-50/80 dark:bg-brand-500/10'
                  : 'border-cyan-200 bg-cyan-50/70 dark:border-slate-700 dark:bg-slate-800/50'
              }`}
            >
              <ImagePlus className="mx-auto h-7 w-7 text-brand-500" />
              <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-100">Arrastra tu imagen aquí</p>
              <p className="text-xs text-slate-600 dark:text-slate-300">o selecciónala desde tu computador</p>
              <label className="mt-3 inline-flex cursor-pointer items-center rounded-xl border border-cyan-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800">
                Seleccionar archivo
                <input type="file" accept="image/*" className="hidden" onChange={handleFileInput} />
              </label>
            </div>

            <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
              <Link2 className="h-4 w-4" />
              URL de la foto
            </label>
            <input
              autoFocus
              className={inputClass}
              placeholder="https://..."
              value={photoDraft}
              onChange={(e) => setPhotoDraft(e.target.value)}
            />

            {!!photoDraft && (
              <div className="mt-4 rounded-xl border border-cyan-100 bg-cyan-50/50 p-3 dark:border-slate-700 dark:bg-slate-800/40">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Vista previa</p>
                <img src={photoDraft} alt="Vista previa" className="h-24 w-24 rounded-full border border-cyan-200 object-cover dark:border-slate-700" />
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={closePhotoModal}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={applyPhoto}
                disabled={isSavingPhoto}
                className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
              >
                {isSavingPhoto ? 'Guardando...' : 'Guardar imagen'}
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
