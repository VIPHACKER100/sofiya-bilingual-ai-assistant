
import React from 'react';

interface TaskPanelProps {
  tasks: string[];
  isVisible: boolean;
  language: 'en' | 'hi';
  onClose: () => void;
  accentColor?: string;
}

export const TaskPanel: React.FC<TaskPanelProps> = ({ tasks, isVisible, language, onClose, accentColor = '#f97316' }) => {
  if (!isVisible && tasks.length === 0) return null;
  if (!isVisible) return null;

  return (
    <div 
        className="glass-panel absolute top-24 left-4 md:left-8 w-64 p-4 rounded-xl animate-in slide-in-from-left duration-500 border-l-2"
        style={{ borderColor: accentColor, boxShadow: `0 0 20px ${accentColor}20` }}
    >
      <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
        <span className="text-xs font-mono tracking-widest uppercase" style={{ color: accentColor }}>
          {language === 'hi' ? 'कार्य सूची' : 'TASK PROTOCOLS'}
        </span>
        <div className="flex items-center gap-2">
           <span className="text-[10px] text-slate-300 bg-white/10 px-1.5 rounded">{tasks.length}</span>
           <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
             </svg>
           </button>
        </div>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
        {tasks.length === 0 ? (
          <div className="text-xs text-slate-500 italic text-center py-4">
             {language === 'hi' ? 'कोई कार्य शेष नहीं।' : 'No active tasks.'}
          </div>
        ) : (
          tasks.map((task, idx) => (
            <div key={idx} className="group flex items-start gap-2 text-sm text-slate-300 border-b border-white/5 pb-2 last:border-0 hover:bg-white/5 p-1 rounded transition-colors">
               <div className="mt-1.5 w-2 h-2 rounded-full ring-1 ring-offset-1 ring-offset-transparent transition-all group-hover:bg-current" style={{ borderColor: accentColor, backgroundColor: 'transparent', color: accentColor }}></div>
               <span className="leading-tight font-light">{task}</span>
            </div>
          ))
        )}
      </div>
      
      {/* Decorative Corner */}
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-white/20 rounded-tr-lg"></div>
    </div>
  );
};
