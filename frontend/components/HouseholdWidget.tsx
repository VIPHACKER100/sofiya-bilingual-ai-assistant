
import React from 'react';
import { motion } from 'framer-motion';
import { Home, Search, Box, Info, X, Zap } from 'lucide-react';

interface KnowledgeItem {
    id: string;
    item_name: string;
    location: string;
    room?: string;
    description?: string;
    last_seen?: string;
}

interface HouseholdWidgetProps {
    items: KnowledgeItem[];
    isVisible: boolean;
    language: 'en' | 'hi';
    onClose: () => void;
    onAddItem: (item: string, location: string) => void;
    accentColor?: string;
}

export const HouseholdWidget: React.FC<HouseholdWidgetProps> = ({ items, isVisible, language, onClose, onAddItem, accentColor = '#f59e0b' }) => {
    const [searchQuery, setSearchQuery] = React.useState('');

    if (!isVisible) return null;

    const filteredItems = items.filter(item =>
        item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="glass-panel absolute top-24 right-4 md:right-8 w-80 p-6 rounded-[2rem] border-r-2 border-amber-500/30 shadow-2xl z-40"
        >
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Home className="w-5 h-5 text-amber-500" />
                    <span className="text-[12px] font-black tracking-widest uppercase text-white/90">
                        {language === 'hi' ? 'घरेलू इंटेलिजेंस' : 'HOUSEHOLD_IQ'}
                    </span>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="mb-6 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={language === 'hi' ? 'सामान खोजें...' : 'SCAN_INVENTORY...'}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-[10px] font-mono focus:outline-none focus:border-amber-500/50 transition-colors placeholder:text-white/20"
                />
            </div>

            <div className="space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
                {filteredItems.length === 0 ? (
                    <div className="py-8 text-center opacity-30">
                        <Box className="w-6 h-6 mx-auto mb-2" />
                        <span className="text-[9px] font-mono uppercase tracking-widest">No Intelligence Found</span>
                    </div>
                ) : (
                    filteredItems.map(item => (
                        <motion.div
                            layout
                            key={item.id}
                            className="p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-bold text-white uppercase">{item.item_name}</span>
                                <Zap className="w-3 h-3 text-amber-500/50" />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[8px] px-2 py-0.5 rounded bg-white/10 text-white/60 font-mono uppercase">
                                    {item.location}
                                </span>
                                {item.last_seen && (
                                    <span className="text-[7px] text-white/20 italic">
                                        Last seen: {new Date(item.last_seen).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            <div className="mt-8 flex items-center justify-between">
                <div className="flex gap-2">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                            const item = prompt(language === 'hi' ? 'सामान का नाम:' : 'Item Name:');
                            const loc = item ? prompt(language === 'hi' ? 'स्थान:' : 'Location:', 'Living Room') : null;
                            if (item && loc) onAddItem(item, loc);
                        }}
                        className="p-2 rounded-lg bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 transition-colors"
                    >
                        <Zap className="w-4 h-4" />
                    </motion.button>
                </div>
                <span className="text-[8px] font-mono tracking-widest opacity-30">SHARED_INTEL_ACTIVE</span>
            </div>
        </motion.div>
    );
};
