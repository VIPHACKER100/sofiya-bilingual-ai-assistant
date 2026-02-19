
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SmartDevice } from '../types';
import { soundService } from '../services/soundService';
import { Lightbulb, Thermometer, Lock, Unlock, X, Zap, Loader } from 'lucide-react';

interface SmartHomeWidgetProps {
    devices: SmartDevice[];
    isVisible: boolean;
    language: 'en' | 'hi';
    onToggle: (id: string) => void;
    onClose: () => void;
}

export const SmartHomeWidget = React.memo(({ devices, isVisible, language, onToggle, onClose }: SmartHomeWidgetProps) => {
    if (!isVisible) return null;

    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0, x: -50 }}
            animate={{ scale: 1, opacity: 1, x: 0 }}
            exit={{ scale: 0.9, opacity: 0, x: -50 }}
            className="glass-panel absolute top-1/2 left-4 lg:left-8 transform -translate-y-1/2 w-80 p-6 rounded-[2.5rem] border-l-2 accent-border accent-cyan shadow-[0_40px_100px_rgba(0,0,0,0.5)] z-40"
        >
            <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                    <Zap className="w-4 h-4 text-cyan-500 animate-pulse" />
                    <span className="text-[11px] font-black accent-text accent-cyan tracking-[0.4em] uppercase">
                        {language === 'hi' ? 'स्मार्ट होम' : 'HOME_COMMAND'}
                    </span>
                </div>
                <button
                    onClick={onClose}
                    title="Terminate Uplink"
                    className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 hover:text-white hover:bg-white/5 transition-all active:scale-95"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {devices.map(device => {
                    const isActive = device.status === true || device.status === 'Unlocked' || (typeof device.status === 'string' && device.status.includes('°'));
                    const accentClass = device.type === 'lock' ? (device.status === 'Locked' ? 'accent-emerald' : 'accent-red') : 'accent-cyan';

                    return (
                        <motion.button
                            key={device.id}
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => { soundService.playUIClick(); onToggle(device.id); }}
                            className={`relative group p-4 rounded-3xl border flex flex-col items-start gap-4 transition-all duration-500 overflow-hidden ${isActive
                                ? `bg-slate-800/80 accent-border ${accentClass} shadow-[0_10px_30px_rgba(0,0,0,0.3)]`
                                : 'bg-black/40 border-slate-800 text-slate-500 hover:border-slate-700'
                                }`}
                        >
                            {/* Active Radial Bloom */}
                            <AnimatePresence>
                                {isActive && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{ opacity: 0.1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 2 }}
                                        className={`absolute inset-0 accent-bg ${accentClass} blur-xl`}
                                    />
                                )}
                            </AnimatePresence>

                            <div className="flex justify-between w-full items-start relative z-10">
                                <div className={`p-2.5 rounded-2xl transition-all duration-500 ${isActive ? `bg-white/10 accent-text ${accentClass} shadow-inner` : 'bg-white/5 text-slate-600'}`}>
                                    {/* Responsive Icons */}
                                    {device.type === 'light' && <Lightbulb className="w-5 h-5" />}
                                    {device.type === 'thermostat' && <Thermometer className="w-5 h-5" />}
                                    {device.type === 'lock' && (isActive && device.status === 'Unlocked' ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />)}
                                </div>
                                {isActive && (
                                    <motion.div
                                        animate={{ opacity: [0.3, 1, 0.3] }}
                                        transition={{ duration: 1, repeat: Infinity }}
                                        className={`w-2 h-2 rounded-full accent-bg ${accentClass} accent-glow`}
                                    />
                                )}
                            </div>

                            <div className="text-left relative z-10 w-full">
                                <div className={`text-[11px] font-black tracking-tight truncate uppercase ${isActive ? 'text-white' : 'text-slate-500'}`}>{device.name}</div>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <span className={`text-[9px] font-mono tracking-widest ${isActive ? 'text-white/60' : 'text-slate-600'}`}>
                                        {typeof device.status === 'boolean'
                                            ? (device.status ? (language === 'hi' ? 'सक्रिय' : 'ACTIVE') : (language === 'hi' ? 'बंद' : 'OFFLINE'))
                                            : device.status.toString().toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            <div className="mt-8 flex justify-center opacity-10">
                <Loader className="w-4 h-4 animate-spin-slow" />
            </div>
        </motion.div>
    );
});
