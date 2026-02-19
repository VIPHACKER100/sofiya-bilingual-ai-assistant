
import React, { useEffect, useRef } from 'react';
import { AppMode } from '../types';

interface WaveformProps {
  mode: AppMode;
  color?: string;
}

export const Waveform: React.FC<WaveformProps> = ({ mode, color = '#06b6d4' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
      
      // Settings based on mode
      const isActive = mode === AppMode.LISTENING || mode === AppMode.SPEAKING;
      const amplitude = isActive ? (mode === AppMode.LISTENING ? 30 : 20) : 4;
      const speed = isActive ? 0.2 : 0.05;
      const lines = 3;

      ctx.lineCap = 'round';

      for(let i = 0; i < lines; i++) {
          ctx.beginPath();
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.globalAlpha = 1 - (i * 0.3); // Fade outer lines
          
          for(let x = 0; x < w; x++) {
              // Tapering at edges
              const taper = Math.sin((x / w) * Math.PI);
              
              // Wave calculation
              const y = cy + 
                  Math.sin(x * 0.02 + phase + i) * amplitude * taper * Math.sin(phase * 0.5) + 
                  (isActive ? (Math.random() - 0.5) * 2 : 0); // Jitter

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
    <div className="w-full h-16 relative flex items-center justify-center overflow-hidden rounded-full glass-panel border-0 bg-slate-900/30">
       <canvas ref={canvasRef} className="w-full h-full" />
       
       <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-mono font-bold tracking-[0.4em] uppercase transition-colors duration-300 ${
           mode === AppMode.IDLE ? 'text-slate-600' : 'text-white text-glow'
       }`} style={{ textShadow: mode !== AppMode.IDLE ? `0 0 10px ${color}` : 'none' }}>
         {mode === AppMode.IDLE ? 'READY' : mode}
       </div>
    </div>
  );
};
