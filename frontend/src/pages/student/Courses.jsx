import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, PlayCircle } from 'lucide-react';
import Card from '../../components/common/Card.jsx';
import Modal from '../../components/common/Modal.jsx';
import RobotLoader from '../../components/common/RobotLoader.jsx';
import { modulesApi } from '../../api/modules.api.js';
import { progressApi } from '../../api/progress.api.js';

const DEFAULT_MODULE_IMAGE = '/assets/campus-placeholder.svg';

export default function Courses() {
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [progressRows, setProgressRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restartingModuleId, setRestartingModuleId] = useState('');
  const [restartTarget, setRestartTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [modulesRes, progressRes] = await Promise.all([modulesApi.listPublished(), progressApi.myProgress()]);
      const sortedModules = [...(modulesRes.data.modules || [])].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      setModules(sortedModules);
      setProgressRows(progressRes.data.progress || []);
    } finally {
      setLoading(false);
    }
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
    <>
      <div className="space-y-4">
        <Card className="rounded-3xl border-cyan-100/80 bg-gradient-to-br from-sky-50/85 via-cyan-50/65 to-slate-50 dark:border-slate-800 dark:bg-slate-900/40 dark:bg-none">
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Cursos</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Explora tus modulos publicados y continua tu progreso.</p>
            </div>
            <Card className="border-cyan-100/80 bg-white/90 p-4 dark:border-slate-700 dark:bg-slate-900/60">
              {loading ? (
                <div className="rounded-2xl border border-cyan-100 bg-white/80 p-6 dark:border-slate-700 dark:bg-slate-900/60">
                  <RobotLoader label="Cargando modulos..." scale={0.75} />
                </div>
              ) : (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {modulesWithProgress.map((m) => (
                    <Card
                      key={m._id}
                      onClick={() => {
                        if (!m.locked) navigate(`/student/courses/${m._id}`);
                      }}
                      className={`group overflow-hidden border border-cyan-100 bg-white/90 !p-0 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50 ${
                        m.locked ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'
                      }`}
                    >
                      <div className="relative h-full min-h-[380px]">
                        <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-t-2xl bg-slate-800">
                          <img
                            src={m.imageUrl || DEFAULT_MODULE_IMAGE}
                            alt={m.title || 'Modulo'}
                            onError={(e) => {
                              e.currentTarget.src = DEFAULT_MODULE_IMAGE;
                            }}
                            className={`h-full w-full object-cover ${m.locked ? 'opacity-60' : ''}`}
                          />
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent dark:from-slate-950/55" />

                          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2 py-1 text-[11px] font-bold text-slate-800 ring-1 ring-slate-300 dark:bg-slate-900/75 dark:text-slate-100 dark:ring-white/20">
                            Modulo {m.moduleNumber}
                          </span>

                          {m.locked ? (
                            <>
                              <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-slate-100/95 px-2 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-300 dark:bg-slate-900/75 dark:text-slate-100 dark:ring-white/20">
                                <Lock className="h-3.5 w-3.5" />
                                Bloqueado
                              </span>
                              <span className="absolute right-3 top-12 rounded-full bg-white/95 px-2 py-1 text-[10px] font-semibold text-slate-700 ring-1 ring-slate-300 dark:bg-slate-900/70 dark:text-slate-200 dark:ring-white/15">
                                {m.category || 'General'}
                              </span>
                            </>
                          ) : m.completed ? (
                            <>
                              <span className="absolute right-3 top-3 rounded-full bg-emerald-100/95 px-2 py-1 text-[11px] font-semibold text-emerald-800 ring-1 ring-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-100 dark:ring-emerald-300/35">
                                Completado
                              </span>
                              <span className="absolute right-3 top-12 rounded-full bg-white/95 px-2 py-1 text-[10px] font-semibold text-slate-700 ring-1 ring-slate-300 dark:bg-slate-900/70 dark:text-slate-200 dark:ring-white/15">
                                {m.category || 'General'}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="absolute right-3 top-3 rounded-full bg-cyan-100/95 px-2 py-1 text-[11px] font-semibold text-cyan-800 ring-1 ring-cyan-300 dark:bg-cyan-500/20 dark:text-cyan-100 dark:ring-cyan-300/35">
                                {m.inProgress ? 'En progreso' : 'Pendiente'}
                              </span>
                              <span className="absolute right-3 top-12 rounded-full bg-white/95 px-2 py-1 text-[10px] font-semibold text-slate-700 ring-1 ring-slate-300 dark:bg-slate-900/70 dark:text-slate-200 dark:ring-white/15">
                                {m.category || 'General'}
                              </span>
                            </>
                          )}
                        </div>

                        <div className="flex flex-1 flex-col p-4">
                          <div className="h-[112px] space-y-2 overflow-hidden">
                            <h3 className="line-clamp-2 text-base font-extrabold text-slate-900 group-hover:text-[#1d4f91] dark:text-white dark:group-hover:text-sky-200">
                              {m.title || 'Modulo sin titulo'}
                            </h3>
                            <p className="line-clamp-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300" title={m.description || 'Sin descripcion.'}>
                              {m.description || 'Sin descripcion.'}
                            </p>
                          </div>

                          <div className="mt-auto h-[104px] space-y-2.5 pt-3">
                            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-300">
                              <span>Progreso</span>
                              <span>{m.progressPercent}%</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700/80">
                              <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-cyan-400" style={{ width: `${m.progressPercent}%` }} />
                            </div>

                            {m.locked ? (
                              <div className="inline-flex h-10 w-full items-center justify-center gap-1 rounded-full border border-slate-200 bg-white/80 px-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
                                <Lock className="h-4 w-4" />
                                Completa el modulo anterior
                              </div>
                            ) : m.completed ? (
                              <div className="grid grid-cols-2 gap-2">
                                <Link
                                  to={`/student/courses/${m._id}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex h-10 w-full items-center justify-center gap-1 rounded-full border border-slate-200 bg-white/80 px-3 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:border-brand-400 dark:hover:text-brand-100"
                                >
                                  <PlayCircle className="h-4 w-4" />
                                  Ver modulo
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => setRestartTarget(m)}
                                  disabled={restartingModuleId === m._id}
                                  className="inline-flex h-10 w-full items-center justify-center rounded-full border border-slate-200 bg-white/80 px-3 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:border-brand-400 dark:hover:text-brand-100"
                                >
                                  {restartingModuleId === m._id ? 'Reiniciando...' : 'Reiniciar'}
                                </button>
                              </div>
                            ) : (
                              <Link
                                to={`/student/courses/${m._id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex h-10 w-full items-center justify-center gap-1 rounded-full border border-slate-200 bg-white/80 px-3 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:border-brand-400 dark:hover:text-brand-100"
                              >
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
              )}
            </Card>
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
    </>
  );
}
