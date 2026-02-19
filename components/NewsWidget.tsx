
import React from 'react';

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

export const NewsWidget: React.FC<NewsWidgetProps> = ({ news, loading, isVisible, language, onClose, accentColor = '#8b5cf6' }) => {
  if (!isVisible) return null;

  const accentClass = getAccentClass(accentColor);

  return (
    <div
      className={`glass-panel absolute bottom-24 right-4 md:right-8 w-80 p-6 rounded-2xl animate-in slide-in-from-right duration-500 flex flex-col max-h-[22rem] border-r-2 accent-border ${accentClass} shadow-[0_0_40px_rgba(0,0,0,0.3)]`}
    >
      <div className="flex items-center justify-between mb-5 border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full animate-pulse accent-bg ${accentClass} accent-glow`}></div>
          <span className={`text-[10px] font-mono tracking-[0.2em] uppercase accent-text ${accentClass}`}>
            {language === 'hi' ? 'ताज़ा समाचार' : 'NEWS_UPLINK'}
          </span>
        </div>
        <button onClick={onClose} title="Close news" className="text-slate-500 hover:text-white transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="overflow-y-auto space-y-4 pr-1 custom-scrollbar">
        {loading ? (
          <div className="text-xs text-slate-500 text-center py-10 flex flex-col items-center gap-3">
            <div className={`w-6 h-6 border-b-2 border-r-2 rounded-full animate-spin accent-border ${accentClass}`}></div>
            <span className="font-mono tracking-widest opacity-50 uppercase text-[9px]">Establishing data link...</span>
          </div>
        ) : news.length === 0 ? (
          <div className="text-xs text-slate-500 text-center py-10 font-mono italic opacity-50">
            {language === 'hi' ? 'कोई खबर नहीं' : 'NO_HEADLINES_FOUND'}
          </div>
        ) : (
          news.map((item, idx) => (
            <a
              key={idx}
              href={item.link}
              target="_blank"
              rel="noreferrer"
              className="block group relative p-3 transition-all hover:bg-white/5 rounded-xl border border-transparent hover:border-white/5"
            >
              <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-0 group-hover:h-8 transition-all duration-300 accent-bg ${accentClass} rounded-full`}></div>
              <div className="text-[8px] text-slate-500 mb-1 font-mono tracking-wider">
                {new Date(item.pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} // LST_UPDATE
              </div>
              <div className="text-xs text-slate-300 leading-snug group-hover:text-white transition-colors font-sans font-medium uppercase tracking-tight">
                {item.title}
              </div>
            </a>
          ))
        )}
      </div>

      <div className="mt-4 pt-2 border-t border-white/5 flex justify-between items-center opacity-30 select-none">
        <span className="text-[7px] font-mono tracking-[0.3em]">SECURE_RSS_v2</span>
        <span className="text-[7px] font-mono">ENCRYPTED</span>
      </div>
    </div>
  );
};
