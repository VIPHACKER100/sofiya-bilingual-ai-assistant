import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Terminal, X, CheckSquare, AlertTriangle } from 'lucide-react';
import { ConfirmationRequest } from '../types/bridge';

interface ConfirmationModalProps {
    isOpen: boolean;
    confirmation: ConfirmationRequest | null;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    confirmation,
    onConfirm,
    onCancel
}) => {
    if (!confirmation) return null;

    const isHindi = confirmation.language === 'hi';
    const isDestructive = ['shutdown', 'restart', 'file_delete_confirm', 'empty_recycle_bin'].includes(confirmation.command_key || '');

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onCancel}
                        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className={`
                            relative w-full max-w-lg overflow-hidden glass-panel border 
                            ${isDestructive ? 'border-red-500/40 bg-red-950/10' : 'border-cyan-500/40 bg-slate-950/20'}
                            rounded-[3rem] shadow-2xl p-10 backdrop-blur-2xl
                        `}
                    >
                        {/* Status Header */}
                        <div className="flex items-center justify-between mb-8 opacity-60">
                            <div className="flex items-center gap-2">
                                <Terminal className={`w-3.5 h-3.5 ${isDestructive ? 'text-red-400' : 'text-cyan-400'}`} />
                                <span className="text-[10px] font-black tracking-[0.3em] font-mono uppercase">
                                    SYS.PENDING_AUTH_{confirmation.command_key?.toUpperCase()}
                                </span>
                            </div>
                            <div className="flex gap-1.5 item-center">
                                <div className={`w-1 h-1 rounded-full ${isDestructive ? 'bg-red-400' : 'bg-cyan-400'} animate-pulse`} />
                                <div className={`w-1 h-1 rounded-full ${isDestructive ? 'bg-red-400/30' : 'bg-cyan-400/30'}`} />
                            </div>
                        </div>

                        {/* Visual Icon */}
                        <div className="flex justify-center mb-8">
                            <motion.div
                                animate={isDestructive ? { scale: [1, 1.1, 1] } : {}}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className={`
                                    w-24 h-24 rounded-full border-2 
                                    ${isDestructive ? 'border-red-500/30 bg-red-500/5' : 'border-cyan-500/30 bg-cyan-500/5'}
                                    flex items-center justify-center shadow-2xl
                                `}
                            >
                                {isDestructive ? (
                                    <ShieldAlert className="w-10 h-10 text-red-500" strokeWidth={1} />
                                ) : (
                                    <AlertTriangle className="w-10 h-10 text-cyan-500" strokeWidth={1} />
                                )}
                            </motion.div>
                        </div>

                        <h2 className="text-3xl font-black text-center text-white tracking-widest uppercase mb-4 leading-tight">
                            {isHindi ? 'मंजूरी आवश्यक है' : 'AUTHORIZATION REQUIRED'}
                        </h2>

                        <div className="relative mb-10">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
                            <p className="pl-6 text-slate-300 text-lg font-light tracking-wide leading-relaxed italic opacity-80">
                                &ldquo;{confirmation.response}&rdquo;
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-6">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onConfirm}
                                className={`
                                    flex-1 py-5 px-10 rounded-2xl font-black tracking-[0.3em] uppercase text-xs transition-all
                                    ${isDestructive
                                        ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_30px_rgba(220,38,38,0.4)]'
                                        : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_30px_rgba(8,145,178,0.4)]'
                                    }
                                `}
                            >
                                <div className="flex items-center justify-center gap-3">
                                    <CheckSquare className="w-4 h-4" />
                                    {isHindi ? 'पुष्टि करें' : 'AUTHORIZE'}
                                </div>
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onCancel}
                                className="flex-1 py-5 px-10 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-black tracking-[0.3em] uppercase text-xs text-slate-400 transition-all backdrop-blur-md"
                            >
                                <div className="flex items-center justify-center gap-3">
                                    <X className="w-4 h-4" />
                                    {isHindi ? 'रद्द करें' : 'TERMINATE'}
                                </div>
                            </motion.button>
                        </div>

                        {/* Scanline Decoration */}
                        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
