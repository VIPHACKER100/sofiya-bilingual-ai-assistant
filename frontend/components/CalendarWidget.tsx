
import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Users, X } from 'lucide-react';

interface CalendarEvent {
    id: string;
    title: string;
    start_time: string;
    end_time: string;
    location?: string;
    is_shared: boolean;
    user_id: string;
}

interface CalendarWidgetProps {
    events: CalendarEvent[];
    isVisible: boolean;
    language: 'en' | 'hi';
    onClose: () => void;
    onAddEvent: (title: string) => void;
    accentColor?: string;
}

export const CalendarWidget: React.FC<CalendarWidgetProps> = ({ events, isVisible, language, onClose, onAddEvent, accentColor = '#06b6d4' }) => {
    if (!isVisible) return null;

    return (
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="glass-panel absolute top-24 left-1/2 -translate-x-1/2 w-96 p-6 rounded-[2rem] border-t-2 border-cyan-500/30 shadow-2xl z-40"
        >
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-cyan-400" />
                    <span className="text-[12px] font-black tracking-widest uppercase text-white/90">
                        {language === 'hi' ? 'कैलेंडर प्रोटोकॉल' : 'CALENDAR_SYNC'}
                    </span>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                {events.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center opacity-30 gap-3">
                        <Clock className="w-8 h-8" />
                        <span className="text-[10px] font-mono uppercase tracking-[0.3em]">No Upcoming Events</span>
                    </div>
                ) : (
                    events.map(event => (
                        <div key={event.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-all group">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="text-[11px] font-bold text-white group-hover:text-cyan-400 transition-colors uppercase">{event.title}</h4>
                                {event.is_shared && (
                                    <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                                        <Users className="w-2.5 h-2.5 text-cyan-400" />
                                        <span className="text-[7px] font-black text-cyan-400 uppercase">SHARED</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-1.5 opacity-60">
                                <div className="flex items-center gap-2 text-[9px]">
                                    <Clock className="w-3 h-3" />
                                    <span>{new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                {event.location && (
                                    <div className="flex items-center gap-2 text-[9px]">
                                        <MapPin className="w-3 h-3" />
                                        <span>{event.location}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center">
                <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">v2.1_CHRONOS</span>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                        const title = prompt(language === 'hi' ? 'ईवेंट का नाम:' : 'Event Title:');
                        if (title) onAddEvent(title);
                    }}
                    className="px-4 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-[9px] font-black text-cyan-400 uppercase"
                >
                    {language === 'hi' ? 'ईवेंट जोड़ें' : 'NEW_EVENT'}
                </motion.button>
            </div>
        </motion.div>
    );
};
