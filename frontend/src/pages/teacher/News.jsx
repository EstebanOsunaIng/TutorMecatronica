import React, { useEffect, useState } from 'react';
import Card from '../../components/common/Card.jsx';
import NewsList from '../../components/news/NewsList.jsx';
import { newsApi } from '../../api/news.api.js';

export default function TeacherNews() {
  const [news, setNews] = useState([]);

  useEffect(() => {
    newsApi.list().then((res) => setNews(res.data.news || []));
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
        <NewsList items={news} limit={10} />
      </div>
    </Card>
  );
}
