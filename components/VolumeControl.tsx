
import React from 'react';

interface VolumeControlProps {
  level: number;
}

export const VolumeControl: React.FC<VolumeControlProps> = ({ level }) => {
  const segments = Array.from({ length: 20 }, (_, i) => i * 5);

  return (
    <div className="flex items-end gap-5 group py-2">
      <div className="text-[9px] font-mono text-slate-500 uppercase tracking-[0.4em] -rotate-90 origin-bottom-right translate-x-3 mb-4 opacity-50">
        AUDIO_GAIN
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex gap-1 h-14 items-end px-2 border-b border-white/5 pb-1">
          {segments.map((threshold) => (
            <div
              key={threshold}
              className={`w-1.5 rounded-sm transition-all duration-500 ease-out ${level > threshold
                  ? 'accent-bg accent-cyan accent-glow scale-y-100'
                  : 'bg-slate-800 scale-y-20 opacity-20'
                }`}
              style={{
                height: `${25 + (threshold * 0.75)}%`
              }}
            />
          ))}
        </div>
        <div className="flex justify-between w-full text-[10px] font-mono text-slate-600 px-1">
          <span className="opacity-40">MIN</span>
          <span className="accent-text accent-cyan font-bold tracking-widest">{level.toString().padStart(3, '0')}_VAL</span>
          <span className="opacity-40">MAX</span>
        </div>
      </div>
    </div>
  );
};
