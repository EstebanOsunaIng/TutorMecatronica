import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import RobotLoader from '../../components/common/RobotLoader.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isMobileVisual, setIsMobileVisual] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 1080 || window.matchMedia('(orientation: portrait)').matches;
  });

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

  const emailError = email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim().toLowerCase()) ? 'Correo invalido.' : '';
  const hasValidationErrors = Boolean(emailError);
  const authBackground = isDark
    ? isMobileVisual
      ? '/assets/modo-oscuro-C.png'
      : '/assets/modo-oscuro-B.png'
    : isMobileVisual
      ? '/assets/modo-claro-C.png'
      : '/assets/modo-claro-B.png';

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Correo y contrasena son obligatorios.');
      return;
    }
    if (hasValidationErrors) {
      setError('Corrige los campos antes de continuar.');
      return;
    }
    try {
      setSubmitting(true);
      await login(email, password);
      navigate('/');
    } catch (err) {
      const apiError = err?.response?.data?.error || err?.response?.data?.message;
      if (apiError) {
        setError(apiError);
      } else {
        setError('Credenciales invalidas');
      }
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
              <h1 className="text-3xl font-extrabold leading-tight md:text-4xl lg:text-[3rem] lg:leading-[1.03]">
                Construyendo el futuro de la ingeniería mecatrónica.
              </h1>
              <p className={`mt-5 text-lg font-medium md:text-xl lg:text-[1.5rem] lg:leading-snug ${isDark ? 'text-sky-100' : 'text-[#2f4359]'}`}>
                Únete a la comunidad académica de la Universitaria de Colombia.
              </p>
            </div>
        </section>

        <section className="relative flex w-full items-center justify-center px-5 py-8 md:px-10 lg:px-14">
          <div className={`relative w-full max-w-[540px] rounded-[2rem] p-7 backdrop-blur-xl md:p-10 ${isDark ? 'border border-sky-800/80 bg-[#0a2746]/78 shadow-xl shadow-sky-950/30' : 'border border-[#9fc0da]/92 bg-[#e9f2fb]/86 shadow-2xl shadow-cyan-700/20'}`}>
            {submitting && (
              <div className={`absolute inset-0 z-20 grid place-items-center rounded-[2rem] ${isDark ? 'bg-slate-950/60' : 'bg-white/70'}`}>
                <RobotLoader label="Ingresando..." scale={0.9} />
              </div>
            )}
            <div className="absolute right-5 top-5">
              <button
                onClick={toggleTheme}
                className={`rounded-2xl p-2.5 transition ${isDark ? 'border border-sky-700/50 bg-[#0b2a4b] text-sky-200 hover:bg-[#123763] hover:text-white' : 'border border-[#b7cede] bg-[#dbeaf5] text-[#0f4a7c] shadow-sm shadow-slate-300/50 hover:bg-[#d1e4f2] hover:text-[#0b3f6b]'}`}
                aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              >
                {theme === 'dark' ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                )}
              </button>
            </div>

            <div className="mb-8 pt-4 text-center">
              <div className="mx-auto flex h-14 w-[260px] items-center justify-center overflow-hidden md:h-16 md:w-[280px]">
                <img
                  src={isDark ? '/assets/universitaria-logo-on-dark.png' : '/assets/universitaria-logo-on-light.png'}
                  alt="Logo Universitaria de Colombia"
                  className="h-full w-full object-contain"
                  style={{ transform: isDark ? 'scale(1.6)' : 'scale(0.82)' }}
                />
              </div>
              <h2 className={`mt-4 text-[2.2rem] font-extrabold leading-none tracking-tight ${isDark ? 'text-white' : 'text-[#092748]'}`}>TuVir Académico</h2>
              <p className={`mt-3 text-[1.1rem] ${isDark ? 'text-sky-100/85' : 'text-[#5f7184]'}`}>Bienvenido al ecosistema industrial</p>
            </div>

            <form onSubmit={submit} className="space-y-5">
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className={`block text-sm font-bold uppercase tracking-[0.18em] ${isDark ? 'text-sky-200/75' : 'text-[#647384]'}`}>
                  Correo institucional
                </label>
                <div className="mt-1.5">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="username"
                    required
                    placeholder="usuario@universitaria.edu.co"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`block w-full rounded-xl px-4 py-3 text-[1.05rem] shadow-sm outline-none transition ${isDark ? 'border border-sky-900/60 bg-[#082447] text-white placeholder:text-sky-100/35 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/25' : 'border border-[#9ebbd4] bg-[#edf4fb] text-[#243447] placeholder:text-[#6d8094] focus:border-[#2c8fd3] focus:ring-2 focus:ring-[#2c8fd3]/25'}`}
                  />
                  {emailError && <p className="mt-1 text-xs text-red-500">{emailError}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="password" className={`block text-sm font-bold uppercase tracking-[0.18em] ${isDark ? 'text-sky-200/75' : 'text-[#647384]'}`}>
                  Contraseña
                </label>
                <div className="mt-1.5 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`block w-full rounded-xl px-4 py-3 pr-12 text-[1.05rem] shadow-sm outline-none transition ${isDark ? 'border border-sky-900/60 bg-[#082447] text-white placeholder:text-sky-100/35 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/25' : 'border border-[#9ebbd4] bg-[#edf4fb] text-[#243447] placeholder:text-[#6d8094] focus:border-[#2c8fd3] focus:ring-2 focus:ring-[#2c8fd3]/25'}`}
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
                <div className="mt-2 text-right text-sm">
                  <Link
                    to="/forgot-password"
                    className={`font-semibold ${isDark ? 'text-sky-300 hover:text-sky-200' : 'text-[#2f82bb] hover:text-[#1f5f92]'}`}
                  >
                    Olvidé mi contraseña
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={hasValidationErrors}
                  className={`flex w-full justify-center rounded-xl px-4 py-3 text-base font-extrabold uppercase tracking-[0.12em] text-white shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${isDark ? 'bg-sky-500 hover:bg-sky-400 focus-visible:outline-sky-500' : 'bg-gradient-to-r from-[#1599e0] to-[#25aeea] hover:from-[#138ece] hover:to-[#209fd6] focus-visible:outline-[#1599e0]'}`}
                >
                  Ingresar
                </button>
              </div>
            </form>

            <div className={`mt-8 border-t pt-6 ${isDark ? 'border-sky-900/50' : 'border-[#cad3dc]'}`}>
              <p className={`text-center text-sm ${isDark ? 'text-sky-100/75' : 'text-[#6d7b8a]'}`}>
                ¿No tienes cuenta?{' '}
                <Link to="/register" className={`font-semibold ${isDark ? 'text-sky-300 hover:text-sky-200' : 'text-[#2f82bb] hover:text-[#1f5f92]'}`}>
                  Regístrate aquí
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
