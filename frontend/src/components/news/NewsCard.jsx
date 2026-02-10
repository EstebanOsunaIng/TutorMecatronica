import React from 'react';

export default function NewsCard({ item }) {
  const Wrapper = item.url ? 'a' : 'div';
  return (
    <Wrapper
      href={item.url || undefined}
      target={item.url ? '_blank' : undefined}
      rel={item.url ? 'noopener noreferrer' : undefined}
      className="block rounded-xl border border-slate-200 bg-slate-100/90 p-4 transition hover:border-brand-500/40 dark:border-slate-800 dark:bg-slate-900/40"
    >
      {item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt={item.title}
          className="mb-3 h-40 w-full rounded-lg object-cover"
          loading="lazy"
        />
      ) : null}
      <div className="mb-2 text-xs uppercase tracking-widest text-[#173f74] dark:text-brand-300">{item.category}</div>
      <h4 className="text-lg font-bold text-[#173f74] dark:text-white">{item.title}</h4>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 line-clamp-4">{item.summary}</p>
      <div className="mt-3 text-xs text-slate-600 dark:text-slate-500">
        {new Date(item.date).toLocaleDateString()} {item.url ? '• Abrir noticia' : ''}
      </div>
    </Wrapper>
  );
}
