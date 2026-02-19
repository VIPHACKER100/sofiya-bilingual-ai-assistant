
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

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ data, loading, language, accentColor, textColorClass }) => {
  if (!data && !loading) return null;

  const getIcon = (condition: string) => {
    const c = condition.toLowerCase();
    const stroke = accentColor;
    const props = { className: "w-10 h-10", stroke, strokeWidth: 1.5, fill: "none", strokeLinecap: "round" as "round", strokeLinejoin: "round" as "round" };
    
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
        className="glass-panel absolute top-24 left-4 lg:left-8 w-64 p-4 rounded-lg animate-in slide-in-from-left duration-500"
        style={{ borderColor: `${accentColor}33` }}
    >
      <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
        <span className={`text-[10px] font-mono tracking-widest uppercase ${textColorClass}`}>
          {language === 'hi' ? 'मौसम रिपोर्ट' : 'WEATHER.SYS'}
        </span>
        {loading && <div className="w-3 h-3 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: accentColor }}></div>}
      </div>

      {loading ? (
        <div className="space-y-2 animate-pulse opacity-50">
           <div className="h-8 bg-slate-700/50 rounded w-1/2"></div>
           <div className="h-4 bg-slate-700/50 rounded w-3/4"></div>
        </div>
      ) : (
        data && (
            <div>
                <div className="flex items-center justify-between">
                    <span className="text-4xl font-bold text-white font-sans tracking-tight">{data.temp}°</span>
                    <div className="filter drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">{getIcon(data.condition)}</div>
                </div>
                <div className="text-sm mt-1 capitalize text-slate-300">{data.condition}</div>
                
                <div className="mt-3 pt-2 border-t border-white/5 flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>WND: {data.windSpeed} km/h</span>
                    <span>{data.locationName || 'GPS: LOCK'}</span>
                </div>
            </div>
        )
      )}
    </div>
  );
};
