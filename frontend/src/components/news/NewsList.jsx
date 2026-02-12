import React, { useMemo, useState } from 'react';

const fallbackByCategory = {
  mecatronica: '/assets/mecatronica.png',
  robotica: '/assets/robotica.png',
  humanoides: '/assets/humanoide.png',
  humanoide: '/assets/humanoide.png',
  ingenieria: '/assets/ingenieria.png',
  unitree: '/assets/unitree.png'
};

function normalizeCategory(category) {
  if (!category) return '';
  return category
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '');
}

function NewsImage({ item }) {
  const normalized = normalizeCategory(item.category);
  const fallback = fallbackByCategory[normalized] || '/assets/mecatronica.png';
  const [src, setSrc] = useState(item.imageUrl || fallback);

  return (
    <img
      src={src}
      alt={item.title}
      loading="lazy"
      onError={() => {
        if (src !== fallback) setSrc(fallback);
      }}
      className="h-40 w-full rounded-2xl object-cover md:h-36 md:w-56"
    />
  );
}

function NewsCard({ item }) {
  const Wrapper = item.url ? 'a' : 'div';
  return (
    <Wrapper
      href={item.url || undefined}
      target={item.url ? '_blank' : undefined}
      rel={item.url ? 'noopener noreferrer' : undefined}
      className="group flex flex-col gap-4 rounded-2xl border border-slate-800/10 bg-white/95 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800/70 dark:bg-slate-900/40 md:flex-row md:items-center"
    >
      <div className="w-full md:w-56">
        <NewsImage item={item} />
      </div>
      <div className="flex-1">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-sky-500/80 dark:text-sky-300/80">
          <span>{item.category}</span>
          <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
          <span>{new Date(item.date).toLocaleDateString()}</span>
        </div>
        <h4 className="text-lg font-bold text-slate-900 transition group-hover:text-sky-600 dark:text-white dark:group-hover:text-sky-200">
          {item.title}
        </h4>
        <p className="mt-2 text-sm text-slate-600 line-clamp-3 dark:text-slate-300">
          {item.summary}
        </p>
        {item.url ? (
          <div className="mt-3 text-xs font-semibold text-sky-500 dark:text-sky-300">Abrir noticia →</div>
        ) : null}
      </div>
    </Wrapper>
  );
}

export default function NewsList({ items, limit = 10 }) {
  const limited = useMemo(() => items.slice(0, limit), [items, limit]);
  return (
    <div className="space-y-4">
      {limited.map((item) => (
        <NewsCard key={item._id} item={item} />
      ))}
    </div>
  );
}
