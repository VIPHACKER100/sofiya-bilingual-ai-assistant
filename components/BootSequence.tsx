
import React, { useState, useEffect, useRef } from 'react';
import { soundService } from '../services/soundService';

interface BootSequenceProps {
  onComplete: () => void;
  language: 'en' | 'hi';
}

export const BootSequence: React.FC<BootSequenceProps> = ({ onComplete, language }) => {
  const [lines, setLines] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const sequenceEn = [
    "INITIALIZING SOFIYA_v4.3_LIFESTYLE_OS...",
    "ESTABLISHING NEURAL_LINK...",
    "SYNCING BIOMETRICS...",
    "LOADING USER_PREFERENCES...",
    "CONNECTING TO SMART_HOME_GRID...",
    "CALIBRATING NLP_ENGINE_v4...",
    "ENCRYPTING SECURE_CHANNEL...",
    "BUFFERING GLOBAL_DATA_STREAMS...",
    "OPTIMIZING EMOTIONAL_SYNAPSES...",
    "SYSTEM_CHECK: 100%_OPERATIONAL",
    "HELLO ADMINISTRATOR. I AM READY."
  ];

  const sequenceHi = [
    "सोफिया_v4.3_ओएस शुरू हो रहा है...",
    "न्यूरल लिंक स्थापित किया जा रहा है...",
    "बायोमेट्रिक्स सिंक हो रहे हैं...",
    "उपयोगकर्ता प्राथमिकताएँ लोड हो रही हैं...",
    "स्मार्ट होम ग्रिड से कनेक्ट किया जा रहा है...",
    "प्राकृतिक भाषा इंजन कैलिब्रेशन...",
    "सुरक्षित कनेक्शन एन्क्रिप्टेड...",
    "डेटा स्ट्रीम डाउनलोड हो रही है...",
    "सिस्टम जाँच: 100% सक्रिय",
    "नमस्ते एडमिन। मैं तैयार हूँ।"
  ];

  useEffect(() => {
    const sequence = language === 'hi' ? sequenceHi : sequenceEn;
    let currentIndex = 0;

    const startTimeout = setTimeout(() => {
      soundService.playStartup();
    }, 100);

    const interval = setInterval(() => {
      if (currentIndex >= sequence.length) {
        clearInterval(interval);
        setTimeout(onComplete, 1200);
        return;
      }

      setLines(prev => [...prev, sequence[currentIndex]]);
      soundService.playTextType();
      currentIndex++;

      if (bottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior: 'smooth' });
      }

    }, 250 + Math.random() * 200);

    return () => {
      clearTimeout(startTimeout);
      clearInterval(interval);
    };
  }, [language, onComplete]);

  return (
    <div className="fixed inset-0 z-[100] bg-black font-mono text-sm p-10 flex flex-col justify-end overflow-hidden">
      {/* Cinematic Overlays */}
      <div className="scanline opacity-20"></div>
      <div className="vignette opacity-80"></div>

      {/* Background Matrix Effect (Subtle) */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

      {/* Text Container */}
      <div className="relative z-10 space-y-3 max-w-4xl animate-in fade-in duration-1000">
        {lines.map((line, idx) => (
          <div key={idx} className="flex items-center gap-4 animate-in slide-in-from-left-4 duration-300">
            <span className="text-violet-900 font-bold shrink-0">{`[${idx.toString().padStart(2, '0')}]`}</span>
            <span className={idx === lines.length - 1
              ? "text-white font-black tracking-widest accent-text-glow accent-violet"
              : "text-violet-500/60 uppercase tracking-tighter"
            }>
              {line}
            </span>
          </div>
        ))}
        <div ref={bottomRef} className="h-4" />
      </div>

      {/* Cinematic Loading Progress */}
      <div className="absolute bottom-12 left-10 right-10 max-w-5xl h-[1px] bg-white/5 overflow-hidden">
        <div
          className="h-full bg-violet-500 accent-glow accent-violet transition-all duration-500 ease-out"
          style={{ width: `${(lines.length / (language === 'hi' ? sequenceHi.length : sequenceEn.length)) * 100}%` }}
        ></div>
      </div>

      {/* System Brand */}
      <div className="absolute top-12 left-10 flex items-center gap-3 opacity-30 select-none">
        <div className="w-1.5 h-1.5 bg-violet-600 rounded-full animate-pulse"></div>
        <span className="text-[10px] text-violet-400 tracking-[0.5em] uppercase font-bold">SOFIYA_SYSCORP_INIT</span>
      </div>

      {/* Decorative Brackets */}
      <div className="absolute top-10 left-10 w-6 h-6 border-t-2 border-l-2 border-violet-900/30"></div>
      <div className="absolute top-10 right-10 w-6 h-6 border-t-2 border-r-2 border-violet-900/30"></div>
      <div className="absolute bottom-10 left-10 w-6 h-6 border-b-2 border-l-2 border-violet-900/30"></div>
      <div className="absolute bottom-10 right-10 w-6 h-6 border-b-2 border-r-2 border-violet-900/30"></div>
    </div>
  );
};