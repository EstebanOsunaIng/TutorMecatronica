import React, { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import Card from '../../components/common/Card.jsx';
import Loader from '../../components/common/Loader.jsx';
import RobotLoader from '../../components/common/RobotLoader.jsx';
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
      <div className="w-24">
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div className="h-full rounded-full bg-brand-500" style={{ width: `${v}%` }} />
        </div>
        <div className="mt-1 w-full text-center text-xs font-bold text-brand-700 dark:text-brand-200">{v}%</div>
      </div>
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

const EMPTY_FILTERS = {
  q: '',
  lastLoginFrom: '',
  lastLoginTo: '',
  progressMin: '',
  progressMax: '',
  badges: [],
  sortBy: 'lastLoginAt',
  sortOrder: 'desc'
};

const BADGE_FILTER_OPTIONS = [0, 1, 2, 3, 4, 5];

export default function TeacherStudents() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
  const [activeColumnMenu, setActiveColumnMenu] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [students, setStudents] = useState([]);

  const [exporting, setExporting] = useState(false);

  const [openId, setOpenId] = useState('');
  const [detailLoadingId, setDetailLoadingId] = useState('');
  const [detailById, setDetailById] = useState({});
  const [detailErrorById, setDetailErrorById] = useState({});

  const buildParams = (activeFilters) => {
    const params = {};
    if (activeFilters.q.trim()) params.q = activeFilters.q.trim();
    if (activeFilters.lastLoginFrom) params.lastLoginFrom = activeFilters.lastLoginFrom;
    if (activeFilters.lastLoginTo) params.lastLoginTo = activeFilters.lastLoginTo;
    if (activeFilters.progressMin !== '') params.progressMin = activeFilters.progressMin;
    if (activeFilters.progressMax !== '') params.progressMax = activeFilters.progressMax;
    if (activeFilters.badges.length) params.badges = activeFilters.badges.join(',');
    if (activeFilters.sortBy) {
      params.sortBy = activeFilters.sortBy;
      params.sortOrder = activeFilters.sortOrder;
    }
    return params;
  };

  const load = async (overrideFilters) => {
    const activeFilters = overrideFilters || appliedFilters;
    setLoading(true);
    setError('');
    try {
      const res = await teacherApi.listStudents(buildParams(activeFilters));
      setStudents(res.data.students || []);
      setAppliedFilters({ ...activeFilters });
    } catch (e) {
      setError(e?.response?.data?.error || 'No se pudo cargar el listado de estudiantes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      load(appliedFilters);
    }, 25000);
    return () => window.clearInterval(id);
  }, [appliedFilters]);

  useEffect(() => {
    const handleCloseMenus = () => setActiveColumnMenu('');
    const handleEsc = (event) => {
      if (event.key === 'Escape') setActiveColumnMenu('');
    };
    document.addEventListener('mousedown', handleCloseMenus);
    document.addEventListener('touchstart', handleCloseMenus);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleCloseMenus);
      document.removeEventListener('touchstart', handleCloseMenus);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  const rows = useMemo(() => students || [], [students]);

  const applyFilters = async (nextFilters = filters) => {
    await load(nextFilters);
    setActiveColumnMenu('');
  };

  const clearAllFilters = async () => {
    setFilters(EMPTY_FILTERS);
    await applyFilters(EMPTY_FILTERS);
  };

  const toggleBadgeSelection = (badgeValue) => {
    setFilters((prev) => {
      const key = String(badgeValue);
      const alreadySelected = prev.badges.includes(key);
      return {
        ...prev,
        badges: alreadySelected ? prev.badges.filter((value) => value !== key) : [...prev.badges, key]
      };
    });
  };

  const setColumnSort = async (sortBy, sortOrder) => {
    const nextFilters = { ...filters, sortBy, sortOrder };
    setFilters(nextFilters);
    await applyFilters(nextFilters);
  };

  const clearColumnFilter = async (column) => {
    const nextFilters = { ...filters };

    if (column === 'student') {
      nextFilters.q = '';
      if (nextFilters.sortBy === 'student') {
        nextFilters.sortBy = 'lastLoginAt';
        nextFilters.sortOrder = 'desc';
      }
    }
    if (column === 'lastLogin') {
      nextFilters.lastLoginFrom = '';
      nextFilters.lastLoginTo = '';
      if (nextFilters.sortBy === 'lastLoginAt') {
        nextFilters.sortBy = 'lastLoginAt';
        nextFilters.sortOrder = 'desc';
      }
    }
    if (column === 'progress') {
      nextFilters.progressMin = '';
      nextFilters.progressMax = '';
      if (nextFilters.sortBy === 'progress') {
        nextFilters.sortBy = 'lastLoginAt';
        nextFilters.sortOrder = 'desc';
      }
    }
    if (column === 'badges') {
      nextFilters.badges = [];
      if (nextFilters.sortBy === 'badgesCount') {
        nextFilters.sortBy = 'lastLoginAt';
        nextFilters.sortOrder = 'desc';
      }
    }

    setFilters(nextFilters);
    await applyFilters(nextFilters);
  };

  const isColumnActive = (column) => {
    if (column === 'student') return Boolean(filters.q.trim() || filters.sortBy === 'student');
    if (column === 'lastLogin') return Boolean(filters.lastLoginFrom || filters.lastLoginTo || filters.sortBy === 'lastLoginAt');
    if (column === 'progress') return Boolean(filters.progressMin !== '' || filters.progressMax !== '' || filters.sortBy === 'progress');
    if (column === 'badges') return Boolean(filters.badges.length || filters.sortBy === 'badgesCount');
    return false;
  };

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

  const exportCsv = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const res = await teacherApi.exportStudentsCsv(buildParams(appliedFilters));
      const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const today = new Date().toISOString().slice(0, 10);
      a.download = `reporte-estudiantes-${today}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card data-tour="teacher-students-overview" className="relative space-y-4 border-cyan-100/80 bg-white/90 dark:border-slate-700 dark:bg-slate-900/50">
      {loading && <RobotLoader label="Cargando auditoría..." scale={0.9} overlay />}

      <Card className="space-y-4 border-cyan-100/80 bg-gradient-to-br from-sky-50/85 via-cyan-50/65 to-slate-50 dark:border-slate-800 dark:bg-slate-900/40 dark:bg-none">
        <div>
          <h2 className="text-[1.875rem] font-extrabold tracking-tight text-slate-900 dark:text-white">Auditoría de Progreso</h2>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
            Reporte institucional, detallado
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:justify-between">
          <input
            value={filters.q}
            onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') applyFilters();
            }}
            placeholder="Buscar estudiante"
            className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-300 focus:ring-4 focus:ring-brand-500/10 dark:border-slate-800 dark:bg-slate-950/60 dark:text-white md:min-w-[420px] md:max-w-[620px]"
          />
          <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:flex-wrap md:items-center md:justify-end">
            <button
              onClick={() => applyFilters()}
              className="w-full rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-extrabold text-white hover:bg-brand-600 md:w-auto"
            >
              Buscar
            </button>
            <button
              onClick={clearAllFilters}
              className="w-full rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-extrabold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 md:w-auto"
            >
              Limpiar filtros
            </button>
            <button
              onClick={exportCsv}
              disabled={exporting}
              className="w-full rounded-xl border border-slate-200 bg-white/70 px-5 py-2.5 text-sm font-extrabold text-slate-800 transition hover:border-brand-300 hover:bg-brand-50 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200 dark:hover:bg-slate-800 md:w-auto"
            >
              {exporting ? 'Exportando...' : 'Exportar CSV'}
            </button>
          </div>
        </div>
      </Card>

      <Card className="overflow-visible p-0">
        <div className="overflow-x-auto overflow-y-visible">
          <div className="min-w-0">
            <div className="relative z-20 grid grid-cols-[minmax(180px,2fr)_minmax(135px,1.2fr)_minmax(105px,0.9fr)_minmax(95px,0.75fr)_80px] gap-0 border-b border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm font-bold uppercase tracking-[0.08em] text-slate-900 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-100">
              <div>
                <div className="relative inline-flex items-center gap-1" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                  <span>Estudiante</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveColumnMenu((prev) => (prev === 'student' ? '' : 'student'));
                    }}
                    className={`rounded-md p-0.5 transition ${isColumnActive('student') ? 'bg-brand-500/20 text-brand-700 dark:text-brand-100' : 'hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>

                  {activeColumnMenu === 'student' && (
                    <div className="absolute left-0 top-full z-[80] mt-1 w-72 rounded-xl border border-slate-200 bg-white p-3 text-left normal-case opacity-100 shadow-2xl backdrop-blur-0 dark:border-slate-700 dark:bg-slate-900">
                      <button
                        type="button"
                        onClick={() => setColumnSort('student', 'asc')}
                        className="w-full rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
                      >
                        Ordenar de menor a mayor
                      </button>
                      <button
                        type="button"
                        onClick={() => setColumnSort('student', 'desc')}
                        className="mt-1 w-full rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
                      >
                        Ordenar de mayor a menor
                      </button>

                      <div className="mt-2 border-t border-slate-200 pt-2 dark:border-slate-700">
                        <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Buscar estudiante</label>
                        <div className="relative mt-1">
                          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                          <input
                            value={filters.q}
                            onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))}
                            placeholder="Nombre o correo"
                            className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-7 pr-2 text-xs outline-none focus:border-brand-400 dark:border-slate-600 dark:bg-slate-800"
                          />
                        </div>
                      </div>

                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => applyFilters()}
                          className="rounded-lg bg-brand-500 px-3 py-1.5 text-[11px] font-bold text-white"
                        >
                          Aplicar
                        </button>
                        <button
                          type="button"
                          onClick={() => clearColumnFilter('student')}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-[11px] font-semibold text-slate-600 dark:border-slate-600 dark:text-slate-200"
                        >
                          Borrar filtro
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="relative inline-flex items-center gap-1" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                  <span>Programa</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveColumnMenu((prev) => (prev === 'lastLogin' ? '' : 'lastLogin'));
                    }}
                    className={`rounded-md p-0.5 transition ${isColumnActive('lastLogin') ? 'bg-brand-500/20 text-brand-700 dark:text-brand-100' : 'hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>

                  {activeColumnMenu === 'lastLogin' && (
                    <div className="absolute left-0 top-full z-[80] mt-1 w-64 rounded-xl border border-slate-200 bg-white p-3 text-left normal-case opacity-100 shadow-2xl backdrop-blur-0 dark:border-slate-700 dark:bg-slate-900">
                      <button
                        type="button"
                        onClick={() => setColumnSort('lastLoginAt', 'asc')}
                        className="w-full rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
                      >
                        Ordenar de menor a mayor
                      </button>
                      <button
                        type="button"
                        onClick={() => setColumnSort('lastLoginAt', 'desc')}
                        className="mt-1 w-full rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
                      >
                        Ordenar de mayor a menor
                      </button>

                      <div className="mt-2 border-t border-slate-200 pt-2 dark:border-slate-700">
                        <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Ultimo acceso desde</label>
                        <input
                          type="date"
                          value={filters.lastLoginFrom}
                          onChange={(e) => setFilters((prev) => ({ ...prev, lastLoginFrom: e.target.value }))}
                          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs outline-none focus:border-brand-400 dark:border-slate-600 dark:bg-slate-800"
                        />
                        <label className="mt-2 block text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Ultimo acceso hasta</label>
                        <input
                          type="date"
                          value={filters.lastLoginTo}
                          onChange={(e) => setFilters((prev) => ({ ...prev, lastLoginTo: e.target.value }))}
                          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs outline-none focus:border-brand-400 dark:border-slate-600 dark:bg-slate-800"
                        />
                      </div>

                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => applyFilters()}
                          className="rounded-lg bg-brand-500 px-3 py-1.5 text-[11px] font-bold text-white"
                        >
                          Aplicar
                        </button>
                        <button
                          type="button"
                          onClick={() => clearColumnFilter('lastLogin')}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-[11px] font-semibold text-slate-600 dark:border-slate-600 dark:text-slate-200"
                        >
                          Borrar filtro
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-center">
                <div className="relative inline-flex items-center gap-1" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                  <span>Proceso</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveColumnMenu((prev) => (prev === 'progress' ? '' : 'progress'));
                    }}
                    className={`rounded-md p-0.5 transition ${isColumnActive('progress') ? 'bg-brand-500/20 text-brand-700 dark:text-brand-100' : 'hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>

                  {activeColumnMenu === 'progress' && (
                    <div className="absolute left-0 top-full z-[80] mt-1 w-64 rounded-xl border border-slate-200 bg-white p-3 text-left normal-case opacity-100 shadow-2xl backdrop-blur-0 dark:border-slate-700 dark:bg-slate-900">
                      <button
                        type="button"
                        onClick={() => setColumnSort('progress', 'asc')}
                        className="w-full rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
                      >
                        Ordenar de menor a mayor
                      </button>
                      <button
                        type="button"
                        onClick={() => setColumnSort('progress', 'desc')}
                        className="mt-1 w-full rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
                      >
                        Ordenar de mayor a menor
                      </button>

                      <div className="mt-2 border-t border-slate-200 pt-2 dark:border-slate-700">
                        <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Progreso minimo</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={filters.progressMin}
                          onChange={(e) => setFilters((prev) => ({ ...prev, progressMin: e.target.value }))}
                          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs outline-none focus:border-brand-400 dark:border-slate-600 dark:bg-slate-800"
                        />
                        <label className="mt-2 block text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Progreso maximo</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={filters.progressMax}
                          onChange={(e) => setFilters((prev) => ({ ...prev, progressMax: e.target.value }))}
                          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs outline-none focus:border-brand-400 dark:border-slate-600 dark:bg-slate-800"
                        />
                      </div>

                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => applyFilters()}
                          className="rounded-lg bg-brand-500 px-3 py-1.5 text-[11px] font-bold text-white"
                        >
                          Aplicar
                        </button>
                        <button
                          type="button"
                          onClick={() => clearColumnFilter('progress')}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-[11px] font-semibold text-slate-600 dark:border-slate-600 dark:text-slate-200"
                        >
                          Borrar filtro
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="relative inline-flex items-center gap-1" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                  <span>Insignias</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveColumnMenu((prev) => (prev === 'badges' ? '' : 'badges'));
                    }}
                    className={`rounded-md p-0.5 transition ${isColumnActive('badges') ? 'bg-brand-500/20 text-brand-700 dark:text-brand-100' : 'hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>

                  {activeColumnMenu === 'badges' && (
                    <div className="absolute left-0 top-full z-[80] mt-1 w-64 rounded-xl border border-slate-200 bg-white p-3 text-left normal-case opacity-100 shadow-2xl backdrop-blur-0 dark:border-slate-700 dark:bg-slate-900">
                      <button
                        type="button"
                        onClick={() => setColumnSort('badgesCount', 'asc')}
                        className="w-full rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
                      >
                        Ordenar de menor a mayor
                      </button>
                      <button
                        type="button"
                        onClick={() => setColumnSort('badgesCount', 'desc')}
                        className="mt-1 w-full rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
                      >
                        Ordenar de mayor a menor
                      </button>

                      <div className="mt-2 border-t border-slate-200 pt-2 dark:border-slate-700">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Filtrar insignias</p>
                        <div className="mt-1 space-y-1">
                          {BADGE_FILTER_OPTIONS.map((badgeValue) => {
                            const key = String(badgeValue);
                            const checked = filters.badges.includes(key);
                            return (
                              <label key={key} className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleBadgeSelection(badgeValue)}
                                  className="h-3.5 w-3.5 rounded border-slate-300"
                                />
                                <span>{badgeValue}</span>
                                {checked && <Check className="ml-auto h-3.5 w-3.5 text-emerald-600" />}
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => applyFilters()}
                          className="rounded-lg bg-brand-500 px-3 py-1.5 text-[11px] font-bold text-white"
                        >
                          Aplicar
                        </button>
                        <button
                          type="button"
                          onClick={() => clearColumnFilter('badges')}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-[11px] font-semibold text-slate-600 dark:border-slate-600 dark:text-slate-200"
                        >
                          Borrar filtro
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

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
                      <div className="grid grid-cols-[minmax(180px,2fr)_minmax(135px,1.2fr)_minmax(105px,0.9fr)_minmax(95px,0.75fr)_80px] items-center px-3 py-2.5">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500/15 text-sm font-extrabold text-brand-700 dark:bg-brand-500/20 dark:text-brand-200">
                              {s.initials || 'ES'}
                            </div>
                            <span
                              className={
                                'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 dark:border-slate-950 ' +
                                (s.isOnline ? 'border-white bg-emerald-500' : 'border-white bg-red-500')
                              }
                              title={s.isOnline ? 'Activo' : 'Inactivo'}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-slate-900 dark:text-white">
                              {s.name} {s.lastName}
                            </div>
                            <div className="truncate text-xs text-slate-600 dark:text-slate-400">{s.email}</div>
                          </div>
                        </div>

                        <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
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
    </Card>
  );
}
