
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

  const formatTime = (ms: number) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = (timeLeft / duration) * 100;

  return (
    <div className="glass-panel absolute top-24 left-1/2 transform -translate-x-1/2 md:translate-x-0 md:left-auto md:right-80 md:top-24 w-48 p-4 rounded-full aspect-square flex flex-col items-center justify-center animate-in zoom-in duration-500 z-30 border-2 accent-border accent-cyan">
      {/* Background Ambience */}
      <div className="absolute inset-0 rounded-full bg-cyan-500/5 pulse-active pointer-events-none"></div>

      {/* Progress Ring SVG */}
      <svg className="absolute inset-0 w-full h-full -rotate-90 p-2">
        <circle
          cx="50%" cy="50%" r="45%"
          fill="transparent"
          className="stroke-slate-800"
          strokeWidth="2"
          strokeOpacity="0.5"
        />
        <circle
          cx="50%" cy="50%" r="45%"
          fill="transparent"
          className="stroke-cyan-500 transition-all duration-1000 ease-linear accent-glow accent-cyan"
          strokeWidth="3"
          strokeDasharray="283"
          strokeDashoffset={283 - (283 * progress) / 100}
          strokeLinecap="round"
        />
      </svg>

      <div className="relative z-10 flex flex-col items-center">
        <span className="text-[10px] accent-text accent-cyan font-mono tracking-[0.3em] uppercase mb-1">PROTO.TIMER</span>
        <span className="text-3xl font-bold text-white font-mono accent-text-glow accent-cyan">{formatTime(timeLeft)}</span>
        <div className="flex gap-2 mt-4 font-mono">
          <button
            onClick={() => setIsPaused(!isPaused)}
            title={isPaused ? "Resume Timer" : "Pause Timer"}
            className="text-[9px] px-2 py-0.5 rounded-full border border-white/10 hover:bg-white/10 text-slate-300 uppercase tracking-widest transition-all"
          >
            {isPaused ? 'RESUME' : 'PAUSE'}
          </button>
          <button
            onClick={onCancel}
            title="Stop Timer"
            className="text-[9px] px-2 py-0.5 rounded-full border border-red-500/20 hover:bg-red-500/10 text-red-400 uppercase tracking-widest transition-all"
          >
            STOP
          </button>
        </div>
      </div>
    </div>
  );
};
