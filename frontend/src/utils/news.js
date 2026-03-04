function toTimestamp(item) {
  const candidate = item?.publishedAt || item?.date || item?.createdAt;
  const time = new Date(candidate).getTime();
  return Number.isFinite(time) ? time : NaN;
}

const PLACEHOLDER_REGEX = /(no\s+se\s+encontraron|sin\s+fuente\s+disponible|sin\s+noticias|no\s+hay\s+noticias)/i;

export function isRealNewsItem(item) {
  if (!item || typeof item !== 'object') return false;
  if (item.isPlaceholder === true) return false;
  if (String(item.type || '').toUpperCase() === 'EMPTY_STATE') return false;

  const title = String(item.title || '').trim();
  const body = String(item.summary || item.description || item.content || '').trim();

  if (!title || PLACEHOLDER_REGEX.test(title)) return false;
  if (!body || PLACEHOLDER_REGEX.test(body)) return false;
  if (!Number.isFinite(toTimestamp(item))) return false;

  return true;
}

export function getLatestRealNews(items = [], limit = 3) {
  const source = Array.isArray(items) ? items : [];

  const deduped = [];
  const seen = new Set();
  for (const item of source) {
    if (!isRealNewsItem(item)) continue;
    const key =
      String(item._id || '').trim() ||
      String(item.url || '').trim() ||
      `${String(item.title || '').trim().toLowerCase()}-${toTimestamp(item)}`;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
  }

  return deduped
    .sort((a, b) => toTimestamp(b) - toTimestamp(a))
    .slice(0, limit);
}
