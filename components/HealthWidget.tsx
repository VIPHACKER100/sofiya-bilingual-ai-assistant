
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
    <div className="glass-panel absolute top-24 right-4 lg:right-96 w-64 p-5 rounded-xl animate-in slide-in-from-right duration-500 border-r-4 border-r-green-500">
      <div className="flex justify-between items-center mb-5 border-b border-white/5 pb-2">
         <span className="text-xs font-mono text-green-400 tracking-widest uppercase flex items-center gap-2">
           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
           {language === 'hi' ? 'स्वास्थ्य' : 'BIO_METRICS'}
         </span>
         <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
      </div>

      <div className="space-y-5">
         {/* Heart Rate ECG */}
         <div className="relative">
            <div className="flex justify-between text-[10px] text-slate-400 mb-1 font-mono uppercase">
               <span>Heart.Rate</span>
               <span className="text-white font-bold">{data.heartRate} BPM</span>
            </div>
            {/* Simulated ECG Line */}
            <div className="h-10 w-full bg-slate-900/50 border border-green-900/30 rounded overflow-hidden relative">
               <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                 <path d="M0,20 L20,20 L30,5 L40,35 L50,20 L80,20 L90,10 L100,30 L110,20 L150,20 L160,5 L170,35 L180,20 L250,20" 
                       fill="none" stroke="#22c55e" strokeWidth="1.5" className="animate-[dash_2s_linear_infinite]" 
                       strokeDasharray="300" strokeDashoffset="300">
                    <animate attributeName="stroke-dashoffset" from="300" to="0" dur="2s" repeatCount="indefinite" />
                 </path>
               </svg>
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-slate-900"></div>
            </div>
         </div>

         {/* Steps Progress */}
         <div>
            <div className="flex justify-between text-[10px] text-slate-400 mb-1 font-mono uppercase">
               <span>Steps</span>
               <span className="text-white font-bold">{data.steps} / 10K</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
               <div className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ width: `${Math.min(100, (data.steps / 10000) * 100)}%` }}></div>
            </div>
         </div>

         {/* Sleep Ring */}
         <div className="flex items-center justify-between bg-slate-800/30 p-2 rounded border border-white/5">
            <div className="text-[10px] text-slate-400 font-mono uppercase">
              <div>Sleep.Score</div>
              <div className="text-xl text-purple-400 font-bold mt-1 tracking-wider">{data.sleepScore}<span className="text-[10px]">%</span></div>
            </div>
            <div className="w-12 h-12 relative flex items-center justify-center">
               <svg className="w-full h-full -rotate-90">
                 <circle cx="50%" cy="50%" r="20" fill="none" stroke="#334155" strokeWidth="3" />
                 <circle cx="50%" cy="50%" r="20" fill="none" stroke="#a855f7" strokeWidth="3" strokeDasharray="125" strokeDashoffset={125 - (125 * data.sleepScore / 100)} strokeLinecap="round" />
               </svg>
            </div>
         </div>
      </div>
    </div>
  );
};
