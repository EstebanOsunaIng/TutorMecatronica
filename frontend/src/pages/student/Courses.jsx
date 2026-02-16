import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, PlayCircle } from 'lucide-react';
import Card from '../../components/common/Card.jsx';
import Modal from '../../components/common/Modal.jsx';
import { modulesApi } from '../../api/modules.api.js';
import { progressApi } from '../../api/progress.api.js';

const DEFAULT_MODULE_IMAGE = '/assets/campus-placeholder.svg';

export default function Courses() {
  const [modules, setModules] = useState([]);
  const [progressRows, setProgressRows] = useState([]);
  const [restartingModuleId, setRestartingModuleId] = useState('');
  const [restartTarget, setRestartTarget] = useState(null);

  const load = useCallback(async () => {
    const [modulesRes, progressRes] = await Promise.all([modulesApi.listPublished(), progressApi.myProgress()]);
    const sortedModules = [...(modulesRes.data.modules || [])].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    setModules(sortedModules);
    setProgressRows(progressRes.data.progress || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const restartModule = async (moduleId) => {
    setRestartingModuleId(moduleId);
    try {
      await progressApi.restartModule({ moduleId });
      await load();
    } finally {
      setRestartingModuleId('');
      setRestartTarget(null);
    }
  };

  const modulesWithProgress = useMemo(() => {
    const progressByModuleId = new Map((progressRows || []).map((row) => [String(row.moduleId), row]));

    return modules.map((moduleItem, index) => {
      const row = progressByModuleId.get(String(moduleItem._id));
      const percent = Math.max(0, Math.min(100, Number(row?.moduleProgressPercent || 0)));
      const completed = percent >= 100 || Boolean(row?.completedAt);
      const inProgress = !completed && percent > 0;

      let locked = false;
      if (index > 0) {
        const previous = modules[index - 1];
        const previousRow = progressByModuleId.get(String(previous._id));
        const previousCompleted = Number(previousRow?.moduleProgressPercent || 0) >= 100 || Boolean(previousRow?.completedAt);
        locked = !previousCompleted;
      }

      return {
        ...moduleItem,
        moduleNumber: index + 1,
        progressPercent: percent,
        completed,
        inProgress,
        locked
      };
    });
  }, [modules, progressRows]);

  return (
    <div className="space-y-4">
      <Card className="rounded-3xl border-cyan-100/80 bg-gradient-to-br from-sky-50/85 via-cyan-50/65 to-slate-50 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),inset_0_0_0_1px_rgba(125,211,252,0.35),inset_0_-18px_32px_-26px_rgba(6,95,130,0.28)] dark:border-slate-800 dark:bg-slate-900/40 dark:bg-none dark:shadow-[inset_0_1px_0_rgba(148,163,184,0.08),inset_0_0_0_1px_rgba(56,189,248,0.18),inset_0_-20px_34px_-24px_rgba(15,118,110,0.22)]">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Cursos</h2>
        <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {modulesWithProgress.map((m) => (
            <Card key={m._id} className="group h-[420px] overflow-hidden border border-white/15 bg-white/[0.08] p-0 shadow-[0_18px_45px_-28px_rgba(8,47,73,0.95)] backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:bg-white/[0.12]">
              <div className="relative h-full">
                <div className="relative h-36 w-full shrink-0 overflow-hidden bg-slate-800">
                  <img
                    src={m.imageUrl || DEFAULT_MODULE_IMAGE}
                    alt={m.title || 'Modulo'}
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_MODULE_IMAGE;
                    }}
                    className={`h-full w-full object-cover ${m.locked ? 'opacity-60' : ''}`}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/10 to-transparent" />

                  <span className="absolute left-3 top-3 rounded-full bg-slate-900/75 px-2 py-1 text-[11px] font-bold text-slate-100 ring-1 ring-white/20">
                    Modulo {m.moduleNumber}
                  </span>

                  {m.locked ? (
                    <>
                      <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-slate-900/75 px-2 py-1 text-[11px] font-semibold text-slate-100 ring-1 ring-white/20">
                        <Lock className="h-3.5 w-3.5" />
                        Bloqueado
                      </span>
                      <span className="absolute right-3 top-12 rounded-full bg-slate-900/70 px-2 py-1 text-[10px] font-semibold text-slate-200 ring-1 ring-white/15">
                        {m.category || 'General'}
                      </span>
                    </>
                  ) : m.completed ? (
                    <>
                      <span className="absolute right-3 top-3 rounded-full bg-emerald-500/20 px-2 py-1 text-[11px] font-semibold text-emerald-100 ring-1 ring-emerald-300/35">
                        Completado
                      </span>
                      <span className="absolute right-3 top-12 rounded-full bg-slate-900/70 px-2 py-1 text-[10px] font-semibold text-slate-200 ring-1 ring-white/15">
                        {m.category || 'General'}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="absolute right-3 top-3 rounded-full bg-cyan-500/20 px-2 py-1 text-[11px] font-semibold text-cyan-100 ring-1 ring-cyan-300/35">
                        {m.inProgress ? 'En progreso' : 'Pendiente'}
                      </span>
                      <span className="absolute right-3 top-12 rounded-full bg-slate-900/70 px-2 py-1 text-[10px] font-semibold text-slate-200 ring-1 ring-white/15">
                        {m.category || 'General'}
                      </span>
                    </>
                  )}
                </div>

                <div className="flex h-[calc(100%-9rem)] flex-col p-5">
                  <div className="space-y-2.5">
                    <h3 className="line-clamp-2 text-xl font-bold leading-tight text-white">{m.title || 'Modulo sin titulo'}</h3>
                    <p className="line-clamp-2 text-xs leading-relaxed text-slate-300" title={m.description || 'Sin descripcion.'}>
                      {m.description || 'Sin descripcion.'}
                    </p>
                  </div>

                  <div className="mt-auto space-y-2.5 pt-3">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                      <span>Progreso</span>
                      <span>{m.progressPercent}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-700/80">
                      <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-cyan-400" style={{ width: `${m.progressPercent}%` }} />
                    </div>

                    {m.locked ? (
                      <div className="inline-flex w-full items-center justify-center gap-1 rounded-lg bg-slate-700/60 px-3 py-2 text-sm font-semibold text-slate-200">
                        <Lock className="h-4 w-4" />
                        Completa el modulo anterior
                      </div>
                    ) : m.completed ? (
                      <div className="grid grid-cols-2 gap-2">
                        <Link to={`/student/courses/${m._id}`} className="inline-flex w-full items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-brand-500 to-cyan-400 px-3 py-2 text-sm font-semibold text-white">
                          <PlayCircle className="h-4 w-4" />
                          Ver modulo
                        </Link>
                        <button
                          type="button"
                          onClick={() => setRestartTarget(m)}
                          disabled={restartingModuleId === m._id}
                          className="inline-flex w-full items-center justify-center rounded-lg bg-slate-700/60 px-3 py-2 text-sm font-semibold text-slate-200 ring-1 ring-white/15 disabled:opacity-50"
                        >
                          {restartingModuleId === m._id ? 'Reiniciando...' : 'Reiniciar'}
                        </button>
                      </div>
                    ) : (
                      <Link to={`/student/courses/${m._id}`} className="inline-flex w-full items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-brand-500 to-cyan-400 px-3 py-2 text-sm font-semibold text-white">
                        <PlayCircle className="h-4 w-4" />
                        Continuar modulo
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      <Modal open={Boolean(restartTarget)} onClose={() => setRestartTarget(null)}>
        <h3 className="text-lg font-bold">Reiniciar modulo</h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Esto pondra el avance del modulo en 0% y deberas recorrer sus subniveles nuevamente para sumar XP.
        </p>
        <p className="mt-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          {restartTarget?.title || 'Modulo'}
        </p>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setRestartTarget(null)}
            className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => restartTarget?._id && restartModule(restartTarget._id)}
            disabled={restartingModuleId === restartTarget?._id}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50"
          >
            {restartingModuleId === restartTarget?._id ? 'Reiniciando...' : 'Si, reiniciar'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
