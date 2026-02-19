
import React, { useEffect, useState } from 'react';

interface TimerWidgetProps {
  duration: number; // in ms
  label: string;
  onComplete: () => void;
  onCancel: () => void;
}

export const TimerWidget: React.FC<TimerWidgetProps> = ({ duration, label, onComplete, onCancel }) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1000) {
          clearInterval(interval);
          onComplete();
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, onComplete]);

  // Format time mm:ss
  const formatTime = (ms: number) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = (timeLeft / duration) * 100;

  return (
    <div className="glass-panel absolute top-24 left-1/2 transform -translate-x-1/2 md:translate-x-0 md:left-auto md:right-80 md:top-24 w-48 p-4 rounded-full aspect-square flex flex-col items-center justify-center animate-in zoom-in duration-300 z-30">
       
       {/* Progress Ring SVG */}
       <svg className="absolute inset-0 w-full h-full -rotate-90 p-2">
         <circle
           cx="50%" cy="50%" r="45%"
           fill="transparent"
           stroke="#334155"
           strokeWidth="2"
           strokeOpacity="0.3"
         />
         <circle
           cx="50%" cy="50%" r="45%"
           fill="transparent"
           stroke="#06b6d4"
           strokeWidth="3"
           strokeDasharray="283"
           strokeDashoffset={283 - (283 * progress) / 100}
           strokeLinecap="round"
           className="transition-all duration-1000 ease-linear filter drop-shadow-[0_0_4px_rgba(6,182,212,0.8)]"
         />
       </svg>

       <div className="relative z-10 flex flex-col items-center">
         <span className="text-[10px] text-cyan-500 font-mono tracking-widest uppercase mb-1">TIMER</span>
         <span className="text-3xl font-bold text-white font-mono drop-shadow-md">{formatTime(timeLeft)}</span>
         <div className="flex gap-2 mt-2">
            <button onClick={() => setIsPaused(!isPaused)} className="text-[9px] px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-slate-300 uppercase tracking-wider transition-colors">
                {isPaused ? 'RESUME' : 'PAUSE'}
            </button>
            <button onClick={onCancel} className="text-[9px] px-2 py-0.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 uppercase tracking-wider transition-colors">
                STOP
            </button>
         </div>
       </div>
    </div>
  );
};
