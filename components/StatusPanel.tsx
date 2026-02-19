
import React, { useState, useEffect } from 'react';

export const StatusPanel: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
  const [cpu, setCpu] = useState(32);
  const [mem, setMem] = useState(14);
  const [netActivity, setNetActivity] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setCpu(prev => Math.min(100, Math.max(10, prev + (Math.random() > 0.5 ? 5 : -5))));
      setMem(prev => Math.min(100, Math.max(10, prev + (Math.random() > 0.5 ? 2 : -2))));
      setNetActivity(Math.random() > 0.3);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-panel w-40 p-3 rounded-bl-xl border-t-0 border-r-0 border-white/10 flex flex-col gap-3 animate-in slide-in-from-right duration-700">
       <div className="text-[9px] font-mono text-slate-500 tracking-widest uppercase mb-1 border-b border-white/5 pb-1">
          Sys.Diagnostics
       </div>

       {/* CPU Graph */}
       <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[10px] font-mono text-cyan-400">
             <span>CPU</span>
             <span>{cpu}%</span>
          </div>
          <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
             <div className="h-full bg-cyan-500 transition-all duration-300" style={{ width: `${cpu}%` }}></div>
          </div>
       </div>

       {/* Memory Graph */}
       <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[10px] font-mono text-purple-400">
             <span>MEM</span>
             <span>{mem}%</span>
          </div>
          <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
             <div className="h-full bg-purple-500 transition-all duration-300" style={{ width: `${mem}%` }}></div>
          </div>
       </div>

       {/* Network Status */}
       <div className="flex items-center justify-between text-[10px] font-mono mt-1">
          <span className="text-slate-400">NET</span>
          <div className="flex gap-0.5">
             {[1,2,3,4].map(i => (
                <div 
                   key={i} 
                   className={`w-1 h-2 rounded-sm ${netActivity ? 'bg-emerald-500' : 'bg-slate-700'}`}
                   style={{ opacity: netActivity ? Math.random() + 0.2 : 0.2 }}
                ></div>
             ))}
          </div>
       </div>
    </div>
  );
};
