
import React, { useEffect, useRef } from 'react';
import { CommandResult } from '../types';

interface HistoryLogProps {
  history: CommandResult[];
}

export const HistoryLog: React.FC<HistoryLogProps> = ({ history }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  return (
    <div className="glass-panel w-full max-w-lg h-56 rounded-lg flex flex-col overflow-hidden relative group transition-all duration-300 hover:bg-slate-900/70">
      {/* Header */}
      <div className="h-6 bg-white/5 border-b border-white/5 flex items-center justify-between px-3">
         <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Term.Log
         </span>
         <div className="flex gap-1">
            <div className="w-1 h-1 rounded-full bg-slate-600"></div>
            <div className="w-1 h-1 rounded-full bg-slate-600"></div>
            <div className="w-1 h-1 rounded-full bg-slate-600"></div>
         </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs custom-scrollbar">
        {history.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2 opacity-50">
            <div className="w-8 h-8 border border-slate-600 rounded flex items-center justify-center">
                <span className="animate-pulse">_</span>
            </div>
            <span>AWAITING INPUT...</span>
          </div>
        )}
        
        {history.map((entry, index) => (
          <div key={index} className="flex flex-col space-y-1 animate-in slide-in-from-left-2 duration-300">
             {/* Metadata */}
            <div className="flex items-center gap-2 text-[9px] text-slate-500">
               <span className="opacity-50">[{new Date(entry.timestamp).toLocaleTimeString([], {hour12: false})}]</span>
               <span className="px-1 bg-white/5 rounded text-slate-400">{entry.actionType}</span>
            </div>
            
            {/* User Command */}
            {!entry.isSystemMessage && (
               <div className="flex items-start gap-2 text-slate-300">
                 <span className="text-cyan-500 font-bold">➜</span>
                 <span className="break-words">{entry.transcript}</span>
               </div>
            )}
            
            {/* System Response */}
            <div className={`pl-4 border-l border-white/10 ${entry.language === 'hi' ? 'text-orange-200' : 'text-emerald-200'} leading-relaxed opacity-90`}>
              {entry.response}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      
      {/* Scanline overlay specific to terminal */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 pointer-events-none bg-[size:100%_2px,3px_100%] opacity-20"></div>
    </div>
  );
};
