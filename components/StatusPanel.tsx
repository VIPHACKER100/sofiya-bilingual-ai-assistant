
import React, { useState, useEffect } from 'react';

export const StatusPanel: React.FC<{ isDarkMode: boolean }> = () => {
   const [cpu, setCpu] = useState(32);
   const [mem, setMem] = useState(14);
   const [netActivity, setNetActivity] = useState(true);

   useEffect(() => {
      const interval = setInterval(() => {
         setCpu(prev => Math.min(99, Math.max(0, prev + (Math.random() > 0.5 ? 2 : -2))));
         setMem(prev => Math.min(99, Math.max(0, prev + (Math.random() > 0.5 ? 1 : -1))));
         setNetActivity(Math.random() > 0.2);
      }, 2000);
      return () => clearInterval(interval);
   }, []);

   return (
      <div className="glass-panel w-48 p-4 rounded-bl-xl border-t-0 border-r-0 border-white/10 flex flex-col gap-4 animate-in slide-in-from-right duration-700">
         <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <div className="text-[9px] font-mono text-slate-500 tracking-[0.2em] uppercase">
               SYS.DIAGNOSTICS
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
         </div>

         {/* CPU Graph */}
         <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-[10px] font-mono accent-text accent-cyan">
               <span className="opacity-70">CPU_LOAD</span>
               <span className="font-bold">{cpu}%</span>
            </div>
            <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
               <div
                  className="h-full bg-cyan-500 transition-all duration-1000 ease-out accent-glow accent-cyan"
                  style={{ width: `${cpu}%` }}
               ></div>
            </div>
         </div>

         {/* Memory Graph */}
         <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-[10px] font-mono accent-text accent-violet">
               <span className="opacity-70">MEM_UTIL</span>
               <span className="font-bold">{mem}%</span>
            </div>
            <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
               <div
                  className="h-full bg-violet-500 transition-all duration-1000 ease-out accent-glow accent-violet"
                  style={{ width: `${mem}%` }}
               ></div>
            </div>
         </div>

         {/* Network Status */}
         <div className="flex items-center justify-between text-[10px] font-mono mt-1 pt-2 border-t border-white/5">
            <span className="text-slate-500 tracking-tighter uppercase">UPLINK_DATA</span>
            <div className="flex gap-1 items-end h-4 pr-1">
               {[1, 2, 3, 4, 5].map(i => (
                  <div
                     key={i}
                     className={`w-1 rounded-sm transition-all duration-300 ${netActivity ? 'bg-emerald-500/80 accent-glow accent-emerald' : 'bg-slate-800'}`}
                     style={{ height: netActivity ? `${Math.floor(Math.random() * 10 + 4)}px` : '4px' }}
                  ></div>
               ))}
            </div>
         </div>

         <div className="text-[8px] font-mono text-slate-600 mt-1 flex justify-between uppercase">
            <span>SEC_LOCK: ON</span>
            <span>STABLE</span>
         </div>
      </div>
   );
};
