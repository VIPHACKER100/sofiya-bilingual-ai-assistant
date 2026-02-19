
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Activity, ShieldCheck, Wifi } from 'lucide-react';

export const StatusBadges = React.memo(({ accentColor }: { accentColor: string }) => {
    const [time, setTime] = useState(new Date());
    const [uptime, setUptime] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        const uptimeTimer = setInterval(() => setUptime(prev => prev + 1), 1000);
        return () => {
            clearInterval(timer);
            clearInterval(uptimeTimer);
        };
    }, []);

    const formatUptime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

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

    const accentClass = getAccentClass(accentColor);

    return (
        <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-6 px-10 py-3 rounded-full glass-panel border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.5)] backdrop-blur-3xl"
        >
            {/* Clock Badge */}
            <div className="flex items-center gap-3 border-r border-white/10 pr-6 group">
                <Clock className={`w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors`} />
                <span className="text-xs font-black font-mono tracking-widest text-white uppercase tabular-nums">
                    {time.toLocaleTimeString([], { hour12: false })}
                </span>
            </div>

            {/* Uptime Badge */}
            <div className="flex items-center gap-3 border-r border-white/10 pr-6 group">
                <Activity className={`w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors`} />
                <div className="flex flex-col">
                    <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest opacity-40">Uptime</span>
                    <span className={`text-[10px] font-black font-mono accent-text ${accentClass} tabular-nums`}>
                        {formatUptime(uptime)}
                    </span>
                </div>
            </div>

            {/* Link Badge */}
            <div className="flex items-center gap-4 group">
                <div className="flex gap-1 items-end h-3">
                    {[1, 2, 3, 4].map(i => (
                        <motion.div
                            key={i}
                            animate={{ height: i <= 3 ? [6, 12, 6] : 4 }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                            className={`w-1 rounded-full ${i <= 3 ? `accent-bg ${accentClass} shadow-[0_0_5px_currentColor]` : 'bg-white/10'}`}
                        />
                    ))}
                </div>
                <div className="flex flex-col items-start">
                    <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-2.5 h-2.5 text-emerald-500" />
                        <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">SECURE_LINK</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
});
