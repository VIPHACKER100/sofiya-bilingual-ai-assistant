
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
      setPhase('inhale');
      setText(language === 'hi' ? 'साँस अंदर लें...' : 'INHALE');

      timeout = setTimeout(() => {
        setPhase('hold');
        setText(language === 'hi' ? 'रोकें...' : 'HOLD');

        timeout = setTimeout(() => {
          setPhase('exhale');
          setText(language === 'hi' ? 'साँस छोड़ें...' : 'EXHALE');

          timeout = setTimeout(cycle, 4000);
        }, 4000);
      }, 4000);
    };

    cycle();
    return () => clearTimeout(timeout);
  }, [language]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black animate-in fade-in duration-1000">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/20 via-black to-emerald-900/10 opacity-60"></div>
      <div className="scanline opacity-10"></div>
      <div className="vignette"></div>

      <div className="relative flex items-center justify-center">
        {/* Pulsating Geometric Rings */}
        <div className={`absolute rounded-full border border-emerald-500/20 transition-all duration-[4000ms] ease-in-out ${phase === 'inhale' ? 'w-[30rem] h-[30rem]' : 'w-48 h-48'}`}></div>
        <div className={`absolute rounded-full border-2 border-emerald-400/30 transition-all duration-[4000ms] ease-in-out ${phase === 'inhale' ? 'w-[25rem] h-[25rem]' : 'w-32 h-32'}`}></div>
        <div className={`absolute rounded-full border border-white/10 transition-all duration-[4000ms] ease-in-out ${phase === 'inhale' ? 'w-[20rem] h-[20rem]' : 'w-24 h-24'}`}></div>

        {/* Center Energy Orb */}
        <div className={`w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center z-10 transition-all duration-[4000ms] shadow-[0_0_100px_rgba(16,185,129,0.3)] ${phase === 'hold' ? 'scale-125 bg-emerald-400 shadow-[0_0_150px_rgba(16,185,129,0.5)]' : 'scale-100'}`}>
          <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
        </div>
      </div>

      <div className="mt-72 text-center z-20 space-y-4">
        <h2 className="text-5xl font-bold text-emerald-100 tracking-[0.5em] font-mono animate-pulse uppercase accent-text-glow accent-emerald">{text}</h2>
        <p className="text-slate-500 text-xs font-mono tracking-[0.4em] uppercase opacity-60">
          {language === 'hi' ? 'अपने मन को केंद्रित करें' : 'CENTER_YOUR_CONSCIOUSNESS'}
        </p>
      </div>

      <button
        onClick={onClose}
        title="Terminate Mindfulness Session"
        className="mt-20 px-10 py-3 border border-emerald-800/50 rounded-full text-emerald-500/70 hover:text-white hover:bg-emerald-500/10 hover:border-emerald-500 transition-all text-[10px] tracking-[0.3em] font-mono glass-panel"
      >
        {language === 'hi' ? 'समाप्त करें' : 'TERMINATE_ZEN_PROTOCOL'}
      </button>

      {/* Protocol Overlay Info */}
      <div className="absolute bottom-12 right-12 text-right font-mono text-[9px] text-white/20 tracking-widest leading-relaxed">
        BIOMETRIC_FEEDBACK: STABLE<br />
        NERVOUS_SYSTEM: ALPHA_WAVE_MATCH<br />
        PROTOCOL_ID: ZEN_99
      </div>
    </div>
  );
};