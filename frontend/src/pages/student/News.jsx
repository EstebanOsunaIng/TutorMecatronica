import React, { useEffect, useState } from 'react';
import NewsFeed from '../../components/news/NewsFeed.jsx';
import { newsApi } from '../../api/news.api.js';

export default function StudentNews() {
  const [news, setNews] = useState([]);

  useEffect(() => {
    newsApi.list().then((res) => setNews(res.data.news || []));
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Noticias</h2>
      <NewsFeed items={news} />
    </div>
  );
}
