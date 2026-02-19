
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const BootSequence: React.FC<{ onComplete: () => void; language: 'en' | 'hi' }> = ({ onComplete, language }) => {
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState(0);

  const steps = language === 'hi' ? [
    "बायोमेट्रिक स्कैनिंग सक्रिय...",
    "न्यूरल लिंक स्थापित किया जा रहा है...",
    "भाषा मॉड्यूल लोड हो रहा है (HI-IN)...",
    "सिस्टम कोर सुरक्षा जाँच...",
    "सोफिया ऑनलाइन होने के लिए तैयार है।"
  ] : [
    "INITIALIZING_BIOMETRIC_SCAN...",
    "ESTABLISHING_NEURAL_LINK...",
    "LOADING_LANGUAGE_MODULES (EN-US)...",
    "VERIFYING_CORE_PROTOCOL_SAFETY...",
    "SOFIYA_SYSTEM_READY_FOR_UPLINK."
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 1000);
          return 100;
        }
        return prev + 1;
      });
    }, 40);

    return () => clearInterval(timer);
  }, [onComplete]);

  useEffect(() => {
    setStep(Math.min(Math.floor(progress / 20), steps.length - 1));
  }, [progress, steps.length]);

  return (
    <div className="fixed inset-0 bg-black z-[200] flex items-center justify-center font-mono overflow-hidden">
      {/* Matrix-like Background */}
      <div className="absolute inset-0 opacity-20 pointer-events-none select-none overflow-hidden text-[8px] text-emerald-500 leading-none flex flex-wrap gap-1">
        {Array.from({ length: 1000 }).map((_, i) => (
          <motion.span
            key={i}
            animate={{ opacity: [0.1, 1, 0.1] }}
            transition={{ duration: Math.random() * 3 + 1, repeat: Infinity, delay: Math.random() * 2 }}
          >
            {Math.random() > 0.5 ? '1' : '0'}
          </motion.span>
        ))}
      </div>

      <div className="relative z-10 w-full max-w-sm px-8">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between text-[10px] text-emerald-500 tracking-[0.3em] font-black uppercase">
            <span>System_Boot</span>
            <span>{progress}%</span>
          </div>

          {/* Progress Bar with Motion */}
          <div className="h-1.5 w-full bg-slate-900 rounded-full border border-white/5 p-[1px] overflow-hidden">
            <motion.div
              className="h-full bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]"
              animate={{ width: `${progress}%` }}
              transition={{ ease: "linear", duration: 0.1 }}
            ></motion.div>
          </div>

          <div className="h-12 flex flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-[10px] text-slate-400 uppercase tracking-widest leading-relaxed text-center"
              >
                {steps[step]}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex justify-center gap-1 opacity-20">
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className={`w-1 h-3 ${i <= step ? 'bg-emerald-500' : 'bg-white/10'}`}></div>
            ))}
          </div>
        </div>
      </div>

      {/* Cinematic Vignette */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,1)]"></div>
      <div className="scanline"></div>
    </div>
  );
};