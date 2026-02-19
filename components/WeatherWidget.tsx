
import React from 'react';

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

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ data, loading, language, accentColor }) => {
  if (!data && !loading) return null;

  const accentClass = getAccentClass(accentColor);

  const getIcon = (condition: string) => {
    const c = condition.toLowerCase();
    const props = { className: `w-12 h-12 accent-text ${accentClass} accent-glow`, stroke: 'currentColor', strokeWidth: 1.5, fill: "none", strokeLinecap: "round" as "round", strokeLinejoin: "round" as "round" };

    if (c.includes('rain') || c.includes('drizzle')) {
      return <svg {...props} viewBox="0 0 24 24"><path d="M20 16.2A4.5 4.5 0 0 0 17.5 8h-1.8A7 7 0 1 0 4 14.9" /><path d="M16 14v6" /><path d="M8 14v6" /><path d="M12 16v6" /></svg>;
    }
    if (c.includes('cloud') || c.includes('fog')) {
      return <svg {...props} viewBox="0 0 24 24"><path d="M17.5 19c0-1.7-1.3-3-3-3h-11a4 4 0 1 1 .9-7.9 7 7 0 1 1 13.1 2.9" /></svg>;
    }
    return <svg {...props} viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" /><path d="M12 1v2" /><path d="M12 21v2" /><path d="M4.22 4.22l1.42 1.42" /><path d="M18.36 18.36l1.42 1.42" /><path d="M1 12h2" /><path d="M21 12h2" /><path d="M4.22 19.78l1.42-1.42" /><path d="M18.36 5.64l1.42-1.42" /></svg>;
  };

  return (
    <div
      className={`glass-panel absolute top-24 left-4 lg:left-8 w-64 p-5 rounded-2xl animate-in slide-in-from-left duration-700 border-l-2 accent-border ${accentClass} shadow-[0_0_30px_rgba(0,0,0,0.2)]`}
    >
      <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full accent-bg ${accentClass} animate-pulse`}></div>
          <span className={`text-[10px] font-mono tracking-[0.3em] uppercase accent-text ${accentClass}`}>
            {language === 'hi' ? 'मौसम रिपोर्ट' : 'WEATHER.STATION'}
          </span>
        </div>
        {loading && <div className={`w-3 h-3 rounded-full border border-t-transparent animate-spin accent-border ${accentClass}`}></div>}
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-10 bg-white/5 rounded-lg w-1/2"></div>
          <div className="h-4 bg-white/5 rounded-lg w-3/4"></div>
        </div>
      ) : (
        data && (
          <div>
            <div className="flex items-center justify-between">
              <span className="text-5xl font-bold text-white tracking-tighter drop-shadow-lg">{data.temp}°</span>
              <div className="accent-glow">{getIcon(data.condition)}</div>
            </div>
            <div className={`text-xs mt-2 uppercase tracking-[0.2em] font-mono accent-text ${accentClass} opacity-80 font-bold`}>{data.condition}</div>

            <div className="mt-5 pt-3 border-t border-white/5 flex flex-col gap-1 font-mono text-[9px] text-slate-500 uppercase tracking-widest">
              <div className="flex justify-between">
                <span>Wind_SPD:</span>
                <span className="text-slate-300">{data.windSpeed} KM/H</span>
              </div>
              <div className="flex justify-between">
                <span>Location:</span>
                <span className="text-slate-300 truncate max-w-[120px]">{data.locationName || 'LINK_FAILURE'}</span>
              </div>
            </div>
          </div>
        )
      )}

      {/* Footer Decoration */}
      <div className="absolute -bottom-1 -right-1 opacity-20 rotate-180">
        <div className={`w-4 h-4 border-t border-l accent-border ${accentClass}`}></div>
      </div>
    </div>
  );
};
