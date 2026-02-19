import React, { useRef, useState, useEffect } from 'react';

interface DrawingCanvasProps {
  onClose: () => void;
  language: 'en' | 'hi';
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ onClose, language }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#06b6d4'); // Cyan default
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
      }
    }
  };

  const saveDrawing = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const link = document.createElement('a');
      link.download = `jarvis_drawing_${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
       <div className="w-full max-w-4xl flex justify-between items-center mb-4 px-4">
          <h2 className="text-xl text-cyan-400 font-bold tracking-widest font-mono">
            {language === 'hi' ? 'डिजिटल कैनवास' : 'DIGITAL CANVAS'}
          </h2>
          <button onClick={onClose} className="text-red-400 hover:text-red-300 font-bold">✕</button>
       </div>
       
       <canvas 
         ref={canvasRef}
         className="bg-slate-900 border-2 border-cyan-500/30 rounded cursor-crosshair touch-none shadow-[0_0_30px_rgba(6,182,212,0.1)]"
         onMouseDown={startDrawing}
         onMouseMove={draw}
         onMouseUp={stopDrawing}
         onMouseLeave={stopDrawing}
         onTouchStart={startDrawing}
         onTouchMove={draw}
         onTouchEnd={stopDrawing}
       />

       <div className="flex flex-wrap gap-4 mt-6 justify-center">
          <div className="flex gap-2 bg-slate-800 p-2 rounded border border-slate-700">
             <button onClick={() => setColor('#06b6d4')} className={`w-8 h-8 rounded-full bg-cyan-500 ${color === '#06b6d4' ? 'ring-2 ring-white' : ''}`} />
             <button onClick={() => setColor('#ef4444')} className={`w-8 h-8 rounded-full bg-red-500 ${color === '#ef4444' ? 'ring-2 ring-white' : ''}`} />
             <button onClick={() => setColor('#22c55e')} className={`w-8 h-8 rounded-full bg-green-500 ${color === '#22c55e' ? 'ring-2 ring-white' : ''}`} />
             <button onClick={() => setColor('#eab308')} className={`w-8 h-8 rounded-full bg-yellow-500 ${color === '#eab308' ? 'ring-2 ring-white' : ''}`} />
             <button onClick={() => setColor('#ffffff')} className={`w-8 h-8 rounded-full bg-white ${color === '#ffffff' ? 'ring-2 ring-cyan-500' : ''}`} />
          </div>

          <div className="flex gap-2">
            <button onClick={clearCanvas} className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded text-sm font-mono">
              {language === 'hi' ? 'साफ़ करें' : 'CLEAR'}
            </button>
            <button onClick={saveDrawing} className="px-4 py-2 bg-cyan-900/50 border border-cyan-500/50 text-cyan-300 hover:bg-cyan-900/80 rounded text-sm font-mono">
              {language === 'hi' ? 'सेव करें' : 'SAVE'}
            </button>
          </div>
       </div>
    </div>
  );
};