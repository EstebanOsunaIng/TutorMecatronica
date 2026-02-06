import { createRequire } from 'module';
import { News } from '../models/News.model.js';

const require = createRequire(import.meta.url);
const Parser = require('rss-parser');

const categories = {
  'Innovación': [
    { name: 'MIT Tech Review', url: 'https://www.technologyreview.com/feed/' },
    { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml' }
  ],
  'Mecatrónica': [
    { name: 'IEEE Spectrum', url: 'https://spectrum.ieee.org/rss/fulltext' },
    { name: 'Hackaday', url: 'https://hackaday.com/blog/feed/' }
  ],
  'Robótica': [
    { name: 'IEEE Spectrum', url: 'https://spectrum.ieee.org/rss/robotics/fulltext' },
    { name: 'Robohub', url: 'https://robohub.org/feed/' }
  ],
  'Humanoides': [
    { name: 'IEEE Spectrum', url: 'https://spectrum.ieee.org/rss/robotics/fulltext' },
    { name: 'Robohub', url: 'https://robohub.org/feed/' }
  ]
};

function stripHtml(s = '') {
  return String(s)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchRssItems(feedUrl) {
  const parser = new Parser({ timeout: 12000 });
  const feed = await parser.parseURL(feedUrl);
  const items = Array.isArray(feed?.items) ? feed.items : [];
  return items.map((it) => ({
    title: stripHtml(it.title || ''),
    summary: stripHtml(it.contentSnippet || it.content || it.summary || ''),
    url: it.link || '',
    pubDate: it.isoDate ? new Date(it.isoDate) : it.pubDate ? new Date(it.pubDate) : null,
    source: feed?.title || ''
  }));
}

async function pickLatestFromFeeds(feeds) {
  const results = await Promise.all(
    feeds.map(async (f) => {
      try {
        const items = await fetchRssItems(f.url);
        return items.map((it) => ({ ...it, source: f.name || it.source || '' }));
      } catch (err) {
        console.error('[news] rss failed', f.url, err?.message || err);
        return [];
      }
    })
  );

  const merged = results.flat().filter((x) => x.title);
  merged.sort((a, b) => {
    const da = a.pubDate ? a.pubDate.getTime() : 0;
    const db = b.pubDate ? b.pubDate.getTime() : 0;
    return db - da;
  });
  return merged[0] || null;
}

export async function ensureDailyNews() {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const count = await News.countDocuments({ date: { $gte: start } });
  if (count > 0) return;

  const batch = [];
  for (const [category, feeds] of Object.entries(categories)) {
    const picked = await pickLatestFromFeeds(feeds);
    if (!picked) {
      batch.push({
        title: `${category}: sin fuente disponible`,
        summary: 'No se pudo consultar una fuente RSS hoy. Intenta refrescar mas tarde.',
        category,
        source: 'RSS',
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
