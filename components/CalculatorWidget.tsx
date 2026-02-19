
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Cpu, Calculator, Delete, Divide, Minus, Plus, Equal, Percent } from 'lucide-react';
import { soundService } from '../services/soundService';

interface CalculatorWidgetProps {
  data: { expression: string; result: number } | null;
  isVisible: boolean;
  onClose: () => void;
}

export const CalculatorWidget = React.memo(({ data, isVisible, onClose }: CalculatorWidgetProps) => {
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
    soundService.playUIClick();

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
        soundService.playUIConfirm();
      } catch (e) {
        setResult('ERROR');
      }
      return;
    }

    setExpression(prev => prev + key.toString());
  };

  const keys = [
    'AC', '+/-', '%', '÷',
    7, 8, 9, '×',
    4, 5, 6, '-',
    1, 2, 3, '+',
    0, '.', '=', ''
  ];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/90 backdrop-blur-xl"
      />

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative glass-panel w-full max-w-sm rounded-[2.5rem] p-10 border-t-2 accent-border accent-cyan shadow-[0_50px_100px_rgba(0,0,0,0.8)] z-10"
      >
        <div className="scanline opacity-10"></div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2.5">
              <Cpu className="w-4 h-4 text-cyan-500 animate-pulse" />
              <span className="text-[10px] font-black accent-text accent-cyan tracking-[0.4em] uppercase">NEURAL_ALU_ACTIVE</span>
            </div>
            <div className="text-[8px] font-mono text-slate-600 mt-1 tracking-widest uppercase">SYSCALL_01101001</div>
          </div>
          <button
            onClick={() => { soundService.playUIClick(); onClose(); }}
            title="Terminate Module"
            className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 transition-all active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cinematic Display */}
        <div className="mb-10 bg-black/60 p-6 rounded-3xl border border-white/5 shadow-inner relative overflow-hidden group min-h-[140px] flex flex-col justify-end">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent pointer-events-none"></div>
          <div className="absolute top-2 right-4 text-[7px] font-mono text-cyan-500/30 tracking-widest">MEM_BANK_A</div>

          <div className="text-right space-y-3 font-mono relative z-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={expression}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-slate-500 text-xs truncate h-4 tracking-[0.2em] font-bold uppercase"
              >
                {expression || 'IDLE_STATE'}
              </motion.div>
            </AnimatePresence>
            <motion.div
              key={result}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-5xl text-white font-black accent-text accent-cyan accent-text-glow truncate leading-none"
            >
              {result || (expression ? '' : '0.0')}
            </motion.div>
          </div>

          {/* Decorative scanner line */}
          <motion.div
            animate={{ y: [0, 120, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 right-0 h-px bg-cyan-500/10 pointer-events-none"
          ></motion.div>
        </div>

        {/* Tactical Keypad */}
        <div className="grid grid-cols-4 gap-4">
          {keys.map((k, i) => (
            <motion.button
              key={i}
              whileHover={k !== '' ? { scale: 1.05 } : {}}
              whileTap={k !== '' ? { scale: 0.9 } : {}}
              onClick={() => k !== '' && handleBtnClick(k)}
              title={k.toString()}
              className={`
                 h-14 flex items-center justify-center rounded-2xl border transition-all text-xs font-black font-mono
                 ${k === '='
                  ? 'accent-bg accent-cyan text-black shadow-[0_0_30px_rgba(6,182,212,0.3)]'
                  : 'border-white/5 text-slate-400 hover:border-cyan-500/40 hover:text-white bg-white/5'
                }
                 ${k === '' ? 'pointer-events-none border-transparent bg-transparent' : ''}
                 ${['÷', '×', '-', '+'].includes(k.toString()) ? 'accent-text accent-cyan font-bold border-cyan-500/20 shadow-inner' : ''}
                 ${k === 'AC' ? 'text-red-400 border-red-500/20' : ''}
               `}
            >
              {k === '÷' ? <Divide className="w-4 h-4" /> :
                k === '×' ? <X className="w-4 h-4" /> :
                  k === '-' ? <Minus className="w-4 h-4" /> :
                    k === '+' ? <Plus className="w-4 h-4" /> :
                      k === '=' ? <Equal className="w-5 h-5" /> :
                        k === '%' ? <Percent className="w-4 h-4" /> :
                          k}
            </motion.button>
          ))}
        </div>

        {/* Footer Meta */}
        <div className="mt-10 flex flex-col items-center gap-3 opacity-20">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="w-4 h-1 bg-cyan-500"></div>
            ))}
          </div>
          <div className="text-[8px] font-mono text-slate-500 tracking-[0.5em] uppercase">SYSTEM_CORE_SYNCED</div>
        </div>
      </motion.div>
    </div>
  );
});
