
import React, { useState } from 'react';
import { Lesson } from '../types';

interface LessonPlayerProps {
  lesson: Lesson | undefined;
  onComplete: () => void;
  onAskTutor: (context: string) => void;
}

const LessonPlayer: React.FC<LessonPlayerProps> = ({ lesson, onComplete, onAskTutor }) => {
  const [isBouncing, setIsBouncing] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  if (!lesson) {
    return (
      <div className="h-full border-2 border-dashed border-[#233c48] rounded-[2.5rem] flex flex-col items-center justify-center text-slate-500 gap-4">
        <span className="material-symbols-outlined text-7xl opacity-10">smart_toy</span>
        <p className="uppercase tracking-widest text-xs font-black">Cargando lección...</p>
      </div>
    );
  }

  const handleDownloadPDF = () => {
    const content = `
      Universitaria de Colombia - Facultad de Mecatrónica
      MATERIAL DE ESTUDIO: ${lesson.title.toUpperCase()}
      
      Contenido de la Lección:
      ${lesson.content}
      
      Recursos Adicionales:
      - Link: ${lesson.externalLink || 'N/A'}
      - Video: ${lesson.videoUrl || 'N/A'}
    `;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Material_${lesson.title.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAskContextual = () => {
    const context = `Hola TuVir, estoy estudiando el paso "${lesson.title}" (${lesson.type}). El contenido es: "${lesson.content.substring(0, 150)}...". ¿Podrías ayudarme a entenderlo mejor?`;
    onAskTutor(context);
  };

  const handleCompleteClick = () => {
    if (lesson.completed) return;
    setIsBouncing(true);
    setShowFeedback(true);
    onComplete();
    setTimeout(() => setIsBouncing(false), 600);
    setTimeout(() => setShowFeedback(false), 2000);
  };

  return (
    <div className="bg-[#1b2a33] border border-[#233c48] rounded-2xl flex flex-col h-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
      {/* Multimedia Area */}
      <div className="aspect-video w-full bg-[#0a1114] relative group shrink-0 overflow-hidden">
        {lesson.videoUrl ? (
          <div className="w-full h-full">
            {lesson.videoUrl.includes('youtube.com') || lesson.videoUrl.includes('youtu.be') ? (
              <iframe 
                className="w-full h-full"
                src={lesson.videoUrl.replace('watch?v=', 'embed/')} 
                title="Lesson Video"
                allowFullScreen
              />
            ) : (
              <video src={lesson.videoUrl} controls className="w-full h-full object-contain" />
            )}
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-t from-[#0a1114] to-[#111c22]">
            <span className="material-symbols-outlined text-6xl text-primary-500/20">
              {lesson.type === 'video' ? 'movie' : lesson.type === 'interactive' ? 'extension' : 'article'}
            </span>
            <p className="mt-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{lesson.title}</p>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-8 prose prose-invert prose-sm max-w-none">
        <div className="flex justify-between items-start mb-6 not-prose">
          <h1 className="text-2xl font-black text-white m-0 tracking-tighter italic">{lesson.title}</h1>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-primary-500/10 border border-primary-500/20 text-primary-400 rounded-lg text-[10px] font-bold uppercase tracking-widest">
              {lesson.type}
            </span>
          </div>
        </div>

        <div className="space-y-6 text-slate-300 leading-relaxed whitespace-pre-wrap">
          {lesson.content}
        </div>

        {/* Dynamic Images Gallery */}
        {lesson.images && lesson.images.length > 0 && (
          <div className="mt-10 grid grid-cols-2 gap-4 not-prose">
            {lesson.images.map((img, idx) => (
              <img 
                key={idx} 
                src={img} 
                alt={`Resource ${idx}`} 
                className="rounded-xl border border-[#233c48] w-full h-40 object-cover hover:scale-105 transition-transform cursor-zoom-in"
              />
            ))}
          </div>
        )}

        {/* Link Button if exists */}
        {lesson.externalLink && (
          <div className="mt-8 not-prose">
            <a 
              href={lesson.externalLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-primary-500/10 border border-primary-500/30 text-primary-400 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-500 hover:text-white transition-all"
            >
              <span className="material-symbols-outlined text-sm">open_in_new</span>
              Ver recurso externo
            </a>
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="p-6 border-t border-[#233c48] bg-[#111c22] flex justify-between items-center shrink-0">
        <div className="flex gap-2">
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors bg-[#1b2a33] rounded-lg border border-[#233c48]">
            <span className="material-symbols-outlined text-sm">download</span> PDF
          </button>
          <button onClick={handleAskContextual} className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors bg-[#1b2a33] rounded-lg border border-[#233c48]">
            <span className="material-symbols-outlined text-sm">smart_toy</span> Ayuda
          </button>
        </div>
        
        <div className="relative">
          {showFeedback && (
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] font-black uppercase px-4 py-1.5 rounded-full shadow-2xl animate-fade-up-out whitespace-nowrap z-50 flex items-center gap-2 border border-emerald-400">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              ¡Lección lista!
            </div>
          )}
          <button 
            onClick={handleCompleteClick}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              isBouncing ? 'animate-bounce' : ''
            } ${
              lesson.completed 
              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 cursor-default shadow-none' 
              : 'bg-primary-500 text-white shadow-lg shadow-primary-500/20 hover:scale-105 active:scale-95'
            }`}
          >
            {lesson.completed ? 'Completado ✓' : 'Completar Paso'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LessonPlayer;
