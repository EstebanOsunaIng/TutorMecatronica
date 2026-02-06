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
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  await News.deleteMany({ date: { $gte: start } });
  await ensureDailyNews();
  res.json({ ok: true });
}
