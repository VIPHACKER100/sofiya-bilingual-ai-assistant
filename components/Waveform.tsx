
import React, { useEffect, useRef } from 'react';
import { AppMode } from '../types';

interface WaveformProps {
  mode: AppMode;
  color?: string;
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

export const Waveform: React.FC<WaveformProps> = ({ mode, color = '#8b5cf6' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const accentClass = getAccentClass(color);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let phase = 0;

    const draw = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const w = canvas.width;
      const h = canvas.height;
      const cy = h / 2;

      ctx.clearRect(0, 0, w, h);

      const isActive = mode === AppMode.LISTENING || mode === AppMode.SPEAKING;
      const amplitude = isActive ? (mode === AppMode.LISTENING ? 30 : 20) : 4;
      const speed = isActive ? 0.2 : 0.05;
      const lines = 3;

      ctx.lineCap = 'round';

      for (let i = 0; i < lines; i++) {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 1 - (i * 0.3);

        for (let x = 0; x < w; x++) {
          const taper = Math.sin((x / w) * Math.PI);
          const y = cy +
            Math.sin(x * 0.02 + phase + i) * amplitude * taper * Math.sin(phase * 0.5) +
            (isActive ? (Math.random() - 0.5) * 2 : 0);

          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      phase += speed;
      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [mode, color]);

  return (
    <div className="w-full h-16 relative flex items-center justify-center overflow-hidden rounded-full glass-panel border-0 bg-slate-900/40">
      <canvas ref={canvasRef} className="w-full h-full" />

      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-mono font-bold tracking-[0.4em] uppercase transition-colors duration-300 ${accentClass} ${mode === AppMode.IDLE ? 'text-slate-600' : 'text-white accent-text-glow'
        }`}>
        {mode === AppMode.IDLE ? 'READY' : mode}
      </div>
    </div>
  );
};
