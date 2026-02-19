
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Square, Timer } from 'lucide-react';

interface TimerWidgetProps {
  duration: number; // in ms
  label: string;
  onComplete: () => void;
  onCancel: () => void;
}

export const TimerWidget = React.memo(({ duration, label, onComplete, onCancel }: TimerWidgetProps) => {
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
  const radius = 45;
  const circumference = 2 * Math.PI * radius;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      className="glass-panel absolute top-24 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-80 w-52 h-52 p-6 rounded-full flex flex-col items-center justify-center z-30 border-2 accent-border accent-cyan shadow-[0_0_50px_rgba(6,182,212,0.2)]"
    >
      <div className="absolute inset-0 rounded-full bg-cyan-500/5 animate-pulse pointer-events-none"></div>

      {/* Progress Ring */}
      <svg className="absolute inset-0 w-full h-full -rotate-90 p-3">
        <circle
          cx="50%" cy="50%" r={`${radius}%`}
          fill="transparent"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="4"
        />
        <motion.circle
          cx="50%" cy="50%" r={`${radius}%`}
          fill="transparent"
          stroke="currentColor"
          className="text-cyan-500 accent-glow accent-cyan transition-all duration-1000 ease-linear"
          strokeWidth="4"
          strokeDasharray="283"
          animate={{ strokeDashoffset: 283 - (283 * progress) / 100 }}
          strokeLinecap="round"
        />
      </svg>

      <div className="relative z-10 flex flex-col items-center gap-1">
        <div className="flex items-center gap-1.5 opacity-40 text-[9px] font-black accent-text accent-cyan tracking-[0.2em] uppercase">
          <Timer className="w-3 h-3" />
          CHRONO_CORE
        </div>

        <AnimatePresence mode="wait">
          <motion.span
            key={timeLeft}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-black text-white font-mono accent-text-glow accent-cyan drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]"
          >
            {formatTime(timeLeft)}
          </motion.span>
        </AnimatePresence>

        <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mt-1 opacity-60">
          SEC_COUNTDOWN
        </div>

        <div className="flex gap-4 mt-6">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsPaused(!isPaused)}
            title={isPaused ? "Resume" : "Pause"}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all shadow-lg"
          >
            {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onCancel}
            title="Terminate"
            className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 hover:bg-red-500/20 transition-all shadow-lg shadow-red-500/5"
          >
            <Square className="w-4 h-4 fill-current" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
});
