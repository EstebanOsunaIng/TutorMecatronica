import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Pencil } from 'lucide-react';
import Card from '../../components/common/Card.jsx';
import { modulesApi } from '../../api/modules.api.js';

const DEFAULT_MODULE_IMAGE = '/assets/campus-placeholder.svg';

export default function TeacherDashboard() {
  const [modules, setModules] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    modulesApi.list().then((res) => setModules(res.data.modules || []));
  }, []);

  const orderedModules = useMemo(() => {
    return [...modules].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [modules]);

  const firstThree = orderedModules.slice(0, 3).map((m, index) => ({ ...m, moduleNumber: index + 1 }));

  const moduleImage = (moduleItem) => {
    return moduleItem.imageUrl || moduleItem.image || moduleItem.coverImage || DEFAULT_MODULE_IMAGE;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Inicio docente</h2>
          <p className="mt-1 text-sm text-slate-400">Resumen rapido de tus primeros modulos.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="text-xs uppercase tracking-widest text-brand-300">Total modulos</div>
          <div className="mt-2 text-3xl font-bold">{modules.length}</div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-widest text-brand-300">Gestion</div>
          <button
            onClick={() => navigate('/teacher/modules')}
            className="mt-2 inline-flex items-center gap-2 rounded-lg bg-brand-500/15 px-3 py-2 text-sm font-semibold text-brand-100 ring-1 ring-brand-300/30"
          >
            Ver todos los modulos
          </button>
        </Card>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold uppercase tracking-widest text-brand-300">Modulos</h3>
          <button
            type="button"
            onClick={() => navigate('/teacher/modules')}
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand-200 hover:text-brand-100"
          >
            Ver mas
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {firstThree.map((m) => (
            <Card
              key={m._id}
              onClick={() => navigate(`/teacher/modules/editor?moduleId=${m._id}`)}
              className="group h-[360px] overflow-hidden border border-white/15 bg-white/[0.08] p-0 shadow-[0_18px_45px_-28px_rgba(8,47,73,0.95)] backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:bg-white/[0.12]"
            >
              <div className="flex h-full flex-col">
                <div className="relative h-36 w-full shrink-0 overflow-hidden bg-slate-800">
                  <img src={moduleImage(m)} alt={m.title || 'Modulo'} className="h-full w-full object-cover" />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/10 to-transparent" />
                  <span className="absolute left-3 top-3 rounded-full bg-slate-900/75 px-2 py-1 text-[11px] font-bold text-slate-100 ring-1 ring-white/20">
                    Modulo {m.moduleNumber}
                  </span>
                  <span className="absolute right-3 top-3 rounded-full bg-slate-900/70 px-2 py-1 text-[10px] font-semibold text-slate-200 ring-1 ring-white/15">
                    {m.category || 'General'}
                  </span>
                </div>

                <div className="flex flex-1 flex-col gap-3 p-5">
                  <div className="space-y-2.5">
                    <h4 className="line-clamp-2 text-lg font-bold leading-tight text-white">{m.title || 'Modulo sin titulo'}</h4>
                    <p className="line-clamp-2 text-xs leading-relaxed text-slate-300">{m.description || 'Sin descripcion.'}</p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/teacher/modules/editor?moduleId=${m._id}`);
                    }}
                    className="mt-auto inline-flex h-9 items-center justify-center gap-1 rounded-lg bg-brand-500/15 px-3 text-sm font-semibold text-brand-100 ring-1 ring-brand-300/30"
                  >
                    <Pencil className="h-4 w-4" />
                    Editar
                  </button>
                </div>
              </div>
            </Card>
          ))}

          {!firstThree.length && (
            <Card>
              <p className="text-sm text-slate-400">Aun no tienes modulos. Crea el primero para empezar.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
