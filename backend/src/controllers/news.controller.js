import { News } from '../models/News.model.js';
import { ensureDailyNews } from '../services/news.service.js';

const categoryMap = {
  mecatronica: 'Mecatrónica',
  robotica: 'Robótica',
  humanoides: 'Humanoides',
  humanoide: 'Humanoides',
  ingenieria: 'Ingeniería',
  unitree: 'Unitree'
};

function normalizeCategory(value) {
  if (!value) return '';
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '');
}

export async function listNews(req, res) {
  await ensureDailyNews();
  const { category } = req.query;
  const normalized = normalizeCategory(category);
  const mappedCategory = categoryMap[normalized] || category;
  const filter = mappedCategory ? { category: mappedCategory } : {};
  const rows = await News.find(filter).sort({ date: -1, createdAt: -1 }).limit(30);

  const seen = new Set();
  const news = [];
  for (const item of rows) {
    const key = (item.url && String(item.url).trim()) || String(item.title || '').trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    news.push(item);
    if (news.length >= 10) break;
  }

  res.json({ news });
}

export async function refreshNews(req, res) {
  const force = String(req.query?.force || '') === '1';
  if (force) {
    await News.deleteMany({});
  } else {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    await News.deleteMany({ date: { $gte: start } });
  }
  await ensureDailyNews();
  res.json({ ok: true });
}
