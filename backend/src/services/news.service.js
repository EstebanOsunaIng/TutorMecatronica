import { createRequire } from 'module';
import { News } from '../models/News.model.js';
import { env } from '../config/env.js';

const categories = ['Mecatrónica', 'Robótica', 'Humanoides', 'Ingeniería', 'Unitree'];

const categoryKeywords = {
  'Mecatrónica': ['mecatronica', 'mecatrónica', 'mechatronics', 'mechatronic'],
  'Robótica': ['robotica', 'robótica', 'robotics', 'robot'],
  'Humanoides': ['humanoid', 'humanoide', 'humanoides'],
  'Ingeniería': ['ingenieria', 'ingeniería', 'engineering', 'automation', 'control'],
  'Unitree': ['unitree']
};

const categoryQueries = {
  'Mecatrónica': ['mecatronica', 'mechatronics', 'mechatronic systems'],
  'Robótica': ['robotica', 'robotics', 'robot arm', 'autonomous robot'],
  'Humanoides': ['humanoid robot', 'humanoide', 'bipedal robot'],
  'Ingeniería': ['ingenieria', 'engineering', 'automation control'],
  'Unitree': ['unitree', 'unitree robot', 'unitree robotics']
};

function matchesCategory(item, category) {
  const keywords = categoryKeywords[category] || [];
  const text = `${item.title || ''} ${item.summary || ''}`.toLowerCase();
  return keywords.some((k) => text.includes(k));
}

async function fetchGnews(query) {
  const apiKey = env.news.gnewsApiKey;
  if (!apiKey) return [];

  const url = new URL('https://gnews.io/api/v4/search');
  url.searchParams.set('q', query);
  url.searchParams.set('token', apiKey);
  url.searchParams.set('lang', env.news.gnewsLang || 'es');
  url.searchParams.set('max', '10');
  url.searchParams.set('topic', 'technology');

  const res = await fetch(url.toString());
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw Object.assign(new Error('GNews error'), { status: 502, details: body });
  }

  const data = await res.json();
  const articles = Array.isArray(data?.articles) ? data.articles : [];
  return articles.map((a) => ({
    title: a.title || '',
    summary: a.description || '',
    url: a.url || '',
    pubDate: a.publishedAt ? new Date(a.publishedAt) : null,
    source: a.source?.name || 'GNews'
  }));
}

async function pickLatest(category) {
  const query = (categoryQueries[category] || []).join(' OR ');
  const items = await fetchGnews(query);
  const filtered = items.filter((x) => x.title).filter((x) => matchesCategory(x, category));
  filtered.sort((a, b) => {
    const da = a.pubDate ? a.pubDate.getTime() : 0;
    const db = b.pubDate ? b.pubDate.getTime() : 0;
    return db - da;
  });
  return filtered[0] || null;
}

export async function ensureDailyNews() {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const count = await News.countDocuments({ date: { $gte: start } });
  if (count > 0) return;

  const batch = [];
  for (const category of categories) {
    let picked = null;
    try {
      picked = await pickLatest(category);
    } catch (err) {
      console.error('[news] gnews failed', category, err?.message || err);
    }
    if (!picked) {
      batch.push({
        title: `${category}: sin fuente disponible`,
        summary: 'No se encontraron noticias filtradas por tema hoy. Intenta refrescar mas tarde.',
        category,
        source: 'GNews',
        url: '',
        date: start,
        createdByAI: false,
        createdAt: new Date()
      });
      continue;
    }

    batch.push({
      title: picked.title,
      summary: picked.summary || 'Sin resumen.',
      category,
      source: picked.source || 'RSS',
      url: picked.url || '',
      date: start,
      createdByAI: false,
      createdAt: new Date()
    });
  }

  await News.insertMany(batch);
}
