
import React, { useState } from 'react';
import { dbService } from '../services/dbService';
import { UserRole, User } from '../types';

interface AuthViewProps {
  mode: 'login' | 'register' | 'forgot';
  setMode: (mode: 'login' | 'register' | 'forgot') => void;
  onLogin: (user: User) => void;
}

const AuthView: React.FC<AuthViewProps> = ({ mode, setMode, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [major, setMajor] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const user = dbService.login(email, password);
        onLogin(user);
      } else if (mode === 'register') {
        const user = dbService.register({ 
          name, 
          email, 
          password, 
          major: major || (role === UserRole.ADMIN ? 'Facultad de Ingeniería' : 'Ingeniería Mecatrónica'), 
          idNumber, 
          role 
        });
        setSuccess(`¡Cuenta de ${role === UserRole.ADMIN ? 'Docente' : 'Estudiante'} creada! Ya puedes ingresar.`);
        setTimeout(() => setMode('login'), 2000);
      } else {
        dbService.resetPassword(email);
        setSuccess('Se ha enviado un código de recuperación a tu correo.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex bg-[#0f172a] relative overflow-hidden">
      {/* Visual Side */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary-900">
        <img 
          src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1200" 
          alt="Mecatrónica Industrial" 
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60 scale-110 hover:scale-100 transition-transform duration-[10s]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent" />
        <div className="absolute bottom-12 left-12 z-20 max-w-md animate-in fade-in slide-in-from-left-10 duration-1000">
          <div className="inline-flex items-center gap-2 bg-primary-500 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4">
            <span className="material-symbols-outlined text-sm">precision_manufacturing</span>
            Campus Virtual TuVir
          </div>
          <h2 className="text-4xl font-black text-white leading-tight mb-4">
            Construyendo el futuro de la ingeniería mecatrónica.
          </h2>
          <p className="text-primary-100 text-lg font-medium opacity-80">
            Únete a la comunidad académica de la Universitaria de Colombia.
          </p>
        </div>
      </div>

      {/* Auth Form Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative overflow-y-auto bg-slate-950/20">
        <div className="absolute top-0 right-0 size-96 bg-primary-600/5 rounded-full blur-[120px]" />
        
        <div className="w-full max-w-md bg-[#111c22]/90 backdrop-blur-xl border border-[#233c48] rounded-[2rem] p-10 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-500 my-8">
          <div className="text-center mb-10">
            <div className="inline-flex size-16 items-center justify-center bg-primary-500 rounded-2xl shadow-xl shadow-primary-500/20 mb-6">
              <span className="material-symbols-outlined text-white text-4xl font-bold">rocket_launch</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tighter">TuVir Académico</h1>
            <p className="text-slate-400 text-sm mt-2">
              {mode === 'login' ? 'Bienvenido al ecosistema industrial' : 
               mode === 'register' ? 'Crea tu perfil institucional' : 'Recuperación de cuenta'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold flex items-center gap-3">
              <span className="material-symbols-outlined text-sm">error</span> {error}
            </div>
          )}
          
          {success && (
            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-xs font-bold flex items-center gap-3">
              <span className="material-symbols-outlined text-sm">check_circle</span> {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'register' && (
              <>
                <div className="p-1 bg-[#0f172a] rounded-xl flex border border-[#233c48]">
                  <button 
                    type="button"
                    onClick={() => setRole(UserRole.STUDENT)}
                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${role === UserRole.STUDENT ? 'bg-primary-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    Estudiante
                  </button>
                  <button 
                    type="button"
                    onClick={() => setRole(UserRole.ADMIN)}
                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${role === UserRole.ADMIN ? 'bg-primary-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    Docente
                  </button>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Nombre Completo</label>
                  <input required type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Ing. Carlos Pérez" className="w-full bg-[#0f172a] border border-[#233c48] rounded-xl px-5 py-3 text-white text-sm focus:border-primary-500 outline-none transition-all placeholder:text-slate-700" />
                </div>
              </>
            )}

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Correo Institucional</label>
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="usuario@universitaria.edu.co" className="w-full bg-[#0f172a] border border-[#233c48] rounded-xl px-5 py-3 text-white text-sm focus:border-primary-500 outline-none transition-all placeholder:text-slate-700" />
            </div>

            {mode !== 'forgot' && (
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Contraseña</label>
                <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-[#0f172a] border border-[#233c48] rounded-xl px-5 py-3 text-white text-sm focus:border-primary-500 outline-none transition-all placeholder:text-slate-700" />
              </div>
            )}

            <button disabled={loading} className="w-full bg-primary-500 hover:bg-primary-400 text-white font-black uppercase tracking-widest py-4 rounded-2xl shadow-xl shadow-primary-500/20 transition-all active:scale-95 mt-4 disabled:opacity-50">
              {loading ? 'Procesando...' : mode === 'login' ? 'Entrar al Campus' : mode === 'register' ? 'Crear mi cuenta' : 'Recuperar'}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-[#233c48] text-center">
            <p className="text-slate-500 text-xs font-medium">
              {mode === 'login' ? '¿Aún no tienes acceso?' : '¿Ya eres miembro?'}
              <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="ml-2 text-primary-400 font-black hover:text-primary-300 transition-colors underline-offset-4 hover:underline">
                {mode === 'login' ? 'Regístrate aquí' : 'Inicia Sesión'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthView;
