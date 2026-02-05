import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../api/auth.api.js';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1);

  const requestCode = async (e) => {
    e.preventDefault();
    await authApi.forgot({ email });
    setStep(2);
  };

  const reset = async (e) => {
    e.preventDefault();
    await authApi.reset({ email, code, newPassword });
    setStep(3);
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center p-6">
      <div className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 p-6">
        <h1 className="mb-2 text-2xl font-bold">Recuperacion</h1>
        {step === 1 && (
          <form onSubmit={requestCode} className="space-y-4">
            <input
              placeholder="Correo"
              className="w-full rounded-lg bg-slate-900 px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button className="w-full rounded-lg bg-brand-500 py-2 font-bold">Enviar codigo</button>
          </form>
        )}
        {step === 2 && (
          <form onSubmit={reset} className="space-y-4">
            <input
              placeholder="Codigo"
              className="w-full rounded-lg bg-slate-900 px-3 py-2"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <input
              type="password"
              placeholder="Nueva contraseña"
              className="w-full rounded-lg bg-slate-900 px-3 py-2"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button className="w-full rounded-lg bg-brand-500 py-2 font-bold">Cambiar contraseña</button>
          </form>
        )}
        {step === 3 && (
          <div className="text-sm text-slate-300">
            Contraseña actualizada. <Link to="/login" className="text-brand-300">Inicia sesion</Link>
          </div>
        )}
      </div>
    </div>
  );
}
