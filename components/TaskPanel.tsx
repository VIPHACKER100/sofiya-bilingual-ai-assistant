
import React from 'react';

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

export const TaskPanel: React.FC<TaskPanelProps> = ({ tasks, isVisible, language, onClose, accentColor = '#8b5cf6' }) => {
  if (!isVisible) return null;

  const accentClass = getAccentClass(accentColor);

  return (
    <div
      className={`glass-panel absolute top-24 left-4 md:left-8 w-72 p-5 rounded-2xl animate-in slide-in-from-left duration-700 border-l-2 accent-border ${accentClass} shadow-[0_0_30px_rgba(0,0,0,0.2)]`}
    >
      <div className="flex items-center justify-between mb-5 border-b border-white/5 pb-2">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full accent-bg ${accentClass}`}></div>
          <span className={`text-[10px] font-mono tracking-[0.3em] uppercase accent-text ${accentClass}`}>
            {language === 'hi' ? 'कार्य प्रोटोकॉल' : 'TASK_PROTOCOLS'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-mono text-slate-500 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">{tasks.length}</span>
          <button onClick={onClose} title="Close tasks" className="text-slate-500 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="space-y-1.5 max-h-72 overflow-y-auto custom-scrollbar pr-1">
        {tasks.length === 0 ? (
          <div className="text-[10px] text-slate-500 font-mono italic text-center py-6 opacity-40 uppercase tracking-widest">
            {language === 'hi' ? 'कोई सक्रिय कार्य नहीं।' : 'NO_ACTIVE_TASKS'}
          </div>
        ) : (
          tasks.map((task, idx) => (
            <div key={idx} className="group flex items-start gap-3 text-[11px] text-slate-400 border-b border-white/5 py-3 last:border-0 hover:bg-white/5 px-2 rounded-xl transition-all cursor-default">
              <div className={`mt-1.5 w-1.5 h-1.5 rounded-full accent-bg ${accentClass} opacity-30 group-hover:opacity-100 group-hover:accent-glow transition-all`}></div>
              <span className="leading-snug font-mono uppercase tracking-tight group-hover:text-white transition-colors">{task}</span>
            </div>
          ))
        )}
      </div>

      {/* Footer Brackets */}
      <div className="mt-4 flex justify-between items-center opacity-10">
        <div className={`w-8 h-[1px] accent-bg ${accentClass}`}></div>
        <div className="text-[7px] font-mono tracking-widest">v4.3_STABLE</div>
        <div className={`w-8 h-[1px] accent-bg ${accentClass}`}></div>
      </div>
    </div>
  );
};
