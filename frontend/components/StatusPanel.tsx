
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Cpu, Database, Wifi } from 'lucide-react';

export const StatusPanel: React.FC = () => {
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
      <div className="glass-panel w-52 p-5 rounded-bl-2xl border-t-0 border-r-0 border-white/10 flex flex-col gap-5 animate-in slide-in-from-right duration-700">
         <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
               <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
               <span className="text-[9px] font-mono text-slate-500 tracking-[0.2em] uppercase">
                  SYS.DIAGNOSTICS
               </span>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
         </div>

         {/* CPU Graph */}
         <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-[10px] font-mono accent-text accent-cyan">
               <div className="flex items-center gap-1.5 opacity-70">
                  <Cpu className="w-3 h-3" />
                  <span>CPU_LOAD</span>
               </div>
               <span className="font-bold">{cpu}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-900/50 rounded-full overflow-hidden border border-white/5 p-[1px]">
               <motion.div
                  className="h-full bg-cyan-500 rounded-full accent-glow accent-cyan"
                  initial={{ width: 0 }}
                  animate={{ width: `${cpu}%` }}
                  transition={{ type: "spring", stiffness: 50, damping: 20 }}
               ></motion.div>
            </div>
         </div>

         {/* Memory Graph */}
         <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-[10px] font-mono accent-text accent-violet">
               <div className="flex items-center gap-1.5 opacity-70">
                  <Database className="w-3 h-3" />
                  <span>MEM_UTIL</span>
               </div>
               <span className="font-bold">{mem}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-900/50 rounded-full overflow-hidden border border-white/5 p-[1px]">
               <motion.div
                  className="h-full bg-violet-500 rounded-full accent-glow accent-violet"
                  initial={{ width: 0 }}
                  animate={{ width: `${mem}%` }}
                  transition={{ type: "spring", stiffness: 50, damping: 20 }}
               ></motion.div>
            </div>
         </div>

         {/* Network Status */}
         <div className="flex items-center justify-between text-[10px] font-mono mt-1 pt-3 border-t border-white/5">
            <div className="flex items-center gap-1.5 text-slate-500">
               <Wifi className="w-3 h-3" />
               <span className="tracking-tighter uppercase">UPLINK</span>
            </div>
            <div className="flex gap-1 items-end h-4 pr-1">
               {[1, 2, 3, 4, 5].map(i => (
                  <motion.div
                     key={i}
                     animate={{
                        height: netActivity ? `${Math.floor(Math.random() * 12 + 4)}px` : '4px',
                        opacity: netActivity ? 1 : 0.3
                     }}
                     className={`w-1 rounded-sm ${netActivity ? 'bg-emerald-500/80 accent-glow accent-emerald' : 'bg-slate-800'}`}
                  ></motion.div>
               ))}
            </div>
         </div>

         <div className="text-[8px] font-mono text-slate-600 mt-1 flex justify-between uppercase tracking-widest opacity-40">
            <span>SEC_LOCK: ON</span>
            <span>OS_STABLE</span>
         </div>
      </div>
   );
};
