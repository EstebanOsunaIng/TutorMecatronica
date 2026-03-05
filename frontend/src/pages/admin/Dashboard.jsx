import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import {
  BarChart3,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Clock3,
  Medal,
  Settings,
  UserCog,
  UsersRound
} from 'lucide-react';
import RobotLoader from '../../components/common/RobotLoader.jsx';
import { adminApi } from '../../api/admin.api.js';
import { useTheme } from '../../context/ThemeContext.jsx';

const ROLE_COLORS = {
  STUDENT: '#2f8fe8',
  TEACHER: '#18a957',
  ADMIN: '#f5a524'
};

const ACTIVITY_COLORS = {
  register: 'bg-blue-500',
  login: 'bg-emerald-500',
  module_complete: 'bg-amber-500'
};

const EMPTY_DASHBOARD = {
  overview: {
    activeStudents: 0,
    averageTimeMinutes: 0,
    certifications: 0,
    updatedAt: null
  },
  registrations: [],
  registrationFilters: {
    month: '',
    granularity: 'week',
    monthOptions: []
  },
  roleDistribution: [],
  modulesStatus: [],
  recentActivity: []
};

function formatRelativeTime(dateValue) {
  if (!dateValue) return '-';
  const diffMs = Date.now() - new Date(dateValue).getTime();
  if (diffMs < 60 * 1000) return 'Hace instantes';
  if (diffMs < 60 * 60 * 1000) return `Hace ${Math.floor(diffMs / (60 * 1000))} min`;
  if (diffMs < 24 * 60 * 60 * 1000) return `Hace ${Math.floor(diffMs / (60 * 60 * 1000))} h`;
  return `Hace ${Math.floor(diffMs / (24 * 60 * 60 * 1000))} dias`;
}

function formatLastUpdate(dateValue) {
  if (!dateValue) return 'Sin datos';
  return new Date(dateValue).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit'
  });
}

function ModuleStatusTooltip({ active, payload, label, isDark }) {
  if (!active || !payload || payload.length === 0) return null;

  const rows = payload
    .filter((item) => Number.isFinite(Number(item?.value)))
    .map((item) => ({
      label: item.name,
      value: Number(item.value || 0),
      color: item.color
    }));

  return (
    <div
      className={
        `min-w-[220px] rounded-xl border px-3 py-2.5 shadow-xl backdrop-blur-sm ` +
        (isDark
          ? 'border-slate-700/80 bg-slate-900/90 text-slate-100'
          : 'border-cyan-100 bg-white/95 text-slate-900')
      }
    >
      <div className={`mb-2 text-sm font-extrabold leading-snug ${isDark ? 'text-white' : 'text-[#0f2b53]'}`}>{label}</div>
      <div className="space-y-1.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="inline-flex items-center gap-2 font-semibold">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: row.color }} />
              {row.label}
            </span>
            <span className={`font-extrabold tabular-nums ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [dashboard, setDashboard] = useState(EMPTY_DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [registrationGranularity, setRegistrationGranularity] = useState('week');
  const [showAllRecentActivity, setShowAllRecentActivity] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const { data } = await adminApi.dashboard({
          granularity: registrationGranularity,
          month: selectedMonth || undefined
        });
        if (isMounted) {
          setDashboard({ ...EMPTY_DASHBOARD, ...data });
          if (!selectedMonth && data?.registrationFilters?.month) {
            setSelectedMonth(data.registrationFilters.month);
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();
    return () => {
      isMounted = false;
    };
  }, [registrationGranularity, selectedMonth]);

  const moduleMaxTotal = useMemo(() => {
    const totals = dashboard.modulesStatus.map((item) => item.completed + item.inProgress + item.notStarted);
    return Math.max(1, ...totals);
  }, [dashboard.modulesStatus]);

  const recentActivityVisible = useMemo(() => {
    if (showAllRecentActivity) return dashboard.recentActivity;
    return dashboard.recentActivity.slice(0, 3);
  }, [dashboard.recentActivity, showAllRecentActivity]);

  const quickActions = useMemo(
    () => [
      { label: 'Gestionar Usuarios', to: '/admin/users', icon: UserCog },
      { label: 'Modulos', to: '/admin/modules', icon: BookOpen },
      { label: 'Estadisticas', to: '/admin/stats', icon: BarChart3 },
      { label: 'Configuracion', to: '/admin/settings', icon: Settings }
    ],
    []
  );

  const kpiCards = [
    {
      title: 'Estudiantes activos',
      value: dashboard.overview.activeStudents.toLocaleString('es-CO'),
      helper: 'Usuarios con cuenta activa',
      icon: UsersRound,
      color: 'from-blue-50 to-blue-100/60 text-blue-900',
      iconBg: 'bg-blue-100 text-blue-700'
    },
    {
      title: 'Tiempo promedio',
      value: `${dashboard.overview.averageTimeMinutes} min`,
      helper: 'Promedio real por modulo',
      icon: Clock3,
      color: 'from-amber-50 to-amber-100/60 text-amber-900',
      iconBg: 'bg-amber-100 text-amber-700'
    },
    {
      title: 'Certificaciones',
      value: dashboard.overview.certifications.toLocaleString('es-CO'),
      helper: 'Total de insignias obtenidas',
      icon: Medal,
      color: 'from-emerald-50 to-emerald-100/60 text-emerald-900',
      iconBg: 'bg-emerald-100 text-emerald-700'
    }
  ];

  return (
    <div data-tour="admin-dashboard-overview" className="space-y-5 rounded-3xl border border-[color:var(--light-divider)] bg-gradient-to-br from-sky-50/85 via-cyan-50/65 to-slate-50 p-4 text-slate-900 shadow-inner md:p-6 dark:border-slate-800 dark:bg-slate-900/40 dark:bg-none dark:text-slate-100">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-300">Panel de Administración</p>
          <h1 className="text-[1.875rem] font-bold tracking-tight">Bienvenido, Admin</h1>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-300">
          Ultima actualizacion: {formatLastUpdate(dashboard.overview.updatedAt)}
        </p>
      </div>

      {loading && (
        <RobotLoader label="Cargando dashboard..." scale={0.9} overlay />
      )}

      <div className="grid gap-3 md:grid-cols-3">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className={`rounded-2xl border border-cyan-100/70 bg-gradient-to-br p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:bg-none dark:text-slate-100 ${card.color}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{card.title}</p>
                  <p className="mt-2 text-3xl font-black leading-none">{loading ? '...' : card.value}</p>
                  <p className="mt-2 text-xs font-medium opacity-80">{card.helper}</p>
                </div>
                <span className={`rounded-xl p-2 ${card.iconBg}`}>
                  <Icon className="h-5 w-5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.to}
              type="button"
              onClick={() => navigate(action.to)}
              className="flex items-center gap-3 rounded-2xl border border-cyan-100 bg-white/90 px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:bg-brand-50 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
            >
              <span className="rounded-xl bg-brand-100 p-2 text-brand-700 dark:bg-brand-500/20 dark:text-brand-200">
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-sm font-semibold">{action.label}</span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <section className="rounded-2xl border border-cyan-100 bg-white/90 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[1.3rem] font-bold leading-none">Registro de Usuarios</h2>
            <div className="flex items-center gap-2">
              <select
                value={registrationGranularity}
                onChange={(event) => setRegistrationGranularity(event.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="week">Por semana</option>
                <option value="day">Por dia</option>
              </select>
              <select
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                {dashboard.registrationFilters.monthOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboard.registrations} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="studentsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2f8fe8" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#2f8fe8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="teachersFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#18a957" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#18a957" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#d9e2ec" />
                <XAxis dataKey="label" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="students"
                  stroke="#2f8fe8"
                  strokeWidth={2}
                  fill="url(#studentsFill)"
                  name="Estudiantes"
                />
                <Area
                  type="monotone"
                  dataKey="teachers"
                  stroke="#18a957"
                  strokeWidth={2}
                  fill="url(#teachersFill)"
                  name="Docentes"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-cyan-100 bg-white/90 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
          <h2 className="mb-6 text-[1.3rem] font-bold leading-none">Distribucion de Roles</h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dashboard.roleDistribution}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={62}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {dashboard.roleDistribution.map((entry) => (
                    <Cell key={entry.role} fill={ROLE_COLORS[entry.role] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs">
            {dashboard.roleDistribution.map((entry) => (
              <div key={entry.role} className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: ROLE_COLORS[entry.role] || '#94a3b8' }}
                />
                <span className="text-slate-600 dark:text-slate-300">{entry.label}</span>
                <span className="font-bold">{entry.value}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1.2fr]">
        <section className="rounded-2xl border border-cyan-100 bg-white/90 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[1.3rem] font-bold leading-none">Estado de Modulos</h2>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Completado
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-1 font-semibold text-blue-700 dark:bg-blue-500/20 dark:text-blue-100">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                En progreso
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-200 px-2.5 py-1 font-semibold text-slate-700 dark:bg-slate-500/20 dark:text-slate-100">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
                Sin iniciar
              </span>
            </div>
          </div>
          {dashboard.modulesStatus.length === 0 ? (
            <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-300">
              Todavia no hay modulos para mostrar en la grafica.
            </p>
          ) : (
            <div className="flex w-full justify-center">
              <div className="w-full max-w-3xl" style={{ height: Math.max(220, dashboard.modulesStatus.length * 46) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboard.modulesStatus} layout="vertical" margin={{ top: 4, right: 14, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      stroke="#64748b"
                      fontSize={12}
                      domain={[0, moduleMaxTotal]}
                    />
                    <YAxis
                      dataKey="moduleTitle"
                      type="category"
                      stroke="#64748b"
                      width={96}
                      fontSize={11}
                      tickFormatter={(value) => (String(value).length > 15 ? `${String(value).slice(0, 15)}...` : value)}
                    />
                    <Tooltip
                      cursor={{ fill: isDark ? 'rgba(148,163,184,0.12)' : 'rgba(14,165,233,0.10)' }}
                      content={<ModuleStatusTooltip isDark={isDark} />}
                    />
                    <Bar dataKey="completed" stackId="a" fill="#18a957" name="Completado" radius={[4, 4, 4, 4]} />
                    <Bar dataKey="inProgress" stackId="a" fill="#2f8fe8" name="En progreso" radius={[4, 4, 4, 4]} />
                    <Bar dataKey="notStarted" stackId="a" fill="#cbd5e1" name="Sin iniciar" radius={[4, 4, 4, 4]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-cyan-100 bg-white/90 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-6 flex items-center justify-between gap-3">
            <h2 className="text-[1.3rem] font-bold leading-none">Actividad Reciente</h2>
            {dashboard.recentActivity.length > 3 && (
              <button
                type="button"
                onClick={() => setShowAllRecentActivity((prev) => !prev)}
                className="inline-flex items-center gap-1 text-xs font-bold text-sky-700 transition hover:text-sky-800 dark:text-sky-300 dark:hover:text-sky-200"
              >
                {showAllRecentActivity ? 'Ver menos' : 'Ver mas'}
                {showAllRecentActivity ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            )}
          </div>
          <div className="space-y-3">
            {dashboard.recentActivity.length === 0 && (
              <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                Todavia no hay actividad reciente.
              </p>
            )}
            {recentActivityVisible.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/70">
                <span
                  className={`mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full ${
                    ACTIVITY_COLORS[activity.type] || 'bg-slate-500'
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{activity.title}</p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-300">{activity.detail}</p>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">{formatRelativeTime(activity.at)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
