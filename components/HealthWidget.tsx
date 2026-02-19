
import React from 'react';
import { HealthData } from '../types';

interface HealthWidgetProps {
   data: HealthData;
   isVisible: boolean;
   language: 'en' | 'hi';
}

export const HealthWidget: React.FC<HealthWidgetProps> = ({ data, isVisible, language }) => {
   if (!isVisible) return null;

   return (
      <div className="glass-panel absolute top-24 right-4 lg:right-96 w-64 p-5 rounded-xl animate-in slide-in-from-right duration-500 border-r-2 accent-border accent-emerald shadow-[0_0_40px_rgba(16,185,129,0.1)]">
         <div className="flex justify-between items-center mb-5 border-b border-white/5 pb-2">
            <span className="text-[10px] font-mono accent-text accent-emerald tracking-[0.2em] uppercase flex items-center gap-2">
               <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               {language === 'hi' ? 'स्वास्थ्य बायो' : 'BIO_METRICS'}
            </span>
            <div className="w-2 h-2 accent-bg accent-emerald rounded-full animate-ping"></div>
         </div>

         <div className="space-y-6">
            {/* Heart Rate ECG */}
            <div className="relative">
               <div className="flex justify-between text-[9px] text-slate-500 mb-1 font-mono uppercase tracking-widest">
                  <span>HEART_RATE</span>
                  <span className="text-white font-bold">{data.heartRate} BPM</span>
               </div>
               {/* Simulated ECG Line */}
               <div className="h-12 w-full bg-black/40 border border-emerald-900/30 rounded-lg overflow-hidden relative">
                  <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                     <path d="M0,24 L20,24 L30,5 L40,40 L50,24 L80,24 L90,12 L100,35 L110,24 L150,24 L160,5 L170,40 L180,24 L250,24"
                        fill="none" stroke="#10b981" strokeWidth="1.5" className="animate-[dash_2s_linear_infinite]"
                        strokeDasharray="300" strokeDashoffset="300">
                        <animate attributeName="stroke-dashoffset" from="300" to="0" dur="2s" repeatCount="indefinite" />
                     </path>
                  </svg>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/80"></div>
               </div>
            </div>

            {/* Steps Progress */}
            <div>
               <div className="flex justify-between text-[9px] text-slate-500 mb-1.5 font-mono uppercase tracking-widest">
                  <span>DAILY_STEPS</span>
                  <span className="text-white font-bold">{data.steps} / 10K</span>
               </div>
               <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                  <div
                     className="h-full bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.4)] accent-glow accent-cyan transition-all duration-1000"
                     style={{ width: `${Math.min(100, (data.steps / 10000) * 100)}%` }}
                  ></div>
               </div>
            </div>

            {/* Sleep Ring */}
            <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
               <div className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">
                  <div>SLEEP_SCORE</div>
                  <div className="text-2xl accent-text accent-violet font-bold mt-1 tracking-wider accent-text-glow">{data.sleepScore}<span className="text-[10px]">%</span></div>
               </div>
               <div className="w-14 h-14 relative flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90">
                     <circle cx="50%" cy="50%" r="22" fill="none" className="stroke-slate-800" strokeWidth="3" />
                     <circle cx="50%" cy="50%" r="22" fill="none" className="stroke-violet-500" strokeWidth="3" strokeDasharray="138" strokeDashoffset={138 - (138 * data.sleepScore / 100)} strokeLinecap="round" />
                  </svg>
                  <div className="absolute text-[8px] font-mono text-slate-500 uppercase">RECOVERY</div>
               </div>
            </div>
         </div>
      </div>
   );
};
