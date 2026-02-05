import React from 'react';

export default function ChatBubble({ role, text }) {
  const isUser = role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
          isUser ? 'bg-brand-500 text-white' : 'bg-slate-900 text-slate-200'
        }`}
      >
        {text}
      </div>
    </div>
  );
}
