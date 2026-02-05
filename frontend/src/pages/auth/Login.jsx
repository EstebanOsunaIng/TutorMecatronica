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
    <div className="mx-auto flex min-h-screen max-w-md items-center p-6">
      <form onSubmit={submit} className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 p-6">
        <h1 className="mb-2 text-2xl font-bold">Iniciar sesion</h1>
        <p className="mb-6 text-sm text-slate-400">Accede con tu correo institucional</p>
        {error && <div className="mb-4 rounded-lg bg-red-500/10 p-2 text-xs text-red-300">{error}</div>}
        <div className="space-y-4">
          <input
            type="email"
            placeholder="Correo"
            className="w-full rounded-lg bg-slate-900 px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Contraseña"
            className="w-full rounded-lg bg-slate-900 px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="w-full rounded-lg bg-brand-500 py-2 font-bold">Ingresar</button>
        </div>
        <div className="mt-4 flex justify-between text-xs text-slate-400">
          <Link to="/register" className="hover:text-white">Crear cuenta</Link>
          <Link to="/forgot" className="hover:text-white">Olvide mi contraseña</Link>
        </div>
      </form>
    </div>
  );
}
