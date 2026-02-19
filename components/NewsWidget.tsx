
import React from 'react';

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
}

interface NewsWidgetProps {
  news: NewsItem[];
  isVisible: boolean;
  language: 'en' | 'hi';
  onClose: () => void;
  accentColor?: string;
}

export const NewsWidget: React.FC<NewsWidgetProps> = ({ news, isVisible, language, onClose, accentColor = '#06b6d4' }) => {
  if (!isVisible) return null;

  return (
    <div 
        className="glass-panel absolute bottom-20 right-4 md:right-8 w-80 p-5 rounded-xl animate-in slide-in-from-right duration-500 flex flex-col max-h-[20rem] border-r-2"
        style={{ borderColor: accentColor }}
    >
       <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
        <span className="text-xs font-mono tracking-widest uppercase" style={{ color: accentColor }}>
          {language === 'hi' ? 'ताज़ा समाचार' : 'GLOBAL FEED'}
        </span>
        <div className="flex items-center gap-3">
           <div className="flex gap-1">
             <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: accentColor }}></div>
             <div className="w-1.5 h-1.5 rounded-full animate-pulse delay-75 bg-white/50"></div>
           </div>
           <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
             </svg>
           </button>
        </div>
      </div>
      
      <div className="overflow-y-auto space-y-3 pr-2 custom-scrollbar">
         {news.length === 0 ? (
           <div className="text-xs text-slate-500 text-center py-6 italic flex flex-col items-center gap-2">
             <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: accentColor }}></div>
             {language === 'hi' ? 'फीड लोड हो रहा है...' : 'Establishing uplink...'}
           </div>
         ) : (
           news.map((item, idx) => (
             <a 
                key={idx} 
                href={item.link} 
                target="_blank" 
                rel="noreferrer" 
                className="block group relative pl-3 transition-all hover:bg-white/5 p-2 rounded"
             >
               <div className="absolute left-0 top-3 w-0.5 h-8 bg-slate-700 group-hover:bg-current transition-colors" style={{ color: accentColor }}></div>
               <div className="text-[9px] text-slate-500 mb-0.5 font-mono">{new Date(item.pubDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
               <div className="text-sm text-slate-300 leading-snug group-hover:text-white transition-colors">
                 {item.title}
               </div>
             </a>
           ))
         )}
      </div>
    </div>
  );
};
