import React, { useEffect, useState } from 'react';
import NewsList from '../../components/news/NewsList.jsx';
import { newsApi } from '../../api/news.api.js';

export default function TeacherNews() {
  const [news, setNews] = useState([]);

  useEffect(() => {
    newsApi.list().then((res) => setNews(res.data.news || []));
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Mantente al dia</p>
        <h2 className="text-2xl font-bold">Noticias y Tendencias</h2>
      </div>
      <NewsList items={news} limit={10} />
    </div>
  );
}
