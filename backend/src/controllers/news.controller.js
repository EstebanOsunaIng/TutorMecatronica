import { News } from '../models/News.model.js';
import { ensureDailyNews } from '../services/news.service.js';

export async function listNews(req, res) {
  await ensureDailyNews();
  const { category } = req.query;
  const filter = category ? { category } : {};
  const news = await News.find(filter).sort({ date: -1 });
  res.json({ news });
}

export async function refreshNews(_req, res) {
  await ensureDailyNews();
  res.json({ ok: true });
}
