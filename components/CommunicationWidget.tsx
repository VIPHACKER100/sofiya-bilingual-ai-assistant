
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Phone, X, Send, PhoneOff, ShieldCheck, User } from 'lucide-react';
import { CommunicationData } from '../types';
import { soundService } from '../services/soundService';

interface CommunicationWidgetProps {
  data: CommunicationData;
  isVisible: boolean;
  language: 'en' | 'hi';
  onClose: () => void;
}

export const CommunicationWidget = React.memo(({ data, isVisible, language, onClose }: CommunicationWidgetProps) => {
  const [status, setStatus] = useState(data.status);
  const [typedContent, setTypedContent] = useState('');

  useEffect(() => {
    if (isVisible && data.type === 'message' && data.content) {
      setTypedContent('');
      setStatus('draft');
      let idx = 0;
      const content = data.content;
      const interval = setInterval(() => {
        if (idx < (content.length || 0)) {
          setTypedContent(prev => prev + (content[idx] || ''));
          soundService.playUIClick(); // Using UIClick for tactile feedback
          idx++;
        } else {
          clearInterval(interval);
        }
      }, 40);
      return () => clearInterval(interval);
    }
    if (isVisible && data.type === 'call') {
      setStatus('calling');
    }
  }, [isVisible, data]);

  const handleSend = () => {
    setStatus('sending');
    soundService.playUIConfirm();
    setTimeout(() => {
      setStatus('sent');
      soundService.playMessageSent();
      setTimeout(onClose, 2000);
    }, 1500);
  };

  const handleCallEnd = () => {
    setStatus('ended');
    setTimeout(onClose, 1000);
  };

  const getAccentClass = (s: string) => {
    return s === 'calling' || s === 'ended' ? 'accent-emerald' : 'accent-cyan';
  };

  if (!isVisible) return null;

  const accentClass = getAccentClass(status);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/90 backdrop-blur-xl"
      />

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className={`relative w-full max-w-lg glass-panel rounded-[2rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)] border-b-2 accent-border ${accentClass} z-10`}
      >
        <div className="scanline opacity-10"></div>

        {/* Header Section */}
        <div className="p-8 pb-4 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-5">
            <div className="relative group">
              <div className={`w-16 h-16 rounded-3xl bg-slate-900/50 flex items-center justify-center border border-white/10 shadow-inner overflow-hidden relative transition-all duration-500 group-hover:scale-105 group-hover:rotate-3`}>
                <div className={`absolute inset-0 accent-bg opacity-10 ${accentClass} ${status === 'calling' ? 'animate-pulse' : ''}`}></div>
                <User className="w-8 h-8 text-white/50 relative z-10" />
              </div>
              {status === 'calling' && (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="absolute -top-1 -right-1 w-4 h-4 accent-bg accent-emerald rounded-full border-2 border-black"
                ></motion.div>
              )}
            </div>
            <div>
              <h2 className="text-white text-2xl font-black tracking-tight uppercase leading-none mb-1">{data.contact}</h2>
              <div className={`flex items-center gap-2 text-[9px] font-mono font-bold tracking-[0.3em] uppercase opacity-60 ${accentClass === 'accent-emerald' ? 'text-emerald-400' : 'text-cyan-400'}`}>
                <ShieldCheck className="w-3 h-3" />
                {data.type === 'message' ? (language === 'hi' ? 'एनक्रिप्टेड डेटा' : 'SECURE_DRAFT') : (language === 'hi' ? 'वॉयस स्ट्रीम' : 'ENCRYPTED_VOICE')}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-all hover:bg-white/5 rounded-full" title="Close Panel">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-10 min-h-[300px] flex flex-col justify-center relative bg-black/40 border-y border-white/5 mx-6 rounded-[2rem] my-4 overflow-hidden shadow-inner">
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

          <AnimatePresence mode="wait">
            {data.type === 'message' ? (
              <motion.div
                key="message"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="relative z-10"
              >
                <div className={`text-white font-mono text-xl leading-relaxed pl-8 py-6 border-l-4 accent-border ${accentClass} bg-gradient-to-r from-cyan-950/20 to-transparent italic rounded-r-2xl`}>
                  <span className="opacity-40">{"// "}</span>
                  {typedContent}
                  <motion.span
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className={`inline-block w-2.5 h-6 accent-bg ${accentClass} align-middle ml-2 shadow-[0_0_10px_rgba(255,255,255,0.5)]`}
                  ></motion.span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="call"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="relative z-10 flex flex-col items-center gap-10"
              >
                <div className="flex items-center gap-2 h-24">
                  {[...Array(20)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        height: status === 'calling' ? `${20 + Math.random() * 80}%` : '4px',
                        opacity: status === 'calling' ? 1 : 0.2
                      }}
                      transition={{ duration: 0.3 }}
                      className={`w-1 accent-bg ${accentClass} rounded-full shadow-[0_0_15px_rgba(16,185,129,0.3)]`}
                    ></motion.div>
                  ))}
                </div>
                <div className={`text-[10px] font-mono font-black tracking-[0.5em] uppercase text-center ${status === 'calling' ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`}>
                  {status === 'calling' ? (language === 'hi' ? 'कनेक्ट हो रहा है...' : 'SECURE_LINK_PENDING...') : (language === 'hi' ? 'लिंक समाप्त' : 'UPLINK_TERMINATED')}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="p-8 flex gap-5 relative z-10 bg-black/20">
          <button
            onClick={onClose}
            title="Abort Operation"
            className="flex-1 py-4 rounded-2xl bg-white/5 hover:bg-red-500/10 text-slate-500 hover:text-red-500 transition-all font-black text-[11px] tracking-[0.3em] uppercase border border-white/5 active:scale-95 flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            {language === 'hi' ? 'रद्द' : 'ABORT'}
          </button>

          <AnimatePresence>
            {data.type === 'message' && status === 'draft' && (
              <motion.button
                key="send"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={handleSend}
                title="Ship Data"
                className={`flex-[2] py-4 rounded-2xl accent-bg ${accentClass} text-black font-black text-[11px] tracking-[0.3em] uppercase shadow-[0_0_40px_rgba(6,182,212,0.3)] hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-2`}
              >
                <Send className="w-4 h-4" />
                {language === 'hi' ? 'ट्रांसमिट' : 'TRANSMIT'}
              </motion.button>
            )}

            {data.type === 'call' && status !== 'ended' && (
              <motion.button
                key="call-off"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={handleCallEnd}
                title="Cut Uplink"
                className="flex-[2] py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-[11px] tracking-[0.3em] uppercase shadow-[0_0_40px_rgba(239,68,68,0.3)] hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <PhoneOff className="w-4 h-4" />
                {language === 'hi' ? 'डिस्कनेक्ट' : 'TERMINATE'}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
});
