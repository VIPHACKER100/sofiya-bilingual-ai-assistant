
import React from 'react';

interface PermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'hi';
}

export const PermissionModal: React.FC<PermissionModalProps> = ({ isOpen, onClose, language }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-in fade-in duration-500">
      <div className="glass-panel border-l-2 accent-border accent-violet rounded-2xl max-w-md w-full p-10 relative overflow-hidden shadow-[0_0_100px_rgba(139,92,246,0.2)]">

        {/* Cinematic Overlays */}
        <div className="scanline opacity-10"></div>
        <div className="vignette opacity-50"></div>

        <div className="relative z-10">
          <h2 className="text-3xl font-bold accent-text accent-violet tracking-[0.4em] mb-8 flex items-center gap-4 font-mono">
            <div className="p-3 border border-violet-500/20 rounded-xl bg-violet-500/5 accent-glow accent-violet">
              <svg className="w-8 h-8 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            SYSTEM_ALERT
          </h2>

          <div className="space-y-6">
            <div className="font-mono text-[10px] accent-text accent-violet uppercase tracking-[0.3em] bg-violet-500/10 px-4 py-2 border border-violet-500/20 rounded-full inline-block">
              {language === 'hi'
                ? "माइक्रोफ़ोन एक्सेस अस्वीकार"
                : "MICROPHONE_LINK_FAILURE"}
            </div>

            <p className="text-sm leading-relaxed text-slate-400 font-mono tracking-wide uppercase opacity-80">
              {language === 'hi'
                ? "SOFIYA को आपकी बात सुनने के लिए ऑडियो अनुमति की आवश्यकता है। कृपया ब्राउज़र सेटिंग्स में माइक्रोफ़ोन चालू करें।"
                : "SOFIYA_LINK_PROTOCOL: Audio input privileges required for neural integration. Please update browser site settings to allow persistent microphone access."}
            </p>
          </div>

          <div className="mt-12 flex justify-center">
            <button
              onClick={onClose}
              title="Acknowledge Alert"
              className="w-full py-4 rounded-xl accent-bg accent-violet text-white text-xs tracking-[0.4em] transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(139,92,246,0.3)] font-black uppercase font-mono"
            >
              {language === 'hi' ? "समझ गया" : "ACKNOWLEDGE_LINK"}
            </button>
          </div>

          <div className="mt-6 flex justify-between items-center opacity-20 font-mono text-[8px] tracking-widest uppercase text-slate-500">
            <span>SYS_ID: SOFIYA_V4</span>
            <span>AUTH_PENDING</span>
          </div>
        </div>
      </div>
    </div>
  );
};
