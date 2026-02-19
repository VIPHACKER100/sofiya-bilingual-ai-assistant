
import React from 'react';
import { ArcReactor } from './components/ArcReactor';
import { HistoryLog } from './components/HistoryLog';
import { VolumeControl } from './components/VolumeControl';
import { PermissionModal } from './components/PermissionModal';
import { DrawingCanvas } from './components/DrawingCanvas';
import { WeatherWidget } from './components/WeatherWidget';
import { TaskPanel } from './components/TaskPanel';
import { NewsWidget } from './components/NewsWidget';
import { CalculatorWidget } from './components/CalculatorWidget';
import { TimerWidget } from './components/TimerWidget';
import { StatusPanel } from './components/StatusPanel';
import { SentryMode } from './components/SentryMode';
import { BootSequence } from './components/BootSequence';
import { Waveform } from './components/Waveform';
import { HealthWidget } from './components/HealthWidget';
import { SmartHomeWidget } from './components/SmartHomeWidget';
import { MindfulnessWidget } from './components/MindfulnessWidget';
import { CommunicationWidget } from './components/CommunicationWidget';
import { MediaWidget } from './components/MediaWidget';
import { AppMode, Language } from './types';
import { soundService } from './services/soundService';
import { TRY_COMMANDS } from './constants';
import { useAssistant } from './hooks/useAssistant';

const PROTOCOLS = {
  sofiya: { name: 'SOFIYA', subtitle: 'ADVANCED AI ASSISTANT', primary: '#8b5cf6', textClass: 'text-violet-400', bgGradient: 'from-violet-900/20 to-black' },
  classic: { name: 'CLASSIC', subtitle: 'STANDARD INTERFACE', primary: '#06b6d4', textClass: 'text-cyan-400', bgGradient: 'from-cyan-900/20 to-black' },
  focus: { name: 'FOCUS', subtitle: 'PRODUCTIVITY MODE', primary: '#ef4444', textClass: 'text-red-400', bgGradient: 'from-red-900/20 to-black' },
  zen: { name: 'ZEN', subtitle: 'MINDFULNESS PROTOCOL', primary: '#10b981', textClass: 'text-emerald-400', bgGradient: 'from-emerald-900/20 to-black' },
};

const App: React.FC = () => {
  const assistant = useAssistant();
  const currentProtocol = PROTOCOLS[assistant.theme];

  const handleBootComplete = () => {
    assistant.setIsBooting(false);
    assistant.addToHistory({
      transcript: "System Init...",
      response: "SOFIYA Online. Ready to assist.",
      actionType: "SYSTEM",
      language: 'en',
      timestamp: Date.now(),
      isSystemMessage: true
    });
  };

  const toggleSmartDevice = (id: string) => {
    assistant.setSmartDevices(prev => prev.map(d => {
      if (d.id === id) {
        if (typeof d.status === 'boolean') return { ...d, status: !d.status };
        if (d.type === 'lock') return { ...d, status: d.status === 'Locked' ? 'Unlocked' : 'Locked' };
      }
      return d;
    }));
  };

  if (assistant.isBooting) return <BootSequence onComplete={handleBootComplete} language={assistant.language === Language.HINDI ? 'hi' : 'en'} />;

  return (
    <div className={`min-h-screen w-full relative overflow-hidden text-slate-200 transition-colors duration-1000 bg-black font-sans`}>
      {/* Cinematic Overlays */}
      <div className="scanline"></div>
      <div className="vignette"></div>

      {/* Dynamic Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${currentProtocol.bgGradient} opacity-40 transition-all duration-1000`}></div>

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 pointer-events-none bg-[size:50px_50px]"
        style={{ backgroundImage: `linear-gradient(${currentProtocol.primary}08 1.5px, transparent 1.5px), linear-gradient(90deg, ${currentProtocol.primary}08 1.5px, transparent 1.5px)` }}
      ></div>

      {/* Decorative Top Bar */}
      <div className="absolute top-0 left-0 right-0 h-[2px] opacity-50 accent-bg" style={{ '--widget-accent': currentProtocol.primary } as any}></div>

      {/* --- Main UI Structure --- */}
      <div className="relative z-10 w-full h-screen flex flex-col p-4 md:p-8">

        {/* Header */}
        <header className="flex justify-between items-start mb-8 animate-in slide-in-from-top duration-700">
          <div className="flex flex-col">
            <h1
              className="text-4xl md:text-5xl font-bold tracking-[0.2em] font-mono text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500 neon-glow"
              style={{ color: currentProtocol.primary }}
            >
              {currentProtocol.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="h-0.5 w-8 accent-bg" style={{ '--widget-accent': currentProtocol.primary } as any}></div>
              <p className="text-xs text-slate-400 tracking-widest uppercase">{currentProtocol.subtitle}</p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            {/* Language Switch */}
            <button
              onClick={() => { soundService.playUIClick(); assistant.setLanguage(l => l === Language.ENGLISH ? Language.HINDI : Language.ENGLISH) }}
              className="glass-panel px-4 py-1 rounded-full text-xs font-bold tracking-wider hover:bg-white/10 transition-colors flex items-center gap-2 border border-white/5"
            >
              <span className={assistant.language === Language.ENGLISH ? "text-white" : "text-slate-500"}>EN</span>
              <span className="w-px h-3 bg-slate-600"></span>
              <span className={assistant.language === Language.HINDI ? "text-orange-400" : "text-slate-500"}>HI</span>
            </button>

            {/* Theme Dots */}
            <div className="flex gap-2">
              {Object.entries(PROTOCOLS).map(([key, proto]) => (
                <button
                  key={key}
                  title={`Switch to ${proto.name} theme`}
                  onClick={() => { soundService.playUIClick(); assistant.setTheme(key as any); }}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${assistant.theme === key ? 'scale-125 shadow-[0_0_15px_currentColor]' : 'opacity-20 hover:opacity-100'}`}
                  style={{ backgroundColor: proto.primary, color: proto.primary }}
                />
              ))}
            </div>
          </div>
        </header>

        {/* Center Stage */}
        <main className="flex-1 flex flex-col items-center justify-center relative">

          {/* Reactor & Waveform Container */}
          <div className="relative flex flex-col items-center gap-8 z-20">
            <div className="relative">
              {/* Transcript Overlay */}
              {assistant.transcript && (
                <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-max max-w-lg text-center pointer-events-none animate-in fade-in zoom-in-95 slide-in-from-bottom-4">
                  <p className="text-lg md:text-xl font-light text-white bg-black/40 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 shadow-lg">
                    "{assistant.transcript}"
                  </p>
                </div>
              )}
              <ArcReactor isActive={assistant.mode !== AppMode.IDLE} onClick={assistant.toggleActivation} language={assistant.language === Language.HINDI ? 'hi' : 'en'} color={currentProtocol.primary} />
            </div>

            <div className="w-full max-w-md">
              <Waveform mode={assistant.mode} color={currentProtocol.primary} />
            </div>
          </div>

          {/* Floating Widgets */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Top Left: Weather */}
            <div className="pointer-events-auto">
              <WeatherWidget data={assistant.weatherData} loading={assistant.isWeatherLoading} language={assistant.language === Language.HINDI ? 'hi' : 'en'} accentColor={currentProtocol.primary} textColorClass={currentProtocol.textClass} />
            </div>

            {/* Top Right: Status */}
            <div className="absolute top-0 right-0 pointer-events-auto hidden lg:block">
              <StatusPanel isDarkMode={true} />
            </div>

            <div className="pointer-events-auto">
              <NewsWidget news={assistant.newsItems} loading={assistant.isNewsLoading} isVisible={assistant.showNews} language={assistant.language === Language.HINDI ? 'hi' : 'en'} onClose={() => assistant.setShowNews(false)} accentColor={currentProtocol.primary} />
            </div>

            {/* Bottom Left: Media/Task */}
            <div className="pointer-events-auto">
              <TaskPanel tasks={assistant.tasks} isVisible={assistant.showTasks} language={assistant.language === Language.HINDI ? 'hi' : 'en'} onClose={() => assistant.setShowTasks(false)} accentColor={currentProtocol.primary} />
              {assistant.mediaTrack && <MediaWidget track={assistant.mediaTrack} isVisible={assistant.showMedia} language={assistant.language === Language.HINDI ? 'hi' : 'en'} onClose={() => assistant.setShowMedia(false)} onTogglePlay={() => assistant.setMediaTrack({ ...assistant.mediaTrack!, isPlaying: !assistant.mediaTrack!.isPlaying })} />}
            </div>
          </div>
        </main>

        {/* Footer Area */}
        <div className="h-1/4 flex flex-col justify-end gap-4 z-20">
          <div className="flex flex-col md:flex-row gap-6 items-end md:items-center justify-between">
            {/* History Log */}
            <HistoryLog history={assistant.history} />

            {/* Volume & Status */}
            <div className="flex flex-col gap-4 items-end">
              <VolumeControl level={assistant.volume} />
              <div className="text-[10px] text-slate-500 font-mono text-right leading-relaxed">
                SYS.VER: 4.3.0 <br />
                SECURE_CONN: <span className="text-emerald-500">ESTABLISHED</span><br />
                CORE_TEMP: <span className="text-cyan-400">OPTIMAL</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Modal Layers */}
      <PermissionModal isOpen={assistant.showPermissionModal} onClose={() => assistant.setShowPermissionModal(false)} language={assistant.language === Language.HINDI ? 'hi' : 'en'} />
      {assistant.showDrawingCanvas && <DrawingCanvas onClose={() => assistant.setShowDrawingCanvas(false)} language={assistant.language === Language.HINDI ? 'hi' : 'en'} />}
      {assistant.showSentryMode && <SentryMode onClose={() => assistant.setShowSentryMode(false)} language={assistant.language === Language.HINDI ? 'hi' : 'en'} />}
      {assistant.showMindfulness && <MindfulnessWidget onClose={() => assistant.setShowMindfulness(false)} language={assistant.language === Language.HINDI ? 'hi' : 'en'} />}
      <CalculatorWidget data={assistant.calcData} isVisible={assistant.showCalc} onClose={() => assistant.setShowCalc(false)} />
      <HealthWidget data={assistant.healthData} isVisible={assistant.showHealth} language={assistant.language === Language.HINDI ? 'hi' : 'en'} />
      <SmartHomeWidget devices={assistant.smartDevices} isVisible={assistant.showSmartHome} language={assistant.language === Language.HINDI ? 'hi' : 'en'} onToggle={toggleSmartDevice} onClose={() => assistant.setShowSmartHome(false)} />
      {assistant.commData && <CommunicationWidget data={assistant.commData} isVisible={assistant.showComm} language={assistant.language === Language.HINDI ? 'hi' : 'en'} onClose={() => assistant.setShowComm(false)} />}
      {assistant.activeTimer && <TimerWidget duration={assistant.activeTimer.duration} label={assistant.activeTimer.label} onComplete={() => assistant.setActiveTimer(null)} onCancel={() => assistant.setActiveTimer(null)} />}

      {/* Marquee Footer - Clickable Interactive commands */}
      <footer className="absolute bottom-0 w-full bg-slate-950/80 border-t border-white/5 py-1 z-30 backdrop-blur-sm overflow-hidden">
        <div
          className="flex animate-marquee hover:pause whitespace-nowrap text-[10px] font-mono tracking-[0.2em] accent-text"
          style={{ '--widget-accent': currentProtocol.primary } as any}
        >
          {TRY_COMMANDS.map((cmd, i) => (
            <button
              key={i}
              onClick={() => { assistant.executeCommand(cmd); }}
              className="mx-4 hover:text-white transition-colors cursor-pointer uppercase py-1"
            >
              • {cmd}
            </button>
          ))}
          {/* Duplicate for seamless loop */}
          {TRY_COMMANDS.map((cmd, i) => (
            <button
              key={`dup-${i}`}
              onClick={() => { assistant.executeCommand(cmd); }}
              className="mx-4 hover:text-white transition-colors cursor-pointer uppercase py-1"
            >
              • {cmd}
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
};

export default App;
