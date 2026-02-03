
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { getTutorResponse } from '../services/geminiService';

interface ChatbotProps {
  externalPrompt?: string;
  onPromptConsumed?: () => void;
}

const Chatbot: React.FC<ChatbotProps> = ({ externalPrompt, onPromptConsumed }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'model', text: '¡Hola! Soy TuVir, tu asistente de mecatrónica. ¿En qué concepto técnico te gustaría profundizar hoy?', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle external prompts (e.g., from the "Dudas" button)
  useEffect(() => {
    if (externalPrompt) {
      handleSend(externalPrompt);
      if (onPromptConsumed) onPromptConsumed();
    }
  }, [externalPrompt]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const history = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    const response = await getTutorResponse(text, history);
    
    const botMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: response || '', timestamp: new Date() };
    setMessages(prev => [...prev, botMsg]);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#111c22] rounded-2xl border border-[#233c48] overflow-hidden shadow-2xl">
      <div className="p-4 border-b border-[#233c48] flex justify-between items-center bg-[#1b2a33]/50">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-full bg-primary-500 flex items-center justify-center text-white shadow-lg shadow-primary-500/20">
            <span className="material-symbols-outlined text-sm">smart_toy</span>
          </div>
          <div>
            <h3 className="text-white text-sm font-bold uppercase tracking-wider">TuVir AI Assistant</h3>
            <p className="text-emerald-400 text-[10px] font-bold">Online • Mecatrónica Expert</p>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user' 
              ? 'bg-primary-500 text-white rounded-tr-none' 
              : 'bg-[#1b2a33] text-slate-200 border border-[#233c48] rounded-tl-none'
            }`}>
              <p>{msg.text}</p>
              <span className={`text-[9px] mt-1 block ${msg.role === 'user' ? 'text-primary-100' : 'text-slate-500'}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#1b2a33] p-3 rounded-2xl rounded-tl-none border border-[#233c48] flex gap-1 items-center">
              <div className="size-1 bg-primary-400 rounded-full animate-bounce"></div>
              <div className="size-1 bg-primary-400 rounded-full animate-bounce delay-100"></div>
              <div className="size-1 bg-primary-400 rounded-full animate-bounce delay-200"></div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-[#233c48] bg-[#111c22]">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Pregunta sobre servomotores, Arduino..."
            className="w-full bg-[#1b2a33] text-white placeholder-slate-500 border border-[#233c48] rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all shadow-inner text-sm"
          />
          <button 
            onClick={() => handleSend()}
            disabled={isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary-500 hover:bg-primary-400 rounded-lg text-white transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-lg">send</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
