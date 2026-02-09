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
    imageUrl: a.image || '',
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

  if (!res.ok) {
    return text;
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content?.trim() || text;
}

export async function ensureDailyNews() {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const cutoff = new Date(start.getTime() - 3 * 24 * 60 * 60 * 1000);
  await News.deleteMany({ date: { $lt: cutoff } });
  const count = await News.countDocuments();
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
        imageUrl: '',
        date: start,
        createdByAI: false,
        createdAt: new Date()
      });
      continue;
    }

    const translatedTitle = await translateToSpanish(picked.title);
    const translatedSummary = await translateToSpanish(picked.summary || 'Sin resumen.');

    batch.push({
      title: translatedTitle,
      summary: translatedSummary || 'Sin resumen.',
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
