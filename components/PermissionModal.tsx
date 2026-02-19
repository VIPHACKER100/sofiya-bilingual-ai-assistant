
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, MicOff, Lock, X } from 'lucide-react';

interface PermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'hi';
}

export const PermissionModal = React.memo(({ isOpen, onClose, language }: PermissionModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Heavy Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/95 backdrop-blur-2xl"
      />

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 30 }}
        className="relative glass-panel border-t-2 accent-border accent-violet rounded-[2.5rem] max-w-lg w-full p-10 lg:p-14 overflow-hidden shadow-[0_50px_100px_rgba(139,92,246,0.3)] z-10"
      >
        <div className="scanline opacity-10"></div>
        <div className="vignette opacity-50"></div>

        <div className="relative z-10 flex flex-col items-center">
          {/* Icon Header */}
          <div className="mb-10 relative">
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-violet-500 blur-2xl rounded-full opacity-20"
            />
            <div className="relative w-24 h-24 rounded-3xl bg-violet-600/10 border border-violet-500/30 flex items-center justify-center shadow-inner">
              <ShieldAlert className="w-12 h-12 text-violet-500" />
            </div>
          </div>

          <h2 className="text-3xl font-black accent-text accent-violet tracking-[0.4em] mb-6 font-mono uppercase text-center">
            {language === 'hi' ? "सिस्टम अलर्ट" : "CORE_ALERT"}
          </h2>

          <div className="flex flex-col items-center gap-6 w-full">
            <div className="flex items-center gap-3 font-mono text-[11px] font-black accent-text accent-violet uppercase tracking-[0.3em] bg-violet-500/10 px-6 py-3 border border-violet-500/20 rounded-full shadow-inner">
              <MicOff className="w-4 h-4" />
              {language === 'hi' ? "ऑडियो एक्सेस विफल" : "UPLINK_DENIED"}
            </div>

            <p className="text-sm leading-relaxed text-slate-400 font-mono tracking-wide uppercase opacity-90 text-center max-w-sm">
              {language === 'hi'
                ? "SOFIYA को आपकी बात सुनने के लिए अनुमति की आवश्यकता है। कृपया ब्राउज़र सेटिंग्स में माइक्रोफ़ोन चालू करें।"
                : "AURAL_INPUT_FAILURE: Secure voice processing requires transient OS privileges. Please enable microphone access via your host browser's security panel."}
            </p>
          </div>

          <div className="mt-12 w-full flex flex-col gap-4">
            <button
              onClick={onClose}
              title="Acknowledge Alert"
              className="w-full py-5 rounded-2xl accent-bg accent-violet text-white text-[11px] tracking-[0.4em] transition-all hover:scale-[1.03] active:scale-95 shadow-[0_20px_40px_rgba(139,92,246,0.4)] font-black uppercase font-mono flex items-center justify-center gap-3 group"
            >
              <Lock className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
              {language === 'hi' ? "एक्सेस प्रदान करें" : "RESOLVE_SECURITY"}
            </button>

            <button
              onClick={onClose}
              className="w-full py-3 text-slate-500 hover:text-white transition-colors text-[9px] font-black tracking-[0.5em] uppercase font-mono"
            >
              SKIP_PROCEDURE
            </button>
          </div>

          <div className="mt-10 flex justify-between w-full opacity-20 font-mono text-[9px] tracking-[0.4em] uppercase text-slate-500 border-t border-white/5 pt-6">
            <span>PROC: {Math.random().toString(16).substring(2, 6).toUpperCase()}</span>
            <span>AUTH_LOCKED</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
});
