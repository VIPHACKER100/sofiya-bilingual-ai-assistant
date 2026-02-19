
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, CheckCircle2, MessageSquare, AlertCircle, Loader2 } from 'lucide-react';
import { soundService } from '../services/soundService';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    language: 'en' | 'hi';
    accentColor: string;
}

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

export const FeedbackModal = React.memo(({ isOpen, onClose, language, accentColor }: FeedbackModalProps) => {
    const [feedback, setFeedback] = useState('');
    const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        soundService.playUIClick();
        setStatus('sending');

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        soundService.playUIConfirm();
        setStatus('sent');

        setTimeout(() => {
            setStatus('idle');
            setFeedback('');
            onClose();
        }, 2500);
    };

    const accentClass = getAccentClass(accentColor);

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/90 backdrop-blur-2xl"
            />

            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 30 }}
                className={`relative w-full max-w-lg glass-panel p-10 lg:p-14 rounded-[3rem] border-t-2 accent-border ${accentClass} shadow-[0_50px_100px_rgba(0,0,0,0.8)] z-10 overflow-hidden`}
            >
                <div className="scanline opacity-10"></div>
                <div className="vignette opacity-50"></div>

                <AnimatePresence mode="wait">
                    {status === 'sent' ? (
                        <motion.div
                            key="sent"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="py-12 text-center flex flex-col items-center gap-8"
                        >
                            <div className="relative">
                                <motion.div
                                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.2, 0.5] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className={`absolute inset-0 blur-3xl accent-bg ${accentClass}`}
                                />
                                <CheckCircle2 className={`w-24 h-24 accent-text ${accentClass} relative z-10 drop-shadow-[0_0_20px_currentColor]`} strokeWidth={1} />
                            </div>
                            <div className="space-y-3">
                                <h2 className="text-4xl font-black uppercase tracking-[0.2em] text-white">
                                    {language === 'hi' ? 'संचरण पूर्ण' : 'TRANSMISSION_COMPLETE'}
                                </h2>
                                <p className="text-slate-500 font-mono text-[10px] tracking-[0.5em] uppercase">Uplink verified. Data synchronized.</p>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="form" className="relative z-10">
                            <div className="flex justify-between items-start mb-12">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <MessageSquare className={`w-5 h-5 accent-text ${accentClass}`} />
                                        <h2 className="text-3xl font-black uppercase tracking-[0.2em] text-white leading-none">
                                            {language === 'hi' ? 'प्रतिक्रिया' : 'FEEDBACK_LOOP'}
                                        </h2>
                                    </div>
                                    <p className="text-[10px] font-black tracking-[0.5em] text-slate-600 uppercase">Neural_Correction_Protocol</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-3 text-slate-500 hover:text-white transition-all hover:bg-white/5 rounded-2xl"
                                    title="Close Module"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-10">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="text-[10px] font-black font-mono text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                            <AlertCircle className="w-3.5 h-3.5" />
                                            Input_Payload
                                        </label>
                                        <span className={`text-[8px] font-mono ${feedback.length > 500 ? 'text-red-500' : 'text-slate-600'}`}>{feedback.length}/500</span>
                                    </div>
                                    <div className="relative group">
                                        <div className={`absolute -inset-0.5 rounded-[2rem] accent-bg ${accentClass} opacity-0 group-focus-within:opacity-10 transition-opacity duration-500`}></div>
                                        <textarea
                                            required
                                            maxLength={500}
                                            value={feedback}
                                            disabled={status === 'sending'}
                                            onChange={(e) => setFeedback(e.target.value)}
                                            placeholder={language === 'hi' ? 'अपना डेटा यहाँ लिखें...' : 'STREAM_DATA_HERE...'}
                                            className="relative w-full h-40 bg-black/60 border border-white/5 rounded-[2rem] p-6 text-white font-mono text-sm focus:outline-none focus:border-white/20 transition-all resize-none placeholder:text-slate-800 shadow-inner custom-scrollbar"
                                        />
                                    </div>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    disabled={status === 'sending' || !feedback.trim()}
                                    className={`w-full py-6 accent-bg ${accentClass} text-white font-black uppercase tracking-[0.4em] text-[11px] rounded-[1.5rem] transition-all shadow-[0_20px_40px_rgba(0,0,0,0.4)] flex items-center justify-center gap-4 group disabled:opacity-50 disabled:grayscale`}
                                >
                                    {status === 'sending' ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            ESTABLISHING_LINK...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                            {language === 'hi' ? 'ट्रांसमिट करें' : 'SEND_REPORT'}
                                        </>
                                    )}
                                </motion.button>
                            </form>

                            <div className="mt-12 pt-8 border-t border-white/5 flex justify-between items-center opacity-30 text-[9px] font-black font-mono tracking-[0.4em] uppercase text-slate-600">
                                <div className="flex gap-4">
                                    <span>ENCRYPTED_RSA_4096</span>
                                    <span>UPLINK_v4.3</span>
                                </div>
                                <div className="flex gap-1">
                                    {[1, 2, 3].map(i => <div key={i} className={`w-1 h-3 accent-bg ${accentClass} opacity-50`} />)}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
});
