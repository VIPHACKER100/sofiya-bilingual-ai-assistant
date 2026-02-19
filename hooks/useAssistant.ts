
import { useState, useEffect, useRef, useCallback } from 'react';
import { AppMode, Language, PersonalityMode, CommandResult, SmartDevice, CommunicationData, MediaTrack, HealthData } from '../types';
import { voiceService } from '../services/voiceService';
import { soundService } from '../services/soundService';
import { weatherService } from '../services/weatherService';
import { newsService } from '../services/newsService';
import { processTranscript } from '../services/commandProcessor';
import { themeService, ThemeKey } from '../services/themeService';
import { analyticsService } from '../services/analyticsService';
import { INITIAL_VOLUME, ERROR_MESSAGES } from '../constants';

export const useAssistant = () => {
    const [isBooting, setIsBooting] = useState(true);
    const [mode, setMode] = useState<AppMode>(AppMode.IDLE);
    const [transcript, setTranscript] = useState<string>("");
    const [history, setHistory] = useState<CommandResult[]>([]);
    const [volume, setVolume] = useState<number>(INITIAL_VOLUME);

    // App State
    const [language, setLanguage] = useState<Language>(Language.HINDI);
    const [theme, setTheme] = useState<'sofiya' | 'classic' | 'focus' | 'zen'>('sofiya');
    const [personality, setPersonality] = useState<PersonalityMode>(PersonalityMode.DEFAULT);

    // Widget Visibility & Data
    const [weatherData, setWeatherData] = useState<any>(null);
    const [isWeatherLoading, setIsWeatherLoading] = useState(false);
    const [tasks, setTasks] = useState<string[]>([]);
    const [showTasks, setShowTasks] = useState(false);
    const [newsItems, setNewsItems] = useState<any[]>([]);
    const [isNewsLoading, setIsNewsLoading] = useState(false);
    const [showNews, setShowNews] = useState(false);
    const [calcData, setCalcData] = useState<{ expression: string, result: number } | null>(null);
    const [showCalc, setShowCalc] = useState(false);
    const [activeTimer, setActiveTimer] = useState<{ duration: number; label: string } | null>(null);
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

    // Modal States
    const [showPermissionModal, setShowPermissionModal] = useState(false);
    const [showDrawingCanvas, setShowDrawingCanvas] = useState(false);
    const [showSentryMode, setShowSentryMode] = useState(false);
    const [showMindfulness, setShowMindfulness] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);

    const processingRef = useRef(false);
    const isActiveRef = useRef(false);

    useEffect(() => {
        // Microphone Permission Check
        if (navigator.permissions && navigator.permissions.query) {
            navigator.permissions.query({ name: 'microphone' as PermissionName }).then((status) => {
                if (status.state === 'denied') setShowPermissionModal(true);
            }).catch(() => { });
        }

        // Load Tasks
        const savedTasks = localStorage.getItem('sofiya_tasks');
        if (savedTasks) setTasks(JSON.parse(savedTasks));

        // Load theme from service
        const savedTheme = themeService.getCurrentThemeKey();
        setTheme(savedTheme);

        voiceService.setLanguage(language);

        // Track boot completion
        setTimeout(() => {
            analyticsService.trackEvent('APP_BOOT_COMPLETE');
            setIsBooting(false);
        }, 3000);

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

    useEffect(() => {
        localStorage.setItem('sofiya_tasks', JSON.stringify(tasks));
    }, [tasks]);

    useEffect(() => {
        themeService.setTheme(theme);
        analyticsService.trackThemeChange(theme);
    }, [theme]);

    useEffect(() => {
        analyticsService.trackEvent('LANGUAGE_CHANGED', { language });
    }, [language]);

    const addToHistory = (entry: CommandResult) => {
        setHistory(prev => [...prev, entry]);
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
                const weather = await weatherService.fetchWeather(latitude, longitude);
                if (weather) {
                    setWeatherData(weather);
                    soundService.playUIConfirm();
                    const msg = language === Language.HINDI ? `तापमान ${weather.temp} डिग्री है` : `Temperature is ${weather.temp} degrees`;
                    voiceService.speak(msg, language === Language.HINDI ? 'hi' : 'en');
                }
            } catch (e) {
                console.error(e);
                const msg = language === Language.HINDI ? ERROR_MESSAGES.network.hi : ERROR_MESSAGES.network.en;
                voiceService.speak(msg, language === Language.HINDI ? 'hi' : 'en');
            } finally { setIsWeatherLoading(false); }
        }, () => {
            setIsWeatherLoading(false);
            const msg = language === Language.HINDI ? ERROR_MESSAGES.gps.hi : ERROR_MESSAGES.gps.en;
            voiceService.speak(msg, language === Language.HINDI ? 'hi' : 'en');
        });
    };


    const fetchNews = async () => {
        setIsNewsLoading(true);
        try {
            const items = await newsService.fetchTopHeadlines();
            if (items.length > 0) {
                setNewsItems(items);
                soundService.playUIConfirm();
            }
        } catch (e) {
            console.error('News Fetch Error:', e);
        } finally {
            setIsNewsLoading(false);
        }
    };

    const handleCommandResult = async (text: string, isFinal: boolean) => {
        setTranscript(text);
        if (isFinal && !processingRef.current) {
            processingRef.current = true;
            setMode(AppMode.PROCESSING);
            const startTime = Date.now();

            try {
                const result = await processTranscript(text, personality);

                // Auto-switch UI language if detection differs significantly (optional refinement)
                if (result.language === 'en' && language === Language.HINDI) {
                    // Stay silent but update internally if needed? 
                    // For now, let's trust the detectLanguage and use result.language for TTS
                }


                // Routine Handlers
                if (result.actionType === 'ROUTINE_MORNING') {
                    fetchWeather();
                    fetchNews();
                    setShowNews(true);
                    setShowTasks(true);
                    soundService.playUIConfirm();
                    analyticsService.trackEvent('ROUTINE_EXECUTED', { type: 'morning' });
                } else if (result.actionType === 'ROUTINE_NIGHT') {
                    setSmartDevices(prev => prev.map(d => d.type === 'light' ? { ...d, status: false } : d));
                    if (mediaTrack) setMediaTrack({ ...mediaTrack, isPlaying: false });
                    setPersonality(PersonalityMode.FOCUS);
                    soundService.playUIConfirm();
                    analyticsService.trackEvent('ROUTINE_EXECUTED', { type: 'night' });
                }

                // Action Handlers
                else if (result.actionType === 'WEATHER_FETCH') { fetchWeather(); analyticsService.trackWidgetOpen('weather'); }
                else if (result.actionType === 'NEWS_FETCH') { fetchNews(); setShowNews(true); analyticsService.trackWidgetOpen('news'); }
                else if (result.actionType === 'NEWS_HIDE') setShowNews(false);
                else if (result.actionType === 'CALCULATION' && result.data) { setCalcData(result.data); setShowCalc(true); soundService.playUIConfirm(); analyticsService.trackWidgetOpen('calculator'); }
                else if (result.actionType === 'TIMER' && result.data) { setActiveTimer(result.data); soundService.playUIConfirm(); analyticsService.trackWidgetOpen('timer'); }
                else if (result.actionType === 'TASK_ADD' && result.data?.task) { setTasks(p => [...p, result.data.task]); setShowTasks(true); analyticsService.trackWidgetOpen('tasks'); }
                else if (result.actionType === 'TASK_SHOW') { setShowTasks(true); analyticsService.trackWidgetOpen('tasks'); }
                else if (result.actionType === 'DRAWING_MODE') { setShowDrawingCanvas(true); analyticsService.trackWidgetOpen('drawing'); }
                else if (result.actionType === 'SENTRY_MODE') { setShowSentryMode(true); analyticsService.trackWidgetOpen('sentry'); }
                else if (result.actionType === 'HEALTH_SHOW') { setShowHealth(true); analyticsService.trackWidgetOpen('health'); }
                else if (result.actionType === 'MINDFULNESS_START') { setShowMindfulness(true); analyticsService.trackWidgetOpen('mindfulness'); }
                else if (result.actionType === 'PERSONALITY_CHANGE' && result.data?.mode) {
                    setPersonality(result.data.mode);
                    soundService.playStartup();
                    analyticsService.trackEvent('PERSONALITY_CHANGED', { mode: result.data.mode });
                }

                // Volume control
                else if (result.actionType === 'VOLUME_UP') { setVolume(v => Math.min(100, v + 10)); soundService.playUIClick(); }
                else if (result.actionType === 'VOLUME_DOWN') { setVolume(v => Math.max(0, v - 10)); soundService.playUIClick(); }
                else if (result.actionType === 'VOLUME_MUTE') { setVolume(0); soundService.playUIClick(); }
                else if (result.actionType === 'VOLUME_UNMUTE') { setVolume(60); soundService.playUIClick(); }

                else if (result.actionType === 'MEDIA_PLAY' && result.data) { setMediaTrack(result.data); setShowMedia(true); }
                else if (result.actionType === 'MEDIA_PAUSE' && mediaTrack) { setMediaTrack({ ...mediaTrack, isPlaying: false }); }
                else if (result.actionType === 'MEDIA_RESUME' && mediaTrack) { setMediaTrack({ ...mediaTrack, isPlaying: true }); }

                else if ((result.actionType === 'COMM_MESSAGE_DRAFT' || result.actionType === 'COMM_CALL_START') && result.data) {
                    setCommData({ type: result.data.type, contact: result.data.contact, content: result.data.content, status: 'draft' });
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
                    timestamp: Date.now(),
                    emotion: result.emotion
                });

                // Track command execution
                analyticsService.trackCommand(text, result.actionType, Date.now() - (startTime || Date.now()));
                if (result.emotion) {
                    analyticsService.trackEvent('EMOTION_DETECTED', { emotion: result.emotion });
                }

                setMode(AppMode.SPEAKING);
                voiceService.speak(result.spokenResponse || result.response, result.language);

                // Open external URLs if provided (e.g. YouTube, Google Search)
                if (result.externalUrl) {
                    setTimeout(() => {
                        window.open(result.externalUrl, '_blank');
                    }, 1500);
                }

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
        analyticsService.trackVoiceActivation(true);
        voiceService.startListening(
            handleCommandResult,
            () => { if (isActiveRef.current && !processingRef.current) setTimeout(() => startListening(), 100); },
            (error) => {
                processingRef.current = false;
                setMode(AppMode.IDLE);
                analyticsService.trackVoiceActivation(false);
                if (error === 'not-allowed' || error === 'permission-denied') setShowPermissionModal(true);
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

    const executeCommand = (cmd: string) => {
        handleCommandResult(cmd, true);
    };

    return {
        isBooting, setIsBooting,
        mode, setMode,
        transcript, setTranscript,
        history, setHistory,
        volume, setVolume,
        language, setLanguage,
        theme, setTheme,
        personality, setPersonality,
        weatherData, isWeatherLoading,
        tasks, setTasks,
        showTasks, setShowTasks,
        newsItems, isNewsLoading, showNews, setShowNews,
        calcData, showCalc, setShowCalc,
        activeTimer, setActiveTimer,
        showHealth, healthData, setShowHealth,
        showSmartHome, smartDevices, setSmartDevices, setShowSmartHome,
        commData, showComm, setShowComm,
        mediaTrack, setMediaTrack, showMedia, setShowMedia,
        showPermissionModal, setShowPermissionModal,
        showDrawingCanvas, setShowDrawingCanvas,
        showSentryMode, setShowSentryMode,
        showMindfulness, setShowMindfulness,
        showFeedback, setShowFeedback,
        toggleActivation, executeCommand,
        addToHistory,
        fetchWeather, fetchNews
    };
};
