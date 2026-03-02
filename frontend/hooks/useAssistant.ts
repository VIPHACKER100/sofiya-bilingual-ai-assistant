
import { useState, useEffect, useRef } from 'react';

import { AppMode, Language, PersonalityMode, CommandResult, SmartDevice, CommunicationData, MediaTrack, HealthData } from '../types';
import { voiceService } from '../services/voiceService';
import { soundService } from '../services/soundService';
import { weatherService } from '../services/weatherService';
import { newsService } from '../services/newsService';
import { processTranscript } from '../services/commandProcessor';
import { themeService } from '../services/themeService';

import { analyticsService } from '../services/analyticsService';
import { INITIAL_VOLUME, ERROR_MESSAGES } from '../constants';
import { useSystemBridge } from './useSystemBridge';


interface CalendarEvent { id: string; title: string; start_time: string; end_time: string; location?: string; is_shared: boolean; user_id: string; }
interface HouseholdItem { id: string; item_name: string; location: string; room?: string; description?: string; last_seen?: string; }
interface GiftIdea { id: string; gift_idea: string; url?: string; price_estimate?: number; target_contact_id?: string; hidden_from: string[]; }

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
    const [weatherData, setWeatherData] = useState<unknown>(null);

    const [isWeatherLoading, setIsWeatherLoading] = useState(false);
    const [tasks, setTasks] = useState<{ id: string, title: string, completed: boolean, is_shared: boolean }[]>([]);
    const [showTasks, setShowTasks] = useState(false);
    const [newsItems, setNewsItems] = useState<unknown[]>([]);

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
    const [showHelp, setShowHelp] = useState(false);
    const [showReportIssue, setShowReportIssue] = useState(false);
    const [showAutomation, setShowAutomation] = useState(false);
    const [showMemory, setShowMemory] = useState(false);
    const [showDesktopPanel, setShowDesktopPanel] = useState(false);
    const [currentUser, setCurrentUser] = useState<{ id: string, name: string } | null>(null);
    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
    const [showCalendar, setShowCalendar] = useState(false);
    const [householdKnowledge, setHouseholdKnowledge] = useState<HouseholdItem[]>([]);
    const [showHousehold, setShowHousehold] = useState(false);
    const [giftIdeas, setGiftIdeas] = useState<GiftIdea[]>([]);
    const [showGifts, setShowGifts] = useState(false);

    // Bridge Integration
    const {
        isConnected: isBridgeConnected,
        connectionStatus: bridgeConnectionStatus,
        systemStatus,
        sendCommand: sendBridgeCommand,
        lastResponse: bridgeResponse,
        resetLastResponse,
        pendingConfirmation,
        confirmAction: confirmBridgeAction,
        reconnect: reconnectBridge
    } = useSystemBridge();


    const processingRef = useRef(false);
    const isActiveRef = useRef(false);

    useEffect(() => {
        // Microphone Permission Check
        if (navigator.permissions && navigator.permissions.query) {
            navigator.permissions.query({ name: 'microphone' as PermissionName }).then((status) => {
                if (status.state === 'denied') setShowPermissionModal(true);
            }).catch(() => undefined);

        }

        // Load Tasks
        const savedTasks = localStorage.getItem('sofiya_tasks');
        if (savedTasks) setTasks(JSON.parse(savedTasks));

        // Load theme from service
        const savedTheme = themeService.getCurrentThemeKey();
        setTheme(savedTheme);

        voiceService.setLanguage(language);

        // Fetch tasks from backend
        const fetchTasks = async () => {
            try {
                const resp = await fetch('http://localhost:3001/api/tasks');
                const data = await resp.json();
                if (Array.isArray(data)) {
                    setTasks(data);
                }
            } catch (e) {
                console.error('Failed to fetch tasks', e);
            }
        };
        fetchTasks();

        // Fetch user from backend
        const fetchUser = async () => {
            try {
                const resp = await fetch('http://localhost:3001/api/identity/current');
                const data = await resp.json();
                if (data.status === 'authenticated') {
                    setCurrentUser({ id: data.userId, name: data.userId });
                }
            } catch (e) {
                console.error('Failed to fetch user', e);
            }
        };
        fetchUser();

        // Fetch shared data
        const fetchSharedData = async () => {
            try {
                const [calResp, houseResp, giftResp] = await Promise.all([
                    fetch('http://localhost:3001/api/calendar/events'),
                    fetch('http://localhost:3001/api/household/knowledge'),
                    fetch('http://localhost:3001/api/social/gifts')
                ]);

                const calData = await calResp.json();
                const houseData = await houseResp.json();
                const giftData = await giftResp.json();

                if (Array.isArray(calData)) setCalendarEvents(calData);
                if (Array.isArray(houseData)) setHouseholdKnowledge(houseData);
                if (Array.isArray(giftData)) setGiftIdeas(giftData);
            } catch (e) {
                console.error('Failed to fetch shared data', e);
            }
        };
        fetchSharedData();

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

    // System Watchdog (Health Alerts)
    const [lastAlertTime, setLastAlertTime] = useState(0);
    useEffect(() => {
        if (!systemStatus || !isBridgeConnected || Date.now() - lastAlertTime < 60000) return; // Alert once per minute max

        const cpuUsage = systemStatus.cpu?.percent || 0;
        const memUsage = systemStatus.memory?.percent || 0;
        const batteryLevel = systemStatus.battery?.percent || 100;
        const isPlugged = systemStatus.battery?.power_plugged ?? true;

        if (cpuUsage > 92) {
            const msg = language === Language.HINDI
                ? "सावधान! CPU उपयोग सीमा से अधिक है।"
                : "Warning! CPU usage is critically high. Performance may be degraded.";
            voiceService.speak(msg, language === Language.HINDI ? 'hi' : 'en');
            setLastAlertTime(Date.now());
        } else if (memUsage > 95) {
            const msg = language === Language.HINDI
                ? "सिस्टम मेमोरी भर गई है।"
                : "System memory is nearly full. Consider closing some applications.";
            voiceService.speak(msg, language === Language.HINDI ? 'hi' : 'en');
            setLastAlertTime(Date.now());
        } else if (batteryLevel < 15 && !isPlugged) {
            const msg = language === Language.HINDI
                ? "बैटरी कम है, कृपया चार्जर कनेक्ट करें।"
                : "Battery is critically low. Directing you to power source.";
            voiceService.speak(msg, language === Language.HINDI ? 'hi' : 'en');
            setLastAlertTime(Date.now());
        }
    }, [systemStatus, isBridgeConnected, language, lastAlertTime]);

    // Handle Bridge Responses
    useEffect(() => {
        if (bridgeResponse) {
            if (bridgeResponse.success) {
                // If the bridge provides a new volume, sync it
                if (bridgeResponse.volume !== undefined) {
                    setVolume(bridgeResponse.volume);
                }

                // Add to history
                addToHistory({
                    transcript: transcript, // This might be slightly off if multiple commands are in flight
                    response: bridgeResponse.response,
                    actionType: bridgeResponse.command_key.toUpperCase(),
                    language: bridgeResponse.language,
                    timestamp: Date.now()
                });

                // Speak response
                voiceService.speak(bridgeResponse.response, bridgeResponse.language);
                setMode(AppMode.SPEAKING);

                // Open external URLs if provided
                if (bridgeResponse.data?.external_url) {
                    window.open(bridgeResponse.data.external_url as string, '_blank');
                }

            } else if (bridgeResponse.error) {
                console.error('Bridge Error:', bridgeResponse.error);
            }

            // Allow processing of next command after a short delay
            const delay = bridgeResponse.response.length * 50 + 1000; // rough estimate of speaking time
            setTimeout(() => {
                processingRef.current = false;
                resetLastResponse();
                if (isActiveRef.current) startListening();
                else setMode(AppMode.IDLE);
            }, Math.min(delay, 5000));
        }
    }, [bridgeResponse]);

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
                } else if (result.actionType === 'ROUTINE_WORK') {
                    setTheme('focus');
                    setPersonality(PersonalityMode.FOCUS);
                    setShowTasks(true);
                    soundService.playStartup();
                    analyticsService.trackEvent('ROUTINE_EXECUTED', { type: 'work' });
                }

                // Handle specific Action Handlers
                if (result.actionType === 'WEATHER_FETCH') { fetchWeather(); analyticsService.trackWidgetOpen('weather'); }
                else if (result.actionType === 'NEWS_FETCH') { fetchNews(); setShowNews(true); analyticsService.trackWidgetOpen('news'); }
                else if (result.actionType === 'NEWS_HIDE') setShowNews(false);
                else if (result.actionType === 'CALCULATION' && result.data) { setCalcData(result.data); setShowCalc(true); soundService.playUIConfirm(); analyticsService.trackWidgetOpen('calculator'); }
                else if (result.actionType === 'TIMER' && result.data) { setActiveTimer(result.data); soundService.playUIConfirm(); analyticsService.trackWidgetOpen('timer'); }
                else if (result.actionType === 'TASK_ADD' && result.data?.task) { addTask(result.data.task); setShowTasks(true); analyticsService.trackWidgetOpen('tasks'); }
                else if (result.actionType === 'TASK_SHOW') { setShowTasks(true); analyticsService.trackWidgetOpen('tasks'); }
                else if (result.actionType === 'DRAWING_MODE') { setShowDrawingCanvas(true); analyticsService.trackWidgetOpen('drawing'); }
                else if (result.actionType === 'SENTRY_MODE') { setShowSentryMode(true); analyticsService.trackWidgetOpen('sentry'); }
                else if (result.actionType === 'HEALTH_SHOW') { setShowHealth(true); analyticsService.trackWidgetOpen('health'); }
                else if (result.actionType === 'MINDFULNESS_START') { setShowMindfulness(true); analyticsService.trackWidgetOpen('mindfulness'); }
                else if (result.actionType === 'AUTOMATION_STATUS') { setShowAutomation(true); analyticsService.trackWidgetOpen('automation'); }
                else if (result.actionType === 'MEMORY_SHOW') { setShowMemory(true); analyticsService.trackWidgetOpen('memory'); }
                else if (result.actionType === 'PERSONALITY_CHANGE' && result.data?.mode) {
                    setPersonality(result.data.mode);
                    soundService.playStartup();
                    analyticsService.trackEvent('PERSONALITY_CHANGED', { mode: result.data.mode });
                }
                else if (result.actionType === 'CALENDAR_SHOW') { setShowCalendar(true); analyticsService.trackWidgetOpen('calendar'); }
                else if (result.actionType === 'CALENDAR_ADD' && result.data?.event) {
                    addCalendarEvent(result.data.event as Omit<CalendarEvent, 'id' | 'user_id'>);
                    setShowCalendar(true);
                }
                else if (result.actionType === 'HOUSEHOLD_SHOW') { setShowHousehold(true); analyticsService.trackWidgetOpen('household'); }
                else if (result.actionType === 'HOUSEHOLD_ITEM_ADD' && result.data?.item) {
                    addHouseholdItem(result.data.item as string, "Living Room"); // Default location for voice add
                    setShowHousehold(true);
                }
                else if (result.actionType === 'GIFTS_SHOW') { setShowGifts(true); analyticsService.trackWidgetOpen('gifts'); }
                else if (result.actionType === 'GIFT_IDEAS_ADD' && result.data?.gift) {
                    addGiftIdea(result.data.gift as string);
                    setShowGifts(true);
                }
                else if (result.actionType === 'THEME_CHANGE' && result.data?.theme) {
                    const newTheme = result.data.theme as 'sofiya' | 'classic' | 'focus' | 'zen';
                    setTheme(newTheme);
                    soundService.playScan();
                    analyticsService.trackThemeChange(newTheme);
                }
                else if (result.actionType === 'VOLUME_SET' && result.data?.volume !== undefined) {
                    const newVol = result.data.volume as number;
                    setVolume(newVol);
                    if (isBridgeConnected) sendBridgeCommand(`set volume to ${newVol}`, result.language);
                    soundService.playUIConfirm();
                }

                // Volume, Media, Communication, Smart Home handlers...
                else if (result.actionType === 'NAVIGATE') {
                    // Immediately open the external URL (e.g. web app launch, Hindi website names)
                    if (result.externalUrl) {
                        soundService.playUIClick();
                        window.open(result.externalUrl, '_blank');
                    }
                }
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
                    } else if (result.data?.deviceType === 'fan') {
                        setSmartDevices(prev => prev.map(d => d.type === 'fan' ? { ...d, status: result.data.state } : d));
                    } else if (result.data?.deviceType === 'ac') {
                        setSmartDevices(prev => prev.map(d => d.type === 'ac' ? { ...d, status: result.data.state } : d));
                    } else if (result.data?.deviceType === 'thermostat') {
                        setSmartDevices(prev => prev.map(d => d.type === 'thermostat' ? { ...d, status: `${result.data.state}°C` } : d));
                    } else if (result.data?.deviceType === 'lock') {
                        setSmartDevices(prev => prev.map(d => d.type === 'lock' ? { ...d, status: result.data.state ? 'Locked' : 'Unlocked' } : d));
                    }
                }

                // UI indicators for system actions
                const uiFeedbackActions = [
                    'VOLUME_UP', 'VOLUME_DOWN', 'VOLUME_MUTE', 'VOLUME_UNMUTE',
                    'BRIGHTNESS_UP', 'BRIGHTNESS_DOWN',
                    'WINDOW_MINIMIZE', 'WINDOW_MAXIMIZE', 'WINDOW_CLOSE', 'SHOW_DESKTOP',
                    'SNAP_LEFT', 'SNAP_RIGHT', 'CENTER_WINDOW', 'MEDIA_NEXT', 'MEDIA_PREV',
                    'SHUTDOWN_CONFIRM', 'RESTART_CONFIRM', 'SLEEP_CONFIRM',
                    'CLIPBOARD_COPY', 'CLIPBOARD_PASTE', 'HOTKEY_SAVE', 'HOTKEY_UNDO',
                    'NEW_TAB', 'CLOSE_TAB', 'SCROLL_UP', 'SCROLL_DOWN',
                    'OCR_IMAGE', 'OCR_PDF', 'READ_PDF', 'NARRATE_SCREEN', 'MAKE_DRAWING'
                ];
                if (uiFeedbackActions.includes(result.actionType)) {
                    soundService.playUIClick();
                }

                // --- SYSTEM BRIDGE INTEGRATION ---
                // If it's a system command, send it to the bridge for actual execution
                const systemCommands = [
                    'WINDOW_MINIMIZE', 'WINDOW_MAXIMIZE', 'WINDOW_CLOSE', 'SHOW_DESKTOP',
                    'SNAP_LEFT', 'SNAP_RIGHT', 'CENTER_WINDOW', 'LIST_APPS', 'OPEN_APP',
                    'VOLUME_UP', 'VOLUME_DOWN', 'VOLUME_MUTE', 'VOLUME_UNMUTE',
                    'BRIGHTNESS_UP', 'BRIGHTNESS_DOWN', 'SCREENSHOT', 'FILE_SEARCH', 'FOLDER_CREATE',
                    'FILE_COPY', 'FILE_MOVE', 'FILE_RENAME', 'FILE_DELETE_CONFIRM',
                    'MOUSE_CLICK', 'MOUSE_DOUBLE_CLICK', 'MOUSE_RIGHT_CLICK', 'SCROLL_UP', 'SCROLL_DOWN',
                    'GET_CLIPBOARD', 'SET_CLIPBOARD', 'CLIPBOARD_COPY', 'CLIPBOARD_PASTE',
                    'HOTKEY_SAVE', 'HOTKEY_UNDO', 'NEW_TAB', 'CLOSE_TAB',
                    'OCR_IMAGE', 'OCR_PDF', 'IMAGE_CONVERT',
                    'IMAGE_RESIZE', 'IMAGE_COMPRESS', 'PDF_MERGE', 'PDF_TO_IMAGES', 'IMAGES_TO_PDF',
                    'SHUTDOWN_CONFIRM', 'RESTART_CONFIRM', 'SLEEP_CONFIRM',
                    'BATTERY_STATUS', 'SYSTEM_STATUS_FULL', 'UPTIME', 'NETWORK_INFO', 'SYSTEM_HEALTH',
                    'CHANGE_WALLPAPER', 'EMPTY_RECYCLE_BIN', 'TOGGLE_TASKBAR', 'ZOOM_IN', 'ZOOM_OUT',
                    'SEARCH_QUERY', 'WIKIPEDIA_FETCH',
                    'MEDIA_PLAY', 'MEDIA_PAUSE', 'MEDIA_RESUME', 'MEDIA_NEXT', 'MEDIA_PREV', 'MEDIA_STOP',
                    'BATCH_PDF', 'SCAN_FOLDER', 'MAKE_DRAWING', 'GET_SELECTED_TEXT', 'READ_PDF',
                    'NARRATE_SCREEN', 'SCREEN_SUMMARY', 'RUN_MACRO', 'AUTOMATION_STATUS', 'MEMORY_SHOW'
                ];



                if (isBridgeConnected && systemCommands.includes(result.actionType)) {
                    sendBridgeCommand(text, result.language);
                    // Add optimistic history entry
                    addToHistory({
                        transcript: text,
                        response: result.response,
                        actionType: result.actionType,
                        language: result.language,
                        timestamp: Date.now(),
                        emotion: result.emotion
                    });
                    // The actual speaking and response will be handled by the bridge effect
                    return;
                }
                // ---------------------------------

                // Standard history for non-bridge actions
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

    const addTask = async (title: string, isShared: boolean = false) => {
        try {
            const resp = await fetch('http://localhost:3001/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, isShared })
            });
            const data = await resp.json();
            if (data.id) {
                setTasks(prev => [data, ...prev]);
            }
        } catch (e) {
            console.error('Failed to add task', e);
        }
    };

    const toggleTask = async (taskId: string, completed: boolean) => {
        try {
            const resp = await fetch(`http://localhost:3001/api/tasks/${taskId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completed })
            });
            const data = await resp.json();
            if (data.id) {
                setTasks(prev => prev.map(t => t.id === taskId ? data : t));
            }
        } catch (e) {
            console.error('Failed to toggle task', e);
        }
    };

    const addCalendarEvent = async (event: Omit<CalendarEvent, 'id' | 'user_id' | 'is_shared'> & { is_shared?: boolean }) => {
        try {
            const resp = await fetch('http://localhost:3001/api/calendar/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...event, is_shared: true })
            });
            const data = await resp.json() as CalendarEvent;
            if (data.id) setCalendarEvents(prev => [data, ...prev]);
        } catch (e) { console.error('Failed to add event', e); }
    };

    const addHouseholdItem = async (itemName: string, location: string) => {
        try {
            const resp = await fetch('http://localhost:3001/api/household/knowledge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemName, location, room: location })
            });
            const data = await resp.json() as HouseholdItem;
            if (data.id) setHouseholdKnowledge(prev => [data, ...prev]);
        } catch (e) { console.error('Failed to add item', e); }
    };

    const addGiftIdea = async (itemName: string) => {
        try {
            const resp = await fetch('http://localhost:3001/api/social/gifts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ giftIdea: itemName, hiddenFrom: [] })
            });
            const data = await resp.json() as GiftIdea;
            if (data.id) setGiftIdeas(prev => [data, ...prev]);
        } catch (e) { console.error('Failed to add gift', e); }
    };

    const executeCommand = (cmd: string) => {
        handleCommandResult(cmd, true);
    };

    const switchUser = async (userId: string) => {
        try {
            const resp = await fetch('http://localhost:3001/api/identity/switch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
            const data = await resp.json();
            if (data.success) {
                setCurrentUser({ id: userId, name: userId });
                soundService.playStartup();
                addToHistory({
                    transcript: "SWITCH_PROFILE",
                    response: `Switched to ${userId}'s profile.`,
                    actionType: "SYSTEM",
                    language: 'en',
                    timestamp: Date.now(),
                    isSystemMessage: true
                });
            }
        } catch (e) {
            console.error('Failed to switch user', e);
        }
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
        showHelp, setShowHelp,
        showReportIssue, setShowReportIssue,
        showAutomation, setShowAutomation,
        showMemory, setShowMemory,
        showDesktopPanel, setShowDesktopPanel,
        currentUser, setCurrentUser, switchUser,
        addTask, toggleTask,
        calendarEvents, showCalendar, setShowCalendar,
        householdKnowledge, showHousehold, setShowHousehold,
        giftIdeas, showGifts, setShowGifts,
        toggleActivation, executeCommand,
        addToHistory,
        fetchWeather, fetchNews,


        // Bridge
        isBridgeConnected,
        bridgeConnectionStatus,
        systemStatus,
        pendingConfirmation,
        confirmBridgeAction,
        addCalendarEvent,
        addHouseholdItem,
        addGiftIdea,
        reconnectBridge
    };
};
