/**
 * SOFIYA Voice Interface
 * Phase 11.2: Visual feedback for voice interaction
 * 
 * Animated mic state, transcript display, response animation, command history sidebar.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff } from 'lucide-react';
import { ArcReactor } from '../../components/ArcReactor';
import { Waveform } from '../../components/Waveform';
import { AppMode } from '../types';

interface HistoryEntry {
  transcript: string;
  response: string;
  actionType?: string;
  timestamp: number;
}

interface VoiceInterfaceProps {
  mode: AppMode;
  transcript: string | null;
  response?: string | null;
  history: HistoryEntry[];
  accentColor?: string;
  onToggle: () => void;
  language?: 'en' | 'hi';
}

export function VoiceInterface({
  mode,
  transcript,
  response,
  history,
  accentColor = '#8b5cf6',
  onToggle,
  language = 'en'
}: VoiceInterfaceProps) {
  const isListening = mode === AppMode.LISTENING;
  const isProcessing = mode === AppMode.PROCESSING;

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Transcript bubble */}
      <AnimatePresence>
        {transcript && (
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -20, opacity: 0, scale: 0.9 }}
            className="absolute -top-28 left-1/2 -translate-x-1/2 w-[20rem] lg:w-[24rem] text-center"
          >
            <div className="glass-panel px-6 py-3 rounded-[2rem] border-t border-white/10">
              <p className="text-lg font-medium text-white/90 italic">"{transcript}"</p>
              <div className="mt-2 flex justify-center gap-1">
                {[1, 2, 3].map(i => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                    className="w-1 h-1 rounded-full"
                    style={{ backgroundColor: accentColor }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Arc Reactor + Mic */}
      <div className="relative">
        <ArcReactor
          isActive={isListening || isProcessing}
          onClick={onToggle}
          language={language}
          color={accentColor}
        />
        <motion.div
          animate={{
            scale: isListening ? [1, 1.1, 1] : 1,
            opacity: isListening ? 1 : 0.7
          }}
          transition={{ repeat: isListening ? Infinity : 0, duration: 1.5 }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          {isListening ? (
            <MicOff className="w-8 h-8 text-white/80" />
          ) : (
            <Mic className="w-8 h-8 text-white/60" />
          )}
        </motion.div>
      </div>

      {/* Waveform */}
      <div className="w-full max-w-lg">
        <Waveform mode={mode} color={accentColor} />
      </div>

      {/* Response animation */}
      <AnimatePresence>
        {response && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center max-w-md"
          >
            <p className="text-slate-300 text-sm">{response}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Command history sidebar hint */}
      {history.length > 0 && (
        <p className="text-[10px] text-slate-500 font-mono">
          {history.length} command{history.length !== 1 ? 's' : ''} in session
        </p>
      )}
    </div>
  );
}
