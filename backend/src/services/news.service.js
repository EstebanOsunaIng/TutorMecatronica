import { News } from '../models/News.model.js';
import { NewsRefreshState } from '../models/NewsRefreshState.model.js';
import { env } from '../config/env.js';

const REFRESH_KEY = 'global-news-refresh';
const categories = ['Mecatrónica', 'Robótica', 'Humanoides', 'Ingeniería', 'Unitree'];

const categoryKeywords = {
  'Mecatrónica': ['mecatronica', 'mecatrónica', 'mechatronics', 'mechatronic'],
  'Robótica': ['robotica', 'robótica', 'robotics', 'robot'],
  'Humanoides': ['humanoid', 'humanoide', 'humanoides'],
  'Ingeniería': ['ingenieria', 'ingeniería', 'engineering', 'automation', 'control'],
  Unitree: ['unitree']
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
  Humanoides: {
    en: ['humanoid robot', 'bipedal robot', 'humanoid robotics'],
    es: ['humanoide', 'robot humanoide', 'robot bipedo']
  },
  'Ingeniería': {
    en: ['engineering', 'mechanical engineering', 'electrical engineering', 'mechatronics'],
    es: ['ingenieria', 'ingeniería', 'ingenieria mecanica', 'ingenieria electrica']
  },
  Unitree: {
    en: ['unitree', 'unitree robot', 'unitree robotics'],
    es: ['unitree']
  }
};

let refreshPromise = null;
let schedulerInterval = null;

function utcDayKey(dateValue = new Date()) {
  const d = new Date(dateValue);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

function startOfUtcDay(dateValue = new Date()) {
  const d = new Date(dateValue);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

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

function normalizeItems(items = []) {
  const seen = new Set();
  const list = [];

  for (const item of items) {
    const title = String(item?.title || '').trim();
    const url = String(item?.url || '').trim();
    if (!title || !url) continue;
    const key = `${url}|${title.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    list.push(item);
  }

  return list.sort((a, b) => {
    const da = a.pubDate ? new Date(a.pubDate).getTime() : 0;
    const db = b.pubDate ? new Date(b.pubDate).getTime() : 0;
    return db - da;
  });
}

async function fetchGnews(query) {
  const apiKey = env.news.gnewsApiKey;
  if (!apiKey) return [];

  const endpoint = new URL('https://gnews.io/api/v4/search');
  endpoint.searchParams.set('q', query);
  endpoint.searchParams.set('token', apiKey);
  endpoint.searchParams.set('max', '20');
  endpoint.searchParams.set('topic', 'technology');

  const lang = String(env.news.gnewsLang || '').trim().toLowerCase();
  if (lang && lang !== 'all') endpoint.searchParams.set('lang', lang);

  const startedAt = Date.now();
  const res = await fetch(endpoint.toString());
  const elapsed = Date.now() - startedAt;
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error('[news][gnews] failed', { status: res.status, elapsedMs: elapsed, endpoint: endpoint.toString(), query, body });
    throw new Error('GNews request failed');
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

  const endpoint = new URL('https://newsapi.org/v2/everything');
  endpoint.searchParams.set('q', query);
  endpoint.searchParams.set('apiKey', apiKey);
  endpoint.searchParams.set('pageSize', '20');
  endpoint.searchParams.set('sortBy', 'publishedAt');
  endpoint.searchParams.set('searchIn', 'title,description');

  const rawLang = String(env.news.gnewsLang || '').trim().toLowerCase();
  if (rawLang && rawLang !== 'all') endpoint.searchParams.set('language', rawLang.slice(0, 2));

  const startedAt = Date.now();
  const res = await fetch(endpoint.toString());
  const elapsed = Date.now() - startedAt;
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error('[news][newsapi] failed', { status: res.status, elapsedMs: elapsed, endpoint: endpoint.toString(), query, body });
    throw new Error('NewsAPI request failed');
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
  } catch {}

  try {
    const newsApiItems = await fetchNewsApi(query);
    if (newsApiItems.length > 0) return newsApiItems;
  } catch {}

  return [];
}

async function pickCategoryNews(category) {
  const queries = buildQueries(category);
  const collected = [];

  for (const query of queries) {
    const items = await fetchFromProviders(query);
    if (!items.length) continue;

    const normalized = normalizeItems(items);
    const filtered = normalized.filter((item) => matchesCategory(item, category));
    if (filtered.length > 0) return filtered;
    collected.push(...normalized);

    if (collected.length >= 5) break;
  }

  return normalizeItems(collected);
}

async function trimNewsPerCategory(limit = 10) {
  for (const category of categories) {
    const rows = await News.find({ category }).sort({ date: -1, createdAt: -1 }).select('_id');
    if (rows.length <= limit) continue;
    const staleIds = rows.slice(limit).map((x) => x._id);
    await News.deleteMany({ _id: { $in: staleIds } });
  }
}

async function updateRefreshState(patch) {
  await NewsRefreshState.findOneAndUpdate({ key: REFRESH_KEY }, { $set: patch }, { upsert: true, new: true });
}

export async function refreshNewsNow({ force = false, trigger = 'manual' } = {}) {
  const now = new Date();
  const todayUtc = startOfUtcDay(now);

  await updateRefreshState({ lastAttemptAt: now });

  const staleCutoff = new Date(todayUtc.getTime() - 3 * 24 * 60 * 60 * 1000);
  await News.deleteMany({ date: { $lt: staleCutoff } });

  const fallbackByCategory = new Map();
  const currentRows = await News.find({}).sort({ date: -1, createdAt: -1 });
  currentRows.forEach((row) => {
    if (!fallbackByCategory.has(row.category)) fallbackByCategory.set(row.category, row);
  });

  const toInsert = [];
  const touchedCategories = [];

  for (const category of categories) {
    let picked = null;
    const candidates = await pickCategoryNews(category);
    picked = candidates[0] || null;

    if (!picked) {
      const fallback = fallbackByCategory.get(category);
      if (!fallback) continue;
      picked = {
        title: fallback.title,
        summary: fallback.summary,
        url: fallback.url,
        imageUrl: fallback.imageUrl,
        source: fallback.source || 'CACHE'
      };
    }

    touchedCategories.push(category);
    toInsert.push({
      title: picked.title || `${category}: noticia`,
      summary: picked.summary || 'Sin resumen.',
      category,
      source: picked.source || 'AUTO',
      url: picked.url || '',
      imageUrl: picked.imageUrl || '',
      date: now,
      createdByAI: false,
      createdAt: now
    });
  }

  if (toInsert.length === 0) {
    await updateRefreshState({
      lastStatus: 'failed',
      lastError: `[${trigger}] No se pudieron obtener noticias desde proveedores ni cache.`
    });
    throw new Error('News refresh failed: no records generated');
  }

  if (force) {
    await News.deleteMany({});
  } else {
    await News.deleteMany({
      category: { $in: touchedCategories },
      date: { $gte: todayUtc }
    });
  }

  await News.insertMany(toInsert);
  await trimNewsPerCategory(10);

  await updateRefreshState({
    lastRefreshAt: now,
    lastStatus: 'success',
    lastError: ''
  });
}

export async function ensureNewsFresh({ force = false, trigger = 'request' } = {}) {
  const state = await NewsRefreshState.findOne({ key: REFRESH_KEY });
  const isFreshToday = state?.lastRefreshAt && utcDayKey(state.lastRefreshAt) === utcDayKey(new Date());

  if (!force && isFreshToday) return;

  if (!refreshPromise) {
    refreshPromise = refreshNewsNow({ force, trigger }).finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export function startNewsScheduler() {
  if (schedulerInterval) return;

  setTimeout(() => {
    ensureNewsFresh({ trigger: 'startup' }).catch((err) => {
      console.error('[news] startup refresh failed', err?.message || err);
    });
  }, 4000);

  schedulerInterval = setInterval(() => {
    ensureNewsFresh({ trigger: 'hourly-check' }).catch((err) => {
      console.error('[news] scheduled refresh failed', err?.message || err);
    });
  }, 60 * 60 * 1000);
}
