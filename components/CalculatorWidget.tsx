
import React, { useState, useEffect } from 'react';
import { soundService } from '../services/soundService';

interface CalculatorWidgetProps {
  data: { expression: string; result: number } | null;
  isVisible: boolean;
  onClose: () => void;
}

export const CalculatorWidget: React.FC<CalculatorWidgetProps> = ({ data, isVisible, onClose }) => {
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState('');

  useEffect(() => {
    if (data) {
      setExpression(data.expression);
      setResult(data.result.toString());
    }
  }, [data]);

  if (!isVisible) return null;

  const handleBtnClick = (key: string | number) => {
    soundService.playKeyPress();

    if (key === 'AC') {
      setExpression('');
      setResult('');
      return;
    }

    if (key === '=') {
      try {
        const sanitized = expression.replace(/×/g, '*').replace(/÷/g, '/');
        // eslint-disable-next-line no-eval
        const res = eval(sanitized);
        setResult(Number(res).toLocaleString());
      } catch (e) {
        setResult('ERROR');
      }
      return;
    }

    setExpression(prev => prev + key.toString());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-500">
      {/* Cinematic Overlays */}
      <div className="scanline opacity-10"></div>
      <div className="vignette"></div>

      <div className="glass-panel relative w-80 rounded-3xl p-8 animate-in zoom-in-95 duration-500 border-t-2 accent-border accent-cyan shadow-[0_0_50px_rgba(6,182,212,0.15)]">

        {/* Header Decoration */}
        <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 accent-bg accent-cyan rounded-full animate-pulse accent-glow"></div>
            <span className="text-[10px] font-mono accent-text accent-cyan tracking-[0.3em] uppercase">COMPUTE_ENGINE_v4</span>
          </div>
          <button
            onClick={() => { soundService.playUIClick(); onClose(); }}
            title="Close Calculator"
            className="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Display */}
        <div className="mb-8 bg-black/60 p-5 rounded-2xl border border-white/5 shadow-inner relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent pointer-events-none"></div>
          <div className="text-right space-y-2 font-mono min-h-[5rem] flex flex-col justify-end relative z-10">
            <div className="text-slate-500 text-xs truncate h-4 uppercase tracking-tighter">{expression || 'READY_FOR_INPUT'}</div>
            <div className="text-4xl text-white font-bold accent-text accent-cyan accent-text-glow truncate">
              {result || (expression ? '' : '0')}
            </div>
          </div>
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-4 gap-4">
          {['AC', '+/-', '%', '÷', 7, 8, 9, '×', 4, 5, 6, '-', 1, 2, 3, '+', 0, '.', '=', ''].map((k, i) => (
            <button
              key={i}
              onClick={() => k !== '' && handleBtnClick(k)}
              title={k.toString()}
              className={`
                 h-12 flex items-center justify-center rounded-xl border transition-all active:scale-90 text-sm font-mono
                 ${k === '='
                  ? 'accent-bg accent-cyan text-black font-extrabold shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:scale-105'
                  : 'border-white/5 text-slate-400 hover:border-cyan-500/30 hover:text-cyan-200 bg-white/5 hover:bg-white/10'
                }
                 ${k === '' ? 'pointer-events-none border-transparent bg-transparent' : ''}
                 ${typeof k === 'string' && ['÷', '×', '-', '+'].includes(k) ? 'accent-text accent-cyan font-bold border-cyan-500/20' : ''}
               `}
            >
              {k}
            </button>
          ))}
        </div>

        {/* Footer Decoration */}
        <div className="mt-8 flex justify-between items-center opacity-25">
          <div className="h-0.5 w-12 bg-slate-700"></div>
          <div className="text-[8px] font-mono text-slate-500 tracking-widest">SOFIYA_CORES_ACTIVE</div>
          <div className="h-0.5 w-12 bg-slate-700"></div>
        </div>
      </div>
    </div>
  );
};
