import React, { useEffect, useState } from 'react';

interface MindfulnessWidgetProps {
  onClose: () => void;
  language: 'en' | 'hi';
}

export const MindfulnessWidget: React.FC<MindfulnessWidgetProps> = ({ onClose, language }) => {
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [text, setText] = useState('');

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const cycle = () => {
      // Inhale (4s)
      setPhase('inhale');
      setText(language === 'hi' ? 'साँस अंदर लें...' : 'Inhale...');
      
      timeout = setTimeout(() => {
        // Hold (4s)
        setPhase('hold');
        setText(language === 'hi' ? 'रोकें...' : 'Hold...');
        
        timeout = setTimeout(() => {
          // Exhale (4s)
          setPhase('exhale');
          setText(language === 'hi' ? 'साँस छोड़ें...' : 'Exhale...');
          
          timeout = setTimeout(cycle, 4000);
        }, 4000);
      }, 4000);
    };

    cycle();
    return () => clearTimeout(timeout);
  }, [language]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-700">
      <div className="relative flex items-center justify-center">
         {/* Animated Circles */}
         <div className={`absolute rounded-full border-2 border-cyan-500/30 transition-all duration-[4000ms] ease-in-out ${phase === 'inhale' ? 'w-96 h-96 opacity-100' : 'w-32 h-32 opacity-50'}`}></div>
         <div className={`absolute rounded-full border border-cyan-400/50 transition-all duration-[4000ms] ease-in-out ${phase === 'inhale' ? 'w-80 h-80' : 'w-24 h-24'}`}></div>
         
         {/* Center Orb */}
         <div className={`w-20 h-20 rounded-full bg-cyan-500 shadow-[0_0_50px_rgba(6,182,212,0.5)] flex items-center justify-center z-10 transition-all duration-[4000ms] ${phase === 'hold' ? 'scale-110 bg-cyan-400' : 'scale-100'}`}>
            <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
         </div>
      </div>

      <div className="mt-64 text-center z-20 space-y-2">
         <h2 className="text-3xl font-light text-cyan-200 tracking-[0.2em] animate-pulse">{text}</h2>
         <p className="text-slate-500 text-sm font-mono uppercase">
           {language === 'hi' ? 'दिमाग शांत करें' : 'CENTER YOUR MIND'}
         </p>
      </div>

      <button onClick={onClose} className="mt-12 px-6 py-2 border border-slate-700 rounded-full text-slate-400 hover:text-white hover:border-slate-500 transition-colors text-xs tracking-widest uppercase">
         {language === 'hi' ? 'समाप्त करें' : 'END SESSION'}
      </button>
    </div>
  );
};