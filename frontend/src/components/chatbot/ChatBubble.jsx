import React from 'react';

export default function ChatBubble({ role, text, imageUrl = '' }) {
  const isUser = role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm ${
          isUser
            ? 'bg-brand-500 text-white'
            : 'border border-cyan-200 bg-cyan-100 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
        }`}
      >
        {imageUrl && (
          <img
            src={imageUrl}
            alt="Imagen enviada"
            className="mb-2 max-h-56 w-auto rounded-xl border border-white/20 object-contain"
          />
        )}
        {text}
      </div>
    </div>
  );
}
