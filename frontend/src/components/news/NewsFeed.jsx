import React from 'react';
import NewsCard from './NewsCard.jsx';

export default function NewsFeed({ items }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((item) => (
        <NewsCard key={item._id} item={item} />
      ))}
    </div>
  );
}
