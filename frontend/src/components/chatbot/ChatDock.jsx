import React, { useEffect, useState } from 'react';
import { aiApi } from '../../api/ai.api.js';
import ChatMessages from './ChatMessages.jsx';

export default function ChatDock() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hola, soy TuVir. ¿En que puedo ayudarte?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async (text, context = '') => {
    if (!text.trim() || loading) return;
    const content = text.trim();
    setMessages((prev) => [...prev, { role: 'user', text: content }]);
    setLoading(true);
    try {
      const { data } = await aiApi.chat({ message: content, context });
      setMessages((prev) => [...prev, { role: 'assistant', text: data.text }]);
    } finally {
      setLoading(false);
    }
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput('');
    await sendMessage(text, '');
  };

  useEffect(() => {
    const handler = (event) => {
      const detail = event?.detail || {};
      if (!detail.message) return;
      sendMessage(detail.message, detail.context || '');
    };
    window.addEventListener('tuvir:chat:send', handler);
    return () => window.removeEventListener('tuvir:chat:send', handler);
  }, [loading]);

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-sky-50/90 to-cyan-50/70 dark:bg-slate-950 dark:bg-none">
      <div className="border-b border-cyan-100/80 p-4 dark:border-slate-800">
        <h3 className="text-sm font-bold uppercase tracking-widest text-brand-700 dark:text-brand-300">Chat TuVir</h3>
      </div>
      <ChatMessages messages={messages} loading={loading} />
      <div className="border-t border-cyan-100/80 p-4 dark:border-slate-800">
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-lg border border-cyan-100 bg-white/90 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-brand-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            placeholder="Pregunta sobre robotica, humanoides, etc..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => (e.key === 'Enter' ? send() : null)}
          />
          <button
            onClick={send}
            className="rounded-lg bg-brand-500 px-3 py-2 text-xs font-bold text-white"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
