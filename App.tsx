
import React, { useState, useEffect, useRef } from 'react';
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
import { CommandResult, AppMode, Language, PersonalityMode, HealthData, SmartDevice, CommunicationData, MediaTrack } from './types';
import { voiceService } from './services/voiceService';
import { processTranscript } from './services/commandProcessor';
import { soundService } from './services/soundService';
import { INITIAL_VOLUME, ERROR_MESSAGES } from './constants';

const PROTOCOLS = {
  sofiya: { name: 'SOFIYA', subtitle: 'ADVANCED AI ASSISTANT', primary: '#8b5cf6', textClass: 'text-violet-400', bgGradient: 'from-violet-900/20 to-black' },
  classic: { name: 'CLASSIC', subtitle: 'STANDARD INTERFACE', primary: '#06b6d4', textClass: 'text-cyan-400', bgGradient: 'from-cyan-900/20 to-black' },
  focus: { name: 'FOCUS', subtitle: 'PRODUCTIVITY MODE', primary: '#ef4444', textClass: 'text-red-400', bgGradient: 'from-red-900/20 to-black' },
  zen: { name: 'ZEN', subtitle: 'MINDFULNESS PROTOCOL', primary: '#10b981', textClass: 'text-emerald-400', bgGradient: 'from-emerald-900/20 to-black' },
};

const App: React.FC = () => {
  const [isBooting, setIsBooting] = useState(true);
  const [mode, setMode] = useState<AppMode>(AppMode.IDLE);
  const [transcript, setTranscript] = useState<string>("");
  const [history, setHistory] = useState<CommandResult[]>([]);
  const [volume, setVolume] = useState<number>(INITIAL_VOLUME);

  // App State
  const [language, setLanguage] = useState<Language>(Language.HINDI);
  const [theme, setTheme] = useState<keyof typeof PROTOCOLS>('sofiya');
  const [personality, setPersonality] = useState<PersonalityMode>(PersonalityMode.DEFAULT);

  // Modal States
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showDrawingCanvas, setShowDrawingCanvas] = useState(false);
  const [showSentryMode, setShowSentryMode] = useState(false);
  const [showMindfulness, setShowMindfulness] = useState(false);

  // Data States
  const [weatherData, setWeatherData] = useState<any>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [tasks, setTasks] = useState<string[]>([]);
  const [showTasks, setShowTasks] = useState(false);
  const [newsItems, setNewsItems] = useState<any[]>([]);
  const [showNews, setShowNews] = useState(false);
  const [calcData, setCalcData] = useState<{ expression: string, result: number } | null>(null);
  const [showCalc, setShowCalc] = useState(false);
  const [activeTimer, setActiveTimer] = useState<{ duration: number; label: string } | null>(null);

  // New Features Data
  const [showHealth, setShowHealth] = useState(false);
  const [healthData] = useState<HealthData>({ steps: 8432, heartRate: 72, sleepScore: 88, calories: 1240 });

  const [showSmartHome, setShowSmartHome] = useState(false);
  const [smartDevices, setSmartDevices] = useState<SmartDevice[]>([
    { id: '1', name: 'Living Room', type: 'light', status: true, location: 'Living Room' },
    { id: '2', name: 'Thermostat', type: 'thermostat', status: '22°C', location: 'Hall' },
    { id: '3', name: 'Front Door', type: 'lock', status: 'Locked', location: 'Entrance' },
    { id: '4', name: 'Kitchen', type: 'light', status: false, location: 'Kitchen' }
  ]);

  const [commData, setCommData] = useState<CommunicationData | null>(null);
  const [showComm, setShowComm] = useState(false);

  const [mediaTrack, setMediaTrack] = useState<MediaTrack | null>(null);
  const [showMedia, setShowMedia] = useState(false);

  const processingRef = useRef(false);
  const isActiveRef = useRef(false);

  useEffect(() => {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'microphone' as PermissionName }).then((status) => {
        if (status.state === 'denied') setShowPermissionModal(true);
      }).catch(() => { });
    }
    const savedTasks = localStorage.getItem('sofiya_tasks');
    if (savedTasks) setTasks(JSON.parse(savedTasks));

    voiceService.setLanguage(language);
    return () => {
      isActiveRef.current = false;
      voiceService.stopListening();
    }
  }, []);

  useEffect(() => {
    voiceService.setLanguage(language);
  }, [language]);

  useEffect(() => {
    voiceService.setPersonality(personality);
  }, [personality]);

  const currentProtocol = PROTOCOLS[theme];

  const handleBootComplete = () => {
    setIsBooting(false);
    addToHistory({
      transcript: "System Init...",
      response: "SOFIYA Online. Ready to assist.",
      actionType: "SYSTEM",
      language: 'en',
      timestamp: Date.now(),
      isSystemMessage: true
    });
  };

  const addToHistory = (entry: CommandResult) => {
    setHistory(prev => [...prev, entry]);
  };

  const toggleSmartDevice = (id: string) => {
    setSmartDevices(prev => prev.map(d => {
      if (d.id === id) {
        if (typeof d.status === 'boolean') return { ...d, status: !d.status };
        if (d.type === 'lock') return { ...d, status: d.status === 'Locked' ? 'Unlocked' : 'Locked' };
      }
      return d;
    }));
  };

  const fetchWeather = () => {
    setIsWeatherLoading(true);
    if (!navigator.geolocation) {
      setIsWeatherLoading(false);
      const msg = language === Language.HINDI ? ERROR_MESSAGES.gps.hi : ERROR_MESSAGES.gps.en;
      voiceService.speak(msg, language === Language.HINDI ? 'hi' : 'en');
      return;
    }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { latitude, longitude } = pos.coords;
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
        const data = await response.json();
        if (data.current_weather) {
          const weather = {
            temp: data.current_weather.temperature,
            condition: 'Partly Cloudy',
            windSpeed: data.current_weather.windspeed,
            locationName: "Local Sector"
          };
          setWeatherData(weather);
          soundService.playUIConfirm();
          const msg = language === Language.HINDI ? `तापमान ${weather.temp} डिग्री है` : `Temperature is ${weather.temp} degrees`;
          voiceService.speak(msg, language === Language.HINDI ? 'hi' : 'en');
        }
      } catch (e) {
        console.error(e);
        setIsWeatherLoading(false);
        const msg = language === Language.HINDI ? ERROR_MESSAGES.network.hi : ERROR_MESSAGES.network.en;
        voiceService.speak(msg, language === Language.HINDI ? 'hi' : 'en');
      } finally { setIsWeatherLoading(false); }
    }, () => {
      setIsWeatherLoading(false);
      const msg = language === Language.HINDI ? ERROR_MESSAGES.gps.hi : ERROR_MESSAGES.gps.en;
      voiceService.speak(msg, language === Language.HINDI ? 'hi' : 'en');
    });
  };

  const handleCommandResult = async (text: string, isFinal: boolean) => {
    setTranscript(text);
    if (isFinal && !processingRef.current) {
      processingRef.current = true;
      setMode(AppMode.PROCESSING);

      try {
        const result = await processTranscript(text, personality);

        if (result.actionType === 'WEATHER_FETCH') fetchWeather();
        else if (result.actionType === 'NEWS_FETCH') { setShowNews(true); soundService.playUIConfirm(); }
        else if (result.actionType === 'NEWS_HIDE') setShowNews(false);
        else if (result.actionType === 'CALCULATION' && result.data) { setCalcData(result.data); setShowCalc(true); soundService.playUIConfirm(); }
        else if (result.actionType === 'TIMER' && result.data) { setActiveTimer(result.data); soundService.playUIConfirm(); }
        else if (result.actionType === 'TASK_ADD' && result.data?.task) { setTasks(p => [...p, result.data.task]); setShowTasks(true); }
        else if (result.actionType === 'TASK_SHOW') setShowTasks(true);
        else if (result.actionType === 'DRAWING_MODE') setShowDrawingCanvas(true);
        else if (result.actionType === 'SENTRY_MODE') setShowSentryMode(true);
        else if (result.actionType === 'HEALTH_SHOW') setShowHealth(true);
        else if (result.actionType === 'MINDFULNESS_START') setShowMindfulness(true);
        else if (result.actionType === 'PERSONALITY_CHANGE' && result.data?.mode) { setPersonality(result.data.mode); soundService.playStartup(); }

        // Volume control
        else if (result.actionType === 'VOLUME_UP') { setVolume(v => Math.min(100, v + 10)); soundService.playUIClick(); }
        else if (result.actionType === 'VOLUME_DOWN') { setVolume(v => Math.max(0, v - 10)); soundService.playUIClick(); }
        else if (result.actionType === 'VOLUME_MUTE') { setVolume(0); soundService.playUIClick(); }
        else if (result.actionType === 'VOLUME_UNMUTE') { setVolume(INITIAL_VOLUME); soundService.playUIClick(); }

        // Social / Time / Status — spoken only, no special UI needed
        else if (['SOCIAL', 'TIME_DATE', 'SYSTEM_STATUS'].includes(result.actionType)) { soundService.playUIConfirm(); }

        else if (result.actionType === 'MEDIA_PLAY' && result.data) {
          setMediaTrack(result.data);
          setShowMedia(true);
        }
        else if (result.actionType === 'MEDIA_PAUSE') {
          if (mediaTrack) setMediaTrack({ ...mediaTrack, isPlaying: false });
        }
        else if (result.actionType === 'MEDIA_RESUME') {
          if (mediaTrack) setMediaTrack({ ...mediaTrack, isPlaying: true });
        }
        else if ((result.actionType === 'COMM_MESSAGE_DRAFT' || result.actionType === 'COMM_CALL_START') && result.data) {
          setCommData({
            type: result.data.type,
            contact: result.data.contact,
            content: result.data.content,
            status: 'draft'
          });
          setShowComm(true);
        }
        else if (result.actionType === 'SMART_HOME_ACTION' || result.actionType === 'SMART_HOME_SCENE') {
          setShowSmartHome(true);
          if (result.data?.scene === 'movie') {
            setSmartDevices(prev => prev.map(d => d.type === 'light' ? { ...d, status: false } : d));
            setTheme('focus');
          } else if (result.data?.deviceType === 'light') {
            setSmartDevices(prev => prev.map(d => d.type === 'light' ? { ...d, status: result.data.state } : d));
          }
        }

        addToHistory({
          transcript: text,
          response: result.response,
          actionType: result.actionType,
          language: result.language,
          timestamp: Date.now()
        });

        setMode(AppMode.SPEAKING);
        voiceService.speak(result.spokenResponse || result.response, result.language);

      } catch (err) {
        console.error(err);
        const msg = language === Language.HINDI ? ERROR_MESSAGES.generic.hi : ERROR_MESSAGES.generic.en;
        voiceService.speak(msg, language === Language.HINDI ? 'hi' : 'en');
      }

      setTimeout(() => {
        processingRef.current = false;
        if (isActiveRef.current) startListening();
        else setMode(AppMode.IDLE);
      }, 2000);
    }
  };

  const startListening = () => {
    if (!isActiveRef.current) return;
    setMode(AppMode.LISTENING);
    setTranscript("");
    voiceService.startListening(
      handleCommandResult,
      () => { if (isActiveRef.current && !processingRef.current) setTimeout(() => startListening(), 100); },
      (error) => {
        processingRef.current = false;
        setMode(AppMode.IDLE);

        if (error === 'not-allowed' || error === 'permission-denied') {
          const msg = language === Language.HINDI ? ERROR_MESSAGES.mic.hi : ERROR_MESSAGES.mic.en;
          voiceService.speak(msg, language === Language.HINDI ? 'hi' : 'en');
          setShowPermissionModal(true);
          isActiveRef.current = false;
        } else if (error === 'network') {
          const msg = language === Language.HINDI ? ERROR_MESSAGES.network.hi : ERROR_MESSAGES.network.en;
          voiceService.speak(msg, language === Language.HINDI ? 'hi' : 'en');
          isActiveRef.current = false;
        }
      }
    );
  };

  const toggleActivation = () => {
    if (isActiveRef.current) {
      isActiveRef.current = false;
      setMode(AppMode.IDLE);
      voiceService.stopListening();
      soundService.playUIClick();
    } else {
      soundService.playUIConfirm();
      isActiveRef.current = true;
      startListening();
    }
  };

  if (isBooting) return <BootSequence onComplete={handleBootComplete} language={language === Language.HINDI ? 'hi' : 'en'} />;

  return (
    <div className={`min-h-screen w-full relative overflow-hidden text-slate-200 transition-colors duration-1000 bg-black`}>
      {/* Dynamic Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${currentProtocol.bgGradient} opacity-40 transition-all duration-1000`}></div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 pointer-events-none bg-[size:50px_50px]" style={{ backgroundImage: `linear-gradient(${currentProtocol.primary}08 1px, transparent 1px), linear-gradient(90deg, ${currentProtocol.primary}08 1px, transparent 1px)` }}></div>

      {/* Decorative Top Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-50" style={{ color: currentProtocol.primary }}></div>

      {/* --- Main UI Structure --- */}
      <div className="relative z-10 w-full h-screen flex flex-col p-4 md:p-8">

        {/* Header */}
        <header className="flex justify-between items-start mb-8 animate-in slide-in-from-top duration-700">
          <div className="flex flex-col">
            <h1 className="text-4xl md:text-5xl font-bold tracking-[0.2em] font-mono text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500" style={{ textShadow: `0 0 20px ${currentProtocol.primary}80` }}>
              {currentProtocol.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="h-0.5 w-8 bg-current" style={{ color: currentProtocol.primary }}></div>
              <p className="text-xs text-slate-400 tracking-widest uppercase">{currentProtocol.subtitle}</p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            {/* Language Switch */}
            <button
              onClick={() => { soundService.playUIClick(); setLanguage(l => l === Language.ENGLISH ? Language.HINDI : Language.ENGLISH) }}
              className="glass-panel px-4 py-1 rounded-full text-xs font-bold tracking-wider hover:bg-white/10 transition-colors flex items-center gap-2"
            >
              <span className={language === Language.ENGLISH ? "text-white" : "text-slate-500"}>EN</span>
              <span className="w-px h-3 bg-slate-600"></span>
              <span className={language === Language.HINDI ? "text-orange-400" : "text-slate-500"}>HI</span>
            </button>

            {/* Theme Dots */}
            <div className="flex gap-2">
              {Object.entries(PROTOCOLS).map(([key, proto]) => (
                <button
                  key={key}
                  title={`Switch to ${proto.name} theme`}
                  aria-label={`Switch to ${proto.name} theme`}
                  onClick={() => { soundService.playUIClick(); setTheme(key as any); }}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${theme === key ? 'scale-150 shadow-[0_0_10px_currentColor]' : 'opacity-30'}`}
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
              {transcript && (
                <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-max max-w-lg text-center pointer-events-none animate-in fade-in zoom-in-95 slide-in-from-bottom-4">
                  <p className="text-lg md:text-xl font-light text-white bg-black/40 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 shadow-lg">
                    "{transcript}"
                  </p>
                </div>
              )}
              <ArcReactor isActive={mode !== AppMode.IDLE} onClick={toggleActivation} language={language === Language.HINDI ? 'hi' : 'en'} color={currentProtocol.primary} />
            </div>

            <div className="w-full max-w-md">
              <Waveform mode={mode} color={currentProtocol.primary} />
            </div>
          </div>

          {/* Floating Widgets - Desktop: Absolute Positions, Mobile: Stacked if needed */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Top Left: Weather */}
            <div className="pointer-events-auto">
              <WeatherWidget data={weatherData} loading={isWeatherLoading} language={language === Language.HINDI ? 'hi' : 'en'} accentColor={currentProtocol.primary} textColorClass={currentProtocol.textClass} />
            </div>

            {/* Top Right: Status */}
            <div className="absolute top-0 right-0 pointer-events-auto hidden lg:block">
              <StatusPanel isDarkMode={true} />
            </div>

            {/* Bottom Right: News/Tasks */}
            <div className="pointer-events-auto">
              <NewsWidget news={newsItems} isVisible={showNews} language={language === Language.HINDI ? 'hi' : 'en'} onClose={() => setShowNews(false)} accentColor={currentProtocol.primary} />
            </div>

            {/* Bottom Left: Media/Task */}
            <div className="pointer-events-auto">
              <TaskPanel tasks={tasks} isVisible={showTasks} language={language === Language.HINDI ? 'hi' : 'en'} onClose={() => setShowTasks(false)} accentColor={currentProtocol.primary} />
              {mediaTrack && <MediaWidget track={mediaTrack} isVisible={showMedia} language={language === Language.HINDI ? 'hi' : 'en'} onClose={() => setShowMedia(false)} onTogglePlay={() => setMediaTrack({ ...mediaTrack, isPlaying: !mediaTrack.isPlaying })} />}
            </div>
          </div>
        </main>

        {/* Footer Area */}
        <div className="h-1/4 flex flex-col justify-end gap-4 z-20">
          <div className="flex flex-col md:flex-row gap-6 items-end md:items-center justify-between">
            {/* History Log */}
            <HistoryLog history={history} />

            {/* Volume & Status (Mobile/Tablet friendly) */}
            <div className="flex flex-col gap-4 items-end">
              <VolumeControl level={volume} />
              <div className="text-[10px] text-slate-500 font-mono text-right">
                SYS.VER: 4.2.0 <br />
                SECURE_CONN: <span className="text-emerald-500">ESTABLISHED</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Modal Layers */}
      <PermissionModal isOpen={showPermissionModal} onClose={() => setShowPermissionModal(false)} language={language === Language.HINDI ? 'hi' : 'en'} />
      {showDrawingCanvas && <DrawingCanvas onClose={() => setShowDrawingCanvas(false)} language={language === Language.HINDI ? 'hi' : 'en'} />}
      {showSentryMode && <SentryMode onClose={() => setShowSentryMode(false)} language={language === Language.HINDI ? 'hi' : 'en'} />}
      {showMindfulness && <MindfulnessWidget onClose={() => setShowMindfulness(false)} language={language === Language.HINDI ? 'hi' : 'en'} />}
      <CalculatorWidget data={calcData} isVisible={showCalc} onClose={() => setShowCalc(false)} />
      <HealthWidget data={healthData} isVisible={showHealth} language={language === Language.HINDI ? 'hi' : 'en'} />
      <SmartHomeWidget devices={smartDevices} isVisible={showSmartHome} language={language === Language.HINDI ? 'hi' : 'en'} onToggle={toggleSmartDevice} onClose={() => setShowSmartHome(false)} />
      {commData && <CommunicationWidget data={commData} isVisible={showComm} language={language === Language.HINDI ? 'hi' : 'en'} onClose={() => setShowComm(false)} />}
      {activeTimer && <TimerWidget duration={activeTimer.duration} label={activeTimer.label} onComplete={() => setActiveTimer(null)} onCancel={() => setActiveTimer(null)} />}

      {/* Marquee Footer */}
      <footer className="absolute bottom-0 w-full bg-slate-950/80 border-t border-white/5 py-1 z-30 backdrop-blur-sm">
        <div className="animate-marquee whitespace-nowrap text-[10px] font-mono tracking-[0.2em]" style={{ color: `${currentProtocol.primary}80` }}>
          TRY COMMANDS: "PLAY LO-FI MUSIC" • "SEND MESSAGE TO MOM" • "ACTIVATE SENTRY MODE" • "START BREATHING" • "TURN ON LIGHTS" • "SHOW NEWS" • "STATUS REPORT"
        </div>
      </footer>
    </div>
  );
};

export default App;
