import React, { useEffect, useState } from 'react';
import Card from '../../components/common/Card.jsx';
import BadgeGrid from '../../components/gamification/BadgeGrid.jsx';
import RankingCard from '../../components/gamification/RankingCard.jsx';
import MyRankCard from '../../components/gamification/MyRankCard.jsx';
import NewsFeed from '../../components/news/NewsFeed.jsx';
import { gamificationApi } from '../../api/gamification.api.js';
import { newsApi } from '../../api/news.api.js';
import { useAuth } from '../../context/AuthContext.jsx';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [badges, setBadges] = useState([]);
  const [unlocked, setUnlocked] = useState([]);
  const [top, setTop] = useState([]);
  const [rank, setRank] = useState({ position: null, total: 0 });
  const [news, setNews] = useState([]);

  useEffect(() => {
    async function load() {
      const [b, t, r, n] = await Promise.all([
        gamificationApi.badges(),
        gamificationApi.top5(),
        gamificationApi.myRank(),
        newsApi.list()
      ]);
      setBadges(b.data.badges || []);
      setUnlocked(b.data.unlocked || []);
      setTop(t.data.top || []);
      setRank(r.data || {});
      setNews(n.data.news || []);
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <h3 className="text-xs uppercase tracking-widest text-brand-300">Progreso</h3>
          <div className="mt-3 text-3xl font-extrabold">{user?.badgesCount || 0} insignias</div>
          <p className="mt-2 text-sm text-slate-400">Completa modulos para desbloquear insignias.</p>
        </Card>
        <Card>
          <h3 className="text-xs uppercase tracking-widest text-brand-300">Bienvenida</h3>
          <p className="mt-2 text-sm text-slate-300">
            Este es tu panel principal. Aqui veras tu avance y las noticias del dia.
          </p>
        </Card>
        <Card>
          <h3 className="text-xs uppercase tracking-widest text-brand-300">Chatbot TuVir</h3>
          <p className="mt-2 text-sm text-slate-300">
            Usa el chatbot para resolver dudas tecnicas y navegar la plataforma.
          </p>
        </Card>
      </div>

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
