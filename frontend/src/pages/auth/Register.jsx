import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const [form, setForm] = useState({
    role: 'STUDENT',
    name: '',
    lastName: '',
    document: '',
    phone: '',
    email: '',
    password: '',
    confirm: '',
    teacherCode: ''
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const inputClass = `block w-full rounded-xl px-4 py-2.5 text-[0.95rem] shadow-sm outline-none transition ${
    isDark
      ? 'border border-sky-900/60 bg-[#082447] text-white placeholder:text-sky-100/35 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/25'
      : 'border border-[#c8d1db] bg-[#ffffff] text-[#2c3b4a] placeholder:text-[#7c8998] focus:border-[#2c8fd3] focus:ring-2 focus:ring-[#2c8fd3]/25'
  }`;

  const labelClass = `block text-[11px] font-bold uppercase tracking-[0.16em] ${isDark ? 'text-sky-200/75' : 'text-[#647384]'}`;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    try {
      await register({
        role: form.role === 'DOCENTE' ? 'TEACHER' : form.role,
        name: form.name,
        lastName: form.lastName,
        document: form.document,
        phone: form.phone,
        email: form.email,
        password: form.password,
        teacherCode: form.role === 'DOCENTE' ? form.teacherCode : undefined
      });
      navigate('/login');
    } catch (err) {
      setError('No se pudo registrar');
    }
  };

  return (
    <div className={`min-h-screen w-full ${isDark ? 'bg-[#020b1c] text-white' : 'bg-[#E4EAF2] text-[#10253c]'}`} style={{ fontFamily: 'Roboto, sans-serif' }}>
      <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
        <section className="relative hidden md:block">
          <img src={isDark ? '/assets/campus-placeholder.svg' : '/assets/fondoClaroLogin.png'} alt="Laboratorio de ingeniería mecatrónica" className="absolute inset-0 h-full w-full object-cover" />
          <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-r from-sky-900/80 via-slate-900/85 to-[#020b1c]' : 'bg-gradient-to-r from-[#dbe3ec]/60 via-[#cad4e0]/45 to-[#8ea0b8]/28'}`} />
          <div className="absolute inset-0 flex items-end p-10 lg:p-14">
            <div className={`max-w-lg ${isDark ? 'text-white' : 'text-[#0d2746]'}`}>
              <h1 className="mt-4 text-3xl font-extrabold leading-tight md:text-4xl lg:text-[3rem] lg:leading-[1.03]">
                Construyendo el futuro de la ingeniería mecatrónica.
              </h1>
              <p className={`mt-5 text-lg font-medium md:text-xl lg:text-[1.5rem] lg:leading-snug ${isDark ? 'text-sky-100' : 'text-[#2f4359]'}`}>
                Únete a la comunidad académica de la Universitaria de Colombia.
              </p>
            </div>
          </div>
        </section>

        <section className="relative flex w-full items-center justify-center px-5 py-6 md:px-8 lg:px-12 lg:py-4">
          <div className={`relative w-full max-w-[540px] rounded-[2rem] p-5 md:p-6 ${isDark ? 'border border-sky-900/50 bg-[#071b31]/95 shadow-xl shadow-sky-950/30' : 'border border-[#c6d2df] bg-[#fcfdff] shadow-2xl shadow-slate-400/30'}`}>
            <div className="absolute right-5 top-5">
              <button
                onClick={toggleTheme}
                className={`rounded-2xl p-2.5 transition ${isDark ? 'border border-sky-700/50 bg-[#0b2a4b] text-sky-200 hover:bg-[#123763] hover:text-white' : 'border border-[#b7cede] bg-[#dbeaf5] text-[#0f4a7c] shadow-sm shadow-slate-300/50 hover:bg-[#d1e4f2] hover:text-[#0b3f6b]'}`}
                aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                type="button"
              >
                {theme === 'dark' ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                )}
              </button>
            </div>

            <div className="mb-4 pt-2 text-center">
              <div className="mx-auto flex h-14 w-[250px] items-center justify-center md:h-16 md:w-[280px]">
                <img
                  src={isDark ? '/assets/universitaria-logo-on-dark.png' : '/assets/universitaria-logo-on-light.png'}
                  alt="Logo Universitaria de Colombia"
                  className="max-h-full w-auto max-w-full object-contain"
                />
              </div>
              <h2 className={`mt-3 text-[2.1rem] font-extrabold leading-none tracking-tight ${isDark ? 'text-white' : 'text-[#092748]'}`}>TuVir Académico</h2>
              <p className={`mt-1.5 text-[0.95rem] ${isDark ? 'text-sky-100/85' : 'text-[#5f7184]'}`}>Crea tu perfil institucional</p>
            </div>

            <form onSubmit={submit} className="space-y-3">
              {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</div>}

              <div className={`grid grid-cols-2 gap-1.5 rounded-xl border p-1.5 ${isDark ? 'border-sky-900/40 bg-[#082447]' : 'border-[#c8d2dc] bg-[#ecf2f8]'}`}>
                <button
                  type="button"
                  onClick={() => update('role', 'STUDENT')}
                  className={`rounded-lg py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] transition ${form.role === 'STUDENT' ? 'bg-sky-500 text-white' : isDark ? 'text-sky-200/75 hover:text-sky-100' : 'text-[#556779] hover:text-[#1f3f5f]'}`}
                >
                  Estudiante
                </button>
                <button
                  type="button"
                  onClick={() => update('role', 'DOCENTE')}
                  className={`rounded-lg py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] transition ${form.role === 'DOCENTE' ? 'bg-sky-500 text-white' : isDark ? 'text-sky-200/75 hover:text-sky-100' : 'text-[#556779] hover:text-[#1f3f5f]'}`}
                >
                  Docente
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label htmlFor="name" className={labelClass}>Nombre</label>
                  <div className="mt-1.5">
                    <input id="name" placeholder="Ej. Carlos" className={inputClass} value={form.name} onChange={(e) => update('name', e.target.value)} required />
                  </div>
                </div>

                <div>
                  <label htmlFor="lastName" className={labelClass}>Apellido</label>
                  <div className="mt-1.5">
                    <input id="lastName" placeholder="Apellido" className={inputClass} value={form.lastName} onChange={(e) => update('lastName', e.target.value)} required />
                  </div>
                </div>

                <div>
                  <label htmlFor="document" className={labelClass}>Identificación</label>
                  <div className="mt-1.5">
                    <input id="document" placeholder="Documento" className={inputClass} value={form.document} onChange={(e) => update('document', e.target.value)} required />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className={labelClass}>Celular</label>
                  <div className="mt-1.5">
                    <input id="phone" placeholder="Número celular" className={inputClass} value={form.phone} onChange={(e) => update('phone', e.target.value)} required />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="email" className={labelClass}>Correo institucional</label>
                  <div className="mt-1.5">
                    <input id="email" type="email" autoComplete="username" placeholder="usuario@universitaria.edu.co" className={inputClass} value={form.email} onChange={(e) => update('email', e.target.value)} required />
                  </div>
                </div>

                {form.role === 'DOCENTE' && (
                  <div className="md:col-span-2">
                    <label htmlFor="teacherCode" className={labelClass}>Código docente</label>
                    <div className="mt-1.5">
                      <input id="teacherCode" placeholder="Código docente" className={inputClass} value={form.teacherCode} onChange={(e) => update('teacherCode', e.target.value)} required />
                    </div>
                  </div>
                )}

                 <div>
                   <label htmlFor="password" className={labelClass}>Contraseña</label>
                   <div className="mt-1.5 relative">
                     <input
                       id="password"
                       type={showPassword ? 'text' : 'password'}
                       autoComplete="new-password"
                       placeholder="••••••••"
                       className={`${inputClass} pr-12`}
                       value={form.password}
                       onChange={(e) => update('password', e.target.value)}
                       required
                     />
                     <button
                       type="button"
                       onClick={() => setShowPassword((prev) => !prev)}
                       className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 transition ${isDark ? 'text-sky-200/80 hover:text-white' : 'text-[#4b5e71] hover:text-[#1f3f5f]'}`}
                       aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                     >
                       {showPassword ? (
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
                   <label htmlFor="confirm" className={labelClass}>Confirmar contraseña</label>
                   <div className="mt-1.5 relative">
                     <input
                       id="confirm"
                       type={showConfirm ? 'text' : 'password'}
                       autoComplete="new-password"
                       placeholder="••••••••"
                       className={`${inputClass} pr-12`}
                       value={form.confirm}
                       onChange={(e) => update('confirm', e.target.value)}
                       required
                     />
                     <button
                       type="button"
                       onClick={() => setShowConfirm((prev) => !prev)}
                       className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 transition ${isDark ? 'text-sky-200/80 hover:text-white' : 'text-[#4b5e71] hover:text-[#1f3f5f]'}`}
                       aria-label={showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                     >
                       {showConfirm ? (
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

              <button
                type="submit"
                className={`mt-1 flex w-full justify-center rounded-xl px-4 py-2.5 text-[0.95rem] font-extrabold uppercase tracking-[0.12em] text-white shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${isDark ? 'bg-sky-500 hover:bg-sky-400 focus-visible:outline-sky-500' : 'bg-gradient-to-r from-[#1599e0] to-[#25aeea] hover:from-[#138ece] hover:to-[#209fd6] focus-visible:outline-[#1599e0]'}`}
              >
                Crear mi cuenta
              </button>
            </form>

            <div className={`mt-4 border-t pt-4 ${isDark ? 'border-sky-900/50' : 'border-[#cad3dc]'}`}>
              <p className={`text-center text-xs ${isDark ? 'text-sky-100/75' : 'text-[#6d7b8a]'}`}>
                ¿Ya eres miembro?{' '}
                <Link to="/login" className={`font-semibold ${isDark ? 'text-sky-300 hover:text-sky-200' : 'text-[#2f82bb] hover:text-[#1f5f92]'}`}>
                  Inicia sesión
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
