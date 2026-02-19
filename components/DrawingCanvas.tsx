
import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eraser, Download, X, Palette, Brush, Shield } from 'lucide-react';
import { soundService } from '../services/soundService';

interface DrawingCanvasProps {
  onClose: () => void;
  language: 'en' | 'hi';
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = React.memo(({ onClose, language }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#8b5cf6'); // Default to Violet
  const [lineWidth, setLineWidth] = useState(4);

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

    const handleResize = () => {
      if (canvas) {
        // Preservation of data during resize would require a temp buffer, 
        // but for this implementation we'll just reset bounds.
        canvas.width = window.innerWidth * 0.8;
        canvas.height = window.innerHeight * 0.6;
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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

    soundService.playUIClick();
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
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
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
      link.download = `sofiya_output_${Date.now()}.png`;
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
    <div className="fixed inset-0 z-[120] flex flex-col items-center justify-center p-4 lg:p-12 overflow-hidden">
      {/* Background with cinematic effects */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/95 backdrop-blur-2xl z-0"
      />
      <div className="scanline opacity-10 z-10"></div>
      <div className="vignette z-10"></div>

      <div className="relative z-20 w-full max-w-6xl h-full flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-10 px-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_15px_#06b6d4]"></div>
              <h2 className="text-3xl font-black text-white tracking-widest uppercase italic leading-none">
                {language === 'hi' ? 'डिजिटल कैनवास' : 'NEURAL_SKETCH'}
              </h2>
            </div>
            <div className="flex items-center gap-2 mt-2 opacity-30 text-[9px] font-mono text-cyan-400 tracking-[0.4em] uppercase">
              <Shield className="w-3 h-3" />
              SECURE_DRAW_ENV // 0xF22B
            </div>
          </div>
          <button
            onClick={onClose}
            title="Terminate Sketch"
            className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 transition-all group active:scale-95"
          >
            <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 relative group rounded-[2.5rem] bg-slate-900 shadow-[inset_0_2px_40px_rgba(0,0,0,0.8)] border border-white/5 p-4 overflow-hidden mb-8">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

          <canvas
            ref={canvasRef}
            className="w-full h-full relative z-10 cursor-crosshair touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />

          {/* HUD Elements */}
          <div className="absolute top-8 left-8 z-20 pointer-events-none opacity-20 font-mono text-[9px] tracking-widest text-slate-500 flex flex-col gap-1 uppercase">
            <span>RES: {window.innerWidth}x{window.innerHeight}</span>
            <span>UPLINK: ACTIVE</span>
          </div>
        </div>

        {/* Tools Bar */}
        <div className="flex flex-wrap gap-8 justify-center items-center pb-8">
          {/* Color Palette */}
          <div className="flex items-center gap-4 glass-panel p-4 rounded-3xl border border-white/10 shadow-2xl">
            <Palette className="w-4 h-4 text-slate-500 mr-2" />
            <div className="flex gap-3">
              {colors.map((c) => (
                <button
                  key={c.name}
                  onClick={() => { setColor(c.hex); soundService.playUIClick(); }}
                  title={`Use ${c.name} color`}
                  className={`w-7 h-7 rounded-xl transition-all duration-300 hover:scale-110 active:scale-90 relative ${color === c.hex ? 'scale-125 shadow-lg' : 'opacity-40 hover:opacity-100'}`}
                  style={{ backgroundColor: c.hex }}
                >
                  {color === c.hex && (
                    <motion.div
                      layoutId="activeColor"
                      className="absolute -inset-1.5 border-2 border-white rounded-2xl opacity-50"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Brush Size */}
          <div className="flex items-center gap-5 glass-panel p-4 rounded-3xl border border-white/10 shadow-2xl px-6">
            <Brush className="w-4 h-4 text-slate-500" />
            <input
              type="range" min="1" max="20"
              value={lineWidth}
              onChange={(e) => setLineWidth(parseInt(e.target.value))}
              className="w-32 accent-cyan-500 bg-white/5 rounded-full h-1"
            />
            <span className="text-[10px] font-mono text-white font-bold w-4 text-center">{lineWidth}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={clearCanvas}
              title="Purge Data"
              className="px-8 py-4 glass-panel border border-white/5 text-slate-500 hover:text-red-400 hover:bg-red-500/5 rounded-2xl text-[10px] font-black tracking-[0.2em] uppercase transition-all shadow-xl active:scale-95 flex items-center gap-2"
            >
              <Eraser className="w-4 h-4" />
              {language === 'hi' ? 'साफ़ करें' : 'PURGE'}
            </button>
            <button
              onClick={saveDrawing}
              title="Extract Data"
              className="px-8 py-4 bg-cyan-600/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-600/40 rounded-2xl text-[10px] font-black tracking-[0.2em] uppercase transition-all shadow-xl active:scale-95 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {language === 'hi' ? 'सेव करें' : 'EXTRACT'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});