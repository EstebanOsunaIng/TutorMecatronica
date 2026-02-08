import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../api/auth.api.js';
import { useTheme } from '../../context/ThemeContext.jsx';

export default function ForgotPassword() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');

  const inputClass = `block w-full rounded-xl px-4 py-2.5 text-[0.95rem] shadow-sm outline-none transition ${
    isDark
      ? 'border border-sky-900/60 bg-[#082447] text-white placeholder:text-sky-100/35 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/25'
      : 'border border-[#c8d1db] bg-[#ffffff] text-[#2c3b4a] placeholder:text-[#7c8998] focus:border-[#2c8fd3] focus:ring-2 focus:ring-[#2c8fd3]/25'
  }`;

  const labelClass = `block text-[11px] font-bold uppercase tracking-[0.16em] ${isDark ? 'text-sky-200/75' : 'text-[#647384]'}`;

  const requestCode = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await authApi.forgot({ email });
      setStep(2);
    } catch (err) {
      setError('No se pudo enviar el código. Verifica el correo e inténtalo de nuevo.');
    }
  };

  const reset = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await authApi.reset({ email, code, newPassword });
      setStep(3);
    } catch (err) {
      setError('No se pudo cambiar la contraseña. Revisa el código e inténtalo nuevamente.');
    }
  };

  return (
    <div className={`min-h-screen w-full ${isDark ? 'bg-[#020b1c] text-white' : 'bg-[#d4dee8] text-[#10253c]'}`} style={{ fontFamily: 'Roboto, sans-serif' }}>
      <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
        <section className="relative hidden md:block">
          <img src={isDark ? '/assets/campus-placeholder.svg' : '/assets/fondoClaroLogin.png'} alt="Laboratorio de ingeniería mecatrónica" className="absolute inset-0 h-full w-full object-cover" />
          <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-r from-sky-900/80 via-slate-900/85 to-[#020b1c]' : 'bg-gradient-to-r from-[#dbe3ec]/60 via-[#cad4e0]/45 to-[#8ea0b8]/28'}`} />
          <div className="absolute inset-0 flex items-end p-10 lg:p-14">
            <div className={`max-w-lg ${isDark ? 'text-white' : 'text-[#0d2746]'}`}>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${isDark ? 'bg-sky-500/20 text-sky-100' : 'bg-[#eef4fb] text-[#2d5477]'}`}>
                Soporte de acceso
              </span>
              <h1 className="mt-4 text-3xl font-extrabold leading-tight md:text-4xl lg:text-[3rem] lg:leading-[1.03]">
                Recupera tu acceso académico.
              </h1>
              <p className={`mt-5 text-lg font-medium md:text-xl lg:text-[1.5rem] lg:leading-snug ${isDark ? 'text-sky-100' : 'text-[#2f4359]'}`}>
                Te guiaremos en el proceso para restablecer tu contraseña de forma segura.
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

            <div className="mb-5 pt-2 text-center">
              <div className="mx-auto flex h-14 w-[250px] items-center justify-center md:h-16 md:w-[280px]">
                <img
                  src={isDark ? '/assets/universitaria-logo-on-dark.png' : '/assets/universitaria-logo-on-light.png'}
                  alt="Logo Universitaria de Colombia"
                  className="max-h-full w-auto max-w-full object-contain"
                />
              </div>
              <h2 className={`mt-3 text-[2.1rem] font-extrabold leading-none tracking-tight ${isDark ? 'text-white' : 'text-[#092748]'}`}>Recuperar contraseña</h2>
              <p className={`mt-1.5 text-[0.95rem] ${isDark ? 'text-sky-100/85' : 'text-[#5f7184]'}`}>
                {step === 1 && 'Ingresa tu correo institucional para recibir el código.'}
                {step === 2 && 'Escribe el código recibido y define una nueva contraseña.'}
                {step === 3 && 'Tu contraseña fue actualizada correctamente.'}
              </p>
            </div>

            {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</div>}

            {step === 1 && (
              <form onSubmit={requestCode} className="space-y-3">
                <div>
                  <label htmlFor="email" className={labelClass}>Correo institucional</label>
                  <div className="mt-1.5">
                    <input
                      id="email"
                      type="email"
                      autoComplete="username"
                      placeholder="usuario@universitaria.edu.co"
                      className={inputClass}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <button
                  className={`mt-1 flex w-full justify-center rounded-xl px-4 py-2.5 text-[0.95rem] font-extrabold uppercase tracking-[0.12em] text-white shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${isDark ? 'bg-sky-500 hover:bg-sky-400 focus-visible:outline-sky-500' : 'bg-gradient-to-r from-[#1599e0] to-[#25aeea] hover:from-[#138ece] hover:to-[#209fd6] focus-visible:outline-[#1599e0]'}`}
                >
                  Enviar código
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={reset} className="space-y-3">
                <div>
                  <label htmlFor="code" className={labelClass}>Código de verificación</label>
                  <div className="mt-1.5">
                    <input
                      id="code"
                      placeholder="Ej. 123456"
                      className={inputClass}
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="newPassword" className={labelClass}>Nueva contraseña</label>
                  <div className="mt-1.5">
                    <input
                      id="newPassword"
                      type="password"
                      autoComplete="new-password"
                      placeholder="••••••••"
                      className={inputClass}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <button
                  className={`mt-1 flex w-full justify-center rounded-xl px-4 py-2.5 text-[0.95rem] font-extrabold uppercase tracking-[0.12em] text-white shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${isDark ? 'bg-sky-500 hover:bg-sky-400 focus-visible:outline-sky-500' : 'bg-gradient-to-r from-[#1599e0] to-[#25aeea] hover:from-[#138ece] hover:to-[#209fd6] focus-visible:outline-[#1599e0]'}`}
                >
                  Cambiar contraseña
                </button>
              </form>
            )}

            {step === 3 && (
              <div className={`rounded-xl border p-4 text-sm ${isDark ? 'border-sky-900/50 bg-[#082447] text-sky-100/90' : 'border-[#c8d2dc] bg-[#eef4fb] text-[#395a79]'}`}>
                Contraseña actualizada con éxito. Ahora puedes iniciar sesión con tu nueva contraseña.
              </div>
            )}

            <div className={`mt-5 border-t pt-4 ${isDark ? 'border-sky-900/50' : 'border-[#cad3dc]'}`}>
              <p className={`text-center text-xs ${isDark ? 'text-sky-100/75' : 'text-[#6d7b8a]'}`}>
                ¿Recordaste tu contraseña?{' '}
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
