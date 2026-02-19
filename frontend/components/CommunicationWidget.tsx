
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Phone, X, Send, PhoneOff, ShieldCheck, User, Zap, Wifi } from 'lucide-react';
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
          soundService.playUIClick();
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
        className="absolute inset-0 bg-black/95 backdrop-blur-2xl"
      />

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 30, rotateX: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0, rotateX: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 30, rotateX: 10 }}
        className={`relative w-full max-w-xl glass-panel rounded-[3rem] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.9)] border-b-4 accent-border ${accentClass} z-10`}
      >
        <div className="scanline opacity-10"></div>
        <div className="vignette opacity-50"></div>

        {/* Header Section */}
        <div className="p-10 pb-6 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className={`w-20 h-20 rounded-[2rem] bg-slate-900/50 flex items-center justify-center border border-white/10 shadow-inner overflow-hidden relative`}
              >
                <div className={`absolute inset-0 accent-bg opacity-20 ${accentClass} ${status === 'calling' ? 'animate-pulse' : ''}`}></div>
                <User className="w-10 h-10 text-white relative z-10" strokeWidth={1.5} />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border border-white/5 rounded-[2rem]"
                />
              </motion.div>
              {status === 'calling' && (
                <motion.div
                  animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute -top-1 -right-1 w-5 h-5 accent-bg accent-emerald rounded-full border-2 border-black z-20"
                ></motion.div>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-white text-3xl font-black tracking-tight uppercase leading-none">{data.contact}</h2>
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-2 text-[10px] font-black tracking-[0.4em] uppercase ${accentClass === 'accent-emerald' ? 'text-emerald-500' : 'text-cyan-500'}`}>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {data.type === 'message' ? (language === 'hi' ? 'सुरक्षित ड्राफ्ट' : 'SECURE_DRAFT') : (language === 'hi' ? 'वॉयस लिंक' : 'ENCRYPTED_VOICE')}
                </div>
                <div className="w-1 h-1 bg-white/20 rounded-full"></div>
                <div className="text-[10px] font-mono text-slate-500 tracking-widest uppercase flex items-center gap-2">
                  <Wifi className="w-3 h-3" />
                  P2P_ACTIVE
                </div>
              </div>
            </div>
          </div>
          <motion.button
            whileHover={{ rotate: 90, scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-3 text-slate-500 hover:text-white transition-all hover:bg-white/5 rounded-2xl"
            title="Close Panel"
          >
            <X className="w-7 h-7" />
          </motion.button>
        </div>

        {/* Content Body */}
        <div className="p-12 min-h-[340px] flex flex-col justify-center relative bg-black/40 border-y border-white/5 mx-8 rounded-[2.5rem] my-4 overflow-hidden shadow-inner group cyber-border">
          <div className="absolute inset-0 opacity-10 pointer-events-none radial-dots"></div>

          <AnimatePresence mode="wait">
            {data.type === 'message' ? (
              <motion.div
                key="message"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10"
              >
                <div className={`text-white font-mono text-2xl leading-relaxed pl-10 py-8 border-l-4 accent-border ${accentClass} bg-gradient-to-r from-cyan-950/30 to-transparent italic rounded-r-3xl shadow-xl`}>
                  <div className="absolute -top-6 left-10 text-[9px] font-black tracking-[0.6em] text-cyan-500 opacity-40 uppercase">Payload_Data:</div>
                  <span className="opacity-40 font-black">{"_> "}</span>
                  {typedContent}
                  <motion.span
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className={`inline-block w-3 h-7 accent-bg ${accentClass} align-middle ml-3 shadow-[0_0_15px_currentColor]`}
                  ></motion.span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="call"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="relative z-10 flex flex-col items-center gap-12"
              >
                <div className="flex items-center gap-3 h-28">
                  {[...Array(24)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        height: status === 'calling' ? [`${20 + Math.random() * 40}%`, `${40 + Math.random() * 60}%`, `${20 + Math.random() * 40}%`] : '6px',
                        opacity: status === 'calling' ? [0.4, 1, 0.4] : 0.1
                      }}
                      transition={{
                        duration: 0.5 + Math.random() * 0.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className={`w-1.5 accent-bg ${accentClass} rounded-full shadow-[0_0_20px_rgba(16,185,129,0.4)]`}
                    ></motion.div>
                  ))}
                </div>
                <div className="flex flex-col items-center gap-4">
                  <div className={`text-xs font-black font-mono tracking-[0.6em] uppercase text-center ${status === 'calling' ? 'text-emerald-500' : 'text-slate-500'}`}>
                    {status === 'calling' ? (language === 'hi' ? 'सुरक्षित कनेक्शन स्थापित हो रहा है...' : 'ESTABLISHING_ENCRYPTED_LINK...') : (language === 'hi' ? 'सत्र समाप्त' : 'SESSION_TERMINATED')}
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3].map(i => <motion.div key={i} animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }} className={`w-1 h-1 rounded-full ${status === 'calling' ? 'bg-emerald-500' : 'bg-slate-700'}`} />)}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="p-10 flex gap-6 relative z-10 bg-black/30">
          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            title="Abort Task"
            className="flex-1 py-5 rounded-2xl bg-white/5 text-slate-500 hover:text-red-500 transition-all font-black text-xs tracking-[0.4em] uppercase border border-white/5 active:scale-95 flex items-center justify-center gap-3 group"
          >
            <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            {language === 'hi' ? 'रद्द' : 'ABORT'}
          </motion.button>

          <AnimatePresence>
            {data.type === 'message' && status === 'draft' && (
              <motion.button
                key="send"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                whileHover={{ scale: 1.03, boxShadow: '0 0 40px rgba(6, 182, 212, 0.4)' }}
                whileTap={{ scale: 0.97 }}
                onClick={handleSend}
                title="Ship Package"
                className={`flex-[2] py-5 rounded-2xl accent-bg ${accentClass} text-black font-black text-xs tracking-[0.5em] uppercase shadow-2xl flex items-center justify-center gap-3 group`}
              >
                <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                {language === 'hi' ? 'ट्रांसमिट' : 'TRANSMIT'}
              </motion.button>
            )}

            {data.type === 'call' && status !== 'ended' && (
              <motion.button
                key="call-off"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                whileHover={{ scale: 1.03, boxShadow: '0 0 40px rgba(239, 68, 68, 0.4)' }}
                whileTap={{ scale: 0.97 }}
                onClick={handleCallEnd}
                title="Disconnect Node"
                className="flex-[2] py-5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-xs tracking-[0.5em] uppercase shadow-2xl flex items-center justify-center gap-3 group"
              >
                <PhoneOff className="w-5 h-5 group-hover:scale-110 transition-transform" />
                {language === 'hi' ? 'डिस्कनेक्ट' : 'TERMINATE'}
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Status Bar */}
        <div className="px-10 py-4 border-t border-white/5 flex justify-between items-center opacity-30 text-[9px] font-black font-mono tracking-[0.5em] uppercase text-slate-500">
          <div className="flex items-center gap-4">
            <Zap className="w-3 h-3 text-cyan-400" />
            BITRATE: 4.2MBPS
          </div>
          <div className="flex items-center gap-4">
            PROTOCOL: SF_NET_V2
            <div className="flex gap-1">
              {[1, 2, 3, 4].map(i => <div key={i} className={`w-1 h-2 rounded-full ${i <= 3 ? `accent-bg ${accentClass}` : 'bg-white/10'}`} />)}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
});
