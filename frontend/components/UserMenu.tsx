import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogOut, ChevronDown, UserPlus } from 'lucide-react';

interface UserProfile {
    id: string;
    name: string;
    avatar?: string;
}

interface UserMenuProps {
    currentUser: UserProfile | null;
    onSwitchUser: (userId: string) => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ currentUser, onSwitchUser }) => {
    const [isOpen, setIsOpen] = React.useState(false);

    const mockUsers: UserProfile[] = [
        { id: 'user_1', name: 'Household Member 1' },
        { id: 'user_2', name: 'Household Member 2' },
    ];

    return (
        <div className="relative">
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
            >
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
                    <User className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="flex flex-col items-start">
                    <span className="text-[10px] font-bold text-white/90">
                        {currentUser ? currentUser.name : 'SWITCH PROFILE'}
                    </span>
                    <span className="text-[8px] font-mono text-cyan-500/60 uppercase tracking-widest">
                        {currentUser ? 'ACTIVE_SESSION' : 'SELECT_USER'}
                    </span>
                </div>
                <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-full right-0 mt-2 w-56 glass-panel rounded-2xl border border-white/10 p-2 z-[100] shadow-2xl"
                    >
                        <div className="p-2 mb-2 border-b border-white/5">
                            <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Profiles</h3>
                            <div className="flex flex-col gap-1">
                                {mockUsers.map(user => (
                                    <button
                                        key={user.id}
                                        onClick={() => { onSwitchUser(user.id); setIsOpen(false); }}
                                        className={`flex items-center gap-3 w-full p-2 rounded-lg transition-colors ${currentUser?.id === user.id ? 'bg-cyan-500/10 border border-cyan-500/20' : 'hover:bg-white/5 border border-transparent'}`}
                                    >
                                        <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center">
                                            <User className="w-3 h-3 text-slate-400" />
                                        </div>
                                        <span className="text-[10px] font-medium">{user.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-white/5 transition-colors text-slate-400">
                            <UserPlus className="w-4 h-4" />
                            <span className="text-[10px] font-medium">Add Household Member</span>
                        </button>

                        <button className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-red-500/10 transition-colors text-red-400 mt-1">
                            <LogOut className="w-4 h-4" />
                            <span className="text-[10px] font-medium">Sign Out</span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
