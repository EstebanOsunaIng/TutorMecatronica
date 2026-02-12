import React from 'react';
import NewsCard from './NewsCard.jsx';

export default function NewsFeed({ items }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <NewsCard key={item._id} item={item} />
      ))}
    </div>
  );
}
