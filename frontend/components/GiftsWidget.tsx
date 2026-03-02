
import React from 'react';
import { motion } from 'framer-motion';
import { Gift, Shield, EyeOff, Plus, X, Sparkles } from 'lucide-react';

interface GiftIdea {
    id: string;
    gift_idea: string;
    url?: string;
    price_estimate?: number;
    target_contact_id?: string;
    hidden_from: string[];
}

interface GiftsWidgetProps {
    ideas: GiftIdea[];
    isVisible: boolean;
    language: 'en' | 'hi';
    onClose: () => void;
    onAddIdea: (item: string) => void;
    currentUserId?: string;
}

export const GiftsWidget: React.FC<GiftsWidgetProps> = ({ ideas, isVisible, language, onClose, onAddIdea, currentUserId }) => {
    if (!isVisible) return null;

    // Filter out ideas that are hidden from the current user
    const visibleIdeas = ideas.filter(idea => !idea.hidden_from.includes(currentUserId || ''));

    return (
        <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="glass-panel absolute bottom-32 left-1/2 -translate-x-1/2 w-[450px] p-8 rounded-[2.5rem] border-b-4 border-pink-500/20 shadow-2xl z-40"
        >
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-pink-500/10 border border-pink-500/20">
                        <Gift className="w-6 h-6 text-pink-400" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black tracking-widest text-white uppercase">
                            {language === 'hi' ? 'उपहार योजना' : 'STEALTH_GIFT_PROTOCOL'}
                        </h2>
                        <span className="text-[9px] font-mono text-pink-500/60 uppercase group-hover:text-pink-400 transition-colors">Privacy_Active</span>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-3">
                {visibleIdeas.length === 0 ? (
                    <div className="col-span-2 py-12 text-center opacity-20 flex flex-col items-center gap-4">
                        <Shield className="w-12 h-12" />
                        <span className="text-[10px] font-mono uppercase tracking-[0.4em]">No Stealth Ideas Active</span>
                    </div>
                ) : (
                    visibleIdeas.map(idea => (
                        <div key={idea.id} className="p-5 rounded-3xl bg-white/5 border border-white/10 hover:border-pink-500/30 transition-all cursor-pointer relative overflow-hidden group">
                            <Sparkles className="absolute -top-1 -right-1 w-8 h-8 text-pink-500/10 group-hover:text-pink-500/20 transition-all opacity-0 group-hover:opacity-100" />

                            <h3 className="text-[11px] font-black text-white uppercase mb-2 line-clamp-2">{idea.gift_idea}</h3>

                            <div className="flex items-center justify-between mt-auto">
                                {idea.price_estimate && (
                                    <span className="text-[10px] font-mono text-pink-400 font-bold">₹{idea.price_estimate}</span>
                                )}
                                <div className="flex items-center gap-1.5 opacity-40">
                                    <EyeOff className="w-3 h-3" />
                                    <span className="text-[7px] font-black uppercase tracking-widest">Stealth</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                        const idea = prompt(language === 'hi' ? 'उपहार आइडिया:' : 'Gift Idea:');
                        if (idea) onAddIdea(idea);
                    }}
                    className="p-5 rounded-3xl bg-pink-500/10 border border-pink-500/20 border-dashed hover:bg-pink-500/20 transition-all flex flex-col items-center justify-center gap-2 opacity-60 hover:opacity-100"
                >
                    <Plus className="w-5 h-5 text-pink-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Add Idea</span>
                </motion.button>
            </div>

            <div className="mt-8 flex justify-center">
                <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/5">
                    <Shield className="w-3.5 h-3.5 text-pink-500/40" />
                    <span className="text-[8px] font-mono text-white/30 uppercase tracking-[0.2em]">Encrypted Peer-to-Peer Hub</span>
                </div>
            </div>
        </motion.div>
    );
};
