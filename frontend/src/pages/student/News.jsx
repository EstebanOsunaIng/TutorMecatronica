import React, { useEffect, useState } from 'react';
import Card from '../../components/common/Card.jsx';
import NewsList from '../../components/news/NewsList.jsx';
import { newsApi } from '../../api/news.api.js';

export default function StudentNews() {
  const [news, setNews] = useState([]);

  useEffect(() => {
    newsApi.list().then((res) => setNews(res.data.news || []));
  }, []);

  return (
    <Card className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
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
