
import React from 'react';

interface PermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'hi';
}

export const PermissionModal: React.FC<PermissionModalProps> = ({ isOpen, onClose, language }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="glass-panel border-l-4 border-l-violet-500 rounded-lg max-w-md w-full p-8 relative overflow-hidden">
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.05)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
        
        <div className="relative z-10">
            <h2 className="text-2xl font-bold text-violet-400 tracking-widest mb-6 flex items-center gap-3 font-mono">
            <div className="p-2 border border-violet-500/30 rounded bg-violet-500/10">
                <svg className="w-6 h-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>
            SYSTEM ALERT
            </h2>

            <div className="space-y-4 text-slate-300 font-sans">
            <p className="font-mono text-xs text-violet-300 uppercase tracking-wider bg-violet-500/10 px-2 py-1 inline-block rounded">
                {language === 'hi' 
                ? "माइक्रोफ़ोन एक्सेस अस्वीकार" 
                : "MICROPHONE ACCESS DENIED"}
            </p>
            
            <p className="text-sm leading-relaxed text-slate-400">
                {language === 'hi'
                ? "SOFIYA को आपकी बात सुनने के लिए ऑडियो अनुमति की आवश्यकता है। कृपया ब्राउज़र सेटिंग्स में माइक्रोफ़ोन चालू करें।"
                : "SOFIYA requires audio input privileges to assist you. Please update your browser site settings to allow microphone access."}
            </p>
            </div>

            <div className="mt-8 flex justify-end">
            <button 
                onClick={onClose}
                className="bg-violet-600 hover:bg-violet-500 text-white px-6 py-2 rounded text-xs tracking-widest transition-all uppercase font-bold font-mono shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:scale-105"
            >
                {language === 'hi' ? "समझ गया" : "ACKNOWLEDGE"}
            </button>
            </div>
        </div>
      </div>
    </div>
  );
};
