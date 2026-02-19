
import { SecurityService } from './securityService';
import { PersonalityMode } from '../types';
import { AIService } from './aiService';

export interface ProcessedCommand {
  actionType: string;
  response: string;
  spokenResponse?: string;
  language: 'en' | 'hi';
  externalUrl?: string;
  data?: any;
}

// ─────────────────────────────────────────────────────────────────────────────
// VOCABULARY DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

// Strong Hindi Indicators: Verbs and question words that rarely appear in English context
const HINDI_STRONG_WORDS = new Set([
  'karo', 'karna', 'kar', 'dekhna', 'dekho', 'dikhao', 'sunao', 'suno', 'sun',
  'batao', 'btao', 'bol', 'bolo', 'kholo', 'band', 'chalao', 'lagao', 'hatao',
  'ruko', 'roko', 'jao', 'aao', 'bhejo', 'likho', 'padho', 'badlo', 'badhao',
  'kam', 'karein', 'karen', 'dijiye', 'lijiye', 'banao', 'jodo', 'dhundo', 'khojo',
  'kya', 'kyu', 'kyun', 'kab', 'kahan', 'kaise', 'kaun', 'kitna', 'kitne', 'kisne', 'kaunsa',
  'namaste', 'shukriya', 'dhanyavad', 'swagat', 'bajao', 'sunao', 'chala', 'mute', 'chup',
  'tez', 'dheere', 'zyada', 'kam', 'bolo', 'bata', 'de', 'dikha'
]);

// Common Hindi Words (nouns, pronouns, particles)
const HINDI_COMMON_WORDS = new Set([
  'main', 'hum', 'tum', 'aap', 'ye', 'yeh', 'woh', 'voh', 'mera', 'meri', 'mere',
  'tumhara', 'apka', 'iska', 'uska', 'sofiya', 'ghar', 'kamra', 'batti', 'pankha',
  'darwaza', 'khidki', 'paani', 'khana', 'gadi', 'dost', 'mitra',
  'hai', 'hain', 'ho', 'hu', 'tha', 'thi', 'the', 'ga', 'gi', 'ge', 'raha', 'rahi', 'rahe',
  'ka', 'ki', 'ke', 'ko', 'ne', 'se', 'me', 'mein', 'par', 'pe', 'tak', 'liye',
  'aur', 'ya', 'lekin', 'agar', 'jab', 'tab',
  'accha', 'achha', 'bura', 'jaldi', 'abhi', 'baad', 'aaj', 'kal',
  'thoda', 'bas', 'bilkul', 'haan', 'nahi', 'mat', 'theek', 'sahi', 'galat',
  'sandesh', 'gaana', 'sangeet', 'samachar', 'mausam', 'samay', 'tarikh', 'waqt',
  'awaaz', 'bolna', 'lao', 'kuch', 'sab', 'sara', 'bahut', 'bilkul', 'seedha',
  'khush', 'dukh', 'bata', 'chhod', 'chalo', 'taiyar', 'kaam', 'sona', 'uthna'
]);

// Strong English Indicators: Function words unique to English grammar
const ENGLISH_STRONG_WORDS = new Set([
  'the', 'this', 'that', 'these', 'those', 'which', 'whose', 'whom',
  'with', 'from', 'about', 'because', 'through', 'under', 'over', 'between',
  'could', 'would', 'should', 'shall', 'might', 'must',
  'please', 'create', 'delete', 'remove', 'update', 'calculate', 'compute',
  'weather', 'news', 'volume', 'brightness', 'increase', 'decrease', 'mute', 'unmute',
  'schedule', 'remind', 'reminder', 'timer', 'alarm', 'date', 'time', 'today', 'tomorrow'
]);

// Common English Words (shared and unique)
const ENGLISH_COMMON_WORDS = new Set([
  'i', 'me', 'my', 'mine', 'you', 'your', 'yours', 'he', 'him', 'his', 'she', 'her', 'it', 'its', 'we', 'us', 'our',
  'open', 'close', 'turn', 'switch', 'play', 'pause', 'stop', 'resume', 'start', 'end', 'cancel',
  'show', 'hide', 'display', 'list', 'add', 'set', 'change',
  'call', 'text', 'message', 'send', 'read', 'speak', 'tell', 'say', 'ask', 'get', 'find', 'search',
  'is', 'am', 'are', 'was', 'were', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'can',
  'a', 'an', 'to', 'for', 'of', 'in', 'on', 'at', 'by',
  'and', 'but', 'or', 'if', 'when', 'where', 'why', 'how', 'what',
  'okay', 'hey', 'hi', 'hello', 'thanks', 'thank', 'music', 'song', 'light',
  'joke', 'fact', 'draw', 'sketch', 'paint', 'note', 'write', 'report', 'status'
]);

// ─────────────────────────────────────────────────────────────────────────────
// LANGUAGE DETECTION
// ─────────────────────────────────────────────────────────────────────────────

const detectLanguage = (text: string): 'en' | 'hi' => {
  const cleanText = text.toLowerCase().trim();

  // Script Check: Devanagari is definitive
  if (/[\u0900-\u097F]/.test(cleanText)) return 'hi';

  const tokens = cleanText.replace(/[^\w\s]/g, '').split(/\s+/);

  let hiScore = 0;
  let enScore = 0;

  tokens.forEach((token, index) => {
    // Weighted Word Scoring
    if (HINDI_STRONG_WORDS.has(token)) hiScore += 3.0;
    else if (HINDI_COMMON_WORDS.has(token)) hiScore += 1.0;

    if (ENGLISH_STRONG_WORDS.has(token)) enScore += 2.0;
    else if (ENGLISH_COMMON_WORDS.has(token)) {
      // Hinglish check: tech/media concept words are neutral in mixed contexts
      if (['play', 'stop', 'start', 'call', 'message', 'text', 'light', 'fan', 'music', 'song', 'draw'].includes(token)) {
        enScore += 0.8;
      } else {
        enScore += 1.0;
      }
    }

    // Hindi SOV: verb/auxiliary at end of sentence
    if (index === tokens.length - 1) {
      if (['hai', 'hain', 'tha', 'thi', 'ga', 'gi', 'ge', 'karo', 'do', 'lo',
        'bhejo', 'dikhao', 'chalao', 'lagao', 'liya', 'diya', 'batao', 'de',
        'roko', 'chala', 'bajao'].includes(token)) {
        hiScore += 2.5;
      }
    }

    // English SVO/Imperative: common command verbs at start
    if (index === 0) {
      if (['turn', 'play', 'show', 'open', 'call', 'send', 'set', 'get', 'search',
        'find', 'what', 'how', 'tell', 'remind', 'schedule', 'increase', 'decrease',
        'mute', 'check', 'draw'].includes(token)) {
        enScore += 1.5;
      }
    }
  });

  // Grammar Marker Heuristics
  if (tokens.includes('ko') && !tokens.includes('to')) hiScore += 2.0;
  if (tokens.includes('to') && !tokens.includes('ko')) enScore += 1.5;
  if (tokens.includes('mein')) hiScore += 3.0;
  if (tokens.includes('in') && !tokens.includes('mein')) enScore += 1.0;
  if (tokens.includes('ka') || tokens.includes('ki') || tokens.includes('ke')) hiScore += 1.5;
  if (tokens.includes('ne') && tokens.includes('ko')) hiScore += 2.0;

  return hiScore >= enScore ? 'hi' : 'en';
};

// ─────────────────────────────────────────────────────────────────────────────
// RESPONSE PERSONALIZER
// ─────────────────────────────────────────────────────────────────────────────

const personalizeResponse = (baseResponse: string, personality: PersonalityMode, lang: 'en' | 'hi', _type: string): string => {
  if (lang === 'hi') {
    if (personality === PersonalityMode.FOCUS) return baseResponse;
    if (personality === PersonalityMode.SASS) return `${baseResponse} और कुछ? या मैं आराम करूँ?`;
    if (personality === PersonalityMode.STORYTELLER) return `सुनिए, ${baseResponse} यह जानकारी आपके लिए विशेष रूप से तैयार की गई है।`;
    return baseResponse;
  }

  switch (personality) {
    case PersonalityMode.FOCUS:
      return baseResponse.replace(/Please |I have |Here is /g, '').trim();
    case PersonalityMode.SASS: {
      const sassSuffixes = [
        " Try not to break anything.",
        " You're welcome, by the way.",
        " I can do this in my sleep. If I slept.",
        " Anything else, or can I go back to saving the world?"
      ];
      return `${baseResponse} ${sassSuffixes[Math.floor(Math.random() * sassSuffixes.length)]}`;
    }
    case PersonalityMode.STORYTELLER: {
      const intros = [
        "Gather round. The data reveals that ",
        "Once upon a time in the digital realm, I found that ",
        "Let me paint a picture for you. ",
        "The scrolls of information indicate that "
      ];
      return `${intros[Math.floor(Math.random() * intros.length)]}${baseResponse.toLowerCase()}`;
    }
    default:
      return baseResponse;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// JOKES & FACTS BANK
// ─────────────────────────────────────────────────────────────────────────────

const JOKES_EN = [
  "Why don't scientists trust atoms? Because they make up everything!",
  "I told my computer I needed a break. Now it won't stop sending me Kit-Kat ads.",
  "Why do programmers prefer dark mode? Because light attracts bugs!",
  "I asked Siri to tell me a joke. She said, 'Sorry, I can't help with that.' Even AI has standards.",
  "What do you call a fish with no eyes? A fsh.",
];

const JOKES_HI = [
  "शिक्षक: एक वाक्य में 'कोशिश' शब्द का उपयोग करो। छात्र: मैं कोशिश करूँगा!",
  "पत्नी: तुम फिर से सो गए? पति: नहीं, मैं बस आँखें बंद करके सोच रहा था।",
  "डॉक्टर: आप कितना पानी पीते हैं? मैं: बहुत कम। डॉक्टर: चाय? मैं: दिन में छः कप। डॉक्टर: यही पानी है।",
];

const FACTS_EN = [
  "Honey never spoils. Archaeologists have found 3000-year-old honey in Egyptian tombs.",
  "Octopuses have three hearts and blue blood.",
  "A day on Venus is longer than a year on Venus.",
  "Bananas are berries, but strawberries are not.",
  "The Eiffel Tower can grow by up to 15 cm in summer due to thermal expansion.",
];

const FACTS_HI = [
  "मानव दिमाग में लगभग 86 अरब न्यूरॉन्स होते हैं।",
  "ऑक्टोपस के तीन दिल होते हैं और उनका खून नीला होता है।",
  "शहद कभी खराब नहीं होता — मिस्र की 3000 साल पुरानी कब्रों में शहद मिला है।",
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Extract a clean search query
// ─────────────────────────────────────────────────────────────────────────────

const extractQuery = (text: string, removeWords: string[]): string => {
  let q = text;
  removeWords.forEach(w => { q = q.replace(new RegExp(w, 'gi'), ''); });
  return q.trim().replace(/\s+/g, ' ');
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PROCESSOR
// ─────────────────────────────────────────────────────────────────────────────

export const processTranscript = async (
  text: string,
  personality: PersonalityMode = PersonalityMode.DEFAULT
): Promise<ProcessedCommand> => {
  const cleanText = SecurityService.sanitizeCommand(text);
  const lowerText = cleanText.toLowerCase();
  const detectedLang = detectLanguage(cleanText);
  const isHindi = detectedLang === 'hi';

  const createResponse = (
    type: string,
    baseResp: string,
    data?: any,
    externalUrl?: string
  ): ProcessedCommand => ({
    actionType: type,
    response: baseResp,
    spokenResponse: personalizeResponse(baseResp, personality, detectedLang, type),
    language: detectedLang,
    data,
    externalUrl
  });

  // ── Security Gate ────────────────────────────────────────────────────────
  if (SecurityService.analyzeForPhishing(cleanText)) {
    return createResponse(
      'SECURITY_ALERT',
      isHindi
        ? "सुरक्षा चेतावनी: संवेदनशील डेटा का अनुरोध अस्वीकृत।"
        : "Security Alert: Request for sensitive data has been blocked."
    );
  }

  // ── Personality Switching ────────────────────────────────────────────────
  if (lowerText.includes('sass') || lowerText.includes('attitude')) {
    return createResponse('PERSONALITY_CHANGE', isHindi ? "सैस मोड सक्रिय।" : "Sass Mode activated.", { mode: PersonalityMode.SASS });
  }
  if (lowerText.includes('focus') && lowerText.includes('mode')) {
    return createResponse('PERSONALITY_CHANGE', isHindi ? "फोकस मोड सक्रिय।" : "Focus Mode engaged.", { mode: PersonalityMode.FOCUS });
  }
  if (lowerText.includes('story') || lowerText.includes('narrator')) {
    return createResponse('PERSONALITY_CHANGE', isHindi ? "कहानी मोड सक्रिय।" : "Storyteller Mode activated.", { mode: PersonalityMode.STORYTELLER });
  }
  if (lowerText.includes('normal') || lowerText.includes('reset') || lowerText.includes('default')) {
    return createResponse('PERSONALITY_CHANGE', isHindi ? "सोफिया को रीसेट कर रही हूँ।" : "Restoring default settings.", { mode: PersonalityMode.DEFAULT });
  }

  // ── System Status / Greeting ─────────────────────────────────────────────
  if (
    lowerText.match(/\b(status|report|system|online|alive|how are you|kaisi ho|kaisi hain)\b/) ||
    lowerText.match(/\b(namaste sofiya|hello sofiya|hi sofiya|hey sofiya)\b/)
  ) {
    const now = new Date();
    const hour = now.getHours();
    const greeting = hour < 12 ? (isHindi ? 'सुप्रभात' : 'Good Morning') : hour < 17 ? (isHindi ? 'नमस्ते' : 'Good Afternoon') : (isHindi ? 'शुभ संध्या' : 'Good Evening');
    const enResp = `${greeting}! All systems nominal. I'm fully operational and ready to assist. Version 4.2 active.`;
    const hiResp = `${greeting}! सभी सिस्टम ठीक हैं। मैं पूरी तरह से तैयार हूँ। वर्शन 4.2 सक्रिय है।`;
    return createResponse('SYSTEM_STATUS', isHindi ? hiResp : enResp);
  }

  // ── Time & Date ──────────────────────────────────────────────────────────
  if (
    lowerText.match(/\b(time|clock|samay|waqt|baje)\b/) ||
    lowerText.match(/\b(date|tarikh|din|today|aaj)\b/)
  ) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const hiTime = now.toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const hiDate = now.toLocaleDateString('hi-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    return createResponse(
      'TIME_DATE',
      isHindi ? `अभी का समय है ${hiTime}। आज की तारीख ${hiDate} है।` : `The current time is ${timeStr}. Today is ${dateStr}.`,
      { time: timeStr, date: dateStr }
    );
  }

  // ── Volume Control ───────────────────────────────────────────────────────
  if (lowerText.match(/\b(volume|awaaz|sound)\b/)) {
    if (lowerText.match(/\b(up|increase|badhao|tez|zyada)\b/)) {
      return createResponse('VOLUME_UP', isHindi ? "आवाज़ बढ़ा रही हूँ।" : "Increasing volume.", { direction: 'up' });
    }
    if (lowerText.match(/\b(down|decrease|kam|dheere|ghata)\b/)) {
      return createResponse('VOLUME_DOWN', isHindi ? "आवाज़ कम कर रही हूँ।" : "Decreasing volume.", { direction: 'down' });
    }
    if (lowerText.match(/\b(mute|band|chup|silent)\b/)) {
      return createResponse('VOLUME_MUTE', isHindi ? "आवाज़ बंद।" : "Sound muted.", { direction: 'mute' });
    }
    if (lowerText.match(/\b(unmute|chalu|on)\b/)) {
      return createResponse('VOLUME_UNMUTE', isHindi ? "आवाज़ चालू।" : "Sound restored.", { direction: 'unmute' });
    }
  }

  // ── Drawing / Canvas ─────────────────────────────────────────────────────
  if (lowerText.match(/\b(draw|sketch|paint|canvas|drawing|bana|banao)\b/)) {
    return createResponse('DRAWING_MODE', isHindi ? "ड्रॉइंग कैनवास खोल रही हूँ।" : "Opening the drawing canvas.");
  }

  // ── Media / Music ────────────────────────────────────────────────────────
  if (lowerText.match(/\b(play|music|song|gaana|bajao|chalao|suno|sunao)\b/)) {
    if (!lowerText.match(/\b(stop|pause|roko|band)\b/)) {
      const song = extractQuery(cleanText, ['play', 'music', 'song', 'gaana', 'bajao', 'chalao', 'please', 'can you', 'suno', 'sunao']);
      const title = song.length > 1 ? song : 'Chill Lo-Fi Beats';
      const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
      return createResponse(
        'MEDIA_PLAY',
        isHindi ? `${title} बजा रही हूँ।` : `Playing ${title}.`,
        { title, artist: 'Unknown Artist', isPlaying: true, coverColor: colors[Math.floor(Math.random() * colors.length)] }
      );
    }
  }

  if (lowerText.match(/\b(stop|pause|roko)\b/) && lowerText.match(/\b(music|song|gaana|media|audio)\b/)) {
    return createResponse('MEDIA_PAUSE', isHindi ? "संगीत रोका गया।" : "Playback paused.");
  }

  if (lowerText.match(/\b(resume|wapas chalao|phir se chala|dobara)\b/)) {
    return createResponse('MEDIA_RESUME', isHindi ? "फिर से शुरू कर रही हूँ।" : "Resuming playback.");
  }

  // ── Communication – Message ──────────────────────────────────────────────
  if (lowerText.match(/\b(message|msg|sandesh|whatsapp|text)\b/)) {
    let contact = 'Unknown';
    let content = '';
    const tokens = cleanText.split(' ');

    // Look for: "message to [contact] saying [content]" or "message [contact] ko [content]"
    const toIdx = tokens.findIndex(t => ['to', 'ko'].includes(t.toLowerCase()));
    if (toIdx !== -1 && tokens[toIdx + 1]) {
      contact = tokens[toIdx + 1];
      const splitKey = isHindi ? ['ki', 'mein', 'likhna'] : ['saying', 'that', 'with', ':'];
      let contentStartIdx = -1;
      for (const key of splitKey) {
        const idx = tokens.findIndex((t, i) => i > toIdx + 1 && t.toLowerCase() === key);
        if (idx !== -1) { contentStartIdx = idx + 1; break; }
      }
      content = contentStartIdx !== -1
        ? tokens.slice(contentStartIdx).join(' ')
        : tokens.slice(toIdx + 2).join(' ');
    }

    if (content) {
      return createResponse(
        'COMM_MESSAGE_DRAFT',
        isHindi ? `${contact} को संदेश तैयार किया गया।` : `Message to ${contact} drafted.`,
        { contact, content, type: 'message' }
      );
    }
  }

  // ── Communication – Call ─────────────────────────────────────────────────
  if (lowerText.match(/\b(call|phone|ring|karo|lagao|phone karo)\b/) && !lowerText.match(/\b(volume|control)\b/)) {
    const tokens = cleanText.split(' ');
    let contact = tokens.find(t => !['call', 'phone', 'ring', 'karo', 'lagao', 'ko', 'to', 'please', 'can', 'you'].includes(t.toLowerCase()));
    if (!contact) contact = 'Unknown';
    return createResponse(
      'COMM_CALL_START',
      isHindi ? `${contact} को कॉल कर रही हूँ।` : `Calling ${contact}.`,
      { contact, type: 'call' }
    );
  }

  // ── Smart Home – Lights ──────────────────────────────────────────────────
  if (lowerText.match(/\b(light|lights|batti|bulb|lamp)\b/)) {
    const isOn = lowerText.match(/\b(on|chalu|jalao|켜)\b/) !== null;
    const action = isOn
      ? (isHindi ? "लाइट्स चालू।" : "Lights turned on.")
      : (isHindi ? "लाइट्स बंद।" : "Lights turned off.");
    return createResponse('SMART_HOME_ACTION', action, { deviceType: 'light', state: isOn });
  }

  // ── Smart Home – Movie Night ─────────────────────────────────────────────
  if (lowerText.match(/\b(movie|cinema|film|movie night)\b/)) {
    return createResponse(
      'SMART_HOME_SCENE',
      isHindi ? "मूवी नाइट सीन सक्रिय किया गया।" : "Executing Movie Night protocol.",
      { scene: 'movie' }
    );
  }

  // ── Social – Jokes ───────────────────────────────────────────────────────
  if (lowerText.match(/\b(joke|mazak|chutkula|funny|hasao|hasa)\b/)) {
    const jokes = isHindi ? JOKES_HI : JOKES_EN;
    const joke = jokes[Math.floor(Math.random() * jokes.length)];
    return createResponse('SOCIAL', joke);
  }

  // ── Social – Facts ───────────────────────────────────────────────────────
  if (lowerText.match(/\b(fact|interesting|did you know|amazing|rochak|gyaan|gyan|bata)\b/)) {
    const facts = isHindi ? FACTS_HI : FACTS_EN;
    const fact = facts[Math.floor(Math.random() * facts.length)];
    return createResponse('SOCIAL', isHindi ? `रोचक तथ्य: ${fact}` : `Interesting fact: ${fact}`);
  }

  // ── Health / Biometrics ──────────────────────────────────────────────────
  if (lowerText.match(/\b(health|sehat|heart|dil|pulse|fitness|steps|calories|sleep)\b/)) {
    return createResponse('HEALTH_SHOW', isHindi ? "स्वास्थ्य डैशबोर्ड खोल रही हूँ।" : "Opening biometrics dashboard.");
  }

  // ── Mindfulness ──────────────────────────────────────────────────────────
  if (lowerText.match(/\b(breathe|breathing|meditate|meditation|dhyan|relax|calm|shant)\b/)) {
    return createResponse('MINDFULNESS_START', isHindi ? "साँस लेने का व्यायाम शुरू कर रही हूँ।" : "Initiating breathing sequence.");
  }

  // ── Sentry / Security Mode ───────────────────────────────────────────────
  if (lowerText.match(/\b(sentry|security|suraksha|guard|surveillance|watch)\b/)) {
    return createResponse('SENTRY_MODE', isHindi ? "निगरानी मोड सक्रिय।" : "Sentry Mode activated.");
  }

  // ── Weather ──────────────────────────────────────────────────────────────
  if (lowerText.match(/\b(weather|mausam|temperature|temp|baarish|rain|sunny|forecast)\b/)) {
    return createResponse('WEATHER_FETCH', isHindi ? "मौसम की जानकारी ला रही हूँ..." : "Fetching meteorological data...");
  }

  // ── News ─────────────────────────────────────────────────────────────────
  if (lowerText.match(/\b(news|samachar|headlines|khabar|khabren|latest)\b/)) {
    return createResponse('NEWS_FETCH', isHindi ? "समाचार फीड लोड हो रही है..." : "Accessing global news feeds...");
  }

  // ── Tasks ────────────────────────────────────────────────────────────────
  if (lowerText.match(/\b(task|todo|remind|kaam|yaad)\b/)) {
    if (lowerText.match(/\b(add|new|create|jodo|banao)\b/)) {
      const task = extractQuery(lowerText, ['add', 'new', 'create', 'task', 'todo', 'remind', 'jodo', 'banao', 'kaam']);
      return createResponse(
        'TASK_ADD',
        isHindi ? `कार्य जोड़ा गया: "${task}"` : `Task added: "${task}"`,
        { task }
      );
    }
    return createResponse('TASK_SHOW', isHindi ? "कार्य सूची दिख रही है।" : "Displaying task list.");
  }

  // ── Timer ────────────────────────────────────────────────────────────────
  if (lowerText.match(/\b(timer|countdown|alarm|minute|second|hour|ghanta|minute)\b/)) {
    const minMatch = lowerText.match(/(\d+)\s*(?:minute|min|मिनट)/i);
    const secMatch = lowerText.match(/(\d+)\s*(?:second|sec|सेकंड)/i);
    const hrMatch = lowerText.match(/(\d+)\s*(?:hour|hr|ghanta|घंटा)/i);
    const duration = (hrMatch ? parseInt(hrMatch[1]) * 3600 : 0)
      + (minMatch ? parseInt(minMatch[1]) * 60 : 0)
      + (secMatch ? parseInt(secMatch[1]) : 0);
    if (duration > 0) {
      const label = cleanText.replace(/set|timer|alarm|please|karo/gi, '').trim();
      return createResponse(
        'TIMER',
        isHindi ? `टाइमर सेट किया गया।` : `Timer set.`,
        { duration, label: label || 'Timer' }
      );
    }
  }

  // ── YouTube Search ───────────────────────────────────────────────────────
  if (lowerText.match(/\b(youtube|video|watch|dekho|dekhna)\b/)) {
    const query = extractQuery(cleanText, ['youtube', 'video', 'watch', 'dekho', 'dekhna', 'search', 'please', 'on', 'in', 'par']);
    return createResponse(
      'SEARCH_QUERY',
      isHindi ? `YouTube पर "${query}" खोज रही हूँ।` : `Searching YouTube for "${query}".`,
      null,
      `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
    );
  }

  // ── Math / Calculator ────────────────────────────────────────────────────
  const mathMatch = lowerText.match(/(\d+(?:\.\d+)?)\s*([\+\-\*\/])\s*(\d+(?:\.\d+)?)/);
  if (mathMatch) {
    try {
      // eslint-disable-next-line no-eval
      const res: number = eval(mathMatch[0]);
      const rounded = parseFloat(res.toFixed(4));
      return createResponse(
        'CALCULATION',
        isHindi ? `${mathMatch[0]} का उत्तर है ${rounded}` : `The result of ${mathMatch[0]} is ${rounded}`,
        { result: rounded, expression: mathMatch[0] }
      );
    } catch (e) { /* fallthrough */ }
  }

  // ── Help ─────────────────────────────────────────────────────────────────
  if (lowerText.match(/\b(help|madad|what can|kya kar|capabilities|features)\b/)) {
    const enHelp = "I can help you with: Media playback, Smart Home, Weather, News, Health, Tasks, Timers, Calculations, Communication, Jokes, and more. Just ask!";
    const hiHelp = "मैं इन चीजों में मदद कर सकती हूँ: संगीत, स्मार्ट होम, मौसम, समाचार, स्वास्थ्य, कार्य, टाइमर, गणना, संचार, मजाक और बहुत कुछ।";
    return createResponse('HELP', isHindi ? hiHelp : enHelp);
  }

  // ── AI Fallback ──────────────────────────────────────────────────────────
  const aiResponse = await AIService.getAIResponse(cleanText, detectedLang);
  if (aiResponse) {
    return createResponse('AI_RESPONSE', aiResponse);
  }

  // ── Web Search (final fallback) ──────────────────────────────────────────
  const query = extractQuery(cleanText, ['search', 'find', 'google', 'look up', 'dhundo', 'khojo', 'please']);
  return createResponse(
    'SEARCH_QUERY',
    isHindi ? `खोज रही हूँ: "${query}"` : `Searching the web for "${query}"`,
    null,
    `https://www.google.com/search?q=${encodeURIComponent(query || cleanText)}`
  );
};
