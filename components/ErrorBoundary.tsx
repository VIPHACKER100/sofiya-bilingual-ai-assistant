
import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, RefreshCw, Terminal, AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    public state: ErrorBoundaryState;

    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null
        };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('SOFIYA_CRITICAL_FAILURE:', error, errorInfo);
    }

    render() {
        // @ts-ignore
        const { hasError, error } = this.state;
        // @ts-ignore
        const { children } = this.props;

        if (hasError) {
            return (
                <div className="fixed inset-0 z-[1000] bg-black flex items-center justify-center p-6 md:p-12 font-mono overflow-hidden">
                    {/* Cinematic FX */}
                    <div className="scanline opacity-[0.05]"></div>
                    <div className="vignette opacity-90"></div>

                    {/* Pulsing Alert Glow */}
                    <motion.div
                        animate={{ opacity: [0.1, 0.3, 0.1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 bg-red-900/10 pointer-events-none"
                    />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, rotateX: 20 }}
                        animate={{ scale: 1, opacity: 1, rotateX: 0 }}
                        transition={{ type: "spring", damping: 20 }}
                        className="max-w-2xl w-full border-2 border-red-500/20 p-10 lg:p-14 glass-panel rounded-[2.5rem] shadow-[0_0_150px_rgba(239,68,68,0.2)] relative z-10 backdrop-blur-3xl"
                    >
                        {/* Status Header */}
                        <div className="flex items-center justify-between mb-10 border-b border-red-500/10 pb-6">
                            <div className="flex items-center gap-5">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-red-500 blur-xl opacity-20 animate-pulse"></div>
                                    <div className="w-16 h-16 rounded-2xl bg-red-600/10 border border-red-500/30 flex items-center justify-center">
                                        <AlertTriangle className="w-8 h-8 text-red-500" />
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <h1 className="text-4xl font-black tracking-[0.2em] uppercase text-white drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                                        Kernel.Panic
                                    </h1>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                                        <span className="text-[10px] font-black tracking-[0.5em] text-red-500 uppercase">System_Fault_Detected</span>
                                    </div>
                                </div>
                            </div>
                            <Terminal className="w-6 h-6 text-red-500/20" />
                        </div>

                        <div className="space-y-8 mb-12">
                            <div className="bg-red-950/20 border border-red-500/20 p-6 rounded-2xl">
                                <p className="text-red-200/90 text-xs font-black uppercase tracking-[0.2em] leading-relaxed">
                                    SOFIYA has encountered a fatal logic exception. All neural sub-processes have been suspended to prevent memory leakage and data corruption.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-[10px] font-black text-red-500/40 uppercase tracking-[0.3em]">
                                    <ShieldAlert className="w-3.5 h-3.5" />
                                    STACK_TRACE_SNAPSHOT
                                </div>
                                <div className="bg-black/60 border border-white/5 p-6 rounded-3xl text-[10px] text-red-400 font-mono overflow-x-auto whitespace-pre custom-scrollbar max-h-60 shadow-inner">
                                    {`[SYS_LOG] :: EXCEPTION_START\n`}
                                    {error?.stack || error?.toString() || "NULL_POINTER_EXCEPTION"}
                                    {`\n[SYS_LOG] :: EOF`}
                                </div>
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => window.location.reload()}
                            className="w-full py-6 bg-red-600 hover:bg-red-500 text-white font-black transition-all rounded-[1.5rem] uppercase tracking-[0.5em] text-[11px] shadow-[0_20px_40px_rgba(239,68,68,0.4)] flex items-center justify-center gap-4 group"
                        >
                            <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                            REINIT_CORE_UPLINK
                        </motion.button>

                        <div className="mt-10 pt-8 border-t border-red-500/5 flex justify-between items-center opacity-20 text-[9px] font-black tracking-[0.4em] text-red-500 uppercase">
                            <div className="flex gap-4">
                                <span>FAIL_CODE: 0x99A</span>
                                <span>NODE_ID: SF_OS_B2</span>
                            </div>
                            <span>STATE: CRITICAL</span>
                        </div>
                    </motion.div>
                </div>
            );
        }

        return children;
    }
}
