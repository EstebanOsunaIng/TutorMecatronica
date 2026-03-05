import React from 'react';
import NewsCard from './NewsCard.jsx';

export default function NewsFeed({ items }) {
  const safeItems = Array.isArray(items) ? items : [];
  if (!safeItems.length) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {safeItems.map((item, idx) => (
        <NewsCard key={item._id || `${item.url || item.title}-${item.date || item.publishedAt || idx}`} item={item} />
      ))}
    </div>
  );
}
