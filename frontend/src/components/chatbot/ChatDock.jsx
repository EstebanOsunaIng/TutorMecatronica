import React, { useEffect, useState } from 'react';
import { aiApi } from '../../api/ai.api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import ChatMessages from './ChatMessages.jsx';

export default function ChatDock() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  const greeting = `Hola, ${user?.name || 'Usuario'}, soy TuVir. ¿En que puedo ayudarte?`;

  const loadHistory = async () => {
    try {
      const res = await aiApi.history();
      setHistory(res.data?.sessions || []);
    } catch (error) {
      setHistory([]);
    }
  };

  const sendMessage = async (text, context = '') => {
    if (!text.trim() || loading) return;
    const content = text.trim();
    setMessages((prev) => [...prev, { role: 'user', text: content }]);
    setLoading(true);
    try {
      const { data } = await aiApi.chat({ message: content, context, sessionId: activeSessionId });
      if (data?.sessionId) setActiveSessionId(String(data.sessionId));
      setMessages((prev) => [...prev, { role: 'assistant', text: data.text }]);
      await loadHistory();
    } finally {
      setLoading(false);
    }
  };

  const openHistorySession = async (sessionId) => {
    try {
      const { data } = await aiApi.historyById(sessionId);
      const session = data?.session;
      if (!session) return;
      setActiveSessionId(String(session._id));
      setMessages(session.messages || []);
      setShowHistory(false);
    } catch (error) {
      // ignore
    }
  };

  const startNewConversation = () => {
    setActiveSessionId(null);
    setMessages([{ role: 'assistant', text: greeting }]);
    setShowHistory(false);
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput('');
    await sendMessage(text, '');
  };

  useEffect(() => {
    setMessages([{ role: 'assistant', text: greeting }]);
    loadHistory();
  }, [user?._id]);

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
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-[color:var(--light-divider)] bg-white/95 shadow-lg dark:border-slate-700 dark:bg-slate-900/95">
      <div className="border-b border-[color:var(--light-divider)] p-4 dark:border-slate-800">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold uppercase tracking-widest text-brand-700 dark:text-brand-300">Chat TuVir</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={startNewConversation}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Nuevo
            </button>
            <button
              type="button"
              onClick={() => setShowHistory((prev) => !prev)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Historial
            </button>
          </div>
        </div>
      </div>
      {showHistory && (
      <div className="border-b border-[color:var(--light-divider)] bg-white/70 p-3 dark:border-slate-800 dark:bg-slate-900/40">
          <div className="max-h-40 space-y-2 overflow-y-auto">
            {history.length === 0 && (
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                Sin conversaciones previas.
              </div>
            )}
            {history.map((session) => (
              <button
                type="button"
                key={session._id}
                onClick={() => openHistorySession(session._id)}
                className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-left transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
              >
                <span className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">{session.title}</span>
                <span className="ml-2 shrink-0 text-[10px] text-slate-400">
                  {new Date(session.updatedAt).toLocaleDateString()}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
      <ChatMessages messages={messages} loading={loading} />
      <div className="border-t border-[color:var(--light-divider)] p-4 dark:border-slate-800">
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-lg border border-[color:var(--light-divider)] bg-white/90 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-brand-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
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
