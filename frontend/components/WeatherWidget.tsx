
import React from 'react';
import { motion } from 'framer-motion';
import { Cloud, CloudRain, Sun, Wind, MapPin, Radio } from 'lucide-react';

interface WeatherWidgetProps {
  data: {
    temp: number;
    condition: string;
    windSpeed: number;
    locationName?: string;
  } | null;
  loading: boolean;
  language: 'en' | 'hi';
  accentColor: string;
  textColorClass: string;
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

export const WeatherWidget = React.memo(({ data, loading, language, accentColor }: WeatherWidgetProps) => {
  if (!data && !loading) return null;

  const accentClass = getAccentClass(accentColor);

  const getIcon = (condition: string) => {
    const c = condition.toLowerCase();
    const props = { className: `w-14 h-14 accent-text ${accentClass} accent-glow` };

    if (c.includes('rain') || c.includes('drizzle')) return <CloudRain {...props} />;
    if (c.includes('cloud') || c.includes('fog')) return <Cloud {...props} />;
    return <Sun {...props} />;
  };

  return (
    <motion.div
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={`glass-panel absolute top-24 left-4 lg:left-8 w-72 p-6 rounded-[2rem] border-l-2 accent-border ${accentClass} shadow-[0_20px_50px_rgba(0,0,0,0.4)] z-40 transition-all duration-500`}
    >
      <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-3">
        <div className="flex items-center gap-3">
          <Radio className={`w-4 h-4 accent-text ${accentClass} animate-pulse`} />
          <span className={`text-[11px] font-black tracking-[0.3em] uppercase accent-text ${accentClass}`}>
            {language === 'hi' ? 'मौसम रिपोर्ट' : 'ATMOS_STATION'}
          </span>
        </div>
        {loading && <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className={`w-4 h-4 rounded-full border-2 border-t-transparent accent-border ${accentClass}`}></motion.div>}
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="h-12 bg-white/5 rounded-2xl w-2/3 animate-pulse"></div>
          <div className="h-4 bg-white/5 rounded-full w-full animate-pulse"></div>
          <div className="h-4 bg-white/5 rounded-full w-3/4 animate-pulse"></div>
        </div>
      ) : (
        data && (
          <div className="relative">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-6xl font-black text-white tracking-tighter leading-none drop-shadow-2xl">{data.temp}°</span>
                <span className={`text-[10px] mt-2 uppercase tracking-[0.2em] font-black accent-text ${accentClass} opacity-80`}>{data.condition}</span>
              </div>
              <motion.div
                animate={{ scale: [1, 1.05, 1], y: [0, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                {getIcon(data.condition)}
              </motion.div>
            </div>

            <div className="mt-8 pt-4 border-t border-white/5 flex flex-col gap-3 font-mono text-[10px] text-slate-500 uppercase tracking-widest">
              <div className="flex justify-between items-center group">
                <div className="flex items-center gap-2">
                  <Wind className="w-3 h-3 opacity-40 group-hover:rotate-45 transition-transform" />
                  <span>Wind_SPD:</span>
                </div>
                <span className="text-white font-black">{data.windSpeed} <span className="text-[8px] opacity-40">KM/H</span></span>
              </div>
              <div className="flex justify-between items-center group">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3 h-3 opacity-40 group-hover:scale-120 transition-transform" />
                  <span>Location:</span>
                </div>
                <span className="text-white font-black truncate max-w-[120px]">{data.locationName || 'LINK_FAILURE'}</span>
              </div>
            </div>
          </div>
        )
      )}

      {/* Hex deco */}
      <div className="absolute top-2 right-2 opacity-5 pointer-events-none">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="currentColor"><path d="M20 0L37.32 10V30L20 40L2.68 30V10L20 0Z" /></svg>
      </div>
    </motion.div>
  );
});
