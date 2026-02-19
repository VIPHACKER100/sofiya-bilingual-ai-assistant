
import React from 'react';

interface VolumeControlProps {
  level: number;
}

export const VolumeControl: React.FC<VolumeControlProps> = ({ level }) => {
  // Create 20 segments for the volume bar
  const segments = Array.from({ length: 20 }, (_, i) => i * 5);

  return (
    <div className="flex items-end gap-3 group">
      <div className="text-[10px] font-mono text-cyan-500/70 uppercase tracking-widest -rotate-90 origin-bottom-right translate-x-2 mb-2">
        Audio.Lvl
      </div>
      
      <div className="flex flex-col gap-1">
         <div className="flex gap-0.5 h-12 items-end">
            {segments.map((threshold) => (
              <div 
                key={threshold}
                className={`w-1.5 rounded-sm transition-all duration-300 ${
                  level > threshold 
                    ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)] scale-y-100' 
                    : 'bg-slate-800 scale-y-50'
                }`}
                style={{ 
                    height: `${20 + (threshold * 0.8)}%`, // Rising effect
                    opacity: level > threshold ? 1 : 0.3
                }}
              />
            ))}
         </div>
         <div className="flex justify-between w-full text-[9px] font-mono text-cyan-600">
            <span>0</span>
            <span className="text-cyan-400 font-bold">{level}%</span>
            <span>100</span>
         </div>
      </div>
    </div>
  );
};
