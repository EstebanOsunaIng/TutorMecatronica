import React, { useEffect, useRef, useState } from 'react';
import { ArrowUp, Mic } from 'lucide-react';
import { aiApi } from '../../api/ai.api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import ChatMessages from './ChatMessages.jsx';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
    reader.readAsDataURL(file);
  });
}

export default function ChatDock() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageError, setImageError] = useState('');
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceError, setVoiceError] = useState('');

  const activeSessionIdRef = useRef(null);
  const loadingRef = useRef(false);
  const imageInputRef = useRef(null);
  const inputRef = useRef(null);
  const attachMenuRef = useRef(null);
  const recognitionRef = useRef(null);
  const dictationBaseRef = useRef('');
  const dictationFinalRef = useRef('');
  useEffect(() => {
    activeSessionIdRef.current = activeSessionId;
  }, [activeSessionId]);
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  const greeting = `Hola, ${user?.name || 'Usuario'}, soy TuVir. ¿En que puedo ayudarte?`;

  const loadHistory = async () => {
    try {
      const res = await aiApi.history();
      setHistory(res.data?.sessions || []);
    } catch (error) {
      setHistory([]);
    }
  };

  const clearSelectedImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview('');
    setImageFile(null);
    setImageError('');
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const getSpeechRecognitionCtor = () => {
    if (typeof window === 'undefined') return null;
    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
  };

  const stopVoiceRecognition = () => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    recognition.stop();
    recognitionRef.current = null;
    setIsRecording(false);
  };

  const startVoiceRecognition = () => {
    const Recognition = getSpeechRecognitionCtor();
    if (!Recognition) {
      setVoiceError('Tu navegador no soporta dictado por voz. Usa Chrome o Edge.');
      return;
    }

    setVoiceError('');
    dictationBaseRef.current = input ? `${input} ` : '';
    dictationFinalRef.current = '';

    const recognition = new Recognition();
    recognition.lang = 'es-CO';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const part = String(event.results[i]?.[0]?.transcript || '').trim();
        if (!part) continue;
        if (event.results[i].isFinal) {
          dictationFinalRef.current += `${part} `;
        } else {
          interim += `${part} `;
        }
      }
      setInput(`${dictationBaseRef.current}${dictationFinalRef.current}${interim}`.trim());
    };

    recognition.onerror = (event) => {
      const code = String(event?.error || '');
      if (code === 'not-allowed') {
        setVoiceError('No se concedio permiso al microfono.');
      } else if (code === 'no-speech') {
        setVoiceError('No se detecto voz. Intenta de nuevo.');
      } else {
        setVoiceError('No pude usar el microfono en este momento.');
      }
      setIsRecording(false);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setIsRecording(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const toggleVoiceRecognition = () => {
    if (isRecording) {
      stopVoiceRecognition();
      return;
    }
    startVoiceRecognition();
  };

  const validateImage = (file) => {
    if (!file) return 'No se selecciono imagen';
    if (!IMAGE_MIME_TYPES.includes(file.type)) return 'Formato no permitido. Usa JPG, PNG o WEBP';
    if (file.size > MAX_IMAGE_BYTES) return 'La imagen supera el maximo de 10MB';
    return '';
  };

  const selectImageFile = (file) => {
    const error = validateImage(file);
    if (error) {
      clearSelectedImage();
      setImageError(error);
      return false;
    }
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    const preview = URL.createObjectURL(file);
    setImageFile(file);
    setImagePreview(preview);
    setImageError('');
    return true;
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;
    selectImageFile(file);
  };

  const handlePaste = (e) => {
    const items = Array.from(e?.clipboardData?.items || []);
    const imageItem = items.find((item) => String(item?.type || '').startsWith('image/'));
    if (!imageItem) return;
    const file = imageItem.getAsFile();
    if (!file) return;
    e.preventDefault();
    selectImageFile(file);
  };

  const sendMessage = async (text, context = '', sessionIdOverride = undefined, meta = {}, media = null) => {
    const content = String(text || '').trim();
    const hasImage = Boolean(media?.file);
    if ((!content && !hasImage) || loadingRef.current) return;

    const userText = content || 'Analiza esta imagen y guiame paso a paso.';
    setMessages((prev) => [...prev, { role: 'user', text: userText, imageUrl: media?.messageImageUrl || '' }]);
    setLoading(true);
    try {
      const sid = sessionIdOverride !== undefined ? sessionIdOverride : activeSessionIdRef.current;
      const { data } = await aiApi.chat({
        message: content,
        context,
        sessionId: sid,
        moduleId: meta?.moduleId,
        levelId: meta?.levelId,
        imageFile: media?.file || null
      });
      if (data?.sessionId) setActiveSessionId(String(data.sessionId));
      setMessages((prev) => [...prev, { role: 'assistant', text: data.text }]);
      await loadHistory();
    } catch (error) {
      const msg = error?.response?.data?.error || 'No pude analizar la imagen en este momento.';
      setMessages((prev) => [...prev, { role: 'assistant', text: msg }]);
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
    clearSelectedImage();
  };

  const deleteConversation = async (sessionId) => {
    try {
      await aiApi.deleteHistory(sessionId);
      if (String(activeSessionIdRef.current || '') === String(sessionId)) {
        startNewConversation();
      }
      await loadHistory();
    } catch (e) {
      // ignore
    }
  };

  const send = async () => {
    if ((!input.trim() && !imageFile) || loading) return;
    if (isRecording) stopVoiceRecognition();
    const text = input.trim();
    const messageImageUrl = imageFile ? await fileToDataUrl(imageFile).catch(() => '') : '';
    const media = imageFile ? { file: imageFile, messageImageUrl } : null;
    setInput('');
    clearSelectedImage();
    await sendMessage(text, '', undefined, {}, media);
  };

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const next = Math.min(el.scrollHeight, 160);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > 160 ? 'auto' : 'hidden';
  }, [input]);

  useEffect(() => {
    // Always start a new conversation when the user session starts.
    startNewConversation();
    loadHistory();
  }, [user?._id]);

  useEffect(() => {
    const handler = (event) => {
      const detail = event?.detail || {};
      if (!detail.message) return;
      sendMessage(detail.message, detail.context || '', activeSessionIdRef.current, {
        moduleId: detail.moduleId,
        levelId: detail.levelId
      });
    };
    window.addEventListener('tuvir:chat:send', handler);
    return () => window.removeEventListener('tuvir:chat:send', handler);
  }, []);

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (!attachMenuRef.current) return;
      if (attachMenuRef.current.contains(event.target)) return;
      setAttachMenuOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, []);

  useEffect(() => () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
  }, [imagePreview]);

  useEffect(() => () => {
    stopVoiceRecognition();
  }, []);

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
              <div
                key={session._id}
                role="button"
                tabIndex={0}
                onClick={() => openHistorySession(session._id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') openHistorySession(session._id);
                }}
                className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-left transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
              >
                <span className="min-w-0 truncate text-xs font-semibold text-slate-700 dark:text-slate-200">{session.title}</span>
                <span className="ml-2 flex shrink-0 items-center gap-2">
                  <span className="text-[10px] text-slate-400">
                    {new Date(session.updatedAt).toLocaleDateString()}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      deleteConversation(session._id);
                    }}
                    className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Eliminar
                  </button>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      <ChatMessages messages={messages} loading={loading} />
      <div className="border-t border-[color:var(--light-divider)] px-4 pb-5 pt-3 dark:border-slate-800">
        {imagePreview && (
          <div className="mb-2 rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-900/60">
            <div className="mb-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-300">
              <span>Imagen adjunta</span>
              <button type="button" onClick={clearSelectedImage} className="font-bold text-red-600 dark:text-red-300">Quitar</button>
            </div>
            <img src={imagePreview} alt="Vista previa" className="max-h-40 rounded-lg object-contain" />
          </div>
        )}

        {imageError && <div className="mb-2 text-xs font-semibold text-red-600 dark:text-red-300">{imageError}</div>}
        {voiceError && <div className="mb-2 text-xs font-semibold text-red-600 dark:text-red-300">{voiceError}</div>}
        {isRecording && <div className="mb-2 text-xs font-semibold text-emerald-600 dark:text-emerald-300">Escuchando... habla para dictar.</div>}

        <div className="mb-2 rounded-2xl border border-[color:var(--light-divider)] bg-white/90 p-2 dark:border-slate-700 dark:bg-slate-900/85">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleImageChange}
          />
          <textarea
            ref={inputRef}
            rows={1}
            wrap="hard"
            className="max-h-44 min-h-[92px] w-full resize-none overflow-x-hidden whitespace-pre-wrap break-all bg-transparent px-3 pb-3 pr-3 pt-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 dark:text-white"
            placeholder="Pregunta sobre robotica, humanoides, etc..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPaste={handlePaste}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <div className="mt-2 flex items-center justify-end gap-2">
            <div className="relative" ref={attachMenuRef}>
              <button
                type="button"
                onClick={() => setAttachMenuOpen((prev) => !prev)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-lg leading-none text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                title="Adjuntar"
              >
                +
              </button>
              {attachMenuOpen && (
                <div className="absolute bottom-12 right-0 z-20 w-36 rounded-xl border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                  <button
                    type="button"
                    onClick={() => {
                      setAttachMenuOpen(false);
                      imageInputRef.current?.click();
                    }}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Imagen
                  </button>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={toggleVoiceRecognition}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border ${
                isRecording
                  ? 'border-emerald-500 bg-emerald-500 text-white'
                  : 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
              }`}
              title={isRecording ? 'Detener microfono' : 'Usar microfono'}
            >
              <Mic className="h-4 w-4" />
            </button>
            <button
              onClick={send}
              disabled={loading || (!input.trim() && !imageFile)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500 text-white disabled:opacity-60"
              title="Enviar"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
