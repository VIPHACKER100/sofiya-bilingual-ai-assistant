
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wind, X, Zap, Flower, Activity } from 'lucide-react';

interface MindfulnessWidgetProps {
  onClose: () => void;
  language: 'en' | 'hi';
}

export const MindfulnessWidget = React.memo(({ onClose, language }: MindfulnessWidgetProps) => {
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [text, setText] = useState('');

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const cycle = () => {
      setPhase('inhale');
      setText(language === 'hi' ? 'साँस अंदर लें...' : 'INHALE_DEEP');

      timeout = setTimeout(() => {
        setPhase('hold');
        setText(language === 'hi' ? 'रोकें...' : 'HOLD_VOID');

        timeout = setTimeout(() => {
          setPhase('exhale');
          setText(language === 'hi' ? 'साँस छोड़ें...' : 'EXHALE_RELEASE');

          timeout = setTimeout(cycle, 4000);
        }, 4000);
      }, 4000);
    };

    cycle();
    return () => clearTimeout(timeout);
  }, [language]);

  return (
    <div className="fixed inset-0 z-[140] flex flex-col items-center justify-center p-8 overflow-hidden">
      {/* Deep Background Ambience */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black z-0"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/40 via-black to-blue-900/20 opacity-40 z-10 transition-colors duration-[4000ms]"></div>

      {/* Cinematic HUD Elements */}
      <div className="scanline opacity-10 z-20"></div>
      <div className="vignette z-20"></div>

      {/* Floating geometric data elements */}
      <div className="absolute inset-0 pointer-events-none z-20">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              rotate: [0, 360],
              scale: [1, 1.2, 1],
              opacity: [0.05, 0.1, 0.05]
            }}
            transition={{ duration: 20 + i * 5, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/2 left-1/2 w-[50rem] h-[50rem] border border-emerald-500/20 rounded-[5rem] -translate-x-1/2 -translate-y-1/2"
          />
        ))}
      </div>

      <div className="relative z-30 flex flex-col items-center">
        {/* Core Breathing Visualizer */}
        <div className="relative flex items-center justify-center w-96 h-96">
          <AnimatePresence>
            <motion.div
              animate={{
                scale: phase === 'inhale' ? 1.5 : (phase === 'hold' ? 1.6 : 1),
                opacity: [0.2, 0.4, 0.2]
              }}
              transition={{ duration: 4, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full border border-emerald-500/30 blur-2xl"
            />
            <motion.div
              animate={{
                scale: phase === 'inhale' ? 1.2 : (phase === 'hold' ? 1.3 : 0.8),
                opacity: [0.1, 0.3, 0.1]
              }}
              transition={{ duration: 4, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full border-2 border-emerald-400/20"
            />
          </AnimatePresence>

          {/* Central Singularity */}
          <motion.div
            animate={{
              scale: phase === 'inhale' ? 1.1 : (phase === 'hold' ? 1.2 : 0.9),
              backgroundColor: phase === 'hold' ? '#10b981' : '#047857',
              boxShadow: phase === 'hold' ? '0 0 100px rgba(16,185,129,0.5)' : '0 0 50px rgba(16,185,129,0.2)'
            }}
            transition={{ duration: 4, ease: "easeInOut" }}
            className="w-32 h-32 rounded-full flex items-center justify-center relative z-10"
          >
            <Flower className={`w-10 h-10 text-white/50 transition-all duration-[4000ms] ${phase === 'inhale' ? 'rotate-180 scale-125' : 'rotate-0'}`} />
            <motion.div
              animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-white rounded-full"
            />
          </motion.div>
        </div>

        {/* Dynamic Instruction Text */}
        <div className="mt-16 text-center space-y-8">
          <div className="flex flex-col items-center">
            <AnimatePresence mode="wait">
              <motion.h2
                key={text}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className="text-6xl font-black text-white tracking-[0.6em] font-mono leading-none drop-shadow-[0_0_30px_rgba(16,185,129,0.5)]"
              >
                {text}
              </motion.h2>
            </AnimatePresence>
            <div className="w-64 h-1 bg-white/5 rounded-full mt-6 overflow-hidden">
              <motion.div
                animate={{ width: ['0%', '100%'] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="h-full bg-emerald-500 shadow-[0_0_10px_#10b981]"
              />
            </div>
          </div>

          <p className="text-emerald-500/50 text-[10px] font-black font-mono tracking-[0.5em] uppercase flex items-center justify-center gap-4">
            <Wind className="w-4 h-4 animate-bounce" />
            {language === 'hi' ? 'परम शांति प्राप्त करें' : 'SYNCING_RESPIRATORY_RHYTHM'}
          </p>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClose}
        title="Terminate Session"
        className="absolute bottom-24 flex items-center gap-3 px-12 py-4 bg-white/5 border border-emerald-800/50 rounded-2xl text-emerald-500/70 hover:text-white hover:bg-emerald-500/20 hover:border-emerald-500 transition-all text-[11px] font-black tracking-[0.4em] uppercase font-mono z-40 group shadow-2xl"
      >
        <X className="w-4 h-4 group-hover:rotate-90 transition-transform" />
        {language === 'hi' ? 'बाहर निकलें' : 'END_PROTOCOL'}
      </motion.button>

      {/* Analytics HUD Overlay */}
      <div className="absolute bottom-12 left-12 font-mono text-[9px] text-white/20 tracking-widest flex items-center gap-12">
        <div className="flex items-center gap-3">
          <Activity className="w-4 h-4 animate-pulse" />
          VITAL_SIGNS: NOMINAL
        </div>
        <div className="flex items-center gap-3">
          <Zap className="w-4 h-4" />
          NEURAL_DENSITY: 0.42Hz
        </div>
      </div>

      <div className="absolute top-12 right-12 text-right font-mono text-[9px] text-white/20 tracking-widest uppercase">
        ZEN_ENGINE_v4.3<br />
        ENCRYPTED_BRAIN_LINK: ON
      </div>
    </div>
  );
});