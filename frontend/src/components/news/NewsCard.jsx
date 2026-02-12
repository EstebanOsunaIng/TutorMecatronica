import React from 'react';

const FALLBACK_BY_CATEGORY = {
  Innovación: '/assets/news/innovacion.svg',
  Innovacion: '/assets/news/innovacion.svg',
  'Inteligencia Artificial': '/assets/news/ia.svg',
  IA: '/assets/news/ia.svg',
  Robótica: '/assets/news/robotica.svg',
  Robotica: '/assets/news/robotica.svg',
  Humanoides: '/assets/news/humanoides.svg',
  Mecatrónica: '/assets/news/robotica.svg',
  Mecatronica: '/assets/news/robotica.svg'
};

function relativeTime(dateValue) {
  if (!dateValue) return '';
  const t = new Date(dateValue).getTime();
  if (!Number.isFinite(t)) return '';
  const diff = Date.now() - t;
  if (diff < 60 * 1000) return 'Hace instantes';
  if (diff < 60 * 60 * 1000) return `Hace ${Math.floor(diff / (60 * 1000))} min`;
  if (diff < 24 * 60 * 60 * 1000) return `Hace ${Math.floor(diff / (60 * 60 * 1000))} horas`;
  return `Hace ${Math.floor(diff / (24 * 60 * 60 * 1000))} dias`;
}

function pickFallback(category) {
  const key = String(category || '').trim();
  return FALLBACK_BY_CATEGORY[key] || '/assets/news/default.svg';
}

export default function NewsCard({ item }) {
  const Wrapper = item.url ? 'a' : 'div';
  const image = item.imageUrl || item.image || item.thumbnail || '';
  const fallback = pickFallback(item.category);
  return (
    <Wrapper
      href={item.url || undefined}
      target={item.url ? '_blank' : undefined}
      rel={item.url ? 'noopener noreferrer' : undefined}
      className="group block overflow-hidden rounded-2xl border border-cyan-100 bg-white/90 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50"
    >
      <div className="relative">
        <img
          src={image || fallback}
          alt={item.title}
          className="h-40 w-full object-cover"
          loading="lazy"
          onError={(e) => {
            if (e.currentTarget.src.endsWith(fallback)) return;
            e.currentTarget.src = fallback;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent dark:from-slate-950/55" />
        <div className="absolute bottom-3 left-3">
          <span className="inline-flex items-center rounded-full bg-[#1d4f91] px-3 py-1 text-xs font-bold text-white shadow-sm">
            {item.category || 'Noticia'}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h4 className="text-base font-extrabold text-slate-900 group-hover:text-[#1d4f91] dark:text-white dark:group-hover:text-sky-200">
          {item.title}
        </h4>
        <div className="mt-2 text-sm text-slate-600 dark:text-slate-300 line-clamp-3">{item.summary}</div>
        <div className="mt-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
          {relativeTime(item.date) || new Date(item.date).toLocaleDateString()} {item.url ? '• Abrir' : ''}
        </div>
      </div>
    </Wrapper>
  );
}
