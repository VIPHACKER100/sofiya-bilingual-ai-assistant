
import React from 'react';

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
                <div className="fixed inset-0 z-[1000] bg-black flex items-center justify-center p-8 font-mono overflow-hidden">
                    {/* Cinematic Overlays */}
                    <div className="scanline opacity-20"></div>
                    <div className="vignette opacity-90"></div>

                    <div className="max-w-2xl w-full border-2 border-red-600/30 p-10 glass-panel rounded-3xl shadow-[0_0_100px_rgba(239,68,68,0.2)] relative z-10 animate-in zoom-in-95 duration-500">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-4 h-4 bg-red-600 rounded-full animate-ping"></div>
                            <h1 className="text-3xl font-black tracking-[0.4em] uppercase text-red-500 accent-text-glow accent-red">Kernel_Panic</h1>
                        </div>

                        <div className="space-y-6 mb-10">
                            <p className="text-red-200/70 text-sm font-bold uppercase tracking-widest bg-red-900/20 p-4 border border-red-500/20 rounded-xl">
                                CRITICAL_EXCEPTION_DETECTED :: MEMORY_DUMP_ACTIVE
                            </p>

                            <p className="text-slate-400 text-sm leading-relaxed uppercase tracking-wider">
                                SOFIYA has encountered a fatal logic core exception. Neural integration has been suspended to prevent permanent baseline corruption. System state is currently unstable.
                            </p>

                            <div className="bg-black/60 border border-red-500/10 p-5 rounded-2xl text-[10px] text-red-500/80 overflow-x-auto whitespace-pre custom-scrollbar max-h-48">
                                {`> TRACEBACK_DUMP:\n`}
                                {error?.stack || error?.toString() || "UNKNOWN_DEVIATION"}
                            </div>
                        </div>

                        <button
                            onClick={() => window.location.reload()}
                            className="w-full py-5 bg-red-600 hover:bg-red-500 text-white font-black transition-all rounded-2xl uppercase tracking-[0.5em] text-xs shadow-[0_0_30px_rgba(239,68,68,0.4)] active:scale-95"
                        >
                            REINIT_CORE_SYSTEM
                        </button>

                        <div className="mt-8 flex justify-between items-center opacity-20 text-[8px] tracking-[0.5em] text-red-500 uppercase">
                            <span>CORE_ID: 0xDEADBEEF</span>
                            <span>STATE: FALLED</span>
                        </div>
                    </div>
                </div>
            );
        }

        return children;
    }
}
