import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { ArrowRight, BookOpenCheck, ChartColumnBig, Pencil, UsersRound } from 'lucide-react';
import Card from '../../components/common/Card.jsx';
import NewsFeed from '../../components/news/NewsFeed.jsx';
import { modulesApi } from '../../api/modules.api.js';
import { newsApi } from '../../api/news.api.js';
import { teacherApi } from '../../api/teacher.api.js';
import { useAuth } from '../../context/AuthContext.jsx';

const DEFAULT_MODULE_IMAGE = '/assets/campus-placeholder.svg';

const PUBLISH_COLORS = ['#2f8fe8', '#94a3b8'];

function isWithinDays(dateValue, days) {
  if (!dateValue) return false;
  const time = new Date(dateValue).getTime();
  if (!Number.isFinite(time)) return false;
  return Date.now() - time <= days * 24 * 60 * 60 * 1000;
}

function getLastSixMonthsLabels() {
  const now = new Date();
  return Array.from({ length: 6 }).map((_, index) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('es-CO', { month: 'short', year: '2-digit' })
    };
  });
}

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [modules, setModules] = useState([]);
  const [students, setStudents] = useState([]);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      setLoading(true);
      try {
        const [modulesRes, studentsRes, newsRes] = await Promise.all([modulesApi.list(), teacherApi.listStudents(), newsApi.list()]);
        if (!active) return;
        setModules(modulesRes.data.modules || []);
        setStudents(studentsRes.data.students || []);
        setNews(newsRes.data.news || []);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();
    return () => {
      active = false;
    };
  }, []);

  const orderedModules = useMemo(() => {
    return [...modules].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [modules]);

  const recentModules = useMemo(() => {
    return [...orderedModules]
      .slice(-3)
      .reverse()
      .map((m, index) => ({ ...m, moduleNumber: orderedModules.length - index }));
  }, [orderedModules]);

  const publishedCount = useMemo(() => modules.filter((m) => m.isPublished).length, [modules]);
  const unpublishedCount = Math.max(modules.length - publishedCount, 0);

  const studentStats = useMemo(() => {
    const total = students.length;
    const active7d = students.filter((s) => isWithinDays(s.lastLoginAt, 7)).length;
    const active30d = students.filter((s) => isWithinDays(s.lastLoginAt, 30)).length;
    const noActivity30d = total - active30d;
    const averageProgress = total
      ? Math.round(students.reduce((sum, s) => sum + Number(s.progress?.overallPercent || 0), 0) / total)
      : 0;

    return {
      total,
      active7d,
      active30d,
      noActivity30d,
      averageProgress
    };
  }, [students]);

  const moduleTrendData = useMemo(() => {
    const months = getLastSixMonthsLabels();
    const countByMonth = new Map(months.map((m) => [m.key, 0]));

    modules.forEach((moduleItem) => {
      const d = new Date(moduleItem.createdAt);
      if (!Number.isFinite(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!countByMonth.has(key)) return;
      countByMonth.set(key, Number(countByMonth.get(key) || 0) + 1);
    });

    return months.map((m) => ({ label: m.label, modulos: countByMonth.get(m.key) || 0 }));
  }, [modules]);

  const publishPieData = useMemo(
    () => [
      { name: 'Publicados', value: publishedCount },
      { name: 'Borradores', value: unpublishedCount }
    ],
    [publishedCount, unpublishedCount]
  );

  const moduleImage = (moduleItem) => {
    return moduleItem.imageUrl || moduleItem.image || moduleItem.coverImage || DEFAULT_MODULE_IMAGE;
  };

  const greetingName = user?.name ? `${user.name}${user?.lastName ? ` ${user.lastName}` : ''}` : 'Docente';

  return (
    <div className="space-y-6 rounded-3xl border border-cyan-100/80 bg-gradient-to-br from-sky-50/85 via-cyan-50/65 to-slate-50 p-4 text-slate-900 shadow-inner md:p-6 dark:border-slate-800 dark:bg-slate-900/40 dark:bg-none dark:text-slate-100">
      <Card className="rounded-3xl border-cyan-100/80 bg-gradient-to-br from-sky-50/85 via-cyan-50/65 to-slate-50 dark:border-slate-800 dark:bg-slate-900/40 dark:bg-none">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-300">Panel docente</p>
            <h2 className="text-3xl font-bold tracking-tight">Bienvenido, {greetingName}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
              Aqui tienes un resumen de modulos y actividad de tus estudiantes para tomar decisiones rapidas.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-cyan-100/80 bg-white/90 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Total de modulos</p>
              <p className="mt-2 text-3xl font-black leading-none">{loading ? '...' : modules.length}</p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-300">Contenidos creados para tus cursos</p>
            </div>
            <span className="rounded-xl bg-blue-100 p-2 text-blue-700 dark:bg-blue-500/20 dark:text-blue-100">
              <BookOpenCheck className="h-5 w-5" />
            </span>
          </div>
        </Card>

        <Card className="border-cyan-100/80 bg-white/90 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Modulos publicados</p>
              <p className="mt-2 text-3xl font-black leading-none">{loading ? '...' : publishedCount}</p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-300">Visibles para estudiantes ahora</p>
            </div>
            <span className="rounded-xl bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100">
              <ChartColumnBig className="h-5 w-5" />
            </span>
          </div>
        </Card>

        <Card className="border-cyan-100/80 bg-white/90 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Estudiantes vinculados</p>
              <p className="mt-2 text-3xl font-black leading-none">{loading ? '...' : studentStats.total}</p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-300">Con seguimiento academico disponible</p>
            </div>
            <span className="rounded-xl bg-indigo-100 p-2 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-100">
              <UsersRound className="h-5 w-5" />
            </span>
          </div>
        </Card>

        <Card className="border-cyan-100/80 bg-white/90 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Progreso promedio</p>
              <p className="mt-2 text-3xl font-black leading-none">{loading ? '...' : `${studentStats.averageProgress}%`}</p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-300">Promedio de avance de tus estudiantes</p>
            </div>
            <span className="rounded-xl bg-amber-100 p-2 text-amber-700 dark:bg-amber-500/20 dark:text-amber-100">
              <ChartColumnBig className="h-5 w-5" />
            </span>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Card className="border-cyan-100/80 bg-white/90 dark:border-slate-700 dark:bg-slate-900">
          <h3 className="mb-4 text-base font-bold">Creacion de modulos (ultimos 6 meses)</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={moduleTrendData} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" stroke="#64748b" fontSize={12} />
                <YAxis allowDecimals={false} stroke="#64748b" fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="modulos" stroke="#0ea5e9" strokeWidth={2.5} dot={{ r: 3 }} name="Modulos" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="border-cyan-100/80 bg-white/90 dark:border-slate-700 dark:bg-slate-900">
          <h3 className="mb-4 text-base font-bold">Estado de tus modulos</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={publishPieData} dataKey="value" nameKey="name" innerRadius={54} outerRadius={86} paddingAngle={3}>
                  {publishPieData.map((entry, index) => (
                    <Cell key={entry.name} fill={PUBLISH_COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 text-xs">
            {publishPieData.map((entry, index) => (
              <div key={entry.name} className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5 dark:bg-slate-800/70">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PUBLISH_COLORS[index] }} />
                  <span>{entry.name}</span>
                </span>
                <span className="font-bold">{entry.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">Modulos recientes</h3>
          <button
            type="button"
            onClick={() => navigate('/teacher/modules')}
            className="inline-flex items-center gap-1 text-sm font-semibold text-sky-700 hover:text-sky-800 dark:text-brand-200 dark:hover:text-brand-100"
          >
            Ver todos
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {recentModules.map((m) => (
            <Card
              key={m._id}
              onClick={() => navigate(`/teacher/modules/editor?moduleId=${m._id}`)}
              className="group overflow-hidden border border-cyan-100 bg-white/90 !p-0 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50"
            >
              <div className="flex h-full flex-col">
                <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-t-2xl bg-slate-800">
                  <img src={moduleImage(m)} alt={m.title || 'Modulo'} className="h-full w-full object-cover" />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent dark:from-slate-950/55" />

                  <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2 py-1 text-[11px] font-bold text-slate-800 ring-1 ring-slate-300 dark:bg-slate-900/75 dark:text-slate-100 dark:ring-white/20">
                    Modulo {m.moduleNumber}
                  </span>
                  <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2 py-1 text-[10px] font-semibold text-slate-700 ring-1 ring-slate-300 dark:bg-slate-900/70 dark:text-slate-200 dark:ring-white/15">
                    {m.category || 'General'}
                  </span>
                  <span
                    className={`absolute right-3 top-11 rounded-full px-2 py-1 text-[10px] font-semibold ${
                      m.isPublished
                        ? 'bg-emerald-100/95 text-emerald-800 ring-1 ring-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-100 dark:ring-emerald-300/35'
                        : 'bg-slate-100/95 text-slate-700 ring-1 ring-slate-300 dark:bg-slate-800/70 dark:text-slate-200 dark:ring-slate-300/20'
                    }`}
                  >
                    {m.isPublished ? 'Publicado' : 'Borrador'}
                  </span>
                </div>

                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div className="space-y-2">
                    <h4 className="line-clamp-2 text-base font-extrabold text-slate-900 group-hover:text-[#1d4f91] dark:text-white dark:group-hover:text-sky-200">
                      {m.title || 'Modulo sin titulo'}
                    </h4>
                    <p className="line-clamp-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      {m.description || 'Sin descripcion.'}
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/teacher/modules/editor?moduleId=${m._id}`);
                    }}
                    className="mt-auto inline-flex w-fit items-center gap-1 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:border-brand-400 dark:hover:text-brand-100"
                  >
                    <Pencil className="h-4 w-4" />
                    Editar
                  </button>
                </div>
              </div>
            </Card>
          ))}

          {!recentModules.length && (
            <Card className="border-cyan-100/80 bg-white/90 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-sm text-slate-500 dark:text-slate-300">Aun no tienes modulos. Crea el primero para empezar.</p>
            </Card>
          )}
        </div>
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">Noticias y Tendencias</h3>
          <button
            type="button"
            onClick={() => navigate('/teacher/news')}
            className="inline-flex items-center gap-1 text-sm font-semibold text-sky-700 hover:text-sky-800 dark:text-brand-200 dark:hover:text-brand-100"
          >
            Ver mas
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4">
          <NewsFeed
            items={[...(news || [])]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 3)}
          />
        </div>
      </Card>
    </div>
  );
}
