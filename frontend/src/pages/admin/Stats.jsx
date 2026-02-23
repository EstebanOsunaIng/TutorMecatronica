import React, { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
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
import { Activity, BarChart3, CalendarDays, ChartPie, UsersRound } from 'lucide-react';
import Card from '../../components/common/Card.jsx';
import { adminApi } from '../../api/admin.api.js';

const ROLE_COLORS = {
  STUDENT: '#2f8fe8',
  TEACHER: '#18a957',
  ADMIN: '#f5a524'
};

const MODULE_STATUS_COLORS = {
  completed: '#16a34a',
  inProgress: '#f59e0b',
  notStarted: '#94a3b8'
};

const ACTIVITY_META = {
  register: { label: 'Registros', color: '#2f8fe8' },
  login: { label: 'Inicios de sesion', color: '#18a957' },
  module_complete: { label: 'Modulos completados', color: '#f97316' }
};

const EMPTY_DASHBOARD = {
  overview: {
    totalUsers: 0,
    activeUsers: 0,
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

function formatLastUpdate(dateValue) {
  if (!dateValue) return 'Sin datos';
  return new Date(dateValue).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit'
  });
}

export default function AdminStats() {
  const [dashboard, setDashboard] = useState(EMPTY_DASHBOARD);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [granularity, setGranularity] = useState('week');
  const [loading, setLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(true);
  const [monthlyTrend, setMonthlyTrend] = useState([]);

  useEffect(() => {
    let active = true;

    const loadStats = async () => {
      setLoading(true);
      try {
        const { data } = await adminApi.dashboard({
          granularity,
          month: selectedMonth || undefined
        });
        if (!active) return;
        setDashboard({ ...EMPTY_DASHBOARD, ...data });
        if (!selectedMonth && data?.registrationFilters?.month) {
          setSelectedMonth(data.registrationFilters.month);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadStats();
    return () => {
      active = false;
    };
  }, [granularity, selectedMonth]);

  useEffect(() => {
    let active = true;
    const monthOptions = dashboard.registrationFilters.monthOptions || [];
    if (!monthOptions.length) {
      setMonthlyTrend([]);
      setTrendLoading(false);
      return undefined;
    }

    const loadMonthlyTrend = async () => {
      setTrendLoading(true);
      try {
        const lastMonths = monthOptions.slice(-6);
        const rows = await Promise.all(
          lastMonths.map(async (option) => {
            const { data } = await adminApi.dashboard({ month: option.value, granularity: 'week' });
            const registrations = data.registrations || [];
            const students = registrations.reduce((sum, item) => sum + Number(item.students || 0), 0);
            const teachers = registrations.reduce((sum, item) => sum + Number(item.teachers || 0), 0);
            return {
              month: option.label,
              students,
              teachers,
              total: students + teachers
            };
          })
        );
        if (!active) return;
        setMonthlyTrend(rows);
      } finally {
        if (active) setTrendLoading(false);
      }
    };

    loadMonthlyTrend();
    return () => {
      active = false;
    };
  }, [dashboard.registrationFilters.monthOptions]);

  const registrationSeries = useMemo(() => {
    return dashboard.registrations.map((item) => ({
      ...item,
      total: Number(item.students || 0) + Number(item.teachers || 0)
    }));
  }, [dashboard.registrations]);

  const roleSeries = useMemo(() => {
    const total = dashboard.roleDistribution.reduce((sum, item) => sum + Number(item.value || 0), 0);
    return dashboard.roleDistribution.map((item) => ({
      ...item,
      percent: total ? Math.round((Number(item.value || 0) / total) * 100) : 0
    }));
  }, [dashboard.roleDistribution]);

  const totalStudentsCount = useMemo(() => {
    return Number(dashboard.roleDistribution.find((item) => item.role === 'STUDENT')?.value || 0);
  }, [dashboard.roleDistribution]);

  const activitySeries = useMemo(() => {
    const counter = { register: 0, login: 0, module_complete: 0 };
    dashboard.recentActivity.forEach((item) => {
      if (counter[item.type] !== undefined) counter[item.type] += 1;
    });
    return Object.entries(counter).map(([type, value]) => ({
      type,
      label: ACTIVITY_META[type].label,
      color: ACTIVITY_META[type].color,
      value
    }));
  }, [dashboard.recentActivity]);

  const modulesPerformance = useMemo(() => {
    return dashboard.modulesStatus.map((item) => {
      const started = Number(item.completed || 0) + Number(item.inProgress || 0);
      const total = totalStudentsCount;
      return {
        ...item,
        started,
        completionRate: total ? Math.round((Number(item.completed || 0) / total) * 100) : 0,
        participationRate: total ? Math.round((started / total) * 100) : 0
      };
    });
  }, [dashboard.modulesStatus, totalStudentsCount]);

  const totals = useMemo(() => {
    const totalUsers = Number(dashboard.overview.totalUsers || 0) || dashboard.roleDistribution.reduce((sum, item) => sum + Number(item.value || 0), 0);
    const totalStudents = dashboard.roleDistribution.find((item) => item.role === 'STUDENT')?.value || 0;
    const activeUsers = Number(dashboard.overview.activeUsers || 0);
    const inactiveUsers = Math.max(Number(totalUsers) - activeUsers, 0);
    const activeRate = totalUsers
      ? Math.round((activeUsers / Number(totalUsers)) * 100)
      : 0;
    const totalRegistrations = registrationSeries.reduce((sum, item) => sum + item.total, 0);
    const peak = registrationSeries.reduce((max, item) => (item.total > max.total ? item : max), {
      label: '-',
      total: 0
    });

    return {
      totalUsers,
      totalRegistrations,
      activeRate,
      activeUsers,
      inactiveUsers,
      totalStudents,
      peakLabel: peak.label,
      peakValue: peak.total
    };
  }, [dashboard, registrationSeries]);

  const kpis = [
    {
      label: 'Total de cuentas',
      value: totals.totalUsers,
      helper: 'Incluye estudiantes, docentes y admins',
      icon: UsersRound,
      iconClass: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-100'
    },
    {
      label: 'Nuevos registros',
      value: totals.totalRegistrations,
      helper: 'Cuentas creadas en el periodo filtrado',
      icon: CalendarDays,
      iconClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100'
    },
    {
      label: 'Cuentas activas',
      value: `${totals.activeRate}%`,
      helper: `${totals.activeUsers} activas de ${totals.totalUsers} (inactivas: ${totals.inactiveUsers})`,
      icon: Activity,
      iconClass: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-100'
    },
    {
      label: 'Mayor pico de registros',
      value: `${totals.peakValue}`,
      helper: `Momento con mas altas: ${totals.peakLabel}`,
      icon: BarChart3,
      iconClass: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-100'
    }
  ];

  return (
    <div className="space-y-5 rounded-3xl border border-cyan-100/80 bg-gradient-to-br from-sky-50/85 via-cyan-50/65 to-slate-50 p-4 text-slate-900 shadow-inner md:p-6 dark:border-slate-800 dark:bg-slate-900/40 dark:bg-none dark:text-slate-100">
      <Card className="rounded-3xl border-cyan-100/80 bg-gradient-to-br from-sky-50/85 via-cyan-50/65 to-slate-50 dark:border-slate-800 dark:bg-slate-900/40 dark:bg-none">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-300">Analitica Avanzada</p>
            <h2 className="text-[1.875rem] font-bold tracking-tight">Estadisticas de la plataforma</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
              Vista completa de comportamiento, adopcion y rendimiento para decision administrativa.
            </p>
          </div>
          <div className="mr-1 flex flex-col items-start gap-2 lg:items-end">
            <span className="text-xs text-slate-500 dark:text-slate-300">
              Ultima actualizacion: {formatLastUpdate(dashboard.overview.updatedAt)}
            </span>
            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <select
                value={granularity}
                onChange={(event) => setGranularity(event.target.value)}
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
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="border-cyan-100/80 bg-white/85 dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">{item.label}</p>
                  <p className="mt-2 text-3xl font-black leading-none">{loading ? '...' : item.value}</p>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-300">{item.helper}</p>
                </div>
                <span className={`rounded-xl p-2 ${item.iconClass}`}>
                  <Icon className="h-5 w-5" />
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Card className="border-cyan-100/80 bg-white/90 dark:border-slate-700 dark:bg-slate-900">
          <h3 className="mb-4 text-base font-bold">Flujo de registros del periodo</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={registrationSeries} margin={{ top: 10, right: 10, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="statsStudents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2f8fe8" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#2f8fe8" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="statsTeachers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#18a957" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#18a957" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#d9e2ec" />
                <XAxis dataKey="label" stroke="#64748b" fontSize={12} />
                <YAxis allowDecimals={false} stroke="#64748b" fontSize={12} />
                <Tooltip />
                <Area type="monotone" dataKey="students" stroke="#2f8fe8" fill="url(#statsStudents)" name="Estudiantes" strokeWidth={2} />
                <Area type="monotone" dataKey="teachers" stroke="#18a957" fill="url(#statsTeachers)" name="Docentes" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="border-cyan-100/80 bg-white/90 dark:border-slate-700 dark:bg-slate-900">
          <h3 className="mb-4 text-base font-bold">Distribucion de roles</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={roleSeries} dataKey="value" nameKey="label" innerRadius={56} outerRadius={88} paddingAngle={2}>
                  {roleSeries.map((entry) => (
                    <Cell key={entry.role} fill={ROLE_COLORS[entry.role] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 text-xs">
            {roleSeries.map((entry) => (
              <div key={entry.role} className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5 dark:bg-slate-800/70">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ROLE_COLORS[entry.role] || '#94a3b8' }} />
                  <span>{entry.label}</span>
                </span>
                <span className="font-bold">{entry.value} ({entry.percent}%)</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="border-cyan-100/80 bg-white/90 dark:border-slate-700 dark:bg-slate-900">
          <h3 className="mb-4 text-base font-bold">Ritmo mensual de registros (ultimos 6 meses)</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis allowDecimals={false} stroke="#64748b" fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="total" stroke="#0ea5e9" strokeWidth={2.5} name="Total" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="students" stroke="#2f8fe8" strokeWidth={2} name="Estudiantes" dot={false} />
                <Line type="monotone" dataKey="teachers" stroke="#18a957" strokeWidth={2} name="Docentes" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {trendLoading && <p className="text-xs text-slate-500 dark:text-slate-300">Cargando tendencia...</p>}
        </Card>

        <Card className="border-cyan-100/80 bg-white/90 dark:border-slate-700 dark:bg-slate-900">
          <h3 className="mb-4 text-base font-bold">Eventos recientes por tipo</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activitySeries} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" stroke="#64748b" fontSize={12} />
                <YAxis allowDecimals={false} stroke="#64748b" fontSize={12} />
                <Tooltip />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {activitySeries.map((entry) => (
                    <Cell key={entry.type} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[1.7fr_1fr]">
        <Card className="border-cyan-100/80 bg-white/90 dark:border-slate-700 dark:bg-slate-900">
          <h3 className="text-base font-bold">Progreso por modulo (completado / en curso / sin iniciar)</h3>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: MODULE_STATUS_COLORS.completed }} />
              Completado
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-100">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: MODULE_STATUS_COLORS.inProgress }} />
              En curso
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-200 px-2.5 py-1 font-semibold text-slate-700 dark:bg-slate-500/20 dark:text-slate-100">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: MODULE_STATUS_COLORS.notStarted }} />
              Sin iniciar
            </span>
          </div>
          <div className="mt-6 flex w-full justify-center">
            <div className="w-full max-w-5xl" style={{ height: Math.max(320, modulesPerformance.length * 60) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={modulesPerformance} layout="vertical" margin={{ top: 4, right: 14, left: 16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" allowDecimals={false} stroke="#64748b" fontSize={12} />
                <YAxis
                  type="category"
                  dataKey="moduleTitle"
                  width={130}
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={(value) => (String(value).length > 16 ? `${String(value).slice(0, 16)}...` : value)}
                />
                <Tooltip />
                <Bar dataKey="completed" stackId="a" fill={MODULE_STATUS_COLORS.completed} name="Completado" radius={[4, 4, 4, 4]} />
                <Bar dataKey="inProgress" stackId="a" fill={MODULE_STATUS_COLORS.inProgress} name="En curso" radius={[4, 4, 4, 4]} />
                <Bar dataKey="notStarted" stackId="a" fill={MODULE_STATUS_COLORS.notStarted} name="Sin iniciar" radius={[4, 4, 4, 4]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        <Card className="border-cyan-100/80 bg-white/90 dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-4 flex items-center gap-2">
            <ChartPie className="h-4 w-4 text-brand-500" />
            <h3 className="text-base font-bold">Indicadores de modulos</h3>
          </div>
          <p className="mb-4 text-xs text-slate-500 dark:text-slate-300">
            Finalizacion y participacion se calculan sobre el total de estudiantes registrados, para evitar porcentajes inflados.
          </p>
          <div className="space-y-3">
            {modulesPerformance.map((item) => (
              <div key={item.moduleId} className="rounded-xl border border-cyan-100 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
                <p className="truncate text-sm font-semibold">{item.moduleTitle}</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-emerald-100 px-2 py-1 font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100">
                    Finalizacion: {item.completionRate}%
                  </div>
                  <div className="rounded-lg bg-blue-100 px-2 py-1 font-semibold text-blue-700 dark:bg-blue-500/20 dark:text-blue-100">
                    Participacion: {item.participationRate}%
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-300">
                  {item.completed} completados, {item.inProgress} en curso y {item.notStarted} sin iniciar.
                </p>
              </div>
            ))}
            {!modulesPerformance.length && (
              <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                No hay datos de modulos para mostrar.
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
