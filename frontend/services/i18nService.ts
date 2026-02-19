export type LanguageCode = 'en' | 'hi' | 'es' | 'fr' | 'de' | 'ja';

export interface LanguageConfig {
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  locale: string;
  voiceCode: string;
}

export const LANGUAGE_CONFIGS: Record<LanguageCode, LanguageConfig> = {
  en: {
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
    locale: 'en-US',
    voiceCode: 'en-US'
  },
  hi: {
    name: 'Hindi',
    nativeName: 'हिन्दी',
    direction: 'ltr',
    locale: 'hi-IN',
    voiceCode: 'hi-IN'
  },
  es: {
    name: 'Spanish',
    nativeName: 'Español',
    direction: 'ltr',
    locale: 'es-ES',
    voiceCode: 'es-ES'
  },
  fr: {
    name: 'French',
    nativeName: 'Français',
    direction: 'ltr',
    locale: 'fr-FR',
    voiceCode: 'fr-FR'
  },
  de: {
    name: 'German',
    nativeName: 'Deutsch',
    direction: 'ltr',
    locale: 'de-DE',
    voiceCode: 'de-DE'
  },
  ja: {
    name: 'Japanese',
    nativeName: '日本語',
    direction: 'ltr',
    locale: 'ja-JP',
    voiceCode: 'ja-JP'
  }
};

interface Translation {
  [key: string]: string;
}

const TRANSLATIONS: Record<LanguageCode, Translation> = {
  en: {
    GREETING: 'Hello, I am Sofiya. How can I make your day better?',
    STATUS_ONLINE: 'SOFIYA Online. Ready to assist.',
    UNKNOWN_COMMAND: "I'm not sure I understand. Could you rephrase that for me?",
    LOADING: 'Loading...',
    ERROR_GPS: 'GPS signal unavailable. Please check your location settings.',
    ERROR_MIC: 'Microphone access denied. Please enable permissions in browser settings.',
    ERROR_NETWORK: 'Network connection failed. Please check your internet.',
    WEATHER_LABEL: 'Weather',
    NEWS_LABEL: 'News',
    TASKS_LABEL: 'Tasks',
    HEALTH_LABEL: 'Health',
    SETTINGS_LABEL: 'Settings',
    LISTENING: 'Listening...',
    PROCESSING: 'Processing...',
    SPEAKING: 'Speaking...',
    MIC_OFF: 'Microphone Off',
    MIC_ON: 'Microphone On',
    THEME_SOFIYA: 'Sofiya',
    THEME_CLASSIC: 'Classic',
    THEME_FOCUS: 'Focus',
    THEME_ZEN: 'Zen'
  },
  hi: {
    GREETING: 'नमस्ते, मैं सोफिया हूँ। मैं आपकी दिनचर्या को कैसे आसान बना सकती हूँ?',
    STATUS_ONLINE: 'सोफिया ऑनलाइन। सहायता के लिए तैयार।',
    UNKNOWN_COMMAND: 'मुझे समझ नहीं आया। क्या आप इसे थोड़ा अलग तरीके से कह सकते हैं?',
    LOADING: 'लोड हो रहा है...',
    ERROR_GPS: 'जीपीएस सिग्नल उपलब्ध नहीं है। कृपया अपनी लोकेशन सेटिंग्स जांचें।',
    ERROR_MIC: 'माइक्रोफ़ोन एक्सेस अस्वीकार कर दिया गया। कृपया ब्राउज़र सेटिंग्स में अनुमति दें।',
    ERROR_NETWORK: 'नेटवर्क कनेक्शन विफल। कृपया अपना इंटरनेट जांचें।',
    WEATHER_LABEL: 'मौसम',
    NEWS_LABEL: 'समाचार',
    TASKS_LABEL: 'कार्य',
    HEALTH_LABEL: 'स्वास्थ्य',
    SETTINGS_LABEL: 'सेटिंग्स',
    LISTENING: 'सुन रही हूँ...',
    PROCESSING: 'प्रोसेसिंग...',
    SPEAKING: 'बोल रही हूँ...',
    MIC_OFF: 'माइक बंद',
    MIC_ON: 'माइक खुला',
    THEME_SOFIYA: 'सोफिया',
    THEME_CLASSIC: 'क्लासिक',
    THEME_FOCUS: 'फोकस',
    THEME_ZEN: 'ज़ेन'
  },
  es: {
    GREETING: 'Hola, soy Sofiya. ¿Cómo puedo mejorar tu día?',
    STATUS_ONLINE: 'SOFIYA en línea. Listo para asistir.',
    UNKNOWN_COMMAND: 'No estoy seguro de entender. ¿Podrías reformular eso?',
    LOADING: 'Cargando...',
    ERROR_GPS: 'Señal de GPS no disponible. Comprueba tu configuración de ubicación.',
    ERROR_MIC: 'Acceso de micrófono denegado. Habilita permisos en tu navegador.',
    ERROR_NETWORK: 'Conexión de red fallida. Comprueba tu internet.',
    WEATHER_LABEL: 'Clima',
    NEWS_LABEL: 'Noticias',
    TASKS_LABEL: 'Tareas',
    HEALTH_LABEL: 'Salud',
    SETTINGS_LABEL: 'Configuración',
    LISTENING: 'Escuchando...',
    PROCESSING: 'Procesando...',
    SPEAKING: 'Hablando...',
    MIC_OFF: 'Micrófono apagado',
    MIC_ON: 'Micrófono encendido',
    THEME_SOFIYA: 'Sofiya',
    THEME_CLASSIC: 'Clásico',
    THEME_FOCUS: 'Enfoque',
    THEME_ZEN: 'Zen'
  },
  fr: {
    GREETING: 'Bonjour, je suis Sofiya. Comment puis-je améliorer votre journée?',
    STATUS_ONLINE: 'SOFIYA en ligne. Prêt à vous aider.',
    UNKNOWN_COMMAND: 'Je ne suis pas sûr de comprendre. Pouvez-vous reformuler?',
    LOADING: 'Chargement...',
    ERROR_GPS: 'Signal GPS indisponible. Vérifiez vos paramètres de localisation.',
    ERROR_MIC: 'Accès au microphone refusé. Activez les permissions dans votre navigateur.',
    ERROR_NETWORK: 'Connexion réseau échouée. Vérifiez votre internet.',
    WEATHER_LABEL: 'Météo',
    NEWS_LABEL: 'Actualités',
    TASKS_LABEL: 'Tâches',
    HEALTH_LABEL: 'Santé',
    SETTINGS_LABEL: 'Paramètres',
    LISTENING: 'Écoute...',
    PROCESSING: 'Traitement...',
    SPEAKING: 'Parole...',
    MIC_OFF: 'Microphone désactivé',
    MIC_ON: 'Microphone activé',
    THEME_SOFIYA: 'Sofiya',
    THEME_CLASSIC: 'Classique',
    THEME_FOCUS: 'Focus',
    THEME_ZEN: 'Zen'
  },
  de: {
    GREETING: 'Hallo, ich bin Sofiya. Wie kann ich deinen Tag verbessern?',
    STATUS_ONLINE: 'SOFIYA online. Bereit zu helfen.',
    UNKNOWN_COMMAND: 'Ich bin mir nicht sicher, ob ich verstehe. Kannst du das umformulieren?',
    LOADING: 'Wird geladen...',
    ERROR_GPS: 'GPS-Signal nicht verfügbar. Überprüfen Sie Ihre Standorteinstellungen.',
    ERROR_MIC: 'Mikrofonzugriff verweigert. Aktivieren Sie Berechtigungen in Ihrem Browser.',
    ERROR_NETWORK: 'Netzwerkverbindung fehlgeschlagen. Überprüfen Sie Ihr Internet.',
    WEATHER_LABEL: 'Wetter',
    NEWS_LABEL: 'Nachrichten',
    TASKS_LABEL: 'Aufgaben',
    HEALTH_LABEL: 'Gesundheit',
    SETTINGS_LABEL: 'Einstellungen',
    LISTENING: 'Hört zu...',
    PROCESSING: 'Verarbeitung...',
    SPEAKING: 'Spricht...',
    MIC_OFF: 'Mikrofon aus',
    MIC_ON: 'Mikrofon an',
    THEME_SOFIYA: 'Sofiya',
    THEME_CLASSIC: 'Klassisch',
    THEME_FOCUS: 'Fokus',
    THEME_ZEN: 'Zen'
  },
  ja: {
    GREETING: 'こんにちは、私はSofiyaです。你的日を良くするにはどうすればいいですか？',
    STATUS_ONLINE: 'SOFIYA オンライン。サポートの準備ができています。',
    UNKNOWN_COMMAND: '申し訳ございませんが、理解できません。別の言い方をしてください。',
    LOADING: '読み込み中...',
    ERROR_GPS: 'GPSの信号が利用できません。位置情報の設定を確認してください。',
    ERROR_MIC: 'マイクアクセスが拒否されました。ブラウザのアクセス許可を有効にしてください。',
    ERROR_NETWORK: 'ネットワーク接続に失敗しました。インターネット接続を確認してください。',
    WEATHER_LABEL: '天気',
    NEWS_LABEL: 'ニュース',
    TASKS_LABEL: 'タスク',
    HEALTH_LABEL: '健康',
    SETTINGS_LABEL: '設定',
    LISTENING: '聞いています...',
    PROCESSING: '処理中...',
    SPEAKING: '話しています...',
    MIC_OFF: 'マイクオフ',
    MIC_ON: 'マイクオン',
    THEME_SOFIYA: 'ソフィヤ',
    THEME_CLASSIC: 'クラシック',
    THEME_FOCUS: 'フォーカス',
    THEME_ZEN: '禅'
  }
};

class I18nService {
  private currentLanguage: LanguageCode = 'en';
  private languageStorageKey = 'sofiya_language';

  constructor() {
    this.loadLanguage();
  }

  setLanguage(lang: LanguageCode) {
    if (!LANGUAGE_CONFIGS[lang]) return;
    this.currentLanguage = lang;
    localStorage.setItem(this.languageStorageKey, lang);
    this.applyLanguage(lang);
  }

  getLanguage(): LanguageCode {
    return this.currentLanguage;
  }

  t(key: string): string {
    return TRANSLATIONS[this.currentLanguage]?.[key] || 
           TRANSLATIONS['en']?.[key] || 
           key;
  }

  getLanguageConfig(): LanguageConfig {
    return LANGUAGE_CONFIGS[this.currentLanguage];
  }

  getAllLanguages(): Array<{ code: LanguageCode; name: string; nativeName: string }> {
    return Object.entries(LANGUAGE_CONFIGS).map(([code, config]) => ({
      code: code as LanguageCode,
      name: config.name,
      nativeName: config.nativeName
    }));
  }

  getSupportedLanguages(): LanguageCode[] {
    return Object.keys(LANGUAGE_CONFIGS) as LanguageCode[];
  }

  private loadLanguage() {
    const saved = localStorage.getItem(this.languageStorageKey) as LanguageCode;
    if (saved && LANGUAGE_CONFIGS[saved]) {
      this.currentLanguage = saved;
    } else {
      const browserLang = navigator.language.split('-')[0] as LanguageCode;
      if (LANGUAGE_CONFIGS[browserLang]) {
        this.currentLanguage = browserLang;
      }
    }
    this.applyLanguage(this.currentLanguage);
  }

  private applyLanguage(lang: LanguageCode) {
    const config = LANGUAGE_CONFIGS[lang];
    if (config) {
      document.documentElement.lang = config.locale;
      document.documentElement.dir = config.direction;
    }
  }
}

export const i18nService = new I18nService();
