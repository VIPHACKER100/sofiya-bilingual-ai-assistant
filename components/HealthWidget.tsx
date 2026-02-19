
import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Heart, Moon, Zap } from 'lucide-react';
import { HealthData } from '../types';

interface HealthWidgetProps {
   data: HealthData;
   isVisible: boolean;
   language: 'en' | 'hi';
}

export const HealthWidget = React.memo(({ data, isVisible, language }: HealthWidgetProps) => {
   if (!isVisible) return null;

   const stepPercentage = Math.min(100, (data.steps / 10000) * 100);

   // Animation variants
   const containerVariants = {
      hidden: { x: 50, opacity: 0 },
      visible: { x: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
      exit: { x: 50, opacity: 0 }
   };

   return (
      <motion.div
         variants={containerVariants}
         initial="hidden"
         animate="visible"
         exit="exit"
         className="glass-panel absolute top-24 right-4 lg:right-96 w-72 p-6 rounded-3xl border-r-2 accent-border accent-emerald shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-40"
      >
         <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-3">
            <span className="text-[11px] font-black accent-text accent-emerald tracking-[0.2em] uppercase flex items-center gap-2">
               <Activity className="w-4 h-4" />
               {language === 'hi' ? 'स्वास्थ्य बायो' : 'HEALTH_BIOMETRICS'}
            </span>
            <div className="flex gap-1">
               {[1, 2, 3].map(i => (
                  <motion.div
                     key={i}
                     animate={{ opacity: [0.2, 1, 0.2] }}
                     transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                     className="w-1.5 h-1.5 accent-bg accent-emerald rounded-full"
                  />
               ))}
            </div>
         </div>

         <div className="space-y-7">
            {/* Heart Rate Section */}
            <div className="relative">
               <div className="flex justify-between items-center text-[10px] text-slate-500 mb-2 font-mono uppercase tracking-widest">
                  <div className="flex items-center gap-1.5">
                     <Heart className="w-3 h-3 text-red-500" />
                     <span>RHYTHM_ENGINE</span>
                  </div>
                  <motion.span
                     animate={{ scale: [1, 1.1, 1] }}
                     transition={{ duration: 0.6, repeat: Infinity }}
                     className="text-white font-black text-xs"
                  >
                     {data.heartRate} <span className="text-[8px] opacity-50">BPM</span>
                  </motion.span>
               </div>

               {/* ECG Visualizer */}
               <div className="h-16 w-full bg-black/60 border border-white/5 rounded-2xl overflow-hidden relative shadow-inner">
                  <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                     <defs>
                        <linearGradient id="ecg-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                           <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
                           <stop offset="50%" stopColor="#10b981" stopOpacity="1" />
                           <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                        </linearGradient>
                     </defs>
                     <motion.path
                        d="M0,32 L20,32 L30,5 L40,55 L50,32 L80,32 L90,12 L100,50 L110,32 L150,32 L160,5 L170,55 L180,32 L200,32"
                        fill="none"
                        stroke="url(#ecg-grad)"
                        strokeWidth="2"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1, x: [0, 200] }}
                        transition={{
                           pathLength: { duration: 1.5, repeat: Infinity, ease: "linear" },
                           x: { duration: 2, repeat: Infinity, ease: "linear" }
                        }}
                     />
                  </svg>
                  <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black"></div>
               </div>
            </div>

            {/* Steps Progress */}
            <div>
               <div className="flex justify-between items-center text-[10px] text-slate-500 mb-2 font-mono uppercase tracking-widest">
                  <div className="flex items-center gap-1.5">
                     <Zap className="w-3 h-3 text-amber-500" />
                     <span>KINETIC_FLOW</span>
                  </div>
                  <span className="text-white font-black text-xs">{data.steps.toLocaleString()} <span className="text-[8px] opacity-50">UNIT</span></span>
               </div>
               <div className="w-full h-2 bg-slate-900/50 rounded-full overflow-hidden border border-white/5 p-[1px] shadow-inner">
                  <motion.div
                     initial={{ width: 0 }}
                     animate={{ width: `${stepPercentage}%` }}
                     transition={{ duration: 1, ease: "easeOut" }}
                     className="h-full bg-emerald-500 rounded-full accent-glow accent-emerald relative"
                  >
                     <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"></div>
                  </motion.div>
               </div>
               <div className="mt-1.5 flex justify-between text-[8px] font-mono text-slate-600 uppercase tracking-tighter">
                  <span>Goal: 10,000</span>
                  <span>{stepPercentage.toFixed(0)}% Complete</span>
               </div>
            </div>

            {/* Sleep Summary */}
            <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-16 h-16 bg-violet-500/10 blur-2xl rounded-full"></div>
               <div className="relative z-10">
                  <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-mono uppercase tracking-widest mb-1">
                     <Moon className="w-3 h-3 text-violet-400" />
                     <span>REST_PHASE</span>
                  </div>
                  <div className="text-2xl accent-text accent-violet font-black tracking-tighter accent-text-glow leading-none">
                     {data.sleepScore}<span className="text-[10px] font-mono opacity-50 ml-1">PT</span>
                  </div>
               </div>
               <div className="w-16 h-16 relative flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90">
                     <circle cx="50%" cy="50%" r="26" fill="none" className="stroke-white/5" strokeWidth="4" />
                     <motion.circle
                        cx="50%" cy="50%" r="26" fill="none"
                        className="stroke-violet-500" strokeWidth="4"
                        strokeDasharray="163"
                        initial={{ strokeDashoffset: 163 }}
                        animate={{ strokeDashoffset: 163 - (163 * data.sleepScore / 100) }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        strokeLinecap="round"
                        style={{ filter: "drop-shadow(0 0 5px rgba(139, 92, 246, 0.5))" }}
                     />
                  </svg>
                  <div className="absolute text-[7px] font-mono text-slate-500 tracking-tighter text-center uppercase leading-none">
                     RECOV
                  </div>
               </div>
            </div>
         </div>

         <div className="mt-6 flex justify-between items-center opacity-20 text-[8px] font-mono tracking-widest uppercase">
            <span>Sec_Stream: ON</span>
            <span>V_4.3.0</span>
         </div>
      </motion.div>
   );
});
