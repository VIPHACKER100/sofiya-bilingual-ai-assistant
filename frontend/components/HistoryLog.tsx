
import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Hash, ChevronRight, Activity } from 'lucide-react';
import { CommandResult } from '../types';

interface HistoryLogProps {
  history: CommandResult[];
}

export const HistoryLog = React.memo(({ history }: HistoryLogProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  return (
    <div className="glass-panel w-full max-w-xl h-64 rounded-3xl flex flex-col overflow-hidden relative group border-b-2 accent-border accent-violet shadow-2xl">
      {/* Visual background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.02)_1px,transparent_1px)] bg-[size:30px_30px] opacity-30 pointer-events-none"></div>

      {/* Header */}
      <div className="h-10 bg-white/5 border-b border-white/5 flex items-center justify-between px-6 relative z-10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Terminal className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
            CORE_TRANSCRIPT_X4
          </span>
        </div>
        <div className="flex gap-1.5 grayscale opacity-30">
          <Activity className="w-3 h-3 text-violet-500" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 font-mono text-xs custom-scrollbar relative z-10">
        <AnimatePresence mode="popLayout">
          {history.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4"
            >
              <div className="w-12 h-12 border border-white/5 rounded-2xl flex items-center justify-center bg-white/5">
                <span className="text-xl animate-pulse">_</span>
              </div>
              <span className="tracking-[0.4em] text-[8px] font-black uppercase opacity-40">Awaiting_Uplink</span>
            </motion.div>
          ) : (
            history.map((entry, index) => (
              <motion.div
                key={`${entry.timestamp}-${index}`}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="flex flex-col space-y-2"
              >
                {/* Metadata Tag */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] text-slate-600 bg-black/40 px-2 py-0.5 rounded border border-white/5 font-bold">
                      {new Date(entry.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <span className={`text-[8px] tracking-widest uppercase font-black ${entry.isSystemMessage ? 'text-violet-500' : 'text-cyan-500'}`}>
                      {entry.actionType}
                    </span>
                  </div>
                  <Hash className="w-2.5 h-2.5 text-slate-700" />
                </div>

                {/* User Input */}
                {!entry.isSystemMessage && (
                  <div className="flex items-start gap-2 text-white/80 pl-2">
                    <ChevronRight className="w-3.5 h-3.5 text-cyan-500 mt-0.5" />
                    <span className="uppercase tracking-tight font-black">{entry.transcript}</span>
                  </div>
                )}

                {/* Intelligence Response */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className={`pl-8 border-l-2 ${entry.language === 'hi' ? 'border-orange-500/30 text-orange-200' : 'border-emerald-500/30 text-emerald-300'} leading-relaxed text-[11px] font-medium italic relative group`}
                >
                  <div className="absolute top-0 -left-[1.5px] w-[2px] h-full bg-gradient-to-b from-transparent via-current to-transparent opacity-50"></div>
                  {entry.response}
                </motion.div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
        <div ref={bottomRef} className="h-4" />
      </div>

      {/* Interactive Scanline specifically for text clarity */}
      <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(0,0,0,0.05)_50%,transparent_100%)] z-20 pointer-events-none bg-[size:100%_4px] opacity-10"></div>
    </div>
  );
});
