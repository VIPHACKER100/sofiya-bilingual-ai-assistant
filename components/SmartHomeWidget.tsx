
import React from 'react';
import { SmartDevice } from '../types';
import { soundService } from '../services/soundService';

interface SmartHomeWidgetProps {
  devices: SmartDevice[];
  isVisible: boolean;
  language: 'en' | 'hi';
  onToggle: (id: string) => void;
  onClose: () => void;
}

export const SmartHomeWidget: React.FC<SmartHomeWidgetProps> = ({ devices, isVisible, language, onToggle, onClose }) => {
  if (!isVisible) return null;

  return (
    <div className="glass-panel absolute top-1/2 left-4 lg:left-8 transform -translate-y-1/2 w-72 p-5 rounded-xl animate-in slide-in-from-left duration-500 z-40 border-l-4 border-l-cyan-500">
       <div className="flex justify-between items-center mb-5 border-b border-white/5 pb-2">
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
             <span className="text-xs font-mono text-cyan-400 tracking-[0.2em] uppercase">
                {language === 'hi' ? 'स्मार्ट होम' : 'HOME_CTRL'}
             </span>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-white transition-colors">✕</button>
       </div>

       <div className="grid grid-cols-2 gap-3">
          {devices.map(device => {
            const isActive = device.status === true || device.status === 'Unlocked' || (typeof device.status === 'string' && device.status.includes('°'));
            const activeColor = device.type === 'lock' ? 'text-red-400 border-red-500/50 shadow-red-500/20' : 'text-cyan-400 border-cyan-500/50 shadow-cyan-500/20';
            
            return (
                <button
                key={device.id}
                onClick={() => { soundService.playUIClick(); onToggle(device.id); }}
                className={`relative group p-3 rounded-lg border flex flex-col items-start gap-2 transition-all duration-300 overflow-hidden ${
                    isActive 
                    ? `bg-slate-800/80 ${activeColor} shadow-[0_0_15px_rgba(0,0,0,0.2)]` 
                    : 'bg-slate-900/40 border-slate-800 text-slate-500 hover:border-slate-600'
                }`}
                >
                {/* Active Glow Background */}
                {isActive && <div className={`absolute inset-0 opacity-10 ${device.type === 'lock' ? 'bg-red-500' : 'bg-cyan-500'}`}></div>}

                <div className="flex justify-between w-full items-start">
                    <div className={`p-1.5 rounded-md transition-colors ${isActive ? (device.type === 'lock' ? 'bg-red-500/20 text-red-400' : 'bg-cyan-500/20 text-cyan-400') : 'bg-slate-800 text-slate-600'}`}>
                        {/* Icons */}
                        {device.type === 'light' && (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        )}
                        {device.type === 'thermostat' && (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        )}
                        {device.type === 'lock' && (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={isActive ? "M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" : "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"} /></svg>
                        )}
                    </div>
                    {isActive && <div className={`w-1.5 h-1.5 rounded-full ${device.type === 'lock' ? 'bg-red-500' : 'bg-cyan-400'} shadow-[0_0_8px_currentColor]`}></div>}
                </div>

                <div className="text-left z-10">
                    <div className={`text-xs font-bold tracking-wide ${isActive ? 'text-white' : 'text-slate-400'}`}>{device.name}</div>
                    <div className="text-[10px] opacity-70 uppercase font-mono mt-0.5">
                        {typeof device.status === 'boolean' 
                            ? (device.status ? (language === 'hi' ? 'चालू' : 'ACTIVE') : (language === 'hi' ? 'बंद' : 'OFFLINE')) 
                            : device.status}
                    </div>
                </div>
                </button>
            );
          })}
       </div>
    </div>
  );
};
