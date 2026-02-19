
import React, { useEffect, useState } from 'react';
import { MediaTrack } from '../types';

interface MediaWidgetProps {
  track: MediaTrack;
  isVisible: boolean;
  language: 'en' | 'hi';
  onClose: () => void;
  onTogglePlay: () => void;
}

export const MediaWidget: React.FC<MediaWidgetProps> = ({ track, isVisible, language, onClose, onTogglePlay }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (track.isPlaying && isVisible) {
      interval = setInterval(() => {
        setProgress(prev => (prev >= 100 ? 0 : prev + 0.2));
      }, 50);
    }
    return () => clearInterval(interval);
  }, [track.isPlaying, isVisible]);

  if (!isVisible) return null;

  return (
    <div className="glass-panel absolute bottom-24 left-4 lg:left-8 w-80 h-36 rounded-2xl overflow-hidden animate-in slide-in-from-left duration-500 z-30 group border-b-4" style={{ borderColor: track.coverColor }}>
      {/* Background Ambience */}
      <div 
        className="absolute inset-0 opacity-10 transition-colors duration-1000"
        style={{ background: `radial-gradient(circle at 20% 50%, ${track.coverColor}, transparent 70%)` }}
      />

      <div className="relative z-10 p-4 flex gap-4 h-full items-center">
         {/* Album Art with Spin */}
         <div 
           className="w-20 h-20 rounded-full shadow-[0_0_20px_rgba(0,0,0,0.5)] flex-shrink-0 flex items-center justify-center relative overflow-hidden border-2 border-white/10"
           style={{ backgroundColor: '#111' }}
         >
             <div 
                className={`absolute inset-0 opacity-50 ${track.isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`}
                style={{ background: `conic-gradient(from 0deg, ${track.coverColor}, transparent, ${track.coverColor})` }}
             ></div>
             <div className="absolute inset-1 bg-slate-900 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
             </div>
         </div>

         {/* Info & Controls */}
         <div className="flex-1 flex flex-col justify-center min-w-0">
            <div className="mb-2">
               <div className="flex items-center gap-2">
                   {track.isPlaying && (
                       <div className="flex gap-0.5 h-3 items-end">
                           {[1,2,3].map(i => <div key={i} className={`w-1 bg-${track.coverColor} animate-[bounce_1s_infinite]`} style={{ backgroundColor: track.coverColor, animationDelay: `${i*0.1}s` }}></div>)}
                       </div>
                   )}
                   <h3 className="text-white font-bold truncate text-sm tracking-wide">{track.title}</h3>
               </div>
               <p className="text-slate-400 text-xs truncate font-mono">{track.artist}</p>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1 bg-slate-700/50 rounded-full mb-3 overflow-hidden">
               <div 
                 className="h-full transition-all duration-100 ease-linear shadow-[0_0_5px_currentColor]"
                 style={{ width: `${progress}%`, backgroundColor: track.coverColor, color: track.coverColor }}
               ></div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
               <button className="text-slate-400 hover:text-white transition-colors">
                   <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
               </button>
               <button 
                onClick={onTogglePlay} 
                className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
               >
                  {track.isPlaying ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                  ) : (
                      <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  )}
               </button>
               <button className="text-slate-400 hover:text-white transition-colors">
                   <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
               </button>
            </div>
         </div>
      </div>

      {/* Close Button */}
      <button onClick={onClose} className="absolute top-2 right-2 text-slate-600 hover:text-white transition-colors">
         <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
  );
};
