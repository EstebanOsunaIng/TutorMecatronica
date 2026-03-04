import React from 'react';

export default function ChatBubble({ role, text, imageUrls = [] }) {
  const isUser = role === 'user';
  const list = Array.isArray(imageUrls) ? imageUrls.filter(Boolean) : [];
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm ${
          isUser
            ? 'bg-brand-500 text-white'
            : 'border border-cyan-200 bg-cyan-100 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
        }`}
      >
        {list.length > 0 && (
          <div className={`mb-2 grid gap-2 ${list.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {list.map((imageUrl, idx) => (
              <img
                key={`${imageUrl}-${idx}`}
                src={imageUrl}
                alt={`Imagen enviada ${idx + 1}`}
                className="max-h-40 w-full rounded-xl border border-white/20 object-cover"
              />
            ))}
          </div>
        )}
        {text}
      </div>
    </div>
  );
}
