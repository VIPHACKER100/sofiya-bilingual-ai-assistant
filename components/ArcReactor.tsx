
import React from 'react';

interface ArcReactorProps {
  isActive: boolean;
  onClick: () => void;
  language: 'en' | 'hi';
  color: string; // Hex color code
}

export const ArcReactor: React.FC<ArcReactorProps> = ({ isActive, onClick, language, color }) => {
  return (
    <div className="relative flex items-center justify-center group w-80 h-80">
      {/* Dynamic Ambient Glow */}
      <div 
        className={`absolute rounded-full transition-all duration-1000 ease-in-out mix-blend-screen ${isActive ? 'w-full h-full opacity-40' : 'w-2/3 h-2/3 opacity-10'}`}
        style={{ 
          background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
          filter: 'blur(40px)'
        }} 
      />
      
      {/* SVG Structure */}
      <div className="relative w-72 h-72 pointer-events-none z-0">
         <svg viewBox="0 0 200 200" className="w-full h-full">
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Static Base Ring */}
            <circle cx="100" cy="100" r="98" stroke={color} strokeWidth="0.5" fill="none" opacity="0.3" />
            <circle cx="100" cy="100" r="90" stroke={color} strokeWidth="0.5" fill="none" opacity="0.2" />

            {/* Outer Rotating Segmented Ring */}
            <g className={`origin-center transition-all duration-1000 ${isActive ? 'animate-[spin_8s_linear_infinite]' : 'animate-[spin_60s_linear_infinite]'}`}>
               <path d="M100 5 A95 95 0 0 1 195 100" fill="none" stroke={color} strokeWidth="1" strokeDasharray="4,4" opacity="0.6" />
               <path d="M100 195 A95 95 0 0 1 5 100" fill="none" stroke={color} strokeWidth="1" strokeDasharray="4,4" opacity="0.6" />
            </g>

            {/* Middle Counter-Rotating Tech Ring */}
            <g className={`origin-center transition-all duration-1000 ${isActive ? 'animate-[spin_5s_linear_infinite_reverse]' : 'animate-[spin_40s_linear_infinite_reverse]'}`}>
               <circle cx="100" cy="100" r="75" stroke={color} strokeWidth="15" fill="none" strokeDasharray="2, 48" opacity="0.2" />
               <circle cx="100" cy="100" r="75" stroke={color} strokeWidth="1" fill="none" strokeDasharray="40, 40" opacity="0.5" />
            </g>
            
            {/* Inner Fast Ring */}
            <g className={`origin-center transition-all duration-500 ${isActive ? 'animate-[spin_3s_linear_infinite]' : 'opacity-0'}`}>
                <circle cx="100" cy="100" r="60" stroke={color} strokeWidth="0.5" fill="none" strokeDasharray="10, 10" />
            </g>

            {/* Core Triangle */}
            <g className={`origin-center transition-all duration-1000 ${isActive ? 'scale-100 opacity-100' : 'scale-90 opacity-40'}`}>
                <path d="M100 40 L152 130 L48 130 Z" fill="none" stroke={color} strokeWidth="1" opacity="0.5" />
                <path d="M100 160 L152 70 L48 70 Z" fill="none" stroke={color} strokeWidth="1" opacity="0.5" />
            </g>
         </svg>
      </div>

      {/* Interactive Core Button */}
      <button 
        onClick={onClick}
        className="absolute z-10 w-32 h-32 rounded-full flex flex-col items-center justify-center transition-all duration-300 group-hover:scale-105 active:scale-95 outline-none"
      >
        <div className={`absolute inset-0 rounded-full border transition-all duration-500 ${isActive ? 'border-2 opacity-100' : 'border opacity-30'}`} style={{ borderColor: color }}></div>
        
        {/* Inner Glass */}
        <div className="absolute inset-2 rounded-full bg-slate-900/50 backdrop-blur-sm border border-white/5 shadow-inner"></div>

        {/* Status Text & Indicator */}
        <div className="relative z-20 flex flex-col items-center">
            <div 
                className={`w-3 h-3 rounded-full mb-2 transition-all duration-300 ${isActive ? 'shadow-[0_0_15px_currentColor] scale-110' : 'opacity-50'}`}
                style={{ backgroundColor: isActive ? color : '#475569', color: color }}
            />
            <span 
                className="text-[10px] font-mono font-bold tracking-[0.3em] transition-colors"
                style={{ color: isActive ? '#fff' : '#64748b', textShadow: isActive ? `0 0 10px ${color}` : 'none' }}
            >
            {isActive ? 'ONLINE' : 'STANDBY'}
            </span>
        </div>
      </button>
      
      {/* Pulse Rings Effect on Click */}
      {isActive && (
         <div className="absolute inset-0 rounded-full border border-white/20 animate-[ping_2s_linear_infinite]" style={{ borderColor: color }}></div>
      )}
    </div>
  );
};
