import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Register() {
  const { register } = useAuth();
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

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

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
    <div className="mx-auto flex min-h-screen max-w-xl items-center p-6">
      <form onSubmit={submit} className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 p-6">
        <h1 className="mb-2 text-2xl font-bold">Registro</h1>
        <p className="mb-6 text-sm text-slate-400">Completa tus datos</p>
        {error && <div className="mb-4 rounded-lg bg-red-500/10 p-2 text-xs text-red-300">{error}</div>}
        <div className="grid gap-4 md:grid-cols-2">
          <select className="rounded-lg bg-slate-900 px-3 py-2" value={form.role} onChange={(e) => update('role', e.target.value)}>
            <option value="STUDENT">Estudiante</option>
            <option value="DOCENTE">Docente</option>
          </select>
          {form.role === 'DOCENTE' && (
            <input
              placeholder="Codigo docente"
              className="rounded-lg bg-slate-900 px-3 py-2"
              value={form.teacherCode}
              onChange={(e) => update('teacherCode', e.target.value)}
            />
          )}
          <input placeholder="Nombre" className="rounded-lg bg-slate-900 px-3 py-2" value={form.name} onChange={(e) => update('name', e.target.value)} />
          <input placeholder="Apellido" className="rounded-lg bg-slate-900 px-3 py-2" value={form.lastName} onChange={(e) => update('lastName', e.target.value)} />
          <input placeholder="Identificacion" className="rounded-lg bg-slate-900 px-3 py-2" value={form.document} onChange={(e) => update('document', e.target.value)} />
          <input placeholder="Celular" className="rounded-lg bg-slate-900 px-3 py-2" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
          <input placeholder="Correo" className="rounded-lg bg-slate-900 px-3 py-2" value={form.email} onChange={(e) => update('email', e.target.value)} />
          <input type="password" placeholder="Contraseña" className="rounded-lg bg-slate-900 px-3 py-2" value={form.password} onChange={(e) => update('password', e.target.value)} />
          <input type="password" placeholder="Confirmar contraseña" className="rounded-lg bg-slate-900 px-3 py-2" value={form.confirm} onChange={(e) => update('confirm', e.target.value)} />
        </div>
        <button className="mt-6 w-full rounded-lg bg-brand-500 py-2 font-bold">Crear cuenta</button>
        <div className="mt-4 text-xs text-slate-400">
          ¿Ya tienes cuenta? <Link to="/login" className="hover:text-white">Inicia sesion</Link>
        </div>
      </form>
    </div>
  );
}
