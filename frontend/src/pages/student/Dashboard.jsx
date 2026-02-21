import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, ArrowRight, Clock3, Flame, Lock, PlayCircle, Target } from 'lucide-react';
import Card from '../../components/common/Card.jsx';
import BadgeGrid from '../../components/gamification/BadgeGrid.jsx';
import RankingCard from '../../components/gamification/RankingCard.jsx';
import MyRankCard from '../../components/gamification/MyRankCard.jsx';
import NewsFeed from '../../components/news/NewsFeed.jsx';
import ActivityChart from '../../components/charts/ActivityChart.jsx';
import { gamificationApi } from '../../api/gamification.api.js';
import { newsApi } from '../../api/news.api.js';
import { modulesApi } from '../../api/modules.api.js';
import { progressApi } from '../../api/progress.api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { getLatestRealNews } from '../../utils/news.js';

export default function StudentDashboard() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const [badges, setBadges] = useState([]);
  const [unlocked, setUnlocked] = useState([]);
  const [top, setTop] = useState([]);
  const [rank, setRank] = useState({ position: null, total: 0 });
  const [news, setNews] = useState([]);
  const [modules, setModules] = useState([]);
  const [progressRows, setProgressRows] = useState([]);
  const [activityRange, setActivityRange] = useState('week');

  useEffect(() => {
    async function load() {
      try {
        const [b, t, r, n, m, p] = await Promise.all([
          gamificationApi.badges(),
          gamificationApi.top5(),
          gamificationApi.myRank(),
          newsApi.list(),
          modulesApi.listPublished(),
          progressApi.myProgress()
        ]);
        setBadges(b.data.badges || []);
        setUnlocked(b.data.unlocked || []);
        setTop(t.data.top || []);
        setRank(r.data || {});
        setNews(n.data.news || []);

        const modulesChronological = [...(m.data.modules || [])].sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
        setModules(modulesChronological);
        setProgressRows(p.data.progress || []);
      } catch {
        setNews([]);
      }
    }
    load();
  }, []);

  const progressByModuleId = new Map((progressRows || []).map((row) => [String(row.moduleId), row]));
  const moduleTimeline = (modules || []).map((moduleItem) => {
    const row = progressByModuleId.get(String(moduleItem._id));
    const percent = row?.moduleProgressPercent || 0;
    const completed = percent >= 100 || Boolean(row?.completedAt);
    const inProgress = !completed && percent > 0;
    return {
      id: moduleItem._id,
      title: moduleItem.title,
      completed,
      inProgress,
      percent
    };
  });

  const completedModules = moduleTimeline.filter((m) => m.completed).length;
  const inProgressModules = moduleTimeline.filter((m) => m.inProgress).length;
  const totalModules = moduleTimeline.length;
  const progressPercent = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

  const modulesWithProgress = useMemo(() => {
    if (!modules.length) return [];
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
  }, [modules, progressByModuleId]);

  const firstModules = useMemo(() => modulesWithProgress.slice(0, 3), [modulesWithProgress]);
  const latestDashboardNews = useMemo(() => getLatestRealNews(news, 3), [news]);

  const moduleImage = (moduleItem) => moduleItem.imageUrl || moduleItem.image || moduleItem.coverImage || '/assets/campus-placeholder.svg';

  const continueModule = moduleTimeline.find((m) => m.inProgress) || null;

  const currentModule = continueModule || moduleTimeline.find((m) => !m.completed) || null;

  const activeStep = currentModule
    ? moduleTimeline.findIndex((m) => String(m.id) === String(currentModule.id))
    : -1;

  const unlockedSet = new Set((unlocked || []).map((id) => String(id)));
  const nextBadge = badges.find((badge) => !unlockedSet.has(String(badge._id)));
  const nextStepText = currentModule?.title || nextBadge?.name || 'Sigue completando tus niveles';

  const badgesCount = Number.isFinite(user?.badgesCount) ? user.badgesCount : (unlocked || []).length;

  const activitySummary = useMemo(() => {
    const rows = progressRows || [];
    const dayKeys = new Set();
    let lastActiveTs = null;

    for (const row of rows) {
      const raw = row?.updatedAt || row?.completedAt || row?.startedAt;
      const ts = raw ? new Date(raw).getTime() : NaN;
      if (!Number.isFinite(ts)) continue;
      const d = new Date(ts);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      dayKeys.add(key);
      if (lastActiveTs === null || ts > lastActiveTs) lastActiveTs = ts;
    }

    const today = new Date();
    let streak = 0;
    for (let i = 0; i < 60; i += 1) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!dayKeys.has(key)) break;
      streak += 1;
    }

    const lastActiveText = (() => {
      if (!lastActiveTs) return 'Sin actividad reciente';
      const mins = Math.floor((Date.now() - lastActiveTs) / 60000);
      if (mins < 2) return 'Hace 1 min';
      if (mins < 60) return `Hace ${mins} min`;
      const hours = Math.floor(mins / 60);
      if (hours < 2) return 'Hace 1 h';
      if (hours < 24) return `Hace ${hours} h`;
      const days = Math.floor(hours / 24);
      if (days < 2) return 'Hace 1 dia';
      return `Hace ${days} dias`;
    })();

    return { streak, lastActiveText };
  }, [progressRows]);


  const ringStyle = {
    background: `conic-gradient(from 0deg, ${isDark ? '#5eead4' : '#1d4f91'} ${progressPercent * 3.6}deg, ${isDark ? '#1e293b' : '#dbe4ef'} 0deg)`
  };

  const displayName = (user?.name || '').trim();

  return (
    <div className="rounded-3xl border border-cyan-100/80 bg-gradient-to-br from-sky-50/85 via-cyan-50/65 to-slate-50 p-4 text-slate-900 shadow-inner md:p-6 dark:border-slate-800 dark:bg-slate-900/40 dark:bg-none dark:text-slate-100">
      <div className="space-y-6">
        <div
          className={`rounded-3xl border px-5 py-4 ${
            isDark
              ? 'border-slate-700/50 bg-slate-900/30'
              : 'border-cyan-100/80 bg-gradient-to-r from-sky-50/80 via-cyan-50/60 to-slate-50'
          }`}
        >
          <div className={`text-sm font-semibold ${isDark ? 'text-sky-200' : 'text-[#1d4f91]'}`}>Bienvenido de vuelta</div>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className={`text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-[#0f2b53]'}`}>
              {displayName ? `¡Hola, ${displayName}!` : '¡Hola!'}
            </h1>
            <span className={`text-2xl ${isDark ? 'text-sky-200' : 'text-[#1d4f91]'}`} aria-hidden="true">👋</span>
          </div>
          <div className={`mt-3 h-1 w-16 rounded-full ${isDark ? 'bg-sky-500/60' : 'bg-[#1d4f91]'}`} />
        </div>

        <Card className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
          <div className="grid gap-6 md:grid-cols-[150px_1fr_200px] md:items-center">
            <div className="flex justify-center md:justify-start">
              <div
                className="relative h-36 w-36 rounded-full p-[12px] shadow-[0_20px_28px_-22px_rgba(29,79,145,0.95)] transition-transform duration-500 hover:scale-[1.03] dark:shadow-[0_20px_32px_-22px_rgba(34,211,238,0.85)]"
                style={ringStyle}
              >
                <div className="pointer-events-none absolute inset-0 animate-[spin_8s_linear_infinite] rounded-full bg-[conic-gradient(from_90deg,transparent_0deg,rgba(255,255,255,0.34)_52deg,transparent_116deg)]" />
                <div className="pointer-events-none absolute inset-[3px] rounded-full border border-white/55 dark:border-cyan-200/20" />
                <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.38),transparent_42%)]" />
                <div
                  className={`relative z-10 flex h-full w-full flex-col items-center justify-center rounded-full ${
                    isDark ? 'bg-slate-900/40' : 'bg-white'
                  }`}
                >
                  <div
                    className={`text-[34px] font-extrabold leading-none tracking-tight tabular-nums ${isDark ? 'text-white' : 'text-[#1d4f91]'}`}
                  >
                    {progressPercent}%
                  </div>
                  <div className={`text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
                    Completado
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className={`text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>¡Tu progreso!</h3>
              <p className={`mt-1 text-lg ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Vas por buen camino, ¡sigue asi!</p>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                {moduleTimeline.length === 0 && (
                  <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>No hay modulos publicados aun.</div>
                )}

                {moduleTimeline.map((moduleItem, idx) => {
                  const current = idx === activeStep && !moduleItem.completed;
                  const upcoming = !moduleItem.completed && idx !== activeStep;
                  const done = moduleItem.completed;
                  const lineActive = idx < activeStep || done;

                  return (
                    <React.Fragment key={moduleItem.id}>
                      <button
                        type="button"
                        onClick={() => moduleItem?.id && navigate(`/student/courses/${moduleItem.id}`)}
                        disabled={!moduleItem?.id}
                        aria-label={`Ir al modulo ${moduleItem.title}`}
                        title={moduleItem.title}
                        className={
                          `flex h-11 w-11 items-center justify-center rounded-full border text-[15px] font-black transition-transform duration-300 hover:-translate-y-0.5 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-sky-500/20 disabled:cursor-not-allowed disabled:opacity-60 ` +
                          (done
                            ? isDark
                              ? 'border-cyan-300/70 bg-gradient-to-br from-cyan-300 to-sky-500 text-slate-950 shadow-[0_8px_14px_-8px_rgba(34,211,238,0.9)] hover:brightness-105'
                              : 'border-[#1d4f91] bg-gradient-to-br from-[#2f8fe8] to-[#1d4f91] text-white shadow-[0_8px_14px_-8px_rgba(29,79,145,0.9)] hover:brightness-105'
                            : current
                              ? isDark
                                ? 'border-cyan-300 bg-slate-900/50 text-cyan-200 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.35)] hover:bg-slate-900/70'
                                : 'border-[#1d4f91] bg-white text-[#1d4f91] shadow-[inset_0_0_0_1px_rgba(29,79,145,0.2)] hover:bg-slate-50'
                              : upcoming
                                ? isDark
                                  ? 'border-slate-600 bg-transparent text-slate-300 hover:border-slate-500'
                                  : 'border-slate-200 bg-transparent text-slate-500 hover:border-slate-300'
                                : '') +
                          (current ? ' animate-pulse' : '')
                        }
                      >
                        {done ? (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          idx + 1
                        )}
                      </button>
                      {idx < moduleTimeline.length - 1 && (
                        <div
                          className={
                            `h-[3px] w-10 rounded-full ` +
                            (lineActive
                              ? isDark
                                ? 'bg-gradient-to-r from-cyan-300/80 to-sky-500/80'
                                : 'bg-gradient-to-r from-[#2f8fe8] to-[#1d4f91]'
                              : isDark
                                ? 'bg-slate-700'
                                : 'bg-slate-200')
                          }
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              <p className={`mt-3 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Proximo: <span className={`font-semibold ${isDark ? 'text-sky-200' : 'text-[#1d4f91]'}`}>{nextStepText}</span>
              </p>
            </div>

            <div className="flex items-start justify-end">
              <div className={`text-right text-base font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                <span className="mr-2" aria-hidden="true">⚡</span>
                Insignias: {badgesCount}
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 lg:grid-cols-3 lg:items-stretch">
          <div className="lg:col-span-3">
            <BadgeGrid badges={badges} unlocked={unlocked} />
          </div>

          <Card className="p-4 lg:col-span-2">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300">Actividad</div>
                <div className="mt-0.5 text-base font-extrabold text-slate-900 dark:text-white">Tu actividad</div>
              </div>
              <select
                value={activityRange}
                onChange={(e) => setActivityRange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-500/10 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200 md:w-auto"
              >
                <option value="day">Dia</option>
                <option value="week">Semana</option>
                <option value="month">Mes</option>
              </select>
            </div>

            <div className="mt-4">
              <ActivityChart progressRows={progressRows} range={activityRange} isDark={isDark} />
            </div>

            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Basado en tu actividad reciente en modulos.
            </div>
          </Card>

          <RankingCard top={top} />

          <Card className="relative h-full overflow-hidden border-cyan-100/70 bg-gradient-to-br from-sky-50/85 via-cyan-50/55 to-slate-50 text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900/55 dark:bg-none dark:text-slate-100 lg:col-span-2">
            <div className="pointer-events-none absolute inset-0 opacity-70">
              <div className="absolute -left-20 -top-20 h-44 w-44 rounded-full bg-cyan-300/15 blur-2xl dark:bg-cyan-400/10" />
              <div className="absolute -bottom-20 -right-20 h-44 w-44 rounded-full bg-sky-400/12 blur-2xl dark:bg-sky-500/10" />
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.10)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:24px_24px] opacity-25 dark:opacity-20" />
            </div>

            <div className="relative flex h-full flex-col">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300">Centro de control</div>
                  <div className="mt-1 text-base font-extrabold text-slate-900 dark:text-white">Mantente activo y sube en el ranking</div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/student/courses')}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white/75 px-3 py-2 text-xs font-extrabold text-slate-700 shadow-sm transition hover:brightness-105 dark:border-slate-700 dark:bg-slate-900/35 dark:text-slate-200"
                >
                  Ver cursos <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-cyan-100 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-900/25">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300">Racha</div>
                    <Flame className="h-4 w-4 text-orange-500 dark:text-orange-300" />
                  </div>
                  <div className="mt-1 text-2xl font-extrabold tabular-nums text-slate-900 dark:text-white">{activitySummary.streak}</div>
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-300">dias seguidos</div>
                </div>
                <div className="rounded-2xl border border-cyan-100 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-900/25">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300">En progreso</div>
                    <Activity className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />
                  </div>
                  <div className="mt-1 text-2xl font-extrabold tabular-nums text-slate-900 dark:text-white">{inProgressModules}</div>
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-300">modulo(s)</div>
                </div>
                <div className="rounded-2xl border border-cyan-100 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-900/25">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300">Ultima actividad</div>
                    <Clock3 className="h-4 w-4 text-sky-700 dark:text-sky-300" />
                  </div>
                  <div className="mt-2 text-sm font-extrabold text-slate-900 dark:text-white">{activitySummary.lastActiveText}</div>
                  <div className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-300">abre un modulo y suma XP</div>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  <Target className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />
                  {continueModule ? (
                    <span className="truncate">Siguiente paso: reanuda <span className="font-extrabold">{continueModule.title}</span></span>
                  ) : (
                    <span>Meta rapida: completa un modulo al 100% y gana 1 insignia</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (continueModule?.id) navigate(`/student/courses/${continueModule.id}`);
                    else navigate('/student/courses');
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-cyan-200 bg-white/80 px-4 py-2 text-sm font-extrabold text-cyan-900 shadow-sm transition hover:-translate-y-0.5 hover:brightness-105 focus:outline-none focus:ring-4 focus:ring-cyan-500/15 dark:border-cyan-300/25 dark:bg-slate-900/40 dark:text-cyan-200"
                >
                  {continueModule ? 'Continuar' : 'Empezar'}
                  <PlayCircle className="h-4 w-4" />
                </button>
              </div>
            </div>
          </Card>

          <MyRankCard
            position={rank.position}
            total={rank.total}
            badgesCount={badgesCount}
            completedModules={completedModules}
            totalModules={totalModules}
            lastBadgeUnlockedAt={user?.lastBadgeUnlockedAt}
            top={top}
          />
        </div>

        <Card className="border-cyan-100/70 bg-white/90 shadow-sm dark:border-slate-700 dark:bg-slate-900/45">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">Modulos</h3>
            <button
              type="button"
              onClick={() => navigate('/student/courses')}
              className="inline-flex items-center gap-1 text-sm font-semibold text-sky-700 hover:text-sky-800 dark:text-brand-200 dark:hover:text-brand-100"
            >
              Ver mas
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {firstModules.map((m) => (
              <Card
                key={m._id}
                onClick={() => {
                  if (!m.locked) navigate(`/student/courses/${m._id}`);
                }}
                className={`group overflow-hidden border border-cyan-100 bg-white/90 !p-0 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50 ${
                  m.locked ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'
                }`}
              >
                <div className="flex h-full flex-col">
                  <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-t-2xl bg-slate-800">
                    <img src={moduleImage(m)} alt={m.title || 'Modulo'} className="h-full w-full object-cover" />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent dark:from-slate-950/55" />

                    <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2 py-1 text-[11px] font-bold text-slate-800 ring-1 ring-slate-300 dark:bg-slate-900/75 dark:text-slate-100 dark:ring-white/20">
                      Modulo {m.moduleNumber}
                    </span>
                    {m.locked ? (
                      <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-slate-100/95 px-2 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-300 dark:bg-slate-900/75 dark:text-slate-100 dark:ring-white/20">
                        <Lock className="h-3.5 w-3.5" />
                        Bloqueado
                      </span>
                    ) : m.completed ? (
                      <span className="absolute right-3 top-3 rounded-full bg-emerald-100/95 px-2 py-1 text-[11px] font-semibold text-emerald-800 ring-1 ring-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-100 dark:ring-emerald-300/35">
                        Completado
                      </span>
                    ) : (
                      <span className="absolute right-3 top-3 rounded-full bg-cyan-100/95 px-2 py-1 text-[11px] font-semibold text-cyan-800 ring-1 ring-cyan-300 dark:bg-cyan-500/20 dark:text-cyan-100 dark:ring-cyan-300/35">
                        {m.inProgress ? 'En progreso' : 'Pendiente'}
                      </span>
                    )}
                    <span className="absolute right-3 top-12 rounded-full bg-white/95 px-2 py-1 text-[10px] font-semibold text-slate-700 ring-1 ring-slate-300 dark:bg-slate-900/70 dark:text-slate-200 dark:ring-white/15">
                      {m.category || 'General'}
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

                    <div className="mt-auto space-y-2.5 pt-3">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-300">
                        <span>Progreso</span>
                        <span>{m.progressPercent}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700/80">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-cyan-400"
                          style={{ width: `${m.progressPercent}%` }}
                        />
                      </div>

                      {m.locked ? (
                        <div className="inline-flex h-10 w-full items-center justify-center gap-1 rounded-full border border-slate-200 bg-white/80 px-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
                          <Lock className="h-4 w-4" />
                          Completa el modulo anterior
                        </div>
                      ) : (
                        <Link
                          to={`/student/courses/${m._id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex h-10 w-full items-center justify-center gap-1 rounded-full border border-slate-200 bg-white/80 px-3 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:border-brand-400 dark:hover:text-brand-100"
                        >
                          <PlayCircle className="h-4 w-4" />
                          {m.completed ? 'Ver modulo' : 'Continuar modulo'}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            {!firstModules.length && (
              <Card className="bg-cyan-50/70 dark:bg-slate-900">
                <p className="text-sm text-slate-400">Aun no hay modulos publicados.</p>
              </Card>
            )}
          </div>
        </Card>

        {latestDashboardNews.length > 0 ? (
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">Noticias y Tendencias</h3>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Ultimas 3
              </div>
            </div>
            <div className="mt-4">
              <NewsFeed items={latestDashboardNews} />
            </div>
          </Card>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">Sin noticias hoy.</p>
        )}
      </div>
    </div>
  );
}
