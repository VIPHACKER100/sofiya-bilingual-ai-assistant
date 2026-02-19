
import React from 'react';
import { motion } from 'framer-motion';

interface ArcReactorProps {
  isActive: boolean;
  onClick: () => void;
  language: 'en' | 'hi';
  color: string; // Hex color code
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

export const ArcReactor = React.memo(({ isActive, onClick, language, color }: ArcReactorProps) => {
  const accentClass = getAccentClass(color);

  return (
    <div className={`relative flex items-center justify-center group w-80 h-80 accent-text ${accentClass}`}>
      {/* Dynamic Ambient Glow */}
      <motion.div
        animate={{
          scale: isActive ? [1, 1.2, 1] : 1,
          opacity: isActive ? 0.2 : 0.05
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className={`absolute rounded-full mix-blend-screen accent-bg ${accentClass} blur-[60px] w-full h-full`}
      />

      {/* SVG Structure */}
      <div className="relative w-72 h-72 pointer-events-none z-0">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          {/* Static Base Ring */}
          <circle cx="100" cy="100" r="98" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.3" />
          <circle cx="100" cy="100" r="90" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.2" />

          {/* Outer Rotating Segmented Ring */}
          <g className={`origin-center transition-all duration-1000 ${isActive ? 'animate-[spin_8s_linear_infinite]' : 'animate-[spin_60s_linear_infinite]'}`}>
            <path d="M100 5 A95 95 0 0 1 195 100" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4,4" opacity="0.6" />
            <path d="M100 195 A95 95 0 0 1 5 100" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4,4" opacity="0.6" />
          </g>

          {/* Middle Counter-Rotating Tech Ring */}
          <g className={`origin-center transition-all duration-1000 ${isActive ? 'animate-[spin_5s_linear_infinite_reverse]' : 'animate-[spin_40s_linear_infinite_reverse]'}`}>
            <circle cx="100" cy="100" r="75" stroke="currentColor" strokeWidth="15" fill="none" strokeDasharray="2, 48" opacity="0.2" />
            <circle cx="100" cy="100" r="75" stroke="currentColor" strokeWidth="1" fill="none" strokeDasharray="40, 40" opacity="0.5" />
          </g>

          {/* Inner Fast Ring */}
          <g className={`origin-center transition-all duration-500 ${isActive ? 'animate-[spin_3s_linear_infinite]' : 'opacity-0'}`}>
            <circle cx="100" cy="100" r="60" stroke="currentColor" strokeWidth="0.5" fill="none" strokeDasharray="10, 10" />
          </g>

          {/* Core Triangle */}
          <g className={`origin-center transition-all duration-1000 ${isActive ? 'scale-100 opacity-100' : 'scale-90 opacity-40'}`}>
            <path d="M100 40 L152 130 L48 130 Z" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />
            <path d="M100 160 L152 70 L48 70 Z" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />
          </g>
        </svg>
      </div>

      {/* Interactive Core Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        title={isActive ? (language === 'hi' ? 'सुनना बंद करें' : 'Stop Listening') : (language === 'hi' ? 'सुनना शुरू करें' : 'Start Listening')}
        className="absolute z-10 w-32 h-32 rounded-full flex flex-col items-center justify-center outline-none"
      >
        <div className={`absolute inset-0 rounded-full border transition-all duration-500 accent-border ${isActive ? 'border-2 scale-110' : 'opacity-30'}`}></div>

        {/* Inner Glass */}
        <div className="absolute inset-2 rounded-full bg-slate-900/50 backdrop-blur-md border border-white/5 shadow-inner"></div>

        {/* Status Text & Indicator */}
        <div className="relative z-20 flex flex-col items-center">
          <motion.div
            animate={isActive ? { scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
            className={`w-3 h-3 rounded-full mb-2 transition-all duration-300 ${isActive ? 'accent-bg accent-glow' : 'bg-slate-600 opacity-50'}`}
          />
          <span
            className={`text-[10px] font-mono font-black tracking-[0.3em] transition-colors ${isActive ? 'text-white accent-text-glow' : 'text-slate-500'}`}
          >
            {isActive ? 'ONLINE' : 'STANDBY'}
          </span>
        </div>
      </motion.button>

      {/* Pulse Rings Effect on Click */}
      {isActive && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0.5 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
          className="absolute inset-0 rounded-full border border-white/20 accent-border"
        ></motion.div>
      )}
    </div>
  );
});
