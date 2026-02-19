
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, SkipBack, SkipForward, Play, Pause, X } from 'lucide-react';
import { MediaTrack } from '../types';

interface MediaWidgetProps {
  track: MediaTrack;
  isVisible: boolean;
  language: 'en' | 'hi';
  onClose: () => void;
  onTogglePlay: () => void;
}

const getAccentClass = (hex: string) => {
  const map: Record<string, string> = {
    '#8b5cf6': 'accent-violet',
    '#06b6d4': 'accent-cyan',
    '#f59e0b': 'accent-amber',
    '#ef4444': 'accent-red',
    '#10b981': 'accent-emerald',
    '#ec4899': 'accent-pink'
  };
  return map[hex.toLowerCase()] || 'accent-violet';
};

export const MediaWidget: React.FC<MediaWidgetProps> = React.memo(({ track, isVisible, language, onClose, onTogglePlay }) => {
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

  const accentClass = getAccentClass(track.coverColor || '#8b5cf6');

  return (
    <motion.div
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -100, opacity: 0 }}
      className={`glass-panel absolute bottom-24 left-4 lg:left-8 w-80 h-40 rounded-3xl overflow-hidden z-30 group border-b-2 accent-border ${accentClass} shadow-[0_20px_50px_rgba(0,0,0,0.5)]`}
    >
      {/* Background Ambience Bloom */}
      <div
        className={`absolute inset-0 opacity-5 transition-colors duration-1000 accent-bg ${accentClass}`}
      />

      <div className="relative z-10 p-5 flex gap-5 h-full items-center">
        {/* Album Art with Spin */}
        <div className="relative flex-shrink-0">
          <motion.div
            animate={{ rotate: track.isPlaying ? 360 : 0 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className={`w-24 h-24 rounded-full shadow-2xl flex items-center justify-center relative overflow-hidden border-2 border-white/5 bg-slate-900 group-hover:scale-110 transition-transform duration-500`}
          >
            <div className={`absolute inset-0 opacity-20 accent-bg ${accentClass}`}></div>
            <div className="absolute inset-2 bg-black rounded-full flex items-center justify-center border border-white/10">
              <Music className={`w-10 h-10 text-white/20 ${track.isPlaying ? 'animate-pulse' : ''}`} />
            </div>
            {/* Center hole */}
            <div className="absolute w-4 h-4 bg-slate-800 rounded-full border border-white/20 z-20"></div>
          </motion.div>

          {/* Status Indicator */}
          {track.isPlaying && (
            <div className="absolute -bottom-1 -right-1 flex gap-0.5 h-4 items-end bg-black/60 p-1.5 rounded-full backdrop-blur-md border border-white/10">
              {[1, 2, 3].map(i => (
                <motion.div
                  key={i}
                  animate={{ height: [4, 10, 4] }}
                  transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
                  className={`w-0.5 accent-bg ${accentClass} rounded-full`}
                ></motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Info & Controls */}
        <div className="flex-1 flex flex-col justify-center min-w-0">
          <div className="mb-3">
            <h3 className="text-white font-black truncate text-[13px] tracking-tight uppercase leading-none">{track.title}</h3>
            <p className="text-slate-500 text-[10px] truncate font-mono uppercase mt-1 opacity-60 tracking-widest">{track.artist}</p>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1 bg-white/5 rounded-full mb-5 overflow-hidden p-[0.5px]">
            <motion.div
              className={`h-full rounded-full accent-bg accent-glow ${accentClass}`}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "linear", duration: 0.05 }}
            ></motion.div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between px-2">
            <button title="Previous Track" className="text-slate-500 hover:text-white transition-all transform active:scale-75">
              <SkipBack className="w-4 h-4 fill-current" />
            </button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onTogglePlay}
              title={track.isPlaying ? "Pause" : "Play"}
              className={`w-11 h-11 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all`}
            >
              {track.isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </motion.button>

            <button title="Next Track" className="text-slate-500 hover:text-white transition-all transform active:scale-75">
              <SkipForward className="w-4 h-4 fill-current" />
            </button>
          </div>
        </div>
      </div>

      <button onClick={onClose} title="Close Player" className="absolute top-4 right-4 text-slate-600 hover:text-white transition-all hover:rotate-90">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
});
