
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ListTodo, X, CheckSquare, Target, Activity } from 'lucide-react';

interface TaskPanelProps {
  tasks: string[];
  isVisible: boolean;
  language: 'en' | 'hi';
  onClose: () => void;
  accentColor?: string;
}

const getAccentClass = (hex: string) => {
  const map: Record<string, string> = {
    '#8b5cf6': 'accent-violet',
    '#06b6d4': 'accent-cyan',
    '#f59e0b': 'accent-amber',
    '#ef4444': 'accent-red',
    '#10b981': 'accent-emerald',
    '#ec4899': 'accent-pink'
  };
  return map[hex.toLowerCase()] || 'accent-violet';
};

export const TaskPanel = React.memo(({ tasks, isVisible, language, onClose, accentColor = '#8b5cf6' }: TaskPanelProps) => {
  if (!isVisible) return null;

  const accentClass = getAccentClass(accentColor);

  return (
    <motion.div
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -100, opacity: 0 }}
      className={`glass-panel absolute top-24 left-4 md:left-8 w-80 p-8 rounded-[2.5rem] border-l-2 accent-border ${accentClass} shadow-[0_40px_100px_rgba(0,0,0,0.5)] z-40 transition-all duration-500`}
    >
      <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <ListTodo className={`w-4 h-4 accent-text ${accentClass} animate-pulse`} />
          <span className={`text-[11px] font-black tracking-[0.4em] uppercase accent-text ${accentClass}`}>
            {language === 'hi' ? 'कार्य प्रोटोकॉल' : 'TASK_PROTOCOL_X'}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-black font-mono text-white/40 bg-white/5 px-3 py-1 rounded-full border border-white/5 shadow-inner">
            {tasks.length.toString().padStart(2, '0')}
          </span>
          <button onClick={onClose} title="Close tasks" className="p-2 text-slate-600 hover:text-white transition-all hover:bg-white/5 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-3 relative z-10">
        <AnimatePresence mode="popLayout">
          {tasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 gap-4 opacity-40"
            >
              <CheckSquare className="w-8 h-8 text-slate-700" />
              <span className="text-[9px] font-mono tracking-[0.5em] uppercase text-center italic">
                {language === 'hi' ? 'कोई सक्रिय कार्य नहीं।' : 'ZERO_ACTIVE_THREADS'}
              </span>
            </motion.div>
          ) : (
            tasks.map((task, idx) => (
              <motion.div
                key={`${task}-${idx}`}
                layout
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="group flex items-start gap-4 text-[11px] text-slate-400 border-b border-white/5 py-4 last:border-0 hover:bg-white/5 px-4 rounded-2xl transition-all cursor-default relative overflow-hidden"
              >
                <div className={`mt-1.5 w-1.5 h-1.5 rounded-full accent-bg ${accentClass} opacity-20 group-hover:opacity-100 group-hover:scale-125 transition-all shadow-[0_0_10px_currentColor]`}></div>
                <span className="leading-relaxed font-mono font-bold uppercase tracking-tight group-hover:text-white transition-colors relative z-10">
                  {task}
                </span>

                {/* Interactive glow on hover */}
                <div className={`absolute inset-0 accent-bg ${accentClass} opacity-0 group-hover:opacity-[0.02] transition-opacity duration-500`}></div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Footer Design */}
      <div className="mt-8 flex justify-between items-center opacity-30 select-none">
        <div className="flex gap-1.5">
          <Target className="w-3 h-3" />
          <Activity className="w-3 h-3" />
        </div>
        <span className="text-[8px] font-mono tracking-[0.5em] font-black uppercase">v4.3_UPLINK</span>
      </div>
    </motion.div>
  );
});
