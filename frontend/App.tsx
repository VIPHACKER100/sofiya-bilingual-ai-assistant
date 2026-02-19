
import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, Shield, Globe, Terminal, Sparkles, MessageSquareWarning,
  Mic, MicOff, Volume2, VolumeX, Sun, Moon, Plus, List, X,
  Play, Pause, SkipForward, Home, Zap, HelpCircle
} from 'lucide-react';
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
import { HelpCenter } from './components/HelpCenter';
import { ReportIssueModal } from './components/ReportIssueModal';
import { AppMode, Language } from './types';
import { soundService } from './services/soundService';
import { TRY_COMMANDS } from './constants';
import { useAssistant } from './hooks/useAssistant';
import { useKeyPress } from './hooks/useCommon';

const PROTOCOLS = {
  sofiya: { name: 'SOFIYA.OS', subtitle: 'NEURAL_LINK_V4', primary: '#8b5cf6', textClass: 'text-violet-400', bgGradient: 'from-violet-900/40 via-black to-black' },
  classic: { name: 'CORE.SYS', subtitle: 'LEGACY_UPLINK', primary: '#06b6d4', textClass: 'text-cyan-400', bgGradient: 'from-cyan-900/40 via-black to-black' },
  focus: { name: 'FOCUS.PRO', subtitle: 'MINIMAL_LATENCY', primary: '#ef4444', textClass: 'text-red-400', bgGradient: 'from-red-900/40 via-black to-black' },
  zen: { name: 'ZEN.STATE', subtitle: 'ALPHA_LEVEL_SYNC', primary: '#10b981', textClass: 'text-emerald-400', bgGradient: 'from-emerald-900/40 via-black to-black' },
};

const QuickActionButton = ({ 
  icon: Icon, 
  label, 
  onClick, 
  isActive,
  color 
}: { 
  icon: any; 
  label: string; 
  onClick: () => void; 
  isActive?: boolean;
  color?: string;
}) => (
  <motion.button
    whileHover={{ scale: 1.05, y: -2 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    title={label}
    className={`
      relative p-3 rounded-2xl transition-all duration-200 group
      ${isActive 
        ? 'bg-white/10 border border-white/20' 
        : 'bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10'
      }
    `}
    style={{ color: color ? `${color}` : undefined }}
  >
    <Icon className="w-5 h-5" />
    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-slate-400">
      {label}
    </span>
  </motion.button>
);

const KeyboardHint = ({ keys, label }: { keys: string[]; label: string }) => (
  <div className="flex items-center gap-1 text-[8px] text-slate-600 font-mono">
    {keys.map((key, i) => (
      <React.Fragment key={key}>
        <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[8px]">{key}</kbd>
        {i < keys.length - 1 && <span>+</span>}
      </React.Fragment>
    ))}
    <span className="ml-1 opacity-50">{label}</span>
  </div>
);

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

  // Keyboard shortcuts
  useKeyPress('m', () => assistant.toggleActivation());
  useKeyPress(' ', () => { if (!assistant.isBooting) assistant.toggleActivation(); });
  useKeyPress('l', () => assistant.setLanguage(l => l === Language.ENGLISH ? Language.HINDI : Language.ENGLISH));
  useKeyPress('w', () => assistant.setShowTasks(p => !p));
  useKeyPress('n', () => { assistant.setShowNews(p => !p); if (!assistant.showNews) assistant.fetchNews(); });
  useKeyPress('h', () => assistant.setShowHealth(p => !p));
  useKeyPress('s', () => assistant.setShowSmartHome(p => !p));
  useKeyPress('d', () => assistant.setShowDrawingCanvas(p => !p));
  useKeyPress('Escape', () => {
    if (assistant.showNews) assistant.setShowNews(false);
    if (assistant.showTasks) assistant.setShowTasks(false);
    if (assistant.showHealth) assistant.setShowHealth(false);
    if (assistant.showSmartHome) assistant.setShowSmartHome(false);
    if (assistant.showCalc) assistant.setShowCalc(false);
  });

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
      <div className="relative z-10 w-full h-screen flex flex-col p-4 lg:p-8">

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
                <h1 className="text-4xl lg:text-5xl font-black tracking-[0.15em] font-mono leading-none flex items-baseline gap-2 text-gradient">
                  {currentProtocol.name.split('.')[0]}
                  <span className="text-xl opacity-20 font-light">.{currentProtocol.name.split('.')[1]}</span>
                </h1>
                <span className="text-[10px] font-black tracking-[0.6em] text-cyan-500/60 uppercase mt-1 pl-1">
                  {currentProtocol.subtitle}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Quick Actions - New Addition */}
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex flex-col items-end gap-4"
          >
            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 p-2 bg-black/40 rounded-2xl border border-white/5 backdrop-blur-md">
              <QuickActionButton 
                icon={assistant.mode === AppMode.LISTENING ? MicOff : Mic} 
                label={assistant.mode === AppMode.LISTENING ? 'Stop (M)' : 'Voice (M)'} 
                onClick={() => assistant.toggleActivation()}
                isActive={assistant.mode === AppMode.LISTENING}
                color={currentProtocol.primary}
              />
              <QuickActionButton 
                icon={List} 
                label="Tasks (W)" 
                onClick={() => assistant.setShowTasks(p => !p)}
                isActive={assistant.showTasks}
              />
              <QuickActionButton 
                icon={Sun} 
                label="News (N)" 
                onClick={() => { assistant.setShowNews(p => !p); if (!assistant.showNews) assistant.fetchNews(); }}
                isActive={assistant.showNews}
              />
              <QuickActionButton 
                icon={Zap} 
                label="Smart (S)" 
                onClick={() => assistant.setShowSmartHome(p => !p)}
                isActive={assistant.showSmartHome}
              />
              <QuickActionButton 
                icon={Home} 
                label="Health (H)" 
                onClick={() => assistant.setShowHealth(p => !p)}
                isActive={assistant.showHealth}
              />
            </div>

            {/* Language & Theme Controls */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => { soundService.playUIClick(); assistant.setLanguage(l => l === Language.ENGLISH ? Language.HINDI : Language.ENGLISH) }}
                className="group relative px-4 py-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3 transition-all hover:bg-white/10 active:scale-95"
                title="Toggle Language (L)"
              >
                <Globe className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                <div className="flex gap-2 text-[10px] font-black tracking-widest font-mono">
                  <span className={assistant.language === Language.ENGLISH ? "text-cyan-400" : "text-slate-600"}>EN</span>
                  <span className="opacity-20">|</span>
                  <span className={assistant.language === Language.HINDI ? "text-orange-400" : "text-slate-600"}>HI</span>
                </div>
              </button>

              <button
                onClick={() => { soundService.playUIClick(); assistant.setShowHelp(true); }}
                title="Help"
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-500 hover:text-white hover:bg-white/10 transition-all active:scale-95"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
              <button
                onClick={() => { soundService.playUIClick(); assistant.setShowFeedback(true); }}
                title="Feedback"
                className="p-2 rounded-xl bg-red-500/5 border border-red-500/20 text-red-500/60 hover:text-red-500 hover:bg-red-500/10 transition-all active:scale-95"
              >
                <MessageSquareWarning className="w-5 h-5" />
              </button>

              {/* Tactical Theme Selector */}
              <div className="flex gap-2 p-2 bg-black/40 rounded-full border border-white/5 backdrop-blur-md">
                {Object.entries(PROTOCOLS).map(([key, proto]) => (
                  <button
                    key={key}
                    onClick={() => { soundService.playUIClick(); assistant.setTheme(key as any); }}
                    className={`w-4 h-4 rounded-full transition-all duration-500 relative ${assistant.theme === key ? 'scale-125' : 'opacity-20 hover:opacity-100'}`}
                    style={{ backgroundColor: proto.primary }}
                    title={`${key.charAt(0).toUpperCase() + key.slice(1)} Theme`}
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
            </div>
          </motion.div>
        </header>

        {/* Keyboard Hints Bar */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-6 py-2 px-4 bg-white/5 rounded-lg border border-white/5 w-fit mt-2"
        >
          <KeyboardHint keys={['Space']} label="Voice" />
          <KeyboardHint keys={['L']} label="Lang" />
          <KeyboardHint keys={['W']} label="Tasks" />
          <KeyboardHint keys={['N']} label="News" />
          <KeyboardHint keys={['H']} label="Health" />
          <KeyboardHint keys={['S']} label="Smart" />
          <KeyboardHint keys={['ESC']} label="Close" />
        </motion.div>

        {/* Neural CORE Stage */}
        <main className="flex-1 flex flex-col items-center justify-center relative">
          <div className="relative flex flex-col items-center gap-8 z-20">
            <div className="relative">
              <AnimatePresence>
                {assistant.transcript && (
                  <motion.div
                    initial={{ y: 20, opacity: 0, scale: 0.9 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: -20, opacity: 0, scale: 0.9 }}
                    className="absolute -top-28 left-1/2 -translate-x-1/2 w-[20rem] lg:w-[24rem] text-center pointer-events-none"
                  >
                    <div className="glass-panel px-6 py-3 rounded-[2rem] border-t border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
                      <p className="text-lg lg:text-xl font-medium text-white/90 italic leading-relaxed line-clamp-2">
                        "{assistant.transcript}"
                      </p>
                      <div className="mt-2 flex justify-center gap-1">
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
        <div className="h-1/3 flex flex-col justify-end gap-6 z-20">
          <div className="flex flex-col lg:flex-row gap-8 items-end justify-between border-t border-white/5 pt-6">
            <HistoryLog history={assistant.history} />

            <div className="flex flex-col gap-6 items-end w-full lg:w-auto">
              <VolumeControl level={assistant.volume} />

              <div className="flex gap-8 text-[9px] font-mono tracking-[0.2em] text-slate-500 uppercase">
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
        {assistant.showHelp && <HelpCenter isOpen={assistant.showHelp} onClose={() => assistant.setShowHelp(false)} language={assistant.language === Language.HINDI ? 'hi' : 'en'} accentColor={currentProtocol.primary} onReportIssue={() => assistant.setShowReportIssue(true)} />}
        {assistant.showReportIssue && <ReportIssueModal isOpen={assistant.showReportIssue} onClose={() => assistant.setShowReportIssue(false)} language={assistant.language === Language.HINDI ? 'hi' : 'en'} accentColor={currentProtocol.primary} />}
      </AnimatePresence>

      {/* Command Flow Marquee */}
      <footer className="absolute bottom-0 w-full bg-black/80 border-t border-white/5 py-2 z-[60] backdrop-blur-xl flex items-center">
        <div className="px-4 lg:px-6 border-r border-white/10 flex items-center gap-3">
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
                className="mx-6 hover:text-cyan-400 transition-colors cursor-pointer"
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
