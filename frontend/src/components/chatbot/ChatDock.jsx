import React, { useState } from 'react';
import { aiApi } from '../../api/ai.api.js';
import ChatMessages from './ChatMessages.jsx';

export default function ChatDock() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hola, soy TuVir. ¿En que puedo ayudarte?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setLoading(true);
    try {
      const { data } = await aiApi.chat({ message: text, context: '' });
      setMessages((prev) => [...prev, { role: 'assistant', text: data.text }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-slate-950">
      <div className="border-b border-slate-800 p-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-brand-300">Chat TuVir</h3>
      </div>
      <ChatMessages messages={messages} loading={loading} />
      <div className="border-t border-slate-800 p-4">
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-lg bg-slate-900 px-3 py-2 text-sm text-white"
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
