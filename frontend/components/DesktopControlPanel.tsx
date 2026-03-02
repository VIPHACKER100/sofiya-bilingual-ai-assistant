import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Monitor, Layout, RotateCcw, Trash2, EyeOff, Eye,
    ZoomIn, ZoomOut, Moon, Sun, Grid, Crosshair, AppWindow
} from 'lucide-react';

interface DesktopControlPanelProps {
    language: 'en' | 'hi';
    onCommand: (cmd: string) => void;
    isConnected?: boolean;
}

const labels = {
    en: {
        title: 'DESKTOP CONTROL',
        wallpaper: 'Wallpaper',
        wallpaperPlaceholder: 'Image path e.g. C:/images/bg.jpg',
        recycle: 'Empty Recycle Bin',
        taskbar: 'Taskbar',
        taskbarShow: 'Show',
        taskbarHide: 'Hide',
        zoom: 'Zoom',
        zoomIn: 'In',
        zoomOut: 'Out',
        theme: 'System Theme',
        dark: 'Dark',
        light: 'Light',
        icons: 'Desktop Icons',
        center: 'Center Window',
        snapLeft: 'Snap Left',
        snapRight: 'Snap Right',
        listApps: 'List Apps',
        showDesktop: 'Show Desktop',
        notConnected: 'System Bridge not connected',
    },
    hi: {
        title: 'डेस्कटॉप कंट्रोल',
        wallpaper: 'वॉलपेपर',
        wallpaperPlaceholder: 'इमेज पथ जैसे C:/images/bg.jpg',
        recycle: 'रिसाइकिल बिन खाली करें',
        taskbar: 'टास्कबार',
        taskbarShow: 'दिखाओ',
        taskbarHide: 'छुपाओ',
        zoom: 'ज़ूम',
        zoomIn: 'बड़ा',
        zoomOut: 'छोटा',
        theme: 'सिस्टम थीम',
        dark: 'डार्क',
        light: 'लाइट',
        icons: 'डेस्कटॉप आइकन्स',
        center: 'विंडो बीच में',
        snapLeft: 'बाएं स्नैप',
        snapRight: 'दाएं स्नैप',
        listApps: 'ऐप्स सूची',
        showDesktop: 'डेस्कटॉप दिखाओ',
        notConnected: 'सिस्टम ब्रिज कनेक्ट नहीं',
    }
};

export const DesktopControlPanel: React.FC<DesktopControlPanelProps> = ({
    language,
    onCommand,
    isConnected = false
}) => {
    const t = labels[language];
    const [wallpaperPath, setWallpaperPath] = useState('');

    const send = (cmd: string) => {
        if (!isConnected) return;
        onCommand(cmd);
    };

    const btnBase = `
    flex items-center justify-center gap-1 px-2 py-2 rounded
    text-xs font-mono uppercase tracking-wider
    transition-all duration-200 border
    disabled:opacity-40 disabled:cursor-not-allowed
  `;

    const btnCyan = `${btnBase} bg-cyan-500/10 hover:bg-cyan-500/25 text-cyan-400 border-cyan-500/30 hover:border-cyan-500/60`;
    const btnRed = `${btnBase} bg-red-500/10  hover:bg-red-500/25  text-red-400  border-red-500/30  hover:border-red-500/60`;
    const btnGray = `${btnBase} bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 border-slate-700`;
    const btnGold = `${btnBase} bg-yellow-500/10 hover:bg-yellow-500/25 text-yellow-400 border-yellow-500/30`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="border border-cyan-500/20 bg-slate-900/70 backdrop-blur-md rounded-lg p-4 w-full font-mono text-xs"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-cyan-500/20">
                <div className="flex items-center gap-2 text-cyan-400 uppercase tracking-widest">
                    <Monitor size={14} />
                    {t.title}
                </div>
                {!isConnected && (
                    <span className="text-red-400 text-[10px] animate-pulse">{t.notConnected}</span>
                )}
            </div>

            {/* --- Row 1: Window Controls --- */}
            <div className="mb-4">
                <p className="text-slate-500 text-[10px] uppercase mb-2 flex items-center gap-1">
                    <AppWindow size={10} /> Window
                </p>
                <div className="grid grid-cols-4 gap-2">
                    <button onClick={() => send('snap window left')} className={btnCyan} disabled={!isConnected}>
                        <Layout size={12} /> {t.snapLeft}
                    </button>
                    <button onClick={() => send('center window')} className={btnCyan} disabled={!isConnected}>
                        <Crosshair size={12} /> {t.center}
                    </button>
                    <button onClick={() => send('snap window right')} className={btnCyan} disabled={!isConnected}>
                        <Layout size={12} className="scale-x-[-1]" /> {t.snapRight}
                    </button>
                    <button onClick={() => send('show desktop')} className={btnGray} disabled={!isConnected}>
                        <Monitor size={12} /> {t.showDesktop}
                    </button>
                </div>
            </div>

            {/* --- Row 2: Taskbar & Zoom --- */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Taskbar */}
                <div>
                    <p className="text-slate-500 text-[10px] uppercase mb-2">{t.taskbar}</p>
                    <div className="flex gap-2">
                        <button onClick={() => send('show taskbar')} className={`${btnCyan} flex-1`} disabled={!isConnected}>
                            <Eye size={12} /> {t.taskbarShow}
                        </button>
                        <button onClick={() => send('hide taskbar')} className={`${btnGray} flex-1`} disabled={!isConnected}>
                            <EyeOff size={12} /> {t.taskbarHide}
                        </button>
                    </div>
                </div>

                {/* Zoom */}
                <div>
                    <p className="text-slate-500 text-[10px] uppercase mb-2">{t.zoom}</p>
                    <div className="flex gap-2">
                        <button onClick={() => send('zoom in')} className={`${btnCyan} flex-1`} disabled={!isConnected}>
                            <ZoomIn size={12} /> {t.zoomIn}
                        </button>
                        <button onClick={() => send('zoom out')} className={`${btnGray} flex-1`} disabled={!isConnected}>
                            <ZoomOut size={12} /> {t.zoomOut}
                        </button>
                    </div>
                </div>
            </div>

            {/* --- Row 3: Theme & Icons --- */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Theme */}
                <div>
                    <p className="text-slate-500 text-[10px] uppercase mb-2">{t.theme}</p>
                    <div className="flex gap-2">
                        <button onClick={() => send('set theme to dark')} className={`${btnGray} flex-1`} disabled={!isConnected}>
                            <Moon size={12} /> {t.dark}
                        </button>
                        <button onClick={() => send('set theme to light')} className={`${btnGold} flex-1`} disabled={!isConnected}>
                            <Sun size={12} /> {t.light}
                        </button>
                    </div>
                </div>

                {/* Desktop Icons */}
                <div>
                    <p className="text-slate-500 text-[10px] uppercase mb-2">{t.icons}</p>
                    <button onClick={() => send('toggle desktop icons')} className={`${btnGray} w-full`} disabled={!isConnected}>
                        <Grid size={12} /> TOGGLE
                    </button>
                </div>
            </div>

            {/* --- Row 4: Wallpaper --- */}
            <div className="mb-4">
                <p className="text-slate-500 text-[10px] uppercase mb-2">{t.wallpaper}</p>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={wallpaperPath}
                        onChange={(e) => setWallpaperPath(e.target.value)}
                        placeholder={t.wallpaperPlaceholder}
                        className="flex-1 bg-slate-800/60 border border-slate-700 text-slate-300 text-[11px] px-2 py-1.5 rounded focus:border-cyan-500 outline-none placeholder:text-slate-600"
                    />
                    <button
                        onClick={() => {
                            if (wallpaperPath.trim()) send(`change wallpaper to ${wallpaperPath}`);
                        }}
                        className={`${btnCyan} px-4`}
                        disabled={!isConnected || !wallpaperPath.trim()}
                    >
                        SET
                    </button>
                </div>
            </div>

            {/* --- Row 5: Dangerous Actions --- */}
            <div className="flex gap-3 pt-3 border-t border-slate-800/50">
                <button
                    onClick={() => send('list running apps')}
                    className={`${btnCyan} flex-1`}
                    disabled={!isConnected}
                >
                    <RotateCcw size={12} /> {t.listApps}
                </button>
                <button
                    onClick={() => send('empty recycle bin')}
                    className={`${btnRed} flex-1`}
                    disabled={!isConnected}
                >
                    <Trash2 size={12} /> {t.recycle}
                </button>
            </div>
        </motion.div>
    );
};

export default DesktopControlPanel;
