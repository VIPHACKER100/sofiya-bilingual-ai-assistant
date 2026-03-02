import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Brain,
    Search,
    Clock,
    User,
    Bot,
    X,
    RefreshCcw,
    TrendingUp,
    Zap,
    Shield,
    MessageSquare,
    Filter
} from 'lucide-react';

interface Conversation {
    id: number;
    timestamp: string;
    user_input: string;
    sofiya_response: string;
    command_type: string;
    success: boolean;
    language: string;
}

interface MemoryStats {
    total_conversations: number;
    successful_commands: number;
    success_rate: number;
    period_days: number;
}

interface MemoryViewerProps {
    isOpen: boolean;
    onClose: () => void;
}

export const MemoryViewer: React.FC<MemoryViewerProps> = ({ isOpen, onClose }) => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [stats, setStats] = useState<MemoryStats | null>(null);
    const [filterMode, setFilterMode] = useState<'all' | 'success' | 'fail'>('all');

    useEffect(() => {
        if (isOpen) {
            fetchConversations();
            fetchStats();
        }
    }, [isOpen]);

    const fetchConversations = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8000/api/memory/conversations?limit=100');
            const data = await response.json();
            if (data.success) {
                setConversations(data.conversations);
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
        }
        setLoading(false);
    };

    const fetchStats = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/memory/stats?days=7');
            const data = await response.json();
            if (data.success) {
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const filteredConversations = conversations.filter(conv => {
        const matchesSearch =
            conv.user_input.toLowerCase().includes(searchQuery.toLowerCase()) ||
            conv.sofiya_response.toLowerCase().includes(searchQuery.toLowerCase());

        if (filterMode === 'success') return matchesSearch && conv.success;
        if (filterMode === 'fail') return matchesSearch && !conv.success;
        return matchesSearch;
    });

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }).format(date);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />

            {/* Modal Container */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-6xl h-[85vh] flex flex-col glass-panel border border-cyan-500/20 bg-slate-950/80 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.15)]"
            >
                {/* Decorative elements */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-cyan-500/10 rounded-full blur-[100px]" />

                {/* Sidebar / Tools */}
                <div className="flex flex-col md:flex-row h-full">
                    {/* Left Content Area */}
                    <div className="flex-1 flex flex-col h-full overflow-hidden">
                        {/* Header */}
                        <div className="p-6 border-b border-white/5 flex flex-col gap-4">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                                        <Brain className="w-6 h-6 text-cyan-500" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-black tracking-[0.2em] text-white uppercase italic">Cognitive_Archive</h2>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                            <span className="text-[10px] font-mono text-cyan-500/60 uppercase tracking-[0.2em]">Neural_Sync_Active</span>
                                        </div>
                                    </div>

                                </div>
                                <button
                                    onClick={onClose}
                                    title="Close Archive"
                                    aria-label="Close Archive"
                                    className="w-10 h-10 rounded-xl hover:bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-all"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Stats Tiles */}
                            {stats && (
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                    <div className="bg-white/5 border border-white/5 p-3 rounded-2xl">
                                        <div className="text-[9px] font-mono text-slate-500 uppercase mb-1 flex items-center gap-1.5">
                                            <MessageSquare className="w-3 h-3" /> Total_Interactions
                                        </div>
                                        <div className="text-xl font-black text-cyan-400 font-mono">{stats.total_conversations}</div>
                                    </div>
                                    <div className="bg-white/5 border border-white/5 p-3 rounded-2xl">
                                        <div className="text-[9px] font-mono text-slate-500 uppercase mb-1 flex items-center gap-1.5">
                                            <Zap className="w-3 h-3" /> Exec_Success
                                        </div>
                                        <div className="text-xl font-black text-emerald-400 font-mono">{stats.successful_commands}</div>
                                    </div>
                                    <div className="bg-white/5 border border-white/5 p-3 rounded-2xl">
                                        <div className="text-[9px] font-mono text-slate-500 uppercase mb-1 flex items-center gap-1.5">
                                            <TrendingUp className="w-3 h-3" /> Efficiency_Rate
                                        </div>
                                        <div className="text-xl font-black text-violet-400 font-mono">{stats.success_rate?.toFixed(1)}%</div>
                                    </div>
                                    <div className="bg-white/5 border border-white/5 p-3 rounded-2xl">
                                        <div className="text-[9px] font-mono text-slate-500 uppercase mb-1 flex items-center gap-1.5">
                                            <Shield className="w-3 h-3" /> Uptime_Window
                                        </div>
                                        <div className="text-xl font-black text-amber-400 font-mono">{stats.period_days}d</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Toolbar */}
                        <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-white/5">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Search through neural layers..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-white/5 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 transition-all"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex bg-white/5 rounded-xl border border-white/5 p-1">
                                    <button
                                        onClick={() => setFilterMode('all')}
                                        className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${filterMode === 'all' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                                    >
                                        All_Data
                                    </button>
                                    <button
                                        onClick={() => setFilterMode('success')}
                                        className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${filterMode === 'success' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                                    >
                                        Success
                                    </button>
                                    <button
                                        onClick={() => setFilterMode('fail')}
                                        className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${filterMode === 'fail' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                                    >
                                        Errors
                                    </button>
                                </div>
                                <button
                                    onClick={fetchConversations}
                                    title="Refresh Archive"
                                    aria-label="Refresh Archive"
                                    className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-all active:scale-95"
                                >
                                    <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                </button>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                            {loading ? (
                                <div className="h-full flex flex-col items-center justify-center opacity-50">
                                    <div className="relative w-16 h-16 flex items-center justify-center mb-4">
                                        <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full" />
                                        <div className="absolute inset-0 border-4 border-cyan-500 rounded-full border-t-transparent animate-spin" />
                                        <Brain className="w-6 h-6 text-cyan-500" />
                                    </div>
                                    <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-cyan-500 animate-pulse">Syncing_Neural_Archive...</p>
                                </div>
                            ) : filteredConversations.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center opacity-30">
                                    <Filter className="w-12 h-12 text-slate-600 mb-4" />
                                    <p className="text-sm font-bold uppercase tracking-widest text-slate-500">No matching clusters found</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredConversations.map((conv, idx) => (
                                        <motion.div
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.03 }}
                                            key={conv.id}
                                            className={`group relative overflow-hidden p-5 rounded-2xl border transition-all ${conv.success
                                                ? 'bg-slate-900/40 border-white/5 hover:border-cyan-500/30'
                                                : 'bg-red-500/5 border-red-500/10 hover:border-red-500/30'
                                                }`}
                                        >
                                            <div className="flex flex-col md:flex-row gap-4">
                                                {/* Entry Metadata */}
                                                <div className="w-full md:w-40 flex flex-col gap-2 shrink-0">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-3 h-3 text-slate-600" />
                                                        <span className="text-[10px] font-mono text-slate-500">{formatTimestamp(conv.timestamp)}</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${conv.success ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                                                            }`}>
                                                            {conv.success ? 'Valid' : 'Error'}
                                                        </span>
                                                        <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-500">
                                                            {conv.language}
                                                        </span>
                                                        {conv.command_type && (
                                                            <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-500">
                                                                {conv.command_type}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Entry Content */}
                                                <div className="flex-1 space-y-3">
                                                    <div className="flex gap-3">
                                                        <div className="w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0 mt-1">
                                                            <User className="w-3 h-3 text-cyan-500" />
                                                        </div>
                                                        <p className="text-sm font-medium text-slate-200 mt-1">{conv.user_input}</p>
                                                    </div>
                                                    <div className="flex gap-3">
                                                        <div className="w-6 h-6 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0 mt-1">
                                                            <Bot className="w-3 h-3 text-violet-400" />
                                                        </div>
                                                        <p className="text-sm text-slate-400 mt-1 leading-relaxed">{conv.sofiya_response}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Accent line */}
                                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${conv.success ? 'bg-cyan-500/20 group-hover:bg-cyan-500/50' : 'bg-red-500/30'}`} />
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer Info */}
                        <div className="px-6 py-3 border-t border-white/5 flex justify-between items-center text-[10px] font-mono text-slate-600 uppercase tracking-widest">
                            <span>Cluster_Sync_Complete</span>
                            <span>Displaying_{filteredConversations.length}_Neural_Entries</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
