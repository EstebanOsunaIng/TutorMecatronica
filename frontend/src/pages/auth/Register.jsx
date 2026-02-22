import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import RobotLoader from '../../components/common/RobotLoader.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
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
  const [inputHint, setInputHint] = useState({ field: '', message: '', visible: false });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isMobileVisual, setIsMobileVisual] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 1080 || window.matchMedia('(orientation: portrait)').matches;
  });
  const hintTimeoutRef = useRef(null);
  const hintCooldownRef = useRef({});

  const LETTERS_REGEX = /^[A-Za-zÀ-ÿ\u00f1\u00d1\s]+$/;

  const isValidEmailStrict = (value) => {
    const email = String(value || '').trim();
    if (!email || email.includes(' ')) return false;
    const parts = email.split('@');
    if (parts.length !== 2) return false;
    const [local, domain] = parts;
    if (!local || !domain || !domain.includes('.')) return false;
    const domainParts = domain.split('.').filter(Boolean);
    if (domainParts.length < 2) return false;
    const tld = domainParts[domainParts.length - 1];
    return tld.length >= 2;
  };

  useEffect(() => {
    return () => {
      if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handleViewport = () => {
      setIsMobileVisual(window.innerWidth <= 1080 || window.matchMedia('(orientation: portrait)').matches);
    };
    handleViewport();
    window.addEventListener('resize', handleViewport);
    window.addEventListener('orientationchange', handleViewport);
    return () => {
      window.removeEventListener('resize', handleViewport);
      window.removeEventListener('orientationchange', handleViewport);
    };
  }, []);

  const showInputHint = (field, message) => {
    const now = Date.now();
    const prev = hintCooldownRef.current[field] || 0;
    if (now - prev < 350) return;
    hintCooldownRef.current[field] = now;

    setInputHint({ field, message, visible: true });
    if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
    hintTimeoutRef.current = setTimeout(() => {
      setInputHint((prevState) => ({ ...prevState, visible: false }));
    }, 1500);
  };

  const renderHint = (field) => {
    if (!inputHint.visible || inputHint.field !== field) return null;
    return (
      <div
        className={`pointer-events-none absolute left-0 top-full z-20 mt-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold shadow-md transition ${
          isDark ? 'bg-slate-800 text-sky-100 ring-1 ring-sky-500/30' : 'bg-sky-50 text-sky-800 ring-1 ring-sky-200'
        }`}
        role="status"
        aria-live="polite"
      >
        {inputHint.message}
      </div>
    );
  };

  const update = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleLettersBeforeInput = (field) => (e) => {
    if (!e.data) return;
    if (!LETTERS_REGEX.test(e.data)) {
      e.preventDefault();
      showInputHint(field, 'Solo se aceptan letras');
    }
  };

  const handleLettersPaste = (field) => (e) => {
    const pasted = e.clipboardData.getData('text') || '';
    const filtered = pasted.replace(/[^A-Za-zÀ-ÿ\u00f1\u00d1\s]/g, '');
    if (!filtered) {
      e.preventDefault();
      showInputHint(field, 'Solo se aceptan letras');
      return;
    }
    if (filtered !== pasted) {
      showInputHint(field, 'Solo se aceptan letras');
    }
    e.preventDefault();
    const target = e.currentTarget;
    const start = target.selectionStart ?? target.value.length;
    const end = target.selectionEnd ?? target.value.length;
    const next = `${target.value.slice(0, start)}${filtered}${target.value.slice(end)}`;
    update(field, next);
  };

  const handleNumericBeforeInput = (field, max = 10) => (e) => {
    if (!e.data) return;
    if (!/^\d+$/.test(e.data)) {
      e.preventDefault();
      showInputHint(field, 'Solo se aceptan numeros');
      return;
    }

    const target = e.currentTarget;
    const start = target.selectionStart ?? target.value.length;
    const end = target.selectionEnd ?? target.value.length;
    const nextLength = target.value.length - (end - start) + e.data.length;
    if (nextLength > max) {
      e.preventDefault();
      showInputHint(field, 'Maximo 10 digitos');
    }
  };

  const handleNumericPaste = (field, max = 10) => (e) => {
    const pasted = e.clipboardData.getData('text') || '';
    const onlyDigits = pasted.replace(/\D/g, '');
    if (!onlyDigits) {
      e.preventDefault();
      showInputHint(field, 'Solo se aceptan numeros');
      return;
    }

    const target = e.currentTarget;
    const start = target.selectionStart ?? target.value.length;
    const end = target.selectionEnd ?? target.value.length;
    const nextRaw = `${target.value.slice(0, start)}${onlyDigits}${target.value.slice(end)}`;
    const next = nextRaw.slice(0, max);

    e.preventDefault();
    update(field, next);

    if (onlyDigits !== pasted) showInputHint(field, 'Solo se aceptan numeros');
    if (nextRaw.length > max) showInputHint(field, 'Maximo 10 digitos');
  };

  const validateForm = (strict = false) => {
    const nextErrors = {};
    if ((strict || form.name.trim()) && !LETTERS_REGEX.test(form.name.trim())) nextErrors.name = 'Solo letras y espacios.';
    if ((strict || form.lastName.trim()) && !LETTERS_REGEX.test(form.lastName.trim())) nextErrors.lastName = 'Solo letras y espacios.';
    if ((strict || form.document.trim()) && !/^\d{10}$/.test(form.document.trim())) nextErrors.document = 'Identificacion invalida: 10 digitos.';
    if ((strict || form.phone.trim()) && !/^\d{10}$/.test(form.phone.trim())) nextErrors.phone = 'Celular invalido: 10 digitos.';
    if ((strict || form.email.trim()) && !isValidEmailStrict(form.email)) nextErrors.email = 'El correo debe incluir @ y un dominio valido';
    if ((strict || form.password) && (form.password || '').trim().length < 6) nextErrors.password = 'Contrasena invalida: minimo 6 caracteres.';
    if ((strict || form.confirm) && form.password !== form.confirm) nextErrors.confirm = 'Las contrasenas no coinciden.';
    if (form.role === 'DOCENTE' && (strict || form.teacherCode.trim()) && !form.teacherCode.trim()) nextErrors.teacherCode = 'Codigo docente requerido.';
    return nextErrors;
  };

  const validationErrors = validateForm(false);
  const hasValidationErrors = Object.keys(validationErrors).length > 0;
  const authBackground = isDark
    ? isMobileVisual
      ? '/assets/modo-oscuro-C.png'
      : '/assets/modo-oscuro-B.png'
    : isMobileVisual
      ? '/assets/modo-claro-C.png'
      : '/assets/modo-claro-B.png';

  const inputClass = `block w-full rounded-xl px-4 py-2.5 text-[0.95rem] shadow-sm outline-none transition ${
    isDark
      ? 'border border-sky-900/60 bg-[#082447] text-white placeholder:text-sky-100/35 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/25'
      : 'border border-[#9ebbd4] bg-[#edf4fb] text-[#243447] placeholder:text-[#6d8094] focus:border-[#2c8fd3] focus:ring-2 focus:ring-[#2c8fd3]/25'
  }`;

  const labelClass = `block text-[11px] font-bold uppercase tracking-[0.16em] ${isDark ? 'text-sky-200/75' : 'text-[#647384]'}`;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const nextErrors = validateForm(true);
    if (Object.keys(nextErrors).length > 0) {
      if (nextErrors.email) {
        showInputHint('email', 'El correo debe incluir @ y un dominio valido');
        toast.warning('Correo inválido', 'El correo debe incluir @ y un dominio válido.');
      } else {
        setError(Object.values(nextErrors)[0]);
        toast.warning('Revisa el formulario', Object.values(nextErrors)[0]);
      }
      return;
    }
    try {
      setSubmitting(true);
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
      toast.success('Registro exitoso', 'Tu cuenta fue creada correctamente.');
      navigate('/login');
    } catch (err) {
      const apiError = err?.response?.data?.error || err?.response?.data?.message;
      setError(apiError || 'No se pudo registrar');
      toast.error('No se pudo registrar', apiError || 'Intenta nuevamente en unos segundos.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={`min-h-screen w-full ${isDark ? 'text-white' : 'text-[#10253c]'}`}
      style={{
        fontFamily: 'Roboto, sans-serif',
        backgroundImage: `url(${authBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
        <section className="hidden items-end p-10 md:flex lg:p-14">
            <div className={`max-w-lg ${isDark ? 'text-white' : 'text-[#0d2746]'}`}>
              <h1 className="mt-4 text-3xl font-extrabold leading-tight md:text-4xl lg:text-[3rem] lg:leading-[1.03]">
                Construyendo el futuro de la ingeniería mecatrónica.
              </h1>
              <p className={`mt-5 text-lg font-medium md:text-xl lg:text-[1.5rem] lg:leading-snug ${isDark ? 'text-sky-100' : 'text-[#2f4359]'}`}>
                Únete a la comunidad académica de la Universitaria de Colombia.
              </p>
            </div>
        </section>

        <section className="relative flex w-full items-center justify-center px-5 py-6 md:px-8 lg:px-12 lg:py-4">
          <div className={`relative w-full max-w-[540px] rounded-[2rem] p-5 backdrop-blur-xl md:p-6 ${isDark ? 'border border-sky-800/80 bg-[#0a2746]/78 shadow-xl shadow-sky-950/30' : 'border border-[#9fc0da]/92 bg-[#e9f2fb]/86 shadow-2xl shadow-cyan-700/20'}`}>
            {submitting && (
              <div className={`absolute inset-0 z-20 grid place-items-center rounded-[2rem] ${isDark ? 'bg-slate-950/60' : 'bg-white/70'}`}>
                <RobotLoader label="Registrando..." scale={0.9} />
              </div>
            )}
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
              <div className="mx-auto flex h-14 w-[260px] items-center justify-center overflow-hidden md:h-16 md:w-[280px]">
                <img
                  src={isDark ? '/assets/universitaria-logo-on-dark.png' : '/assets/universitaria-logo-on-light.png'}
                  alt="Logo Universitaria de Colombia"
                  className="h-full w-full object-contain"
                  style={{ transform: isDark ? 'scale(1.6)' : 'scale(0.82)' }}
                />
              </div>
              <h2 className={`mt-3 text-[2.1rem] font-extrabold leading-none tracking-tight ${isDark ? 'text-white' : 'text-[#092748]'}`}>TuVir Académico</h2>
              <p className={`mt-1.5 text-[0.95rem] ${isDark ? 'text-sky-100/85' : 'text-[#5f7184]'}`}>Crea tu perfil institucional</p>
            </div>

            <form onSubmit={submit} className="space-y-3">
              {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</div>}

              <div className={`grid grid-cols-2 gap-1.5 rounded-xl border p-1.5 ${isDark ? 'border-sky-900/40 bg-[#082447]' : 'border-[#a8c3da] bg-[#dfeaf6]'}`}>
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
                  <div className="relative mt-1.5">
                    <input
                      id="name"
                      placeholder="Ej. Carlos"
                      className={inputClass}
                      value={form.name}
                      onBeforeInput={handleLettersBeforeInput('name')}
                      onPaste={handleLettersPaste('name')}
                      onChange={(e) => update('name', e.target.value)}
                      required
                    />
                    {renderHint('name')}
                  </div>
                </div>

                <div>
                  <label htmlFor="lastName" className={labelClass}>Apellido</label>
                  <div className="relative mt-1.5">
                    <input
                      id="lastName"
                      placeholder="Apellido"
                      className={inputClass}
                      value={form.lastName}
                      onBeforeInput={handleLettersBeforeInput('lastName')}
                      onPaste={handleLettersPaste('lastName')}
                      onChange={(e) => update('lastName', e.target.value)}
                      required
                    />
                    {renderHint('lastName')}
                  </div>
                </div>

                <div>
                  <label htmlFor="document" className={labelClass}>Identificación</label>
                  <div className="relative mt-1.5">
                    <input
                      id="document"
                      placeholder="Documento"
                      className={inputClass}
                      value={form.document}
                      onBeforeInput={handleNumericBeforeInput('document', 10)}
                      onPaste={handleNumericPaste('document', 10)}
                      onChange={(e) => update('document', e.target.value)}
                      required
                    />
                    {renderHint('document')}
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className={labelClass}>Celular</label>
                  <div className="relative mt-1.5">
                    <input
                      id="phone"
                      placeholder="Número celular"
                      className={inputClass}
                      value={form.phone}
                      onBeforeInput={handleNumericBeforeInput('phone', 10)}
                      onPaste={handleNumericPaste('phone', 10)}
                      onChange={(e) => update('phone', e.target.value)}
                      required
                    />
                    {renderHint('phone')}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="email" className={labelClass}>Correo institucional</label>
                  <div className="mt-1.5">
                    <input
                      id="email"
                      type="email"
                      autoComplete="username"
                      placeholder="usuario@universitaria.edu.co"
                      className={inputClass}
                      value={form.email}
                      onBlur={() => {
                        if (!isValidEmailStrict(form.email)) {
                          showInputHint('email', 'El correo debe incluir @ y un dominio valido');
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key !== 'Enter') return;
                        if (!isValidEmailStrict(form.email)) {
                          e.preventDefault();
                          showInputHint('email', 'El correo debe incluir @ y un dominio valido');
                        }
                      }}
                      onChange={(e) => update('email', e.target.value)}
                      required
                    />
                    {renderHint('email')}
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
                disabled={hasValidationErrors}
                className={`mt-1 flex w-full justify-center rounded-xl px-4 py-2.5 text-[0.95rem] font-extrabold uppercase tracking-[0.12em] text-white shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${isDark ? 'bg-sky-500 hover:bg-sky-400 focus-visible:outline-sky-500' : 'bg-gradient-to-r from-[#1599e0] to-[#25aeea] hover:from-[#138ece] hover:to-[#209fd6] focus-visible:outline-[#1599e0]'}`}
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
