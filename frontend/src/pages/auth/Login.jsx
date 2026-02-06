import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError('Credenciales invalidas');
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      <section className="relative hidden md:block">
        <img
          src="/assets/campus-placeholder.svg"
          alt="Campus virtual"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/85 via-slate-950/40 to-brand-900/30" />
        <div className="absolute inset-0 flex items-end p-12">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur">
              Campus virtual TuVir
            </div>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight text-white">
              Construyendo el futuro de la ingeniería mecatrónica.
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/80">
              Únete a la comunidad académica de la Universitaria de Colombia.
            </p>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center bg-white px-6 py-12 text-slate-900 dark:bg-zinc-950 dark:text-zinc-50">
        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center gap-3">
            <img
              src="/assets/universitaria-logo.svg"
              alt="Universitaria de Colombia"
              className="h-12 w-auto"
            />
            <div className="text-center">
              <h2 className="text-xl font-extrabold">TuVir Académico</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-zinc-400">Accede con tu correo institucional</p>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-5">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-semibold">
                Correo institucional
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="usuario@universitaria.edu.co"
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-500/15 dark:border-zinc-800 dark:bg-zinc-950"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="password" className="text-sm font-semibold">
                  Contraseña
                </label>
                <Link
                  to="/forgot"
                  className="text-xs font-semibold text-brand-700 hover:underline dark:text-brand-300"
                >
                  Olvidé mi contraseña
                </Link>
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-500/15 dark:border-zinc-800 dark:bg-zinc-950"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-brand-500 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-500/25"
            >
              Ingresar
            </button>

            <div className="text-center text-sm text-slate-600 dark:text-zinc-400">
              ¿No tienes cuenta?{' '}
              <Link to="/register" className="font-extrabold text-brand-700 hover:underline dark:text-brand-300">
                Regístrate aquí
              </Link>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
