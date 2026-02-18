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
  'Mecatrónica': {
    en: ['mechatronics', 'mechatronic systems', 'automation control', 'robotics', 'control systems'],
    es: ['mecatronica', 'mecatrónica', 'automatizacion', 'control automatico', 'robotica']
  },
  'Robótica': {
    en: ['robotics', 'robot arm', 'autonomous robot', 'mobile robot'],
    es: ['robotica', 'robótica', 'robot autonomo', 'robot movil']
  },
  'Humanoides': {
    en: ['humanoid robot', 'bipedal robot', 'humanoid robotics'],
    es: ['humanoide', 'robot humanoide', 'robot bipedo']
  },
  'Ingeniería': {
    en: ['engineering', 'mechanical engineering', 'electrical engineering', 'mechatronics'],
    es: ['ingenieria', 'ingeniería', 'ingenieria mecanica', 'ingenieria electrica']
  },
  'Unitree': {
    en: ['unitree', 'unitree robot', 'unitree robotics'],
    es: ['unitree']
  }
};

function buildQueries(category) {
  const def = categoryQueries[category];
  if (!def) return [];
  const enQuery = def.en?.join(' OR ') || '';
  const esQuery = def.es?.join(' OR ') || '';
  return [enQuery, esQuery].filter(Boolean);
}

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
  const lang = String(env.news.gnewsLang || '').trim().toLowerCase();
  if (lang && lang !== 'all') {
    url.searchParams.set('lang', lang);
  }
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
    imageUrl: a.image || '',
    pubDate: a.publishedAt ? new Date(a.publishedAt) : null,
    source: a.source?.name || 'GNews'
  }));
}

async function fetchNewsApi(query) {
  const apiKey = env.news.newsApiKey;
  if (!apiKey) return [];

  const url = new URL('https://newsapi.org/v2/everything');
  url.searchParams.set('q', query);
  url.searchParams.set('apiKey', apiKey);
  url.searchParams.set('pageSize', '20');
  url.searchParams.set('sortBy', 'publishedAt');
  url.searchParams.set('searchIn', 'title,description');

  const rawLang = String(env.news.gnewsLang || '').trim().toLowerCase();
  if (rawLang && rawLang !== 'all') {
    const lang = rawLang.slice(0, 2);
    if (lang) url.searchParams.set('language', lang);
  }

  const res = await fetch(url.toString());
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw Object.assign(new Error('NewsAPI error'), { status: 502, details: body });
  }

  const data = await res.json();
  const articles = Array.isArray(data?.articles) ? data.articles : [];
  return articles.map((a) => ({
    title: a.title || '',
    summary: a.description || '',
    url: a.url || '',
    imageUrl: a.urlToImage || '',
    pubDate: a.publishedAt ? new Date(a.publishedAt) : null,
    source: a.source?.name || 'NewsAPI'
  }));
}

async function fetchFromProviders(query) {
  try {
    const gnewsItems = await fetchGnews(query);
    if (gnewsItems.length > 0) return gnewsItems;
  } catch (err) {
    console.error('[news] gnews provider failed', err?.message || err);
  }

  try {
    const newsApiItems = await fetchNewsApi(query);
    if (newsApiItems.length > 0) return newsApiItems;
  } catch (err) {
    console.error('[news] newsapi provider failed', err?.message || err);
  }

  return [];
}

async function pickLatest(category) {
  const queries = buildQueries(category);
  const collected = [];

  for (const q of queries) {
    const items = await fetchFromProviders(q);
    collected.push(...items);
  }

  const normalized = collected
    .filter((x) => x.title && x.url)
    .sort((a, b) => {
      const da = a.pubDate ? a.pubDate.getTime() : 0;
      const db = b.pubDate ? b.pubDate.getTime() : 0;
      return db - da;
    });

  const filtered = normalized.filter((x) => matchesCategory(x, category));

  if (filtered.length > 0) return filtered;

  return normalized;
}

async function translateToSpanish(text) {
  const apiKey = env.ai.openaiApiKey;
  if (!apiKey || !text) return text;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: env.ai.openaiModel,
      messages: [
        {
          role: 'system',
          content: 'Traduce al español neutro. Mantén nombres propios y marcas. No agregues información.'
        },
        { role: 'user', content: text }
      ],
      temperature: 0.2
    })
  });

  if (res.ok) {
    const data = await res.json();
    const translated = data?.choices?.[0]?.message?.content?.trim();
    if (translated) return translated;
  }

  return text;
}

async function translateWithLibre(text) {
  const url = env.news.translateUrl;
  if (!url || !text) return text;

  const payload = {
    q: text,
    source: 'auto',
    target: 'es',
    format: 'text'
  };
  if (env.news.translateApiKey) payload.api_key = env.news.translateApiKey;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) return text;
    const data = await res.json();
    return data?.translatedText || text;
  } catch (err) {
    return text;
  }
}

async function translateToSpanishSafe(text) {
  const first = await translateToSpanish(text);
  if (first && first !== text) return first;
  return translateWithLibre(text);
}

export async function ensureDailyNews() {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const cutoff = new Date(start.getTime() - 3 * 24 * 60 * 60 * 1000);
  await News.deleteMany({ date: { $lt: cutoff } });

  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const todayCount = await News.countDocuments({ date: { $gte: start, $lt: end } });
  if (todayCount > 0) return;

  await News.deleteMany({ date: { $gte: start, $lt: end } });

  const batch = [];
  const usedUrls = new Set();
  const usedTitles = new Set();
  for (const category of categories) {
    let picked = null;
    try {
      const candidates = await pickLatest(category);
      picked =
        candidates.find((item) => {
          const normalizedTitle = String(item.title || '').trim().toLowerCase();
          return !usedUrls.has(item.url) && !usedTitles.has(normalizedTitle);
        }) || null;
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
        imageUrl: '',
        date: start,
        createdByAI: false,
        createdAt: new Date()
      });
      continue;
    }

    usedUrls.add(picked.url);
    usedTitles.add(String(picked.title || '').trim().toLowerCase());

    batch.push({
      title: picked.title,
      summary: picked.summary || 'Sin resumen.',
      category,
      source: picked.source || 'GNews',
      url: picked.url || '',
      imageUrl: picked.imageUrl || '',
      date: start,
      createdByAI: false,
      createdAt: new Date()
    });
  }

  await News.insertMany(batch);
}
