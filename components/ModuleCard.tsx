
import React from 'react';
import { Module } from '../types';

interface ModuleCardProps {
  module: Module;
  onClick: () => void;
}

const ModuleCard: React.FC<ModuleCardProps> = ({ module, onClick }) => {
  const diffColor = {
    'Básico': 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    'Intermedio': 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    'Avanzado': 'text-red-400 bg-red-400/10 border-red-400/20'
  }[module.difficulty];

  // Map categories to specific high-quality mechatronics images
  const getCategoryImage = (category: string) => {
    const images: Record<string, string> = {
      'Robótica': 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800',
      'Electrónica': 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?auto=format&fit=crop&q=80&w=800',
      'Diseño': 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=800',
      'Programación': 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&q=80&w=800',
      'General': 'https://images.unsplash.com/photo-1581092334651-ddf26d9a1930?auto=format&fit=crop&q=80&w=800'
    };
    return images[category] || images['General'];
  };

  const isHighProgress = module.progress > 75;
  const isMastered = module.progress >= 90;

  return (
    <div 
      onClick={onClick}
      className="bg-[#1b2a33] border border-[#233c48] rounded-[2rem] overflow-hidden hover:border-primary-500/50 hover:shadow-2xl hover:shadow-primary-500/10 transition-all cursor-pointer group flex flex-col h-full shadow-lg"
    >
      {/* Module Image Header - Restored as requested */}
      <div className="relative aspect-video overflow-hidden shrink-0">
        <img 
          src={getCategoryImage(module.category)} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
          alt={module.title}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1b2a33] via-transparent to-transparent opacity-60" />
        
        <div className="absolute top-4 left-4">
          <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border backdrop-blur-md ${diffColor}`}>
            {module.difficulty}
          </span>
        </div>
      </div>

      <div className="p-7 flex flex-col flex-1 relative z-10">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-white font-black text-xl group-hover:text-primary-400 transition-colors leading-tight italic tracking-tight flex-1">
            {module.title}
          </h3>
          <span className="text-primary-400 text-[9px] font-black uppercase tracking-[0.2em] bg-primary-500/5 border border-primary-500/10 px-2 py-1 rounded-md ml-2 shrink-0">
            {module.category}
          </span>
        </div>

        <p className="text-slate-400 text-xs mb-8 line-clamp-3 leading-relaxed font-medium">
          {module.description}
        </p>

        <div className="mt-auto pt-5 border-t border-[#233c48]/50">
          <div className="flex justify-between items-center mb-3">
            <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest">Estado de Avance</span>
            <div className="flex items-center gap-1.5">
              {isMastered && (
                <span className="material-symbols-outlined text-xs text-yellow-400 fill-1 animate-pulse">stars</span>
              )}
              <span className={`text-xs font-black ${isMastered ? 'text-yellow-400' : 'text-primary-400'}`}>
                {module.progress}%
              </span>
            </div>
          </div>
          
          <div className="h-2 bg-[#111c22] rounded-full overflow-hidden p-0.5 border border-[#233c48]">
            <div 
              className={`h-full transition-all duration-1000 ease-out rounded-full bg-gradient-to-r ${
                isMastered 
                  ? 'from-yellow-600 via-yellow-400 to-yellow-200' 
                  : 'from-primary-600 via-primary-500 to-primary-300'
              }`}
              style={{ 
                width: `${module.progress}%`,
                boxShadow: isHighProgress 
                  ? `0 0 15px ${isMastered ? 'rgba(250,204,21,0.5)' : 'rgba(19,164,236,0.5)'}` 
                  : 'none'
              }}
            />
          </div>
          
          <div className="mt-6 flex items-center justify-between text-slate-500 text-[10px] font-black uppercase tracking-[0.15em]">
            <div className="flex items-center gap-2">
              <span className={`material-symbols-outlined text-base ${isMastered ? 'text-yellow-400' : 'text-primary-500'}`}>
                {isMastered ? 'verified' : 'analytics'}
              </span>
              {module.lessons.length} Pasos técnicos
            </div>
            <div className="flex items-center gap-1 group-hover:text-white transition-colors">
              Iniciar <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuleCard;
