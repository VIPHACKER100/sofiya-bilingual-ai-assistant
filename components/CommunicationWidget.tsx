
import React, { useState, useEffect } from 'react';
import { CommunicationData } from '../types';
import { soundService } from '../services/soundService';

interface CommunicationWidgetProps {
  data: CommunicationData;
  isVisible: boolean;
  language: 'en' | 'hi';
  onClose: () => void;
}

export const CommunicationWidget: React.FC<CommunicationWidgetProps> = ({ data, isVisible, language, onClose }) => {
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
          soundService.playTextType();
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

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-500">
      <div className={`glass-panel w-full max-w-md rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border-2 transition-colors duration-500 relative ${status === 'calling' ? 'accent-border accent-emerald' : 'accent-border accent-cyan'}`}>

        {/* Cinematic Overlays */}
        <div className="scanline opacity-10"></div>
        <div className="vignette"></div>

        {/* Header */}
        <div className="bg-white/5 p-5 flex justify-between items-center relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold border border-white/10 shadow-inner group overflow-hidden">
                <div className={`absolute inset-0 accent-bg opacity-20 ${status === 'calling' ? 'accent-emerald animate-pulse' : 'accent-cyan'}`}></div>
                <span className="relative z-10 text-xl font-mono">{data.contact.charAt(0).toUpperCase()}</span>
              </div>
              {status === 'calling' && <div className="absolute -bottom-1 -right-1 w-4 h-4 accent-bg accent-emerald rounded-full border-2 border-black animate-bounce"></div>}
            </div>
            <div>
              <div className="text-white font-bold tracking-widest text-lg uppercase font-mono">{data.contact}</div>
              <div className={`text-[10px] uppercase tracking-[0.3em] font-mono flex items-center gap-2 ${status === 'calling' ? 'accent-text accent-emerald' : 'accent-text accent-cyan'}`}>
                <span className={`w-1.5 h-1.5 rounded-full accent-bg ${status === 'calling' || status === 'sending' ? 'animate-ping' : 'opacity-40'}`}></span>
                {data.type === 'message' ? (language === 'hi' ? 'एनक्रिप्टेड संदेश' : 'ENCRYPTED_MSG') : (language === 'hi' ? 'वॉयस लिंक' : 'VOICE_UPLINK')}
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-10 min-h-[220px] flex flex-col justify-center relative bg-black/40 border-y border-white/5">
          {/* Grid bg */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

          {data.type === 'message' ? (
            <div className="relative z-10">
              <div className="text-cyan-100 font-mono text-xl leading-relaxed border-l-4 accent-border accent-cyan pl-6 py-4 bg-gradient-to-r from-cyan-950/20 to-transparent italic">
                "{typedContent}<span className="animate-pulse w-2 h-6 inline-block accent-bg accent-cyan align-middle ml-1"></span>"
              </div>
            </div>
          ) : (
            <div className="relative z-10 flex flex-col items-center gap-8">
              {/* Sound wave visualizer for call */}
              <div className="flex items-center gap-1.5 h-16">
                {[...Array(15)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 accent-bg accent-emerald opacity-80 rounded-full transition-all duration-300"
                    style={{
                      height: status === 'calling' ? `${20 + Math.random() * 80}%` : '15%'
                    }}
                  ></div>
                ))}
              </div>
              <div className="accent-text accent-emerald text-[10px] animate-pulse tracking-[0.5em] font-mono uppercase">
                {status === 'calling' ? (language === 'hi' ? 'कनेक्ट हो रहा है...' : 'ESTABLISHING_LINK...') : (language === 'hi' ? 'लिंक सक्रिय' : 'LINK_SECURED')}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 flex gap-4 relative z-10 bg-black/20">
          <button
            onClick={onClose}
            title="Abort Session"
            className="flex-1 py-3 rounded-xl hover:bg-white/5 text-slate-500 hover:text-white transition-all uppercase font-mono text-[10px] tracking-[0.3em] border border-white/5"
          >
            {language === 'hi' ? 'रद्द करें' : 'ABORT'}
          </button>

          {data.type === 'message' && status === 'draft' && (
            <button
              onClick={handleSend}
              title="Transmit Message"
              className="flex-1 py-3 rounded-xl accent-bg accent-cyan text-black font-extrabold uppercase font-mono text-[10px] tracking-[0.3em] shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all hover:scale-105 active:scale-95"
            >
              {language === 'hi' ? 'भेजें' : 'TRANSMIT'}
            </button>
          )}

          {data.type === 'call' && status !== 'ended' && (
            <button
              onClick={handleCallEnd}
              title="Terminate Call"
              className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold uppercase font-mono text-[10px] tracking-[0.3em] shadow-[0_0_30px_rgba(239,68,68,0.3)] transition-all hover:scale-105 active:scale-95"
            >
              {language === 'hi' ? 'काटें' : 'TERMINATE'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
