import React from 'react';
import { motion } from 'framer-motion';
import { SystemStatus as SystemStatusType } from '../types/bridge';
import { Cpu, Zap, Database, Activity, Monitor } from 'lucide-react';



interface SystemStatusProps {
    status: SystemStatusType | null;
}

export const SystemStatus: React.FC<SystemStatusProps> = ({ status }) => {
    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatUptime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    };

    if (!status) {
        return (
            <div className="relative overflow-hidden glass-panel border border-white/5 bg-black/40 p-5 w-full md:w-72 rounded-2xl backdrop-blur-xl group">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase font-mono">Telemetry_Sync</span>
                    </div>
                </div>
                <div className="space-y-4 opacity-20 animate-pulse">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-2 bg-white/5 rounded-full w-full" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="relative overflow-hidden glass-panel border border-cyan-500/20 bg-black/40 p-5 w-full md:w-72 rounded-2xl backdrop-blur-xl group hover:border-cyan-500/40 transition-all duration-500 shadow-[0_0_30px_rgba(6,182,212,0.05)]">
            {/* Header */}
            <div className="flex items-center justify-between mb-5 pb-2 border-b border-cyan-500/10">
                <div className="flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-cyan-500 animate-pulse" />
                    <span className="text-[10px] font-black tracking-[0.2em] text-cyan-500 uppercase font-mono">Realtime_Telemetry</span>
                </div>
                <div className="flex gap-1">
                    <div className="w-1 h-1 rounded-full bg-cyan-500 animate-ping" />
                    <div className="w-1 h-1 rounded-full bg-cyan-500/40" />
                </div>
            </div>

            {/* Content Scenarios */}
            <div className="space-y-5">
                {/* Energy Monitor */}
                {status.battery && status.battery.percent !== null && (
                    <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                            <div className="flex items-center gap-2">
                                <Zap className={`w-3 h-3 ${status.battery.power_plugged ? 'text-amber-400' : 'text-slate-400'}`} />
                                <span className="text-[9px] font-bold text-slate-400 uppercase font-mono">Energy_Core</span>
                            </div>
                            <span className={`text-[10px] font-black font-mono ${status.battery.percent < 20 ? 'text-red-400' : 'text-cyan-400'}`}>
                                {status.battery.percent}%
                            </span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden p-[1px]">
                            <motion.div
                                className={`h-full rounded-full ${status.battery.power_plugged ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]' :
                                    status.battery.percent < 20 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]'
                                    }`}
                                initial={{ width: 0 }}
                                animate={{ width: `${status.battery.percent}%` }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                            />


                        </div>
                    </div>
                )}

                {/* Compute Monitor */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                        <div className="flex items-center gap-2">
                            <Cpu className="w-3 h-3 text-slate-400" />
                            <span className="text-[9px] font-bold text-slate-400 uppercase font-mono">Compute_Load</span>
                        </div>
                        <span className={`text-[10px] font-black font-mono ${status.cpu.percent > 80 ? 'text-red-400' : 'text-cyan-400'}`}>
                            {status.cpu.percent.toFixed(0)}%
                        </span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden p-[1px]">
                        <div
                            className={`h-full rounded-full transition-all duration-700 ease-out ${status.cpu.percent > 80 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]'
                                }`}
                            style={{ width: `${Math.min(status.cpu.percent, 100)}%` } as React.CSSProperties}
                        />
                    </div>
                </div>

                {/* Network Monitor */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                        <div className="flex items-center gap-2">
                            <Monitor className="w-3 h-3 text-slate-400" />
                            <span className="text-[9px] font-bold text-slate-400 uppercase font-mono">Network_Flux</span>
                        </div>
                        <div className="flex gap-2">
                            <span className="text-[8px] font-mono text-cyan-400/60 uppercase">
                                ↓ {formatBytes(status.network.bytes_recv)}
                            </span>
                            <span className="text-[8px] font-mono text-amber-400/60 uppercase">
                                ↑ {formatBytes(status.network.bytes_sent)}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 overflow-hidden">
                        {[...Array(12)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="w-1 bg-cyan-500/30 rounded-full"
                                animate={{
                                    height: [4, 8, 4],
                                    opacity: [0.3, 0.6, 0.3]
                                }}
                                transition={{
                                    duration: 1 + Math.random(),
                                    repeat: Infinity,
                                    delay: i * 0.1
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* Storage/Memory */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                        <div className="flex items-center gap-2">
                            <Database className="w-3 h-3 text-slate-400" />
                            <span className="text-[9px] font-bold text-slate-400 uppercase font-mono">Memory_Pool</span>
                        </div>
                        <span className="text-[9px] font-black font-mono text-cyan-400/80 uppercase">
                            {formatBytes(status.memory.used)}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden px-[0.5px]">
                            <div
                                className="h-full bg-emerald-500/80 rounded-full transition-all duration-1000"
                                style={{ width: `${(status.memory.used / status.memory.total) * 100}%` } as React.CSSProperties}
                            />
                        </div>
                        <span className="text-[8px] font-mono text-slate-600">
                            {((status.memory.used / status.memory.total) * 100).toFixed(0)}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Footer / System Details */}
            <div className="mt-6 pt-4 border-t border-white/5 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Activity className="w-2.5 h-2.5 text-slate-600" />
                        <span className="text-[8px] font-mono tracking-widest text-slate-500 uppercase">Uptime:</span>
                    </div>
                    <span className="text-[9px] font-black font-mono text-slate-400">{formatUptime(status.uptime)}</span>
                </div>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Monitor className="w-2.5 h-2.5 text-slate-600" />
                        <span className="text-[8px] font-mono tracking-widest text-slate-500 uppercase">Platform:</span>
                    </div>
                    <span className="text-[9px] font-black font-mono text-emerald-500/80 uppercase tracking-tighter">{status.platform}</span>
                </div>
            </div>

            {/* Scanning Line Effect */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
                <div className="w-full h-[1px] bg-cyan-400 animate-scan shadow-[0_0_10px_#06b6d4]" />
            </div>
        </div>
    );
};

