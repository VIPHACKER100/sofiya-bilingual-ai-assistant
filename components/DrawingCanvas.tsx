
import React, { useRef, useState, useEffect } from 'react';
import { soundService } from '../services/soundService';

interface DrawingCanvasProps {
  onClose: () => void;
  language: 'en' | 'hi';
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ onClose, language }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#8b5cf6'); // Default to Violet
  const [lineWidth, setLineWidth] = useState(3);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = window.innerWidth * 0.8;
      canvas.height = window.innerHeight * 0.6;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
      }
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
      }
    }
  }, [color, lineWidth]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsDrawing(true);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    soundService.playKeyPress();
    const { x, y } = getCoordinates(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e, canvas);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    const rect = canvas.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        soundService.playUIClick();
      }
    }
  };

  const saveDrawing = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const link = document.createElement('a');
      link.download = `sofiya_sketch_${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
      soundService.playUIConfirm();
    }
  };

  const colors = [
    { name: 'violet', hex: '#8b5cf6' },
    { name: 'cyan', hex: '#06b6d4' },
    { name: 'emerald', hex: '#10b981' },
    { name: 'amber', hex: '#f59e0b' },
    { name: 'red', hex: '#ef4444' },
    { name: 'white', hex: '#ffffff' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl p-8 animate-in fade-in duration-700">
      <div className="scanline opacity-10"></div>
      <div className="vignette"></div>

      <div className="w-full max-w-4xl flex justify-between items-center mb-8 px-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-3 h-3 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_10px_#06b6d4]"></div>
          <h2 className="text-3xl font-bold text-white tracking-[0.3em] font-mono italic">
            {language === 'hi' ? 'डिजिटल कैनवास' : 'NEURAL_SKETCHPAD'}
          </h2>
        </div>
        <button onClick={onClose} title="Close Canvas" className="text-slate-500 hover:text-white transition-colors text-2xl font-mono">✕</button>
      </div>

      <div className="relative group">
        <canvas
          ref={canvasRef}
          className="bg-black border border-white/10 rounded-3xl cursor-crosshair touch-none shadow-[0_0_100px_rgba(0,0,0,0.5)] group-hover:border-white/20 transition-colors"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {/* Decorative Corner Brackets */}
        <div className="absolute -top-4 -left-4 w-8 h-8 border-t-2 border-l-2 border-cyan-500/50"></div>
        <div className="absolute -bottom-4 -right-4 w-8 h-8 border-b-2 border-r-2 border-cyan-500/50"></div>
      </div>

      <div className="flex flex-wrap gap-8 mt-10 justify-center items-center relative z-10">
        <div className="flex gap-4 glass-panel p-3 rounded-full border border-white/10 shadow-lg">
          {colors.map((c) => (
            <button
              key={c.name}
              onClick={() => { setColor(c.hex); soundService.playUIClick(); }}
              title={`Use ${c.name} color`}
              className={`w-8 h-8 rounded-full transition-all duration-300 hover:scale-110 active:scale-90 ${color === c.hex ? 'ring-2 ring-white ring-offset-4 ring-offset-black scale-110 shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'opacity-60 hover:opacity-100'}`}
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>

        <div className="flex gap-4">
          <button
            onClick={clearCanvas}
            title="Clear Canvas"
            className="px-8 py-3 glass-panel border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 rounded-xl text-xs font-mono tracking-widest uppercase transition-all"
          >
            {language === 'hi' ? 'साफ़ करें' : 'PURGE'}
          </button>
          <button
            onClick={saveDrawing}
            title="Save Drawing"
            className="px-8 py-3 bg-cyan-600/20 border border-cyan-500/50 text-cyan-300 hover:bg-cyan-600/40 rounded-xl text-xs font-mono tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(6,182,212,0.2)]"
          >
            {language === 'hi' ? 'सेव करें' : 'EXTRACT'}
          </button>
        </div>
      </div>

      <div className="absolute bottom-12 left-12 opacity-20 font-mono text-[10px] tracking-[0.5em] uppercase pointer-events-none">
        INTERFACE_v4.3 // SKETCH_PROTOCOL_INIT
      </div>
    </div>
  );
};