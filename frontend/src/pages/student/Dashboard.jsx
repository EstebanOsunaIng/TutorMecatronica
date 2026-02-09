import React, { useEffect, useState } from 'react';
import Card from '../../components/common/Card.jsx';
import BadgeGrid from '../../components/gamification/BadgeGrid.jsx';
import RankingCard from '../../components/gamification/RankingCard.jsx';
import MyRankCard from '../../components/gamification/MyRankCard.jsx';
import NewsFeed from '../../components/news/NewsFeed.jsx';
import { gamificationApi } from '../../api/gamification.api.js';
import { newsApi } from '../../api/news.api.js';
import { modulesApi } from '../../api/modules.api.js';
import { progressApi } from '../../api/progress.api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';

export default function StudentDashboard() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [badges, setBadges] = useState([]);
  const [unlocked, setUnlocked] = useState([]);
  const [top, setTop] = useState([]);
  const [rank, setRank] = useState({ position: null, total: 0 });
  const [news, setNews] = useState([]);
  const [modules, setModules] = useState([]);
  const [progressRows, setProgressRows] = useState([]);

  useEffect(() => {
    async function load() {
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
  const totalModules = moduleTimeline.length;
  const progressPercent = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

  const currentModule =
    moduleTimeline.find((m) => m.inProgress) ||
    moduleTimeline.find((m) => !m.completed) ||
    null;

  const activeStep = currentModule
    ? moduleTimeline.findIndex((m) => String(m.id) === String(currentModule.id))
    : -1;

  const unlockedSet = new Set((unlocked || []).map((id) => String(id)));
  const nextBadge = badges.find((badge) => !unlockedSet.has(String(badge._id)));
  const nextStepText = currentModule?.title || nextBadge?.name || 'Sigue completando tus niveles';

  const ringStyle = {
    background: `conic-gradient(${isDark ? '#38bdf8' : '#1d4f91'} ${progressPercent * 3.6}deg, ${isDark ? '#12345a' : '#dbe4ef'} 0deg)`
  };

  return (
    <div className="space-y-6">
      <Card
        className={`overflow-hidden rounded-3xl border ${
          isDark ? 'border-slate-700/40 bg-[#0b1632]' : 'border-slate-300 bg-[#f5f7fa]'
        }`}
      >
        <div className="grid gap-6 md:grid-cols-[170px_1fr_auto] md:items-center">
          <div className="flex justify-center md:justify-start">
            <div className="relative h-28 w-28 rounded-full p-2" style={ringStyle}>
              <div
                className={`flex h-full w-full flex-col items-center justify-center rounded-full ${
                  isDark ? 'bg-[#0b1632]' : 'bg-[#f5f7fa]'
                }`}
              >
                <div className={`text-4xl font-extrabold ${isDark ? 'text-white' : 'text-[#173f74]'}`}>{progressPercent}%</div>
                <div className={`text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  Completado
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className={`text-4xl font-extrabold leading-tight ${isDark ? 'text-white' : 'text-[#0f2b53]'}`}>Tu progreso</h3>
            <p className={`mt-1 text-2xl ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Vas por buen camino, sigue asi.</p>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              {moduleTimeline.length === 0 && (
                <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  No hay modulos publicados aun.
                </div>
              )}
              {moduleTimeline.map((moduleItem, idx) => {
                const active = moduleItem.completed || idx === activeStep;
                const current = idx === activeStep && !moduleItem.completed;
                return (
                  <React.Fragment key={moduleItem.id}>
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-bold ${
                        moduleItem.completed
                          ? isDark
                            ? 'border-[#2e6cb0] bg-[#173f74] text-white'
                            : 'border-[#244e88] bg-[#1d4f91] text-white'
                          : current
                            ? isDark
                              ? 'border-[#1b3e70] bg-[#12345a] text-sky-100'
                              : 'border-[#2c5c9c] bg-[#d9e4f1] text-[#173f74]'
                          : isDark
                            ? 'border-slate-700 bg-slate-800 text-slate-400'
                            : 'border-slate-300 bg-slate-100 text-slate-500'
                      } ${current ? 'ring-2 ring-offset-2 ring-offset-transparent ring-[#3f8be0]' : ''}`}
                      title={moduleItem.title}
                    >
                      {moduleItem.completed ? (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        idx + 1
                      )}
                    </div>
                    {idx < moduleTimeline.length - 1 && (
                      <div
                        className={`h-[2px] w-8 ${
                          active
                            ? isDark
                              ? 'bg-[#2e6cb0]'
                              : 'bg-[#2e6cb0]'
                            : isDark
                              ? 'bg-slate-700'
                              : 'bg-slate-300'
                        }`}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            <p className={`mt-3 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Proximo paso: <span className={`font-semibold ${isDark ? 'text-sky-300' : 'text-[#173f74]'}`}>{nextStepText}</span>
            </p>
          </div>

          <div className="flex items-end justify-between gap-6 md:flex-col md:items-end md:justify-center">
            <div>
              <div className={`text-right text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Insignias: {completedModules}</div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className={`rounded-xl p-2 ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-[#173f74]'}`}
                aria-label="Configuracion"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317a1.724 1.724 0 013.35 0 1.724 1.724 0 002.573 1.066 1.724 1.724 0 012.36 2.36 1.724 1.724 0 001.066 2.573 1.724 1.724 0 010 3.35 1.724 1.724 0 00-1.066 2.573 1.724 1.724 0 01-2.36 2.36 1.724 1.724 0 00-2.573 1.066 1.724 1.724 0 01-3.35 0 1.724 1.724 0 00-2.573-1.066 1.724 1.724 0 01-2.36-2.36 1.724 1.724 0 00-1.066-2.573 1.724 1.724 0 010-3.35 1.724 1.724 0 001.066-2.573 1.724 1.724 0 012.36-2.36 1.724 1.724 0 002.573-1.066z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <button
                type="button"
                className={`rounded-xl p-2 ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-[#173f74]'}`}
                aria-label="Insignias"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 4v5c0 5-3.5 8.5-7 9-3.5-.5-7-4-7-9V7l7-4z" />
                </svg>
              </button>
              <button
                type="button"
                className={`rounded-xl p-2 ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-[#173f74]'}`}
                aria-label="Cursos"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h-2a2 2 0 00-2 2v8a2 2 0 002 2h7" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v8a2 2 0 01-2 2h-7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <BadgeGrid badges={badges} unlocked={unlocked} />
        </div>
        <div className="space-y-4">
          <RankingCard top={top} />
          <MyRankCard position={rank.position} total={rank.total} badgesCount={user?.badgesCount} />
        </div>
      </div>

      <Card>
        <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-brand-300">Noticias del dia</h3>
        <NewsFeed items={news} />
      </Card>
    </div>
  );
}
