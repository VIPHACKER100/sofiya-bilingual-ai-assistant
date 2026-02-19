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
    "INITIALIZING SOFIYA LIFESTYLE OS...",
    "SYNCING BIOMETRICS...",
    "LOADING PERSONAL PREFERENCES...",
    "CONNECTING TO HOME AUTOMATION...",
    "CALIBRATING NATURAL LANGUAGE ENGINE...",
    "ESTABLISHING SECURE CONNECTION...",
    "DOWNLOADING WEATHER & NEWS STREAMS...",
    "OPTIMIZING EMOTIONAL INTELLIGENCE...",
    "SYSTEM CHECK: 100% FUNCTIONAL",
    "HELLO, I AM READY."
  ];

  const sequenceHi = [
    "सोफिया लाइफस्टाइल ओएस शुरू हो रहा है...",
    "बायोमेट्रिक्स सिंक किया जा रहा है...",
    "व्यक्तिगत प्राथमिकताएँ लोड हो रही हैं...",
    "होम ऑटोमेशन से कनेक्ट किया जा रहा है...",
    "प्राकृतिक भाषा इंजन कैलिब्रेशन...",
    "सुरक्षित कनेक्शन स्थापित...",
    "मौसम और समाचार डेटा डाउनलोड...",
    "सिस्टम जाँच: 100% सक्रिय",
    "नमस्ते, मैं तैयार हूँ।"
  ];

  useEffect(() => {
    const sequence = language === 'hi' ? sequenceHi : sequenceEn;
    let currentIndex = 0;

    // Start with a small delay
    const startTimeout = setTimeout(() => {
      soundService.playStartup();
    }, 100);

    const interval = setInterval(() => {
      if (currentIndex >= sequence.length) {
        clearInterval(interval);
        setTimeout(onComplete, 800); // Wait a bit after last line
        return;
      }

      setLines(prev => [...prev, sequence[currentIndex]]);
      soundService.playTextType();
      currentIndex++;

      // Scroll to bottom
      if (bottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior: 'smooth' });
      }

    }, 300 + Math.random() * 200); // Random typing speed

    return () => {
      clearTimeout(startTimeout);
      clearInterval(interval);
    };
  }, [language, onComplete]);

  return (
    <div className="fixed inset-0 z-[100] bg-black text-violet-500 font-mono text-sm md:text-base p-8 md:p-16 flex flex-col justify-end overflow-hidden">
      {/* Scanline Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(139,92,246,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%] pointer-events-none"></div>
      
      {/* Text Container */}
      <div className="relative z-10 space-y-2 max-w-3xl">
         {lines.map((line, idx) => (
           <div key={idx} className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-300">
             <span className="text-slate-600 text-xs shrink-0">{`>_`}</span>
             <span className={idx === lines.length - 1 ? "text-violet-300 font-bold glow-text" : "text-violet-600/80"}>
               {line}
             </span>
           </div>
         ))}
         <div ref={bottomRef} />
      </div>

      {/* Loading Bar */}
      <div className="absolute bottom-8 left-8 right-8 md:left-16 md:right-16 h-1 bg-slate-900 rounded overflow-hidden">
         <div 
           className="h-full bg-violet-500 shadow-[0_0_10px_#8b5cf6] transition-all duration-300 ease-out" 
           style={{ width: `${(lines.length / (language === 'hi' ? sequenceHi.length : sequenceEn.length)) * 100}%` }}
         ></div>
      </div>
      
      {/* Corner Decor */}
      <div className="absolute top-8 left-8 w-4 h-4 border-t-2 border-l-2 border-violet-700"></div>
      <div className="absolute top-8 right-8 w-4 h-4 border-t-2 border-r-2 border-violet-700"></div>
    </div>
  );
};