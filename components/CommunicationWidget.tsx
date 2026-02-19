
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

  // Typing effect for message drafting
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="glass-panel w-full max-w-md rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 relative">
        
        {/* Animated Border Glow */}
        <div className={`absolute inset-0 pointer-events-none border-2 transition-colors duration-500 ${status === 'calling' ? 'border-green-500/30 animate-pulse' : 'border-cyan-500/30'}`}></div>

        {/* Header */}
        <div className="bg-white/5 p-4 flex justify-between items-center backdrop-blur-md">
           <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white font-bold border border-white/20 shadow-inner">
                    {data.contact.charAt(0).toUpperCase()}
                </div>
                {status === 'calling' && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900 animate-bounce"></div>}
              </div>
              <div>
                  <div className="text-white font-bold tracking-wide text-lg">{data.contact}</div>
                  <div className="text-[10px] text-cyan-400 uppercase tracking-widest font-mono flex items-center gap-2">
                     <span className={`w-1.5 h-1.5 rounded-full ${status === 'calling' || status === 'sending' ? 'bg-cyan-400 animate-ping' : 'bg-slate-500'}`}></span>
                     {data.type === 'message' ? (language === 'hi' ? 'एनक्रिप्टेड संदेश' : 'ENCRYPTED_MSG') : (language === 'hi' ? 'वॉयस लिंक' : 'VOICE_LINK')}
                  </div>
              </div>
           </div>
        </div>

        {/* Content Body */}
        <div className="p-8 min-h-[180px] flex flex-col justify-center relative bg-black/40">
            {/* Grid bg */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:30px_30px]"></div>

            {data.type === 'message' ? (
                <div className="relative z-10">
                    <div className="text-cyan-100 font-mono text-lg leading-relaxed border-l-4 border-cyan-500 pl-4 py-2 bg-gradient-to-r from-cyan-900/20 to-transparent">
                        "{typedContent}<span className="animate-pulse w-2 h-5 inline-block bg-cyan-400 align-middle ml-1"></span>"
                    </div>
                </div>
            ) : (
                <div className="relative z-10 flex flex-col items-center gap-6">
                     {/* Sound wave visualizer for call */}
                    <div className="flex items-center gap-1 h-12">
                         {[...Array(10)].map((_, i) => (
                             <div 
                                key={i} 
                                className="w-1.5 bg-green-500/80 rounded-full animate-[pulse_1s_ease-in-out_infinite]"
                                style={{ 
                                    height: status === 'calling' ? `${20 + Math.random() * 80}%` : '20%',
                                    animationDelay: `${i * 0.1}s` 
                                }}
                             ></div>
                         ))}
                    </div>
                    <div className="text-green-400 text-sm animate-pulse tracking-[0.2em] font-mono">
                        {status === 'calling' ? (language === 'hi' ? 'कनेक्ट हो रहा है...' : 'ESTABLISHING UPLINK...') : (language === 'hi' ? 'जुड़ा हुआ' : 'CONN_ESTABLISHED')}
                    </div>
                </div>
            )}
        </div>

        {/* Footer Actions */}
        <div className="bg-white/5 p-4 flex gap-4 backdrop-blur-md border-t border-white/5">
           <button 
             onClick={onClose} 
             className="flex-1 py-3 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors uppercase font-mono text-xs tracking-widest border border-white/5"
           >
             {language === 'hi' ? 'रद्द करें' : 'ABORT'}
           </button>
           
           {data.type === 'message' && status === 'draft' && (
               <button 
                 onClick={handleSend} 
                 className="flex-1 py-3 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold uppercase font-mono text-xs tracking-widest shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all hover:scale-105"
               >
                 {language === 'hi' ? 'भेजें' : 'TRANSMIT'}
               </button>
           )}
           
           {data.type === 'call' && status !== 'ended' && (
                <button 
                 onClick={handleCallEnd} 
                 className="flex-1 py-3 rounded bg-red-600 hover:bg-red-500 text-white font-bold uppercase font-mono text-xs tracking-widest shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all hover:scale-105"
               >
                 {language === 'hi' ? 'काटें' : 'TERMINATE'}
               </button>
           )}
        </div>

      </div>
    </div>
  );
};
