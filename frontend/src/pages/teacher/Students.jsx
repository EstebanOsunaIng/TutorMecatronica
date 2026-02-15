import React, { useEffect, useMemo, useState } from 'react';
import Card from '../../components/common/Card.jsx';
import Loader from '../../components/common/Loader.jsx';
import { teacherApi } from '../../api/teacher.api.js';

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function formatDate(date) {
  if (!date) return '-';
  try {
    return new Date(date).toLocaleDateString();
  } catch {
    return '-';
  }
}

function ProgressBar({ value }) {
  const v = clamp(Number(value) || 0, 0, 100);
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div className="h-full rounded-full bg-brand-500" style={{ width: `${v}%` }} />
      </div>
      <div className="w-full text-center text-xs font-bold text-brand-700 dark:text-brand-200">{v}%</div>
    </div>
  );
}

function BadgeDots({ count = 0 }) {
  const filled = clamp(Number(count) || 0, 0, 5);
  const arr = Array.from({ length: 5 }).map((_, i) => i < filled);
  return (
    <div className="flex items-center gap-1">
      {arr.map((on, i) => (
        <span
          key={i}
          className={
            `h-2 w-2 rounded-full border ` +
            (on
              ? 'border-amber-300/60 bg-amber-400 dark:border-amber-300/50'
              : 'border-slate-300 bg-slate-200 dark:border-slate-700 dark:bg-slate-800')
          }
        />
      ))}
      <span className="ml-2 text-xs text-slate-600 dark:text-slate-400">{count}</span>
    </div>
  );
}

export default function TeacherStudents() {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [students, setStudents] = useState([]);

  const [openId, setOpenId] = useState('');
  const [detailLoadingId, setDetailLoadingId] = useState('');
  const [detailById, setDetailById] = useState({});
  const [detailErrorById, setDetailErrorById] = useState({});

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await teacherApi.listStudents(q);
      setStudents(res.data.students || []);
    } catch (e) {
      setError('No se pudo cargar el listado de estudiantes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const rows = useMemo(() => students || [], [students]);

  const toggleAnalyze = async (studentId) => {
    if (openId === studentId) {
      setOpenId('');
      return;
    }
    setOpenId(studentId);

    if (detailById[studentId]) return;
    setDetailLoadingId(studentId);
    setDetailErrorById((prev) => ({ ...prev, [studentId]: '' }));
    try {
      const res = await teacherApi.studentProgress(studentId);
      setDetailById((prev) => ({ ...prev, [studentId]: res.data }));
    } catch (e) {
      setDetailErrorById((prev) => ({ ...prev, [studentId]: 'No se pudo cargar el progreso.' }));
    } finally {
      setDetailLoadingId('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Auditoría de Progreso</h2>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
            Reporte institucional, detallado
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar estudiante"
            className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-300 focus:ring-4 focus:ring-brand-500/10 dark:border-slate-800 dark:bg-slate-950/60 dark:text-white md:w-60"
          />
          <button
            onClick={load}
            className="w-full rounded-xl bg-brand-500 px-4 py-2 text-sm font-extrabold text-white hover:bg-brand-600 sm:w-auto"
          >
            Buscar
          </button>
          <button
            disabled
            className="hidden rounded-xl border border-slate-200 bg-white/70 px-4 py-2 text-sm font-bold text-slate-700 opacity-60 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200 md:inline-flex"
            title="Pendiente"
          >
            Exportar Excel
          </button>
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <div className="min-w-0">
            <div className="grid grid-cols-[minmax(200px,2fr)_minmax(150px,1.3fr)_minmax(120px,1fr)_minmax(110px,0.8fr)_90px] gap-0 border-b border-slate-200 bg-slate-50/80 px-3 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400">
              <div>Estudiante</div>
              <div>Programa</div>
              <div>Proceso</div>
              <div>Insignias</div>
              <div className="text-right">Detalle</div>
            </div>

            {loading ? (
              <div className="p-10">
                <Loader />
              </div>
            ) : error ? (
              <div className="p-6 text-sm text-red-600 dark:text-red-300">{error}</div>
            ) : rows.length === 0 ? (
              <div className="p-6 text-sm text-slate-600 dark:text-slate-300">No hay estudiantes para mostrar.</div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {rows.map((s) => {
                  const isOpen = openId === s._id;
                  const detail = detailById[s._id];
                  const detailError = detailErrorById[s._id];
                  const isDetailLoading = detailLoadingId === s._id;

                  return (
                    <div key={s._id}>
                      <div className="grid grid-cols-[minmax(200px,2fr)_minmax(150px,1.3fr)_minmax(120px,1fr)_minmax(110px,0.8fr)_90px] items-center px-3 py-2.5">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500/15 text-sm font-extrabold text-brand-700 dark:bg-brand-500/20 dark:text-brand-200">
                              {s.initials || 'ES'}
                            </div>
                            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-950" />
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-extrabold text-slate-900 dark:text-white">
                              {s.name} {s.lastName}
                            </div>
                            <div className="truncate text-xs text-slate-600 dark:text-slate-400">{s.email}</div>
                          </div>
                        </div>

                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                          Ingeniería Mecatrónica
                          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Último acceso: {formatDate(s.lastLoginAt)}</div>
                        </div>

                        <div>
                          <ProgressBar value={s.progress?.overallPercent || 0} />
                        </div>

                        <div>
                          <BadgeDots count={s.badgesCount || 0} />
                        </div>

                        <div className="text-right">
                          <button
                            onClick={() => toggleAnalyze(s._id)}
                            className="text-xs font-extrabold uppercase tracking-[0.14em] text-brand-700 hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200"
                          >
                            {isOpen ? 'Cerrar' : 'Analizar'}
                          </button>
                        </div>
                      </div>

                      {isOpen && (
                        <div className="bg-white/60 px-4 pb-4 dark:bg-slate-950/30">
                          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/60">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                              <div>
                                <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                                  Vista previa
                                </div>
                                <div className="mt-1 text-base font-extrabold text-slate-900 dark:text-white">
                                  Proceso general del estudiante
                                </div>
                              </div>
                              <div className="flex items-center gap-6 text-sm">
                                <div className="text-slate-700 dark:text-slate-200">
                                  <span className="text-xs text-slate-500 dark:text-slate-400">Módulos iniciados</span>
                                  <div className="font-extrabold">{detail?.summary?.modulesStarted ?? s.progress?.modulesStarted ?? 0}</div>
                                </div>
                                <div className="text-slate-700 dark:text-slate-200">
                                  <span className="text-xs text-slate-500 dark:text-slate-400">Completados</span>
                                  <div className="font-extrabold">{detail?.summary?.modulesCompleted ?? s.progress?.modulesCompleted ?? 0}</div>
                                </div>
                                <div className="text-slate-700 dark:text-slate-200">
                                  <span className="text-xs text-slate-500 dark:text-slate-400">Progreso</span>
                                  <div className="font-extrabold">{detail?.summary?.overallPercent ?? s.progress?.overallPercent ?? 0}%</div>
                                </div>
                              </div>
                            </div>

                            <div className="mt-5">
                              {isDetailLoading ? (
                                <div className="py-4">
                                  <Loader />
                                </div>
                              ) : detailError ? (
                                <div className="text-sm text-red-600 dark:text-red-300">{detailError}</div>
                              ) : (
                                <div className="space-y-3">
                                  {(detail?.modules || []).map((m) => (
                                    <div
                                      key={m.moduleId}
                                      className="flex flex-col gap-1.5 rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-950/40 md:flex-row md:items-center md:justify-between"
                                    >
                                      <div className="min-w-0">
                                        <div className="truncate font-bold text-slate-900 dark:text-white">{m.title}</div>
                                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{m.level} · {m.category}</div>
                                      </div>
                                      <div className="flex items-center justify-between gap-4 md:justify-end">
                                        <ProgressBar value={m.percent} />
                                      </div>
                                    </div>
                                  ))}

                                  {detail && (detail.modules || []).length === 0 && (
                                    <div className="text-sm text-slate-600 dark:text-slate-300">Sin actividad registrada.</div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
