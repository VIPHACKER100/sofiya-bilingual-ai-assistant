
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

  // Sync with voice data when it arrives
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
        // Safe-ish eval for calculator
        const sanitized = expression.replace(/×/g, '*').replace(/÷/g, '/');
        // eslint-disable-next-line no-eval
        const res = eval(sanitized);
        setResult(Number(res).toLocaleString());
      } catch (e) {
        setResult('Error');
      }
      return;
    }

    // Append to expression
    setExpression(prev => prev + key.toString());
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-panel relative w-72 rounded-2xl p-6 animate-in zoom-in-95 duration-300 border border-cyan-500/30">
        
        {/* Close Button */}
        <button 
          onClick={() => { soundService.playUIClick(); onClose(); }} 
          className="absolute -top-3 -right-3 w-8 h-8 glass-panel rounded-full text-slate-400 hover:text-white hover:border-red-500 flex items-center justify-center transition-all z-10"
        >
          ✕
        </button>
        
        {/* Display */}
        <div className="mb-6 bg-black/40 p-4 rounded-lg border border-white/5 shadow-inner">
           <div className="text-xs text-cyan-600 font-mono tracking-widest mb-1 text-right">COMPUTE ENGINE</div>
           <div className="text-right space-y-1 font-mono min-h-[4rem] flex flex-col justify-end">
              <div className="text-slate-500 text-sm truncate h-5">{expression || '0'}</div>
              <div className="text-3xl text-cyan-100 font-bold drop-shadow-[0_0_8px_rgba(6,182,212,0.5)] truncate">
                {result || (expression ? '' : '0')}
              </div>
           </div>
        </div>

        {/* Visual Keypad */}
        <div className="grid grid-cols-4 gap-3">
           {['AC','+/-','%','÷',7,8,9,'×',4,5,6,'-',1,2,3,'+',0,'.','=',''].map((k, i) => (
             <button 
               key={i} 
               onClick={() => k !== '' && handleBtnClick(k)}
               className={`
                 h-10 flex items-center justify-center rounded border transition-all active:scale-95 text-sm font-mono
                 ${k === '=' 
                   ? 'bg-cyan-600/20 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)] hover:bg-cyan-600/40' 
                   : 'border-white/5 text-slate-400 hover:border-cyan-500/30 hover:text-cyan-200 bg-white/5'
                 }
                 ${k === '' ? 'pointer-events-none border-transparent bg-transparent' : ''}
               `}
             >
               {k}
             </button>
           ))}
        </div>
        
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-2xl pointer-events-none shadow-[inset_0_0_50px_rgba(6,182,212,0.05)]"></div>
      </div>
    </div>
  );
};
