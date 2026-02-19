
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Shield, Globe, Terminal, Sparkles, MessageSquareWarning } from 'lucide-react';
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
import { StatusBadges } from './components/StatusBadges';
import { FeedbackModal } from './components/FeedbackModal';
import { AppMode, Language } from './types';
import { soundService } from './services/soundService';
import { TRY_COMMANDS } from './constants';
import { useAssistant } from './hooks/useAssistant';

const PROTOCOLS = {
  sofiya: { name: 'SOFIYA.OS', subtitle: 'NEURAL_LINK_V4', primary: '#8b5cf6', textClass: 'text-violet-400', bgGradient: 'from-violet-900/40 via-black to-black' },
  classic: { name: 'CORE.SYS', subtitle: 'LEGACY_UPLINK', primary: '#06b6d4', textClass: 'text-cyan-400', bgGradient: 'from-cyan-900/40 via-black to-black' },
  focus: { name: 'FOCUS.PRO', subtitle: 'MINIMAL_LATENCY', primary: '#ef4444', textClass: 'text-red-400', bgGradient: 'from-red-900/40 via-black to-black' },
  zen: { name: 'ZEN.STATE', subtitle: 'ALPHA_LEVEL_SYNC', primary: '#10b981', textClass: 'text-emerald-400', bgGradient: 'from-emerald-900/40 via-black to-black' },
};

const App: React.FC = () => {
  const assistant = useAssistant();
  const currentProtocol = PROTOCOLS[assistant.theme];

  const handleBootComplete = () => {
    assistant.setIsBooting(false);
    assistant.addToHistory({
      transcript: "UPLINK_INITIALIZED",
      response: "SOFIYA Online. Core services authenticated.",
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
    <div className="min-h-screen w-full relative overflow-hidden bg-black text-slate-200 font-sans selection:bg-cyan-500/30">
      {/* Cinematic Environmental FX */}
      <div className="scanline opacity-[0.03]"></div>
      <div className="vignette opacity-60"></div>

      {/* Deep Background Pulse */}
      <motion.div
        animate={{ opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 10, repeat: Infinity }}
        className={`absolute inset-0 bg-gradient-to-br ${currentProtocol.bgGradient} transition-all duration-1000`}
      />


      {/* Advanced HUD Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20 animate-grid-drift"
        style={{
          backgroundImage: `radial-gradient(${currentProtocol.primary}33 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      ></div>

      <StatusBadges accentColor={currentProtocol.primary} />

      {/* Main UI Container */}
      <div className="relative z-10 w-full h-screen flex flex-col p-6 lg:p-12">

        {/* Superior Header */}
        <header className="flex justify-between items-start z-50">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex flex-col gap-2"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner group cursor-pointer hover:bg-white/10 transition-all overflow-hidden relative">
                <Sparkles className="w-6 h-6 text-white group-hover:scale-125 transition-transform" />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-2 border-t-white/20 border-r-transparent border-b-transparent border-l-transparent rounded-2xl"
                />
              </div>
              <div className="flex flex-col">
                <h1 className="text-5xl font-black tracking-[0.15em] font-mono leading-none flex items-baseline gap-2 text-gradient">
                  {currentProtocol.name.split('.')[0]}
                  <span className="text-xl opacity-20 font-light">.{currentProtocol.name.split('.')[1]}</span>
                </h1>
                <span className="text-[10px] font-black tracking-[0.6em] text-cyan-500/60 uppercase mt-1 pl-1">
                  {currentProtocol.subtitle}
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex flex-col items-end gap-6"
          >
            {/* Global Actions */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => { soundService.playUIClick(); assistant.setLanguage(l => l === Language.ENGLISH ? Language.HINDI : Language.ENGLISH) }}
                className="group relative px-6 py-2 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4 transition-all hover:bg-white/10 active:scale-95"
              >
                <Globe className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                <div className="flex gap-2 text-[10px] font-black tracking-widest font-mono">
                  <span className={assistant.language === Language.ENGLISH ? "text-cyan-400" : "text-slate-600"}>EN</span>
                  <span className="opacity-20">|</span>
                  <span className={assistant.language === Language.HINDI ? "text-orange-400" : "text-slate-600"}>HI</span>
                </div>
              </button>

              <button
                onClick={() => { soundService.playUIClick(); assistant.setShowFeedback(true); }}
                title="Feedback Loop"
                className="p-2.5 rounded-2xl bg-red-500/5 border border-red-500/20 text-red-500/60 hover:text-red-500 hover:bg-red-500/10 transition-all active:scale-95"
              >
                <MessageSquareWarning className="w-5 h-5" />
              </button>
            </div>

            {/* Tactical Theme Selector */}
            <div className="flex gap-4 p-2 bg-black/40 rounded-full border border-white/5 backdrop-blur-md">
              {Object.entries(PROTOCOLS).map(([key, proto]) => (
                <button
                  key={key}
                  onClick={() => { soundService.playUIClick(); assistant.setTheme(key as any); }}
                  className={`w-4 h-4 rounded-full transition-all duration-500 relative ${assistant.theme === key ? 'scale-125' : 'opacity-20 hover:opacity-100'}`}
                  style={{ backgroundColor: proto.primary }}
                >
                  {assistant.theme === key && (
                    <motion.div
                      layoutId="theme-active"
                      className="absolute -inset-1.5 border border-white/20 rounded-full"
                    />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        </header>

        {/* Neural CORE Stage */}
        <main className="flex-1 flex flex-col items-center justify-center relative">
          <div className="relative flex flex-col items-center gap-12 z-20">
            <div className="relative">
              <AnimatePresence>
                {assistant.transcript && (
                  <motion.div
                    initial={{ y: 20, opacity: 0, scale: 0.9 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: -20, opacity: 0, scale: 0.9 }}
                    className="absolute -top-32 left-1/2 -track-x-1/2 w-[24rem] text-center pointer-events-none"
                    style={{ left: '50%', transform: 'translateX(-50%)' }}
                  >
                    <div className="glass-panel px-8 py-4 rounded-[2rem] border-t border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
                      <p className="text-xl font-medium text-white/90 italic leading-relaxed">
                        "{assistant.transcript}"
                      </p>
                      <div className="mt-3 flex justify-center gap-1">
                        {[1, 2, 3].map(i => <motion.div key={i} animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }} className="w-1 h-1 bg-cyan-500 rounded-full" />)}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <ArcReactor
                isActive={assistant.mode !== AppMode.IDLE}
                onClick={assistant.toggleActivation}
                language={assistant.language === Language.HINDI ? 'hi' : 'en'}
                color={currentProtocol.primary}
              />
            </div>

            <div className="w-full max-w-lg">
              <Waveform mode={assistant.mode} color={currentProtocol.primary} />
            </div>
          </div>

          {/* HUD Widget Layers */}
          <div className="absolute inset-0 pointer-events-none">
            <AnimatePresence>
              <WeatherWidget data={assistant.weatherData} loading={assistant.isWeatherLoading} language={assistant.language === Language.HINDI ? 'hi' : 'en'} accentColor={currentProtocol.primary} textColorClass={currentProtocol.textClass} />

              <div className="absolute top-0 right-0 pointer-events-auto hidden xl:block">
                <StatusPanel />
              </div>

              <NewsWidget news={assistant.newsItems} loading={assistant.isNewsLoading} isVisible={assistant.showNews} language={assistant.language === Language.HINDI ? 'hi' : 'en'} onClose={() => assistant.setShowNews(false)} accentColor={currentProtocol.primary} />

              <TaskPanel tasks={assistant.tasks} isVisible={assistant.showTasks} language={assistant.language === Language.HINDI ? 'hi' : 'en'} onClose={() => assistant.setShowTasks(false)} accentColor={currentProtocol.primary} />

              {assistant.mediaTrack && <MediaWidget track={assistant.mediaTrack} isVisible={assistant.showMedia} language={assistant.language === Language.HINDI ? 'hi' : 'en'} onClose={() => assistant.setShowMedia(false)} onTogglePlay={() => assistant.setMediaTrack({ ...assistant.mediaTrack!, isPlaying: !assistant.mediaTrack!.isPlaying })} />}
            </AnimatePresence>
          </div>
        </main>

        {/* Master Console Footer */}
        <div className="h-1/3 flex flex-col justify-end gap-8 z-20">
          <div className="flex flex-col lg:flex-row gap-12 items-end justify-between border-t border-white/5 pt-10">
            <HistoryLog history={assistant.history} />

            <div className="flex flex-col gap-8 items-end w-full lg:w-auto">
              <VolumeControl level={assistant.volume} />

              <div className="flex gap-10 text-[9px] font-mono tracking-[0.2em] text-slate-500 uppercase">
                <div className="flex flex-col gap-1 items-end">
                  <span className="opacity-40">Uplink_Node:</span>
                  <span className="text-emerald-500 font-black">STABLE.IN_NORTH</span>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <span className="opacity-40">Security_Level:</span>
                  <span className="text-white font-black flex items-center gap-2">
                    <Shield className="w-3 h-3 text-cyan-500" />
                    AES_256_ACTIVE
                  </span>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <span className="opacity-40">System_Clock:</span>
                  <span className="text-white font-black">XRT_9.4</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Extreme Layer Overlays (Modals) */}
      <AnimatePresence>
        {assistant.showPermissionModal && <PermissionModal isOpen={assistant.showPermissionModal} onClose={() => assistant.setShowPermissionModal(false)} language={assistant.language === Language.HINDI ? 'hi' : 'en'} />}
        {assistant.showDrawingCanvas && <DrawingCanvas onClose={() => assistant.setShowDrawingCanvas(false)} language={assistant.language === Language.HINDI ? 'hi' : 'en'} />}
        {assistant.showSentryMode && <SentryMode onClose={() => assistant.setShowSentryMode(false)} language={assistant.language === Language.HINDI ? 'hi' : 'en'} />}
        {assistant.showMindfulness && <MindfulnessWidget onClose={() => assistant.setShowMindfulness(false)} language={assistant.language === Language.HINDI ? 'hi' : 'en'} />}
        {assistant.showCalc && <CalculatorWidget data={assistant.calcData} isVisible={assistant.showCalc} onClose={() => assistant.setShowCalc(false)} />}
        {assistant.showHealth && <HealthWidget data={assistant.healthData} isVisible={assistant.showHealth} language={assistant.language === Language.HINDI ? 'hi' : 'en'} />}
        {assistant.showSmartHome && <SmartHomeWidget devices={assistant.smartDevices} isVisible={assistant.showSmartHome} language={assistant.language === Language.HINDI ? 'hi' : 'en'} onToggle={toggleSmartDevice} onClose={() => assistant.setShowSmartHome(false)} />}
        {assistant.showComm && assistant.commData && <CommunicationWidget data={assistant.commData} isVisible={assistant.showComm} language={assistant.language === Language.HINDI ? 'hi' : 'en'} onClose={() => assistant.setShowComm(false)} />}
        {assistant.activeTimer && <TimerWidget duration={assistant.activeTimer.duration} label={assistant.activeTimer.label} onComplete={() => assistant.setActiveTimer(null)} onCancel={() => assistant.setActiveTimer(null)} />}
        {assistant.showFeedback && <FeedbackModal isOpen={assistant.showFeedback} onClose={() => assistant.setShowFeedback(false)} language={assistant.language === Language.HINDI ? 'hi' : 'en'} accentColor={currentProtocol.primary} />}
      </AnimatePresence>

      {/* Command Flow Marquee */}
      <footer className="absolute bottom-0 w-full bg-black/80 border-t border-white/5 py-2 z-[60] backdrop-blur-xl flex items-center">
        <div className="px-6 border-r border-white/10 flex items-center gap-3">
          <Terminal className="w-3.5 h-3.5 text-cyan-500" />
          <span className="text-[10px] font-black font-mono tracking-widest text-slate-500">TRY:</span>
        </div>
        <div className="overflow-hidden flex-1">
          <motion.div
            animate={{ x: [0, -1000] }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="flex whitespace-nowrap text-[9px] font-black font-mono tracking-[0.3em] uppercase opacity-40 hover:opacity-100 transition-opacity"
          >
            {[...TRY_COMMANDS, ...TRY_COMMANDS].map((cmd, i) => (
              <button
                key={i}
                onClick={() => { assistant.executeCommand(cmd); soundService.playUIClick(); }}
                className="mx-8 hover:text-cyan-400 transition-colors cursor-pointer"
              >
                {cmd}
              </button>
            ))}
          </motion.div>
        </div>
      </footer>
    </div>
  );
};

export default App;
