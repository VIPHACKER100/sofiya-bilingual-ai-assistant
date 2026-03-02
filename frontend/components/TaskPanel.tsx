
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ListTodo, X, CheckSquare, Target, Activity } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  is_shared: boolean;
}

interface TaskPanelProps {
  tasks: Task[];
  isVisible: boolean;
  language: 'en' | 'hi';
  onClose: () => void;
  onToggleTask: (taskId: string, completed: boolean) => void;
  onAddTask: (title: string, isShared: boolean) => void;
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

export const TaskPanel = React.memo(({ tasks, isVisible, language, onClose, onToggleTask, onAddTask, accentColor = '#8b5cf6' }: TaskPanelProps) => {
  const [newTaskTitle, setNewTaskTitle] = React.useState('');
  const [isNewTaskShared, setIsNewTaskShared] = React.useState(false);

  if (!isVisible) return null;

  const accentClass = getAccentClass(accentColor);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      onAddTask(newTaskTitle, isNewTaskShared);
      setNewTaskTitle('');
      setIsNewTaskShared(false);
    }
  };

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

      <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-3 relative z-10 mb-6">
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
            tasks.map((task) => (
              <motion.div
                key={task.id}
                layout
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className={`group flex items-start gap-4 text-[11px] border-b border-white/5 py-4 last:border-0 hover:bg-white/5 px-4 rounded-2xl transition-all cursor-default relative overflow-hidden ${task.completed ? 'opacity-50' : ''}`}
              >
                <button
                  onClick={() => onToggleTask(task.id, !task.completed)}
                  className={`mt-1 w-4 h-4 rounded border flex items-center justify-center transition-all ${task.completed ? 'bg-cyan-500 border-cyan-500' : 'border-white/20 hover:border-white/40'}`}
                >
                  {task.completed && <CheckSquare className="w-3 h-3 text-black" />}
                </button>
                <div className="flex flex-col flex-1">
                  <span className={`leading-relaxed font-mono font-bold uppercase tracking-tight group-hover:text-white transition-colors relative z-10 ${task.completed ? 'line-through text-slate-600' : 'text-slate-400'}`}>
                    {task.title}
                  </span>
                  {task.is_shared && (
                    <span className="text-[7px] font-black text-cyan-500/60 uppercase tracking-widest mt-1">SHARED_TASK</span>
                  )}
                </div>

                {/* Interactive glow on hover */}
                <div className={`absolute inset-0 accent-bg ${accentClass} opacity-0 group-hover:opacity-[0.02] transition-opacity duration-500`}></div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* New Task Input */}
      <form onSubmit={handleAddTask} className="relative z-10 mt-4 space-y-3 border-t border-white/5 pt-4">
        <div className="relative">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder={language === 'hi' ? 'नया कार्य जोड़ें...' : 'APPEND_NEW_THREAD...'}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] font-mono focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-white/20 text-white"
          />
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={isNewTaskShared}
              onChange={(e) => setIsNewTaskShared(e.target.checked)}
              className="hidden"
            />
            <div className={`w-3 h-3 rounded-sm border transition-all ${isNewTaskShared ? 'bg-cyan-500 border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'border-white/20 group-hover:border-white/40'}`}></div>
            <span className="text-[8px] font-black text-white/40 uppercase tracking-widest group-hover:text-white/60 transition-colors">
              {language === 'hi' ? 'साझा करें' : 'SHARE_WITH_CORE'}
            </span>
          </label>
          <button
            type="submit"
            className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${newTaskTitle.trim() ? 'bg-white/10 text-white hover:bg-white/20 cursor-pointer' : 'text-white/20 cursor-not-allowed'}`}
            disabled={!newTaskTitle.trim()}
          >
            {language === 'hi' ? 'जोड़ें' : 'COMMIT'}
          </button>
        </div>
      </form>

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
