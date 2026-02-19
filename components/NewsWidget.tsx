
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Newspaper, X, ExternalLink, RefreshCw, Rss } from 'lucide-react';

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
}

interface NewsWidgetProps {
  news: NewsItem[];
  loading: boolean;
  isVisible: boolean;
  language: 'en' | 'hi';
  onClose: () => void;
  accentColor?: string;
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

export const NewsWidget = React.memo(({ news, loading, isVisible, language, onClose, accentColor = '#8b5cf6' }: NewsWidgetProps) => {
  if (!isVisible) return null;

  const accentClass = getAccentClass(accentColor);

  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 100, opacity: 0 }}
      className={`glass-panel absolute bottom-24 right-4 md:right-8 w-80 p-8 rounded-[2.5rem] flex flex-col max-h-[26rem] border-r-2 accent-border ${accentClass} shadow-[0_40px_100px_rgba(0,0,0,0.5)] z-40 transition-all duration-500`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full -mr-10 -mt-10 pointer-events-none"></div>

      <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <Newspaper className={`w-4 h-4 accent-text ${accentClass} animate-pulse`} />
          <span className={`text-[11px] font-black tracking-[0.4em] uppercase accent-text ${accentClass}`}>
            {language === 'hi' ? 'ताज़ा समाचार' : 'HEADLINE_UPLINK'}
          </span>
        </div>
        <button onClick={onClose} title="Close news" className="p-2 text-slate-600 hover:text-white transition-all hover:bg-white/5 rounded-full">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="overflow-y-auto space-y-5 pr-2 custom-scrollbar relative z-10 h-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
            <RefreshCw className={`w-8 h-8 animate-spin accent-text ${accentClass}`} />
            <span className="text-[10px] font-mono tracking-[0.5em] uppercase text-center">SYNCHRONIZING_RSS_STREAM...</span>
          </div>
        ) : news.length === 0 ? (
          <div className="text-xs text-slate-500 text-center py-20 font-mono italic opacity-40 uppercase tracking-widest">
            {language === 'hi' ? 'कोई खबर नहीं मिली' : 'ZERO_DATA_MATCH'}
          </div>
        ) : (
          <AnimatePresence>
            {news.map((item, idx) => (
              <motion.a
                key={idx}
                href={item.link}
                target="_blank"
                rel="noreferrer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="group block relative p-4 transition-all hover:bg-white/5 rounded-2xl border border-transparent hover:border-white/5"
              >
                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 group-hover:h-8 transition-all duration-300 accent-bg ${accentClass} rounded-full`}></div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[8px] text-slate-600 font-mono tracking-widest font-black uppercase">
                    {new Date(item.pubDate).toLocaleDateString([], { month: 'short', day: 'numeric' })} // {new Date(item.pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <ExternalLink className="w-3 h-3 text-slate-700 group-hover:text-cyan-500 transition-colors" />
                </div>
                <div className="text-xs text-slate-300 leading-relaxed group-hover:text-white transition-colors font-sans font-bold uppercase tracking-tight line-clamp-2">
                  {item.title}
                </div>
              </motion.a>
            ))}
          </AnimatePresence>
        )}
      </div>

      <div className="mt-8 pt-4 border-t border-white/5 flex justify-between items-center opacity-20 select-none">
        <div className="flex items-center gap-2">
          <Rss className="w-3 h-3" />
          <span className="text-[7px] font-mono tracking-[0.4em] uppercase">Feed_Sync: Active</span>
        </div>
        <span className="text-[7px] font-mono">v4.3.0_STABLE</span>
      </div>
    </motion.div>
  );
});
