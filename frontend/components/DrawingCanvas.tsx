
import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eraser, Download, X, Palette, Brush, Shield, Zap, Activity } from 'lucide-react';
import { soundService } from '../services/soundService';

interface DrawingCanvasProps {
  onClose: () => void;
  language: 'en' | 'hi';
}

export const DrawingCanvas = React.memo(({ onClose, language }: DrawingCanvasProps) => {
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
    <div className="fixed inset-0 z-[120] flex flex-col items-center justify-center p-6 lg:p-16 overflow-hidden">
      {/* Cinematic Background */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/95 backdrop-blur-3xl z-0"
      />
      <div className="scanline opacity-10 z-10"></div>
      <div className="vignette z-10"></div>
      <div className="absolute inset-0 grid-hud opacity-[0.03] z-10 pointer-events-none"></div>

      <div className="relative z-20 w-full max-w-7xl h-full flex flex-col">
        {/* Superior Header */}
        <div className="flex justify-between items-center mb-12 px-6">
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex flex-col gap-2">
            <div className="flex items-center gap-4">
              <div className="w-4 h-4 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_20px_#06b6d4]"></div>
              <h2 className="text-4xl font-black text-white tracking-[0.2em] uppercase italic leading-none text-gradient">
                {language === 'hi' ? 'डिजिटल कैनवास' : 'NEURAL_SKETCH'}
              </h2>
            </div>
            <div className="flex items-center gap-3 opacity-40 text-[10px] font-black font-mono tracking-[0.5em] text-cyan-400 uppercase">
              <Shield className="w-3.5 h-3.5" />
              SECURE_WORKSPACE // 0xF22B
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full ml-4 animate-ping"></div>
            </div>
          </motion.div>
          <motion.button
            whileHover={{ rotate: 90, scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            title="Terminate Module"
            className="w-14 h-14 rounded-2xl border border-white/10 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all group active:scale-95 shadow-2xl"
          >
            <X className="w-7 h-7" />
          </motion.button>
        </div>

        {/* Neural Drawing Environment */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex-1 relative group rounded-[3rem] bg-black/40 shadow-[inset_0_2px_100px_rgba(0,0,0,0.9)] border border-white/5 p-4 overflow-hidden mb-12 cyber-border"
        >
          <div className="absolute inset-0 radial-dots opacity-20"></div>

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

          {/* Telemetry HUD */}
          <div className="absolute bottom-12 left-12 z-20 pointer-events-none opacity-20 font-mono text-[9px] tracking-widest text-slate-500 flex gap-12 uppercase">
            <div className="flex items-center gap-2">
              <Activity className="w-3 h-3" />
              DENSITY: 0.81hz
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-3 h-3" />
              LATENCY: 4ms
            </div>
          </div>
        </motion.div>

        {/* Pro Tools Dashboard */}
        <div className="flex flex-wrap gap-10 justify-between items-center pb-12 px-6">
          <div className="flex gap-10">
            {/* Color Matrix */}
            <div className="flex items-center gap-6 glass-panel p-5 rounded-[2rem] border border-white/10 shadow-2xl">
              <div className="flex gap-4">
                {colors.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => { setColor(c.hex); soundService.playUIClick(); }}
                    title={`Use ${c.name} color`}
                    className={`w-8 h-8 rounded-xl transition-all duration-500 hover:scale-110 active:scale-90 relative ${color === c.hex ? 'scale-125 shadow-2xl z-10' : 'opacity-40 hover:opacity-100'}`}
                    style={{ backgroundColor: c.hex }}
                  >
                    {color === c.hex && (
                      <motion.div
                        layoutId="activeColor"
                        className="absolute -inset-1.5 border border-white/40 rounded-2xl"
                      />
                    )}
                  </button>
                ))}
              </div>
              <div className="w-px h-8 bg-white/10 mx-2"></div>
              <Palette className="w-5 h-5 text-slate-500" />
            </div>

            {/* Brush Dynamics */}
            <div className="flex items-center gap-6 glass-panel p-5 rounded-[2rem] border border-white/10 shadow-2xl px-10 group">
              <Brush className={`w-5 h-5 ${color === '#ffffff' ? 'text-white' : 'accent-text'}`} style={{ color: color }} />
              <div className="relative flex items-center">
                <input
                  type="range" min="1" max="25"
                  value={lineWidth}
                  title="Adjust Line Width"
                  onChange={(e) => setLineWidth(parseInt(e.target.value))}
                  className="w-52 accent-cyan-500 bg-white/5 rounded-full h-1 appearance-none cursor-pointer"
                />
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white/5 px-3 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono text-white">
                  SIZE_{lineWidth}PX
                </div>
              </div>
            </div>
          </div>

          {/* Master Actions */}
          <div className="flex gap-6">
            <motion.button
              whileHover={{ scale: 1.03, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
              whileTap={{ scale: 0.97 }}
              onClick={clearCanvas}
              title="Purge Sketch Buffer"
              className="px-10 py-5 glass-panel border border-white/5 text-slate-500 hover:text-red-500 rounded-[1.5rem] text-[11px] font-black tracking-[0.4em] uppercase transition-all shadow-2xl flex items-center gap-3 group"
            >
              <Eraser className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              {language === 'hi' ? 'साफ़ करें' : 'PURGE'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: '0 0 50px rgba(6, 182, 212, 0.3)' }}
              whileTap={{ scale: 0.97 }}
              onClick={saveDrawing}
              title="Export Signal Data"
              className="px-10 py-5 bg-cyan-600/10 border border-cyan-500/20 text-cyan-400 hover:text-white hover:bg-cyan-500 rounded-[1.5rem] text-[11px] font-black tracking-[0.4em] uppercase transition-all shadow-2xl flex items-center gap-3 group"
            >
              <Download className="w-4 h-4 group-hover:-translate-y-1 transition-transform" />
              {language === 'hi' ? 'सेव करें' : 'EXTRACT'}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
});