import React, { useEffect, useState } from 'react';
import Card from '../../components/common/Card.jsx';
import NewsList from '../../components/news/NewsList.jsx';
import { newsApi } from '../../api/news.api.js';

export default function TeacherNews() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await newsApi.list();
        if (!mounted) return;
        setNews(res.data.news || []);
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.data?.error || err?.response?.data?.message || 'No fue posible cargar noticias.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Card className="rounded-3xl border-cyan-100/80 bg-gradient-to-br from-sky-50/85 via-cyan-50/65 to-slate-50 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),inset_0_0_0_1px_rgba(125,211,252,0.35),inset_0_-18px_32px_-26px_rgba(6,95,130,0.28)] dark:border-slate-800 dark:bg-slate-900/40 dark:bg-none dark:shadow-[inset_0_1px_0_rgba(148,163,184,0.08),inset_0_0_0_1px_rgba(56,189,248,0.18),inset_0_-20px_34px_-24px_rgba(15,118,110,0.22)]">
      <div className="space-y-4">
        <Card className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/30">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Mantente al dia</p>
            <h2 className="text-2xl font-bold">Noticias y Tendencias</h2>
          </div>
        </Card>
        {loading ? (
          <div className="rounded-2xl border border-cyan-100 bg-white/80 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300">
            Cargando noticias...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
            {error}
          </div>
        ) : (
          <NewsList items={news} limit={10} />
        )}
      </div>
    </Card>
  );
}
