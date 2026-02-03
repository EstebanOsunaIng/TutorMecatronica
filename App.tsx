
import React, { useState, useEffect, useRef } from 'react';
import { UserRole, User, Module, Lesson, Notification } from './types';
import Sidebar from './components/Sidebar';
import Chatbot from './components/Chatbot';
import ModuleCard from './components/ModuleCard';
import LessonPlayer from './components/LessonPlayer';
import AuthView from './components/AuthView';
import { dbService } from './services/dbService';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [currentView, setView] = useState('dashboard');
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [pendingPrompt, setPendingPrompt] = useState<string | undefined>(undefined);
  
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  
  const [showStarAnim, setShowStarAnim] = useState(false);
  const [prevStars, setPrevStars] = useState(0);

  const [isEditing, setIsEditing] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);

  const [profileData, setProfileData] = useState<Partial<User>>({});

  useEffect(() => {
    dbService.init();
    const session = dbService.getCurrentSession();
    if (session) {
      setCurrentUser(session);
      setPrevStars(session.stars);
      setProfileData(session);
    }
    setModules(dbService.getModules());

    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (currentUser && currentUser.stars > prevStars && currentUser.role === UserRole.STUDENT) {
      setShowStarAnim(true);
      setTimeout(() => setShowStarAnim(false), 5000);
      setPrevStars(currentUser.stars);
      
      dbService.addNotification(currentUser.id, {
        title: '¡Nueva Estrella Obtenida!',
        message: `Has alcanzado un total de ${currentUser.stars} estrellas. ¡Tu desempeño técnico es excepcional!`,
        type: 'star'
      });
      setCurrentUser(dbService.getCurrentSession());
    }
  }, [currentUser?.stars, prevStars]);

  // Fix: Added unreadCount calculation based on current user notifications
  const unreadCount = currentUser?.notifications?.filter(n => n.unread).length || 0;

  // Fix: Added markRead function to handle notification status update
  const markRead = (id: string) => {
    if (currentUser) {
      dbService.markNotificationRead(currentUser.id, id);
      setCurrentUser(dbService.getCurrentSession());
    }
  };

  // Fix: Added clearNotifications function to handle notification list clearing
  const clearNotifications = () => {
    if (currentUser) {
      dbService.clearAllNotifications(currentUser.id);
      setCurrentUser(dbService.getCurrentSession());
    }
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setPrevStars(user.stars);
    setProfileData(user);
  };

  const handleLogout = () => {
    dbService.logout();
    setCurrentUser(null);
    setView('dashboard');
    setAuthMode('login');
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser) {
      try {
        const { email, ...updatable } = profileData;
        const updated = dbService.updateUser({ ...currentUser, ...updatable } as User);
        setCurrentUser(updated);
        alert('Perfil actualizado con éxito');
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handleSaveModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingModule) {
      const updated = dbService.saveModule(editingModule);
      setModules(updated);
      setIsEditing(false);
      setEditingModule(null);
      setCurrentUser(dbService.getCurrentSession());
    }
  };

  const handleNewModule = () => {
    const newMod: Module = {
      id: '',
      title: 'Módulo de Ingeniería',
      description: 'Describe el contenido técnico aquí.',
      category: 'General',
      difficulty: 'Básico',
      progress: 0,
      lessons: [{ id: `l_${Date.now()}`, title: 'Introducción', content: '...', completed: false, duration: '10m', type: 'text', images: [] }]
    };
    setEditingModule(newMod);
    setIsEditing(true);
  };

  const handleDeleteModule = (id: string) => {
    if (window.confirm('¿Deseas eliminar este módulo de la ruta académica?')) {
      const updated = dbService.deleteModule(id);
      setModules(updated);
      if (selectedModuleId === id) setView('modules');
    }
  };

  const handleSelectModule = (id: string) => {
    const mod = modules.find(m => m.id === id);
    if (mod) {
      setSelectedModuleId(id);
      if (mod.lessons.length > 0) setActiveLessonId(mod.lessons[0].id);
      setView('module-detail');
    }
  };

  const toggleLessonComplete = (moduleId: string, lessonId: string) => {
    const newModules = modules.map(m => {
      if (m.id !== moduleId) return m;
      const newLessons = m.lessons.map(l => l.id === lessonId ? { ...l, completed: !l.completed } : l);
      const completedCount = newLessons.filter(l => l.completed).length;
      const newProgress = Math.round((completedCount / newLessons.length) * 100);
      return { ...m, lessons: newLessons, progress: newProgress };
    });
    
    setModules(newModules);
    const targetModule = newModules.find(m => m.id === moduleId);
    if (targetModule) dbService.saveModule(targetModule);
    
    if (currentUser && currentUser.role === UserRole.STUDENT) {
      const avgProg = newModules.length > 0 ? newModules.reduce((acc, m) => acc + m.progress, 0) / newModules.length : 0;
      const rounded = Math.round(avgProg);
      const stars = Math.floor(rounded / 20);
      
      const updatedUser = dbService.updateUser({ ...currentUser, progress: rounded, stars });
      setCurrentUser(updatedUser);
    }
  };

  const StarShower = () => (
    <div className="star-shower-container">
      {Array.from({ length: 40 }).map((_, i) => (
        <span 
          key={i} 
          className="falling-star material-symbols-outlined fill-1"
          style={{ 
            left: `${Math.random() * 100}%`, 
            animationDuration: `${Math.random() * 2 + 1}s`,
            animationDelay: `${Math.random() * 2}s`,
            fontSize: `${Math.random() * 25 + 10}px`
          }}
        >
          stars
        </span>
      ))}
    </div>
  );

  const renderAdminDashboard = () => {
    const allStudents = dbService.getUsers().filter(u => u.role === UserRole.STUDENT);
    const topPerformance = [...allStudents].sort((a,b) => b.progress - a.progress).slice(0, 5);
    const pieData = [
      { name: 'Completado', value: modules.reduce((acc, m) => acc + (m.progress === 100 ? 1 : 0), 0) },
      { name: 'En Proceso', value: modules.reduce((acc, m) => acc + (m.progress > 0 && m.progress < 100 ? 1 : 0), 0) },
      { name: 'Sin Iniciar', value: modules.reduce((acc, m) => acc + (m.progress === 0 ? 1 : 0), 0) },
    ];
    const COLORS = ['#13a4ec', '#38bdf8', '#0f172a'];

    return (
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-4xl font-black text-white italic tracking-tighter">Panel de Gestión Académica</h2>
            <p className="text-slate-500 font-bold mt-1 uppercase tracking-widest text-[10px]">Visión de Ingeniera Experta</p>
          </div>
          <div className="flex gap-4">
             <div className="bg-surface border border-[#233c48] px-6 py-4 rounded-[1.5rem] shadow-xl text-center">
                <span className="text-[9px] font-black text-slate-500 uppercase block mb-1">Módulos</span>
                <span className="text-primary-400 font-black text-2xl">{modules.length}</span>
             </div>
             <div className="bg-surface border border-[#233c48] px-6 py-4 rounded-[1.5rem] shadow-xl text-center">
                <span className="text-[9px] font-black text-slate-500 uppercase block mb-1">Estudiantes</span>
                <span className="text-white font-black text-2xl">{allStudents.length}</span>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 bg-surface p-10 rounded-[2.5rem] border border-[#233c48] shadow-2xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
              <span className="material-symbols-outlined text-[150px] text-white">monitoring</span>
            </div>
            <h3 className="text-white font-black uppercase tracking-widest text-xs flex items-center gap-2 mb-10">
              <span className="material-symbols-outlined text-primary-500">analytics</span> Desempeño por Cohorte
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topPerformance} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={100} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#111c22', borderRadius: '12px', border: '1px solid #233c48', fontSize: '10px', color: '#fff' }} />
                  <Bar dataKey="progress" radius={[0, 10, 10, 0]} barSize={24}>
                    {topPerformance.map((_, index) => <Cell key={`cell-${index}`} fill={index === 0 ? '#13a4ec' : '#334155'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-4 bg-surface p-10 rounded-[2.5rem] border border-[#233c48] shadow-xl">
             <h3 className="text-white font-black uppercase tracking-widest text-xs mb-8 flex items-center gap-2">
               <span className="material-symbols-outlined text-yellow-400">workspace_premium</span> Líderes del Campus
             </h3>
             <div className="space-y-5">
                {topPerformance.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-4 bg-surface-light/30 p-4 rounded-2xl border border-transparent hover:border-primary-500/30 transition-all cursor-default">
                    <span className={`text-lg font-black w-4 text-center ${i === 0 ? 'text-yellow-400 animate-pulse' : 'text-slate-600'}`}>{i + 1}</span>
                    <img src={`https://ui-avatars.com/api/?name=${s.name}&background=13a4ec&color=fff`} className="size-10 rounded-full border border-white/10" alt="" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-white truncate">{s.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1 bg-black/40 rounded-full overflow-hidden">
                          <div className="h-full bg-primary-500" style={{ width: `${s.progress}%` }} />
                        </div>
                        <span className="text-primary-400 font-black text-[9px]">{s.progress}%</span>
                      </div>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>

        <div className="bg-surface rounded-[2.5rem] border border-[#233c48] p-10 shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-1000">
              <span className="material-symbols-outlined text-[100px] text-white">settings_accessibility</span>
            </div>
           <h3 className="text-white font-black italic text-xl mb-10">Módulos Disponibles</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {modules.map(mod => (
                <div key={mod.id} className="relative group">
                   <ModuleCard module={mod} onClick={() => {}} />
                   <div className="absolute top-4 right-4 flex gap-2 z-30">
                      <button onClick={(e) => { e.stopPropagation(); setEditingModule({...mod}); setIsEditing(true); }} className="bg-surface-light/80 backdrop-blur-md p-2 rounded-xl border border-white/10 text-white hover:bg-primary-500 transition-all"><span className="material-symbols-outlined text-lg">edit</span></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteModule(mod.id); }} className="bg-red-500/10 backdrop-blur-md p-2 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all"><span className="material-symbols-outlined text-lg">delete</span></button>
                   </div>
                </div>
              ))}
              <button onClick={handleNewModule} className="bg-surface-light/20 border-2 border-dashed border-[#233c48] rounded-[2rem] p-8 flex flex-col items-center justify-center text-slate-600 hover:text-primary-400 hover:border-primary-500/50 hover:bg-primary-500/5 transition-all group min-h-[200px]">
                <span className="material-symbols-outlined text-5xl mb-4 group-hover:rotate-90 transition-transform duration-500">add_circle</span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Agregar Módulo Académico</span>
              </button>
           </div>
        </div>
      </div>
    );
  };

  const renderDashboard = () => (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-5xl font-black text-white italic tracking-tighter">¡Hola, {currentUser?.name.split(' ')[0]}!</h2>
          <p className="text-slate-500 font-bold mt-2 uppercase tracking-widest text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-500 text-sm">school</span> {currentUser?.major || 'Ingeniería Mecatrónica'}
          </p>
        </div>
        <div className="hidden md:flex items-center gap-3 bg-surface p-4 rounded-[2rem] border border-[#233c48] shadow-lg">
           <div className="flex -space-x-3">
              {[1,2,3].map(i => <img key={i} src={`https://ui-avatars.com/api/?name=User+${i}&background=1b2a33&color=13a4ec`} className="size-8 rounded-full border-2 border-surface" />)}
           </div>
           <p className="text-[9px] font-black uppercase text-slate-400">12 Estudiantes en línea</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
          <span className="material-symbols-outlined absolute -right-6 -bottom-6 text-[180px] opacity-10 group-hover:rotate-12 transition-transform duration-1000">precision_manufacturing</span>
          <h4 className="text-primary-100 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Dominio Académico</h4>
          <p className="text-6xl font-black italic">Rango {currentUser?.stars || 0}</p>
          <div className="mt-8 flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className={`material-symbols-outlined ${i < (currentUser?.stars || 0) ? 'text-yellow-400 fill-1' : 'text-white/20'}`}>stars</span>
            ))}
          </div>
        </div>

        <div className="bg-surface border border-[#233c48] rounded-[2.5rem] p-10 flex flex-col justify-center shadow-xl hover:scale-[1.02] transition-transform duration-500">
          <h4 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-6">Carrera Completa</h4>
          <div className="flex items-baseline gap-3 mb-8">
             <p className="text-7xl font-black text-white leading-none tracking-tighter">{currentUser?.progress || 0}</p>
             <p className="text-2xl font-bold text-primary-400 opacity-60">%</p>
          </div>
          <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden p-0.5 shadow-inner">
            <div className="h-full bg-primary-500 rounded-full transition-all duration-1000 shadow-[0_0_20px_rgba(19,164,236,0.6)]" style={{ width: `${currentUser?.progress || 0}%` }} />
          </div>
        </div>

        <div className="bg-surface border border-[#233c48] rounded-[2.5rem] p-10 relative flex flex-col justify-center overflow-hidden shadow-xl group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <span className="material-symbols-outlined text-8xl text-white">auto_stories</span>
          </div>
          <h4 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-6">Módulos Académicos</h4>
          <p className="text-7xl font-black text-white leading-none tracking-tighter">{modules.length}</p>
          <button onClick={() => setView('modules')} className="mt-10 text-[10px] font-black text-primary-400 hover:text-white uppercase tracking-[0.2em] flex items-center gap-2 group transition-all w-fit">
            Ir a mis lecciones <span className="material-symbols-outlined text-base group-hover:translate-x-2 transition-transform">arrow_forward</span>
          </button>
        </div>
      </div>

      <div className="bg-surface border border-[#233c48] rounded-[2.5rem] p-10 shadow-2xl overflow-hidden relative">
         <div className="flex justify-between items-center mb-10">
            <div>
               <h3 className="text-white font-black text-lg italic">Continuar Aprendizaje</h3>
               <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest mt-1">Recomendados para tu nivel</p>
            </div>
            <button onClick={() => setView('modules')} className="text-primary-400 text-[10px] font-black uppercase hover:text-white transition-colors">Explorar Todo</button>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {modules.slice(0, 3).map(m => <ModuleCard key={m.id} module={m} onClick={() => handleSelectModule(m.id)} />)}
         </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
      <div className="flex items-center gap-4 mb-10">
         <div className="size-14 rounded-2xl bg-primary-500/10 flex items-center justify-center text-primary-500 border border-primary-500/20">
            <span className="material-symbols-outlined text-3xl">manage_accounts</span>
         </div>
         <h2 className="text-4xl font-black text-white italic tracking-tighter">Perfil TuVir</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 flex flex-col gap-8">
           <div className="bg-surface border border-[#233c48] rounded-[2.5rem] p-10 flex flex-col items-center text-center shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-primary-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative group/avatar cursor-pointer">
                <img src={`https://ui-avatars.com/api/?name=${profileData.name}&background=13a4ec&color=fff&size=200`} className="size-32 rounded-full border-4 border-[#233c48] group-hover/avatar:border-primary-500 transition-all shadow-2xl object-cover" alt="" />
                <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-all">
                  <span className="material-symbols-outlined text-white">photo_camera</span>
                </div>
              </div>
              <h3 className="text-white font-black text-xl mt-6 italic tracking-tight">{profileData.name}</h3>
              <p className="text-primary-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">{currentUser?.role === UserRole.ADMIN ? 'Docente Experto' : 'Estudiante Activo'}</p>
              <div className="mt-8 pt-8 border-t border-[#233c48] w-full flex justify-around">
                 <div>
                    <span className="block text-white font-black text-lg leading-none">{currentUser?.stars || 0}</span>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Estrellas</span>
                 </div>
                 <div>
                    <span className="block text-white font-black text-lg leading-none">{currentUser?.progress || 0}%</span>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Dominio</span>
                 </div>
              </div>
           </div>
           
           <div className="bg-surface border border-[#233c48] rounded-[2.5rem] p-8 shadow-xl">
              <h4 className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-6">Estado Institucional</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-surface-light/40 p-4 rounded-xl border border-white/5">
                   <span className="text-[10px] font-bold text-slate-500">Carrera</span>
                   <span className="text-xs font-black text-white">{currentUser?.major || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center bg-surface-light/40 p-4 rounded-xl border border-white/5">
                   <span className="text-[10px] font-bold text-slate-500">ID</span>
                   <span className="text-xs font-black text-white">{currentUser?.idNumber || 'N/A'}</span>
                </div>
              </div>
           </div>
        </div>

        <div className="lg:col-span-8 bg-surface border border-[#233c48] rounded-[2.5rem] p-12 shadow-2xl relative overflow-hidden">
          <form onSubmit={handleUpdateProfile} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nombre Completo</label>
                <input value={profileData.name || ''} onChange={e => setProfileData({...profileData, name: e.target.value})} className="w-full bg-[#0f172a] border border-[#233c48] rounded-2xl px-6 py-4 text-white text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Correo (Protegido)</label>
                <input disabled value={currentUser?.email || ''} className="w-full bg-[#0f172a]/50 border border-[#233c48] rounded-2xl px-6 py-4 text-slate-500 text-sm cursor-not-allowed italic" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Cédula / ID</label>
                <input value={profileData.idNumber || ''} onChange={e => setProfileData({...profileData, idNumber: e.target.value})} className="w-full bg-[#0f172a] border border-[#233c48] rounded-2xl px-6 py-4 text-white text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Carrera</label>
                <input value={profileData.major || ''} onChange={e => setProfileData({...profileData, major: e.target.value})} className="w-full bg-[#0f172a] border border-[#233c48] rounded-2xl px-6 py-4 text-white text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Teléfono</label>
                <input value={profileData.phone || ''} onChange={e => setProfileData({...profileData, phone: e.target.value})} className="w-full bg-[#0f172a] border border-[#233c48] rounded-2xl px-6 py-4 text-white text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Biografía Técnica</label>
              <textarea value={profileData.bio || ''} onChange={e => setProfileData({...profileData, bio: e.target.value})} rows={4} className="w-full bg-[#0f172a] border border-[#233c48] rounded-2xl px-6 py-4 text-white text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all resize-none" placeholder="Cuéntanos sobre tus intereses en mecatrónica..." />
            </div>

            <div className="pt-6 border-t border-[#233c48] flex justify-end">
              <button type="submit" className="bg-primary-500 text-white font-black uppercase tracking-widest px-10 py-4 rounded-2xl shadow-xl shadow-primary-500/20 hover:bg-primary-400 hover:scale-105 active:scale-95 transition-all">Actualizar mi Perfil Académico</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  if (!currentUser) return <AuthView mode={authMode} setMode={setAuthMode} onLogin={handleLogin} />;

  return (
    <div className="flex h-screen w-full bg-[#0f172a] text-slate-200 overflow-hidden font-sans select-none">
      {showStarAnim && <StarShower />}
      
      <Sidebar 
        currentView={currentView} 
        setView={setView} 
        role={currentUser.role}
        userName={currentUser.name}
        userRoleLabel={currentUser.role === UserRole.ADMIN ? 'Docente Experta' : 'Estudiante Elite'}
        avatar={`https://ui-avatars.com/api/?name=${currentUser.name}&background=13a4ec&color=fff`}
      />
      
      <div className="flex-1 flex flex-col min-w-0 relative">
        <header className="h-24 border-b border-[#233c48] bg-surface flex items-center justify-between px-10 shrink-0 z-10 shadow-lg">
          <div className="flex items-center gap-6">
             <div className="size-14 rounded-2xl bg-primary-500/5 border border-primary-500/10 flex items-center justify-center text-primary-500">
                <span className="material-symbols-outlined text-3xl">
                  {currentView === 'dashboard' ? 'grid_view' : currentView === 'modules' ? 'auto_stories' : currentView === 'progress' ? 'analytics' : 'settings_account_box'}
                </span>
             </div>
             <div>
                <h2 className="text-white font-black uppercase tracking-[0.3em] text-[10px] leading-none mb-1">Módulo Actual</h2>
                <p className="text-slate-400 font-bold text-xs uppercase italic">{currentView}</p>
             </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative" ref={notificationRef}>
              <button onClick={() => setShowNotifications(!showNotifications)} className="size-12 rounded-2xl bg-[#1b2a33] border border-[#233c48] flex items-center justify-center text-slate-400 hover:text-white transition-all relative group hover:border-primary-500/50">
                <span className={`material-symbols-outlined text-2xl ${unreadCount > 0 ? 'animate-swing' : ''}`}>notifications</span>
                {unreadCount > 0 && <span className="absolute -top-1 -right-1 size-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-surface animate-bounce shadow-lg">{unreadCount}</span>}
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-4 w-96 bg-[#1b2a33]/95 backdrop-blur-2xl border border-[#233c48] rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.5)] z-[300] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Centro de Alertas</h4>
                    <button onClick={clearNotifications} className="text-[9px] font-black text-primary-400 hover:text-white uppercase transition-colors">Limpiar</button>
                  </div>
                  <div className="max-h-[450px] overflow-y-auto p-4 space-y-3 scrollbar-hide">
                    {(currentUser.notifications || []).map(n => (
                      <div key={n.id} onClick={() => markRead(n.id)} className={`p-5 rounded-2xl border transition-all cursor-pointer ${n.unread ? 'bg-primary-500/10 border-primary-500/20 shadow-lg' : 'opacity-40 hover:opacity-100 hover:bg-white/5 border-transparent'}`}>
                        <p className="text-xs font-black text-white">{n.title}</p>
                        <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">{n.message}</p>
                      </div>
                    ))}
                    {(currentUser.notifications?.length === 0) && <div className="py-12 text-center text-slate-600 text-[9px] font-black uppercase italic tracking-widest">No hay notificaciones pendientes</div>}
                  </div>
                </div>
              )}
            </div>
            <button onClick={handleLogout} className="size-12 rounded-2xl hover:bg-red-500/10 text-slate-500 border border-transparent hover:border-red-500/30 hover:text-red-500 flex items-center justify-center transition-all"><span className="material-symbols-outlined text-2xl">power_settings_new</span></button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-12 bg-[#0a0f1a] scrollbar-hide relative">
          {showStarAnim && (
            <div className="absolute inset-0 z-[200] pointer-events-none flex flex-col items-center justify-center animate-in fade-in duration-700 bg-black/40 backdrop-blur-sm">
               <div className="relative">
                  <span className="material-symbols-outlined text-[240px] text-yellow-400 fill-1 animate-bounce-short drop-shadow-[0_0_80px_rgba(250,204,21,0.6)]">workspace_premium</span>
                  <div className="absolute -inset-10 bg-yellow-400/20 blur-[100px] rounded-full animate-pulse" />
               </div>
               <h2 className="text-6xl font-black text-white mt-12 italic uppercase tracking-[0.5em] drop-shadow-2xl">¡NIVEL LOGRADO!</h2>
               <p className="text-primary-400 text-lg font-black uppercase tracking-[0.3em] mt-4 opacity-80">Dominio de Mecatrónica +1</p>
            </div>
          )}
          
          <div className="max-w-7xl mx-auto h-full">
            {currentView === 'dashboard' && (currentUser.role === UserRole.ADMIN ? renderAdminDashboard() : renderDashboard())}
            
            {currentView === 'modules' && (
              <div className="space-y-12 animate-in fade-in duration-700">
                 <div className="flex justify-between items-center">
                    <h2 className="text-4xl font-black text-white italic tracking-tighter">Tu Ruta de Aprendizaje</h2>
                    {currentUser.role === UserRole.ADMIN && (
                      <button onClick={handleNewModule} className="bg-primary-500 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-primary-400 transition-all shadow-xl shadow-primary-500/20">
                        <span className="material-symbols-outlined">add</span> Nuevo Módulo
                      </button>
                    )}
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                   {modules.map(m => (
                     <div key={m.id} className="relative group">
                       <ModuleCard module={m} onClick={() => handleSelectModule(m.id)} />
                       {currentUser.role === UserRole.ADMIN && (
                         <div className="absolute top-4 right-4 flex gap-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); setEditingModule({...m}); setIsEditing(true); }} className="bg-surface-light/90 backdrop-blur-md p-2 rounded-xl border border-white/10 text-white hover:bg-primary-500"><span className="material-symbols-outlined text-lg">edit</span></button>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteModule(m.id); }} className="bg-red-500/20 backdrop-blur-md p-2 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white"><span className="material-symbols-outlined text-lg">delete</span></button>
                         </div>
                       )}
                     </div>
                   ))}
                 </div>
              </div>
            )}

            {currentView === 'module-detail' && (
               <div className="h-full flex flex-col gap-10 animate-in fade-in duration-700 pb-20">
                  <button onClick={() => setView('modules')} className="flex items-center gap-3 text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-[0.3em] transition-all group w-fit">
                    <span className="material-symbols-outlined text-base group-hover:-translate-x-2 transition-transform">arrow_back</span> Volver a la ruta
                  </button>
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 flex-1 min-h-0">
                    <div className="lg:col-span-4 bg-surface border border-[#233c48] rounded-[2.5rem] p-10 overflow-y-auto shadow-2xl scrollbar-hide">
                      <h3 className="text-white font-black text-[10px] mb-10 uppercase tracking-[0.4em] text-primary-400 border-b border-white/5 pb-4">Secuencia Técnica</h3>
                      {modules.find(m => m.id === selectedModuleId)?.lessons.map((lesson, idx) => (
                        <button key={lesson.id} onClick={() => setActiveLessonId(lesson.id)} className={`w-full text-left p-6 rounded-[2rem] mb-5 transition-all border flex items-center gap-5 group/lesson ${activeLessonId === lesson.id ? 'bg-primary-500 text-white shadow-2xl shadow-primary-500/20 border-primary-400' : 'bg-[#1b2a33]/50 text-slate-500 border-transparent hover:border-[#233c48] hover:text-white'}`}>
                           <span className={`size-12 shrink-0 rounded-2xl flex items-center justify-center text-xs font-black transition-all ${lesson.completed ? 'bg-emerald-500 text-white' : activeLessonId === lesson.id ? 'bg-white text-primary-600' : 'bg-surface text-slate-700 group-hover/lesson:text-primary-400'}`}>{lesson.completed ? '✓' : idx + 1}</span>
                           <div className="flex-1 min-w-0">
                              <p className="text-sm font-black truncate tracking-tight">{lesson.title}</p>
                              <p className={`text-[9px] font-bold uppercase mt-1 ${activeLessonId === lesson.id ? 'text-primary-100' : 'text-slate-600'}`}>{lesson.duration}</p>
                           </div>
                        </button>
                      ))}
                    </div>
                    <div className="lg:col-span-8 flex flex-col h-full">
                      {activeLessonId && selectedModuleId ? (
                        <LessonPlayer 
                          lesson={modules.find(m => m.id === selectedModuleId)?.lessons.find(l => l.id === activeLessonId)!} 
                          onComplete={() => toggleLessonComplete(selectedModuleId, activeLessonId)} 
                          onAskTutor={setPendingPrompt} 
                        />
                      ) : null}
                    </div>
                  </div>
               </div>
            )}
            
            {currentView === 'settings' && renderSettings()}
            {currentView === 'progress' && (currentUser.role === UserRole.ADMIN ? renderAdminReports() : renderStudentProgress())}
          </div>
        </main>
      </div>

      <div className="w-[440px] border-l border-[#233c48] shrink-0 p-8 flex flex-col bg-[#0f172a] shadow-[-20px_0_50px_rgba(0,0,0,0.5)] z-20">
        <Chatbot externalPrompt={pendingPrompt} onPromptConsumed={() => setPendingPrompt(undefined)} />
      </div>

      {isEditing && renderModuleEditor()}
    </div>
  );

  function renderAdminReports() {
     const allStudents = dbService.getUsers().filter(u => u.role === UserRole.STUDENT);
     return (
       <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex justify-between items-end mb-10">
             <div>
                <h2 className="text-3xl font-black text-white italic tracking-tighter">Auditoría de Progreso</h2>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px] mt-1">Reporte institucional detallado</p>
             </div>
             <button className="bg-surface-light px-6 py-2 rounded-xl border border-white/5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all">Exportar Excel</button>
          </div>
          <div className="bg-surface border border-[#233c48] rounded-[3rem] overflow-hidden shadow-2xl">
            <table className="w-full text-left">
              <thead className="bg-[#1b2a33]/50 text-slate-500 font-black uppercase tracking-widest text-[9px]">
                <tr>
                  <th className="px-10 py-6">Estudiante</th>
                  <th className="px-10 py-6">Facultad</th>
                  <th className="px-10 py-6">Maestría %</th>
                  <th className="px-10 py-6">Insignias</th>
                  <th className="px-10 py-6 text-right">Detalle</th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                {allStudents.map(s => (
                  <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                    <td className="px-10 py-6 flex items-center gap-4">
                      <div className="relative">
                        <img src={`https://ui-avatars.com/api/?name=${s.name}&background=13a4ec&color=fff`} className="size-10 rounded-full border border-white/10" alt="" />
                        <div className="absolute -bottom-1 -right-1 size-3 bg-emerald-500 rounded-full border-2 border-surface" />
                      </div>
                      <span className="font-black text-white text-xs">{s.name}</span>
                    </td>
                    <td className="px-10 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-tight">{s.major || 'Mecatrónica'}</td>
                    <td className="px-10 py-6">
                       <div className="flex items-center gap-4">
                          <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden min-w-[80px]">
                            <div className="h-full bg-primary-500 rounded-full" style={{ width: `${s.progress}%` }} />
                          </div>
                          <span className="font-black text-xs text-primary-400">{s.progress}%</span>
                       </div>
                    </td>
                    <td className="px-10 py-6">
                       <div className="flex gap-1 text-yellow-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={`material-symbols-outlined text-[14px] ${i < s.stars ? 'fill-1' : 'opacity-10 text-white'}`}>stars</span>
                        ))}
                       </div>
                    </td>
                    <td className="px-10 py-6 text-right">
                       <button className="text-[9px] font-black uppercase tracking-widest text-primary-400 hover:text-white transition-colors">Analizar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
       </div>
     );
  }

  function renderStudentProgress() {
    const data = currentUser?.weeklyHistory || [];
    return (
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 bg-surface border border-[#233c48] rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group">
            <div className="absolute -top-24 -right-24 size-64 bg-primary-500/5 rounded-full blur-[80px] pointer-events-none" />
            <div className="flex justify-between items-center mb-12">
               <div>
                  <h3 className="text-white font-black uppercase tracking-[0.2em] text-sm italic">Métricas de Ingeniería</h3>
                  <p className="text-slate-500 text-[10px] uppercase font-bold mt-2">Avance de conocimientos aplicados</p>
               </div>
               <div className="bg-primary-500/10 text-primary-400 px-5 py-2 rounded-2xl border border-primary-500/20 text-[9px] font-black uppercase tracking-widest">Dataset Actualizado</div>
            </div>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorProg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#13a4ec" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#13a4ec" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#233c48" vertical={false} opacity={0.3} />
                  <XAxis dataKey="week" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} tick={{dy: 10}} />
                  <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} unit="%" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111c22', borderRadius: '16px', border: '1px solid #233c48', fontSize: '10px', color: '#fff' }}
                    itemStyle={{ color: '#13a4ec', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="percentage" stroke="#13a4ec" strokeWidth={4} fillOpacity={1} fill="url(#colorProg)" animationDuration={2000} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-surface border border-[#233c48] rounded-[3rem] p-10 shadow-2xl flex flex-col relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5">
                <span className="material-symbols-outlined text-6xl text-white">leaderboard</span>
             </div>
            <h3 className="text-white font-black uppercase tracking-widest text-xs mb-10 flex items-center gap-2">
              <span className="material-symbols-outlined text-yellow-400">workspace_premium</span> Cuadro de Honor Estudiantil
            </h3>
            <div className="space-y-6 flex-1 overflow-y-auto pr-2 scrollbar-hide">
              {dbService.getUsers().filter(u => u.role === UserRole.STUDENT).sort((a,b) => b.progress - a.progress).slice(0, 6).map((s, i) => (
                <div key={s.id} className={`flex items-center gap-5 p-4 rounded-2xl border transition-all ${s.id === currentUser?.id ? 'bg-primary-500/10 border-primary-500/30 shadow-lg' : 'bg-[#1b2a33]/30 border-transparent hover:border-white/10'}`}>
                  <span className={`text-xl font-black w-6 text-center ${i === 0 ? 'text-yellow-400' : 'text-slate-700'}`}>{i + 1}</span>
                  <img src={`https://ui-avatars.com/api/?name=${s.name}&background=13a4ec&color=fff`} className="size-11 rounded-full border border-white/5" alt="" />
                  <div className="flex-1 min-w-0">
                    <p className={`text-[11px] font-black truncate ${s.id === currentUser?.id ? 'text-primary-400' : 'text-white'}`}>{s.id === currentUser?.id ? 'Tú (Mecatrónico)' : s.name}</p>
                    <p className="text-[8px] text-slate-500 font-bold uppercase mt-0.5">{s.major || 'Ingeniería'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-white">{s.progress}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fix: Changed from const to function declaration to avoid "used before declaration" error
  function renderModuleEditor() {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300 overflow-y-auto">
        <div className="bg-surface border border-[#233c48] w-full max-w-5xl rounded-[3rem] shadow-[0_0_100px_rgba(19,164,236,0.1)] flex flex-col max-h-[90vh] overflow-hidden">
          <div className="px-12 py-8 border-b border-[#233c48] flex justify-between items-center bg-white/5">
            <div className="flex items-center gap-4">
               <div className="size-12 rounded-2xl bg-primary-500 flex items-center justify-center text-white shadow-xl shadow-primary-500/20">
                  <span className="material-symbols-outlined text-2xl">science</span>
               </div>
               <h3 className="text-white font-black uppercase tracking-[0.2em] text-sm italic">Arquitectura Académica TuVir</h3>
            </div>
            <button onClick={() => setIsEditing(false)} className="size-12 rounded-2xl hover:bg-white/5 text-slate-500 hover:text-white transition-all flex items-center justify-center border border-white/5"><span className="material-symbols-outlined">close</span></button>
          </div>
          
          <form onSubmit={handleSaveModule} className="flex-1 overflow-y-auto p-12 space-y-12 scrollbar-hide">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-4 space-y-10">
                <h4 className="text-[10px] font-black text-primary-500 uppercase tracking-widest border-b border-primary-500/20 pb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">precision_manufacturing</span> Especificaciones Base
                </h4>
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Título del Módulo</label>
                    <input required value={editingModule?.title} onChange={e => setEditingModule(p => p ? {...p, title: e.target.value} : null)} className="w-full bg-[#0f172a] border border-[#233c48] rounded-2xl px-6 py-4 text-white text-sm focus:border-primary-500 outline-none shadow-inner" />
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Área</label>
                      <input required value={editingModule?.category} onChange={e => setEditingModule(p => p ? {...p, category: e.target.value} : null)} className="w-full bg-[#0f172a] border border-[#233c48] rounded-2xl px-6 py-4 text-white text-sm focus:border-primary-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Complejidad</label>
                      <select value={editingModule?.difficulty} onChange={e => setEditingModule(p => p ? {...p, difficulty: e.target.value as any} : null)} className="w-full bg-[#0f172a] border border-[#233c48] rounded-2xl px-6 py-4 text-white text-sm focus:border-primary-500 outline-none appearance-none">
                        <option>Básico</option><option>Intermedio</option><option>Avanzado</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Resumen del Curso</label>
                    <textarea value={editingModule?.description} onChange={e => setEditingModule(p => p ? {...p, description: e.target.value} : null)} rows={4} className="w-full bg-[#0f172a] border border-[#233c48] rounded-2xl px-6 py-4 text-white text-sm focus:border-primary-500 outline-none resize-none" />
                  </div>
                </div>
              </div>

              <div className="lg:col-span-8 space-y-10">
                <div className="flex justify-between items-center border-b border-purple-500/20 pb-4">
                  <h4 className="text-[10px] font-black text-purple-500 uppercase tracking-widest flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">settings_input_component</span> Estructura de Lecciones
                  </h4>
                  <button type="button" onClick={() => {}} className="bg-primary-500/10 text-primary-400 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-500 hover:text-white transition-all border border-primary-500/20">Añadir Componente</button>
                </div>
                <div className="space-y-8 max-h-[500px] overflow-y-auto pr-4 scrollbar-hide pb-10">
                  {editingModule?.lessons.map((lesson, idx) => (
                    <div key={lesson.id} className="bg-[#1b2a33]/40 border border-[#233c48] p-8 rounded-[2.5rem] space-y-8 shadow-2xl relative group/item">
                      <div className="flex items-center gap-5">
                        <span className="size-10 bg-primary-500 rounded-2xl flex items-center justify-center text-[11px] font-black text-white shadow-xl shadow-primary-500/20 italic">{idx+1}</span>
                        <input value={lesson.title} onChange={e => setEditingModule(p => p ? {...p, lessons: p.lessons.map(l => l.id === lesson.id ? {...l, title: e.target.value} : l)} : null)} className="flex-1 bg-transparent border-none text-white text-base font-black p-0 focus:ring-0 italic tracking-tight" placeholder="Nombre del componente..." />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          <div>
                            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Recurso de Video / Link</label>
                            <input value={lesson.videoUrl || ''} onChange={e => setEditingModule(p => p ? {...p, lessons: p.lessons.map(l => l.id === lesson.id ? {...l, videoUrl: e.target.value} : l)} : null)} className="w-full bg-[#0f172a] border border-[#233c48] rounded-2xl px-5 py-3 text-white text-[11px] outline-none" placeholder="YouTube URL..." />
                          </div>
                          <div>
                            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Documentación Adicional</label>
                            <input value={lesson.externalLink || ''} onChange={e => setEditingModule(p => p ? {...p, lessons: p.lessons.map(l => l.id === lesson.id ? {...l, externalLink: e.target.value} : l)} : null)} className="w-full bg-[#0f172a] border border-[#233c48] rounded-2xl px-5 py-3 text-white text-[11px] outline-none" placeholder="https://docs..." />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-1">Laboratorio Visual (Imágenes)</label>
                          <div className="flex flex-wrap gap-4">
                            {lesson.images?.map((img, i) => (
                              <div key={i} className="size-14 relative group/img">
                                <img src={img} className="w-full h-full object-cover rounded-xl border border-white/10" />
                                <button type="button" className="absolute -top-2 -right-2 size-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"><span className="material-symbols-outlined text-[10px]">close</span></button>
                              </div>
                            ))}
                            <label className="size-14 rounded-2xl border-2 border-dashed border-[#233c48] flex items-center justify-center cursor-pointer hover:bg-primary-500/10 hover:border-primary-500/50 transition-all group/add">
                               <span className="material-symbols-outlined text-2xl text-slate-700 group-hover/add:text-primary-400">add_photo_alternate</span>
                               <input type="file" accept="image/*" className="hidden" />
                            </label>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Desarrollo Teórico-Práctico</label>
                        <textarea value={lesson.content} onChange={e => setEditingModule(p => p ? {...p, lessons: p.lessons.map(l => l.id === lesson.id ? {...l, content: e.target.value} : l)} : null)} className="w-full bg-[#0f172a] border border-[#233c48] rounded-2xl px-6 py-4 text-white text-xs outline-none resize-none h-40 leading-relaxed shadow-inner" placeholder="Escribe el desarrollo del tema aquí..." />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex gap-6 pt-10 border-t border-[#233c48]">
              <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-5 text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-white transition-all">Descartar</button>
              <button type="submit" className="flex-[2] bg-primary-500 text-white font-black uppercase tracking-[0.3em] py-5 rounded-[2rem] shadow-[0_20px_60px_rgba(19,164,236,0.3)] hover:bg-primary-400 transition-all active:scale-95">Sincronizar Ruta Académica</button>
            </div>
          </form>
        </div>
      </div>
    );
  }
};

export default App;
