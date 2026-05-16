
import { SecurityService } from './securityService';
import { PersonalityMode } from '../types';
import { AIService } from './aiService';
import { emotionService } from './emotionService';

export interface ProcessedCommand {
  actionType: string;
  response: string;
  spokenResponse?: string;
  language: 'en' | 'hi';
  externalUrl?: string;
  data?: Record<string, unknown>;
  emotion?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// VOCABULARY DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

// Strong Hindi Indicators: Verbs and question words that rarely appear in English context
const HINDI_STRONG_WORDS = new Set([
  'karo', 'karna', 'kar', 'dekhna', 'dekho', 'dikhao', 'sunao', 'suno', 'sun',
  'batao', 'btao', 'bol', 'bolo', 'kholo', 'band', 'chalao', 'lagao', 'hatao', 'open', 'ओपन',
  'ruko', 'roko', 'jao', 'aao', 'bhejo', 'likho', 'padho', 'badlo', 'badhao',
  'kam', 'karein', 'karen', 'dijiye', 'lijiye', 'banao', 'jodo', 'dhundo', 'khojo',
  'kya', 'kyu', 'kyun', 'kab', 'kahan', 'kaise', 'kaun', 'kitna', 'kitne', 'kisne', 'kaunsa',
  'namaste', 'shukriya', 'dhanyavad', 'swagat', 'bajao', 'sunao', 'chala', 'mute', 'chup',
  'tez', 'dzyada', 'kam', 'bolo', 'bata', 'de', 'dikha', 'shubh', 'ratri', 'saweraheere', '',
  // From SOFIYA reference
  'shut down', 'shutdown', 'kholo', 'band', 'karo', 'chalao', 'bhejo', 'suno', 'sun',
  'raha', 'mujhe', 'tum', 'aap', 'btao', 'dekhna', 'ruko', 'badhao', 'aawaz', 'awaz',
  'par', 'ko', 'me', 'se', 'ka', 'ki', 'aur', 'kahan', 'kab', 'kyu', 'mausam', 'tapman',
  'garmi', 'sardi', 'hisab', 'jodo', 'ghatao', 'guna', 'bhag', 'chalu', 'chala', 'shuru',
  'bhej', 'bheja', 'send', 'call', 'phone', 'karo', 'lagao', 'suno', 'dekho', 'bolo',
  'batao', 'dikhao', 'kholo', 'band', 'khalo', 'chal', 'chalna', 'chalni', 'chalo',
  'jao', 'aao', 'lena', 'dena', 'lijiye', 'dijiye', 'le', 'de', 'lo', 'ke', 'ka',
  'ki', 'kaa', 'kee', 'ke', 'ky', 'kyu', 'kyun', 'kese', 'kaise', 'kaha', 'kahan',
  'kaun', 'kon', 'kitna', 'kitni', 'kitne', 'kaisa', 'kaisi', 'kaisey', 'aisa', 'aisi',
  'waisa', 'waisi', 'kya', 'yeh', 'woh', 'voh', 'ye', 'yo', 'wo', 'is', 'us', 'ab',
  'phir', 'fir', 'tab', 'tabhi', 'abhi', 'aj', 'aaj', 'kal', 'parso', 'paiso',
  'raat', 'din', 'subah', 'shaam', 'morning', 'evening', 'night', 'day', 'date',
  'time', 'samay', 'waqt', 'tarikh', 'mahina', 'mahine', 'saal', 'sal', 'varsha',
  'paisa', 'rupees', 'rupiya', 'lakh', 'crore', 'number', 'nambar',
  // Devanagari additions
  'समय', 'क्या', 'कौन', 'कहाँ', 'कैसे', 'कब', 'क्यों', 'मैं', 'आप', 'तुम', 'मुझे', 'तुम्हें', 'उन्हें',
  'है', 'हैं', 'था', 'थी', 'थे', 'होगा', 'होगी', 'होंगे', 'चाहिए', 'चाहती', 'चाहते',
  'करो', 'करोगा', 'करें', 'किया', 'की', 'करके', 'हो', 'होगा', 'होना',
  'देखो', 'सुनो', 'बोलो', 'खोलो', 'बंद करो', 'चालू करो', 'बढ़ाओ', 'घटाओ',
  'नीचे', 'ऊपर', 'बाएं', 'दाएं', 'छोटा', 'बड़ा', 'नया', 'पुराना',
  'लो', 'लेना', 'दो', 'देना', 'लो', 'जाओ', 'आओ', 'रुको', 'चलो'
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
  'khush', 'dukh', 'bata', 'chhod', 'chalo', 'taiyar', 'kaam', 'sona', 'uthna', 'shubh', 'subah',
  // From SOFIYA reference
  'samay', 'tareekh', 'din', 'aaj', 'kal', 'suno', 'sun', 'raha', 'mujhe', 'tum', 'aap',
  'namaste', 'shukriya', 'dhanyavad', 'kaise', 'madad', 'sakte', 'btao', 'dekhna',
  'dheere', 'tez', 'badhao', 'kam', 'aawaz', 'awaz', 'mausam', 'tapman', 'garmi', 'sardi',
  'hisab', 'jodo', 'ghatao', 'guna', 'bhag', 'chalu', 'chala', 'shuru', 'bhej', 'bheja',
  'phone', 'send', 'call', 'khalo', 'chal', 'chalna', 'chalni', 'le', 'ky', 'kese',
  'kaha', 'kon', 'kitni', 'kaisa', 'kaisi', 'aisa', 'aisi', 'waisa', 'waisi', 'yo', 'wo',
  'is', 'us', 'ab', 'phir', 'fir', 'tab', 'tabhi', 'aj', 'paiso', 'raat', 'subah',
  'shaam', 'morning', 'evening', 'night', 'day', 'date', 'time', 'waqt', 'mahina',
  'mahine', 'saal', 'sal', 'varsha', 'paisa', 'rupees', 'rupiya', 'lakh', 'crore', 'number', 'nambar',
  // Devanagari
  'नमस्ते', 'शुक्रिया', 'धन्यवाद', 'अच्छा', 'बुरा', 'जल्दी', 'अभी', 'बाद', 'आज', 'कल',
  'थोड़ा', 'बस', 'बिल्कुल', 'हाँ', 'नहीं', 'ठीक', 'सही', 'गलत', 'कुछ', 'सब', 'बहुत',
  'खुश', 'दुख', 'बताओ', 'छोड़', 'चलो', 'तैयार', 'काम', 'सोना', 'उठना', 'शुभ', 'सुबह',
  'शाम', 'रात', 'दिन', 'तारीख', 'महीना', 'साल', 'पैसा', 'रुपये', 'लाख', 'करोड़'
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
  const emotionAnalysis = emotionService.analyzeEmotion(cleanText);

  // Auto-adjust personality if in DEFAULT mode based on emotion
  let activePersonality = personality;
  if (personality === PersonalityMode.DEFAULT) {
    const recommended = emotionService.getRecommendedPersonality(emotionAnalysis);
    if (recommended === 'SASS') activePersonality = PersonalityMode.SASS;
    if (recommended === 'FOCUS') activePersonality = PersonalityMode.FOCUS;
  }

  const createResponse = (
    type: string,
    baseResp: string,
    data?: Record<string, unknown>,
    externalUrl?: string
  ): ProcessedCommand => ({
    actionType: type,
    response: baseResp,
    spokenResponse: personalizeResponse(baseResp, activePersonality, detectedLang, type),
    language: detectedLang,
    data,
    externalUrl,
    emotion: emotionAnalysis.emotion
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

  // ── Volume Control (Percentage) ──────────────────────────────────────────
  if (lowerText.match(/\b(volume|sound|awaaz|awaz|आवाज़)\s+(to|set|at|पर|सेट)\s+(\d+)\b/)) {
    const match = lowerText.match(/\b(\d+)\b/);
    if (match) {
      const vol = parseInt(match[0]);
      return createResponse('VOLUME_SET', isHindi ? `आवाज़ ${vol} प्रतिशत पर सेट कर रही हूँ।` : `Setting volume to ${vol} percent.`, { volume: vol });
    }
  }

  // ── Theme & Mode Control ──────────────────────────────────────────────────
  if (lowerText.match(/(?:^|\s)(switch to|set theme|theme badlo|mode badlo|बदलो|थीम|मोड)(?:\s|$)/)) {
    if (lowerText.match(/(?:^|\s)(sofiya|default|standard|सोफिया)(?:\s|$)/)) {
      return createResponse('THEME_CHANGE', isHindi ? "सोफिया थीम सक्रिय।" : "Switching to Sofiya mode.", { theme: 'sofiya' });
    }
    if (lowerText.match(/(?:^|\s)(classic|cyber|cyan|क्लासिक)(?:\s|$)/)) {
      return createResponse('THEME_CHANGE', isHindi ? "क्लासिक थीम सक्रिय।" : "Switching to Classic mode.", { theme: 'classic' });
    }
    if (lowerText.match(/(?:^|\s)(focus|red|minimal|वर्क|फोकस)(?:\s|$)/)) {
      return createResponse('THEME_CHANGE', isHindi ? "फोकस थीम सक्रिय।" : "Switching to Focus mode.", { theme: 'focus' });
    }
    if (lowerText.match(/(?:^|\s)(zen|emerald|green|calm|ज़ेन)(?:\s|$)/)) {
      return createResponse('THEME_CHANGE', isHindi ? "ज़ेन थीम सक्रिय।" : "Switching to Zen mode.", { theme: 'zen' });
    }
  }

  // ── Multi-stage Routines ─────────────────────────────────────────────────
  if (lowerText.match(/(?:^|\s)(good morning|suprabhat|subah ho gayi|shuru karo|गुड मॉर्निंग|सुप्रभात)(?:\s|$)/)) {
    return createResponse('ROUTINE_MORNING', isHindi ? "सुप्रभात! आपका दिन शुरू करने के लिए तैयार हूँ।" : "Good morning! Initializing your daily briefing.");
  }
  if (lowerText.match(/(?:^|\s)(work mode|focus mode|start working|kam shuru|काम शुरू|फोकस मोड)(?:\s|$)/)) {
    return createResponse('ROUTINE_WORK', isHindi ? "वर्क मोड सक्रिय। ध्यान केंद्रित करने का समय है।" : "Work mode activated. Let's get things done.");
  }

  if (lowerText.match(/(?:^|\s)(good night|shubh ratri|so raha hoon|bedtime|goodnight|रात को शुभ|शुभ रात्रि|सो जाओ)(?:\s|$)/)) {
    return createResponse(
      'ROUTINE_NIGHT',
      isHindi
        ? "शुभ रात्रि। मैं लाइट्स बंद कर रही हूँ और फोकस मोड सक्रिय कर रही हूँ। आराम कीजिये।"
        : "Good night. Turning off lights, stopping media, and engaging focus mode. Sleep well.",
      { scene: 'sleep' }
    );
  }

  // ── Greetings ───────────────────────────────────────────────────────────
  if (
    lowerText.match(/(?:^|\s)(status|report|system|online|alive|how are you|kaisi ho|kaisi hain|hello|hi|hey|namaste|नमस्ते|namaste|hola|ola)(?:\s|$)/) ||
    lowerText.match(/^sofiy/i) ||
    lowerText.match(/(?:^|\s)(who are you|तुम कोन हो|who is sofiya)(?:\s|$)/)
  ) {
    const now = new Date();
    const hour = now.getHours();
    const greeting = hour < 12 ? (isHindi ? 'सुप्रभात' : 'Good Morning') : hour < 17 ? (isHindi ? 'नमस्ते' : 'Good Afternoon') : (isHindi ? 'शुभ संध्या' : 'Good Evening');
    const enResp = `${greeting}! All systems nominal. I'm fully operational and ready to assist. Version 4.3 active.`;
    const hiResp = `${greeting}! सभी सिस्टम ठीक हैं। मैं पूरी तरह से तैयार हूँ। वर्शन 4.3 सक्रिय है।`;
    return createResponse('SYSTEM_STATUS', isHindi ? hiResp : enResp);
  }

  // ── Time & Date ──────────────────────────────────────────────────────────
  if (
    lowerText.match(/(?:^|\s)(time|clock|samay|waqt|baje|समय|कितने बजे|क्या समय)(?:\s|$)/) ||
    lowerText.match(/(?:^|\s)(date|tarikh|din|today|aaj|तारीख|आज|कौन सा दिन)(?:\s|$)/)
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

  // ── Battery & Power Status ────────────────────────────────────────────────
  if (lowerText.match(/(?:^|\s)(battery|charge|power|बैटरी|चार्ज|बिजली|ऊर्जा)(?:\s|$)/)) {
    return createResponse('BATTERY_STATUS', isHindi ? "बैटरी स्थिति देख रही हूँ..." : "Checking battery status...");
  }

  // ── System Status ───────────────────────────────────────────────────────────
  if (lowerText.match(/\b(system status|pc status|computer status|system check)\b/i) || lowerText.match(/(?:^|\s)(सिस्टम स्टेटस|पीसी स्टेटस|कंप्यूटर स्थिति|सिस्टम चेक)(?:\s|$)/i)) {
    return createResponse('SYSTEM_STATUS_FULL', isHindi ? "सिस्टम जानकारी ला रही हूँ..." : "Gathering system information...");
  }

  // ── Power Controls (Require Confirmation) ────────────────────────────────
  if (lowerText.match(/(?:^|\s)(shutdown|power off|turn off|band karo|computer band|pc band|system band|शटडाउन|बंद करो|पीसी बंद|कंप्यूटर बंद)(?:\s|$)/i)) {
    return createResponse('SHUTDOWN_CONFIRM', isHindi ? "क्या आप वाकई कंप्यूटर बंद करना चाहते हैं?" : "Are you sure you want to shutdown the computer?");
  }
  if (lowerText.match(/(?:^|\s)(restart|reboot|dobara shuru|fir se chalu|रीस्टार्ट|दोबारा शुरू|रीबूट)(?:\s|$)/i)) {
    return createResponse('RESTART_CONFIRM', isHindi ? "क्या आप वाकई कंप्यूटर रीस्टार्ट करना चाहते हैं?" : "Are you sure you want to restart the computer?");
  }
  if (lowerText.match(/(?:^|\s)(sleep|suspend|sone do|स्लीप|सोने दो)(?:\s|$)/i)) {
    return createResponse('SLEEP_CONFIRM', isHindi ? "क्या आप सिस्टम स्लीप मोड में डालना चाहते हैं?" : "Do you want to put the system to sleep?");
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
  if (lowerText.match(/\b(play|music|song|gaana|bajao|suno|sunao)\b/) || lowerText.match(/(?:^|\s)(गाना|बजाओ|सुनाओ)(?:\s|$)/)) {
    if (!lowerText.match(/\b(stop|pause|roko|band)\b/)) {
      const song = extractQuery(cleanText, ['play', 'music', 'song', 'gaana', 'bajao', 'please', 'can you', 'suno', 'sunao']);
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

  if (lowerText.match(/(?:^|\s)(resume|wapas chalao|phir se chala|dobara|फिर से|फिर|वापस)(?:\s|$)/)) {
    return createResponse('MEDIA_RESUME', isHindi ? "फिर से शुरू कर रही हूँ।" : "Resuming playback.");
  }

  // ── Media Next/Previous ──────────────────────────────────────────────────
  if (lowerText.match(/(?:^|\s)(next|agla|agle|skip|forward|आगे|अगला|next track|next song)(?:\s|$)/i)) {
    return createResponse('MEDIA_NEXT', isHindi ? "अगला गाना बजा रही हूँ।" : "Playing next track.");
  }
  if (lowerText.match(/(?:^|\s)(previous|prev|pichla|pichle|back|pehle|पिछला|पीछे|previous track|previous song)(?:\s|$)/i)) {
    return createResponse('MEDIA_PREV', isHindi ? "पिछला गाना बजा रही हूँ।" : "Playing previous track.");
  }

  if (lowerText.match(/(?:^|\s)(stop|band karo|ab bas|roko|रोको|बंद करो|बस)(?:\s|$)/i)) {
    if (lowerText.match(/(?:^|\s)(media|playback|music|song|gaana|sangeet|म्यूजिक|गाना)(?:\s|$)/i)) {
      return createResponse('MEDIA_STOP', isHindi ? "मीडिया प्लेबैक रोक दिया गया है।" : "Media playback stopped.");
    }
    return createResponse('STOP', isHindi ? "ठीक है।" : "Okay, stopping.");
  }

  // ── Go Back / Exit ────────────────────────────────────────────────────────
  if (lowerText.match(/(?:^|\s)(go back|back|exit|quit|close|bahir|बाहर|निकलो|वापस)(?:\s|$)/i)) {
    return createResponse('GO_BACK', isHindi ? "वापस जा रही हूँ।" : "Going back.");
  }

  // ── Repeat / Again ────────────────────────────────────────────────────────
  if (lowerText.match(/(?:^|\s)(repeat|again|dobara|फिर|पुनः|ek aur|ek baar)(?:\s|$)/i)) {
    return createResponse('REPEAT', isHindi ? "फिर से दोहरा रही हूँ।" : "Repeating.");
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

  // ── Window Management ────────────────────────────────────────────────────────
  if (lowerText.match(/(?:^|\s)(minimize|chhota|niche|छोटा|मिनिमाइज|नीचे)(?:\s|$)/i)) {
    return createResponse('WINDOW_MINIMIZE', isHindi ? "विंडो छोटी कर रही हूँ।" : "Minimizing window.");
  }
  if (lowerText.match(/(?:^|\s)(maximize|bada|pura|बड़ा|मैक्सिमाइज|पूरी)(?:\s|$)/i)) {
    return createResponse('WINDOW_MAXIMIZE', isHindi ? "विंडो बड़ी कर रही हूँ।" : "Maximizing window.");
  }
  if (lowerText.match(/(?:^|\s)(close window|window band|window close|विंडो बंद|खिड़की बंद)(?:\s|$)/i)) {
    return createResponse('WINDOW_CLOSE', isHindi ? "विंडो बंद कर रही हूँ।" : "Closing window.");
  }
  if (lowerText.match(/(?:^|\s)(show desktop|desktop|sab band|सब बंद|डेस्कटॉप)(?:\s|$)/i)) {
    return createResponse('SHOW_DESKTOP', isHindi ? "डेस्कटॉप दिखा रही हूँ।" : "Showing desktop.");
  }
  if (lowerText.match(/(?:^|\s)(snap left|left side|bayan|बाईं|बायें|left)(?:\s|$)/i)) {
    return createResponse('SNAP_LEFT', isHindi ? "विंडो बाईं तरफ कर रही हूँ।" : "Snapping window to left.");
  }
  if (lowerText.match(/(?:^|\s)(snap right|right side|dayan|दाईं|दायें|right)(?:\s|$)/i)) {
    return createResponse('SNAP_RIGHT', isHindi ? "विंडो दाईं तरफ कर रही हूँ।" : "Snapping window to right.");
  }

  // ── Mouse/Input Controls ───────────────────────────────────────────────────
  if (lowerText.match(/(?:^|\s)(click|press|select|choose|क्लिक|दबाओ|चुनो)(?:\s|$)/i)) {
    return createResponse('MOUSE_CLICK', isHindi ? "क्लिक कर रही हूँ।" : "Clicking.");
  }
  if (lowerText.match(/(?:^|\s)(double click|do bar click|double press|डबल क्लिक|दो बार)(?:\s|$)/i)) {
    return createResponse('MOUSE_DOUBLE_CLICK', isHindi ? "डबल क्लिक कर रही हूँ।" : "Double clicking.");
  }
  if (lowerText.match(/(?:^|\s)(right click|context menu|options|राइट क्लिक|ऑप्शंस)(?:\s|$)/i)) {
    return createResponse('MOUSE_RIGHT_CLICK', isHindi ? "राइट क्लिक कर रही हूँ।" : "Right clicking.");
  }
  if (lowerText.match(/(?:^|\s)(scroll up|upar scroll|up scroll|ऊपर|ऊपर स्क्रॉल)(?:\s|$)/i)) {
    return createResponse('SCROLL_UP', isHindi ? "ऊपर स्क्रॉल कर रही हूँ।" : "Scrolling up.");
  }
  if (lowerText.match(/(?:^|\s)(scroll down|neeche scroll|down scroll|नीचे|नीचे स्क्रॉल)(?:\s|$)/i)) {
    return createResponse('SCROLL_DOWN', isHindi ? "नीचे स्क्रॉल कर रही हूँ।" : "Scrolling down.");
  }

  // ── Clipboard ───────────────────────────────────────────────────────────────
  if (lowerText.match(/(?:^|\s)(get clipboard|clipboard|clipboard dekho|क्लिपबोर्ड)(?:\s|$)/i)) {
    return createResponse('GET_CLIPBOARD', isHindi ? "क्लिपबोर्ड की सामग्री दिखा रही हूँ।" : "Getting clipboard content.");
  }
  if (lowerText.match(/(?:^|\s)(set clipboard|copy|कॉपी|क्लिपबोर्ड में)(?:\s|$)/i)) {
    return createResponse('SET_CLIPBOARD', isHindi ? "क्लिपबोर्ड में कॉपी किया।" : "Copied to clipboard.");
  }

  // ── File Operations ───────────────────────────────────────────────────────
  if (lowerText.match(/(?:^|\s)(search file|find file|file dhoondo|dhundho|फ़ाइल ढूंढो|फाइल खोजो)(?:\s|$)/i)) {
    const query = extractQuery(cleanText, ['search', 'file', 'find', 'dhoondo', 'dhundho', 'फ़ाइल', 'फाइल', 'खोजो', 'ढूंढो']);
    return createResponse('FILE_SEARCH', isHindi ? `${query} खोज रही हूँ।` : `Searching for ${query}.`, { query });
  }
  if (lowerText.match(/(?:^|\s)(create folder|new folder|naya folder|folder banao|नया फोल्डर|फोल्डर बनाओ)(?:\s|$)/i)) {
    const query = extractQuery(cleanText, ['create', 'folder', 'new', 'naya', 'banao', 'बनाओ', 'नया', 'फोल्डर']);
    return createResponse('FOLDER_CREATE', isHindi ? `${query} फोल्डर बना रही हूँ।` : `Creating folder ${query}.`, { name: query });
  }
  if (lowerText.match(/(?:^|\s)(delete file|file hatao|remove file|हटाओ|डिलीट|फाइल हटाओ)(?:\s|$)/i)) {
    return createResponse('FILE_DELETE_CONFIRM', isHindi ? "क्या आप इस फाइल को हटाना चाहते हैं?" : "Do you want to delete this file?");
  }
  if (lowerText.match(/(?:^|\s)(copy file|file copy|कॉपी|फाइल कॉपी)(?:\s|$)/i)) {
    return createResponse('FILE_COPY', isHindi ? "फाइल कॉपी कर रही हूँ।" : "Copying file.");
  }
  if (lowerText.match(/(?:^|\s)(move file|file move|स्थानांतरित|फाइल मूव)(?:\s|$)/i)) {
    return createResponse('FILE_MOVE', isHindi ? "फाइल मूव कर रही हूँ।" : "Moving file.");
  }
  if (lowerText.match(/(?:^|\s)(rename file|naam badlo|नाम बदलो)(?:\s|$)/i)) {
    return createResponse('FILE_RENAME', isHindi ? "फाइल का नाम बदल रही हूँ।" : "Renaming file.");
  }

  // ── OCR & Text Extraction ─────────────────────────────────────────────────
  if (lowerText.match(/(?:^|\s)(extract text|image se text|ocr image|text nikalo|इमेज से टेक्स्ट|फोटो से टेक्स्ट)(?:\s|$)/i)) {
    return createResponse('OCR_IMAGE', isHindi ? "इमेज से टेक्स्ट निकाल रही हूँ।" : "Extracting text from image.");
  }
  if (lowerText.match(/(?:^|\s)(extract text from pdf|pdf se text|pdf padho|पीडीएफ से टेक्स्ट|पीडीएफ पढ़ो)(?:\s|$)/i)) {
    return createResponse('OCR_PDF', isHindi ? "पीडीएफ से टेक्स्ट निकाल रही हूँ।" : "Extracting text from PDF.");
  }

  // ── Image Processing ──────────────────────────────────────────────────────
  if (lowerText.match(/(?:^|\s)(convert image|image convert|format change|इमेज कन्वर्ट|फॉर्मेट बदलो)(?:\s|$)/i)) {
    return createResponse('IMAGE_CONVERT', isHindi ? "इमेज कन्वर्ट कर रही हूँ।" : "Converting image.");
  }
  if (lowerText.match(/(?:^|\s)(resize image|image resize|size badlo|इमेज रिसाइज|साइज बदलो)(?:\s|$)/i)) {
    return createResponse('IMAGE_RESIZE', isHindi ? "इमेज का साइज बदल रही हूँ।" : "Resizing image.");
  }
  if (lowerText.match(/(?:^|\s)(compress image|image compress|size kam|इमेज कम्प्रेस|साइज कम)(?:\s|$)/i)) {
    return createResponse('IMAGE_COMPRESS', isHindi ? "इमेज कम्प्रेस कर रही हूँ।" : "Compressing image.");
  }

  // ── PDF Tools ───────────────────────────────────────────────────────────────
  if (lowerText.match(/(?:^|\s)(merge pdfs|pdfs jodo|combine pdf|पीडीएफ मिलाओ|पीडीएफ जोड़ो)(?:\s|$)/i)) {
    return createResponse('PDF_MERGE', isHindi ? "पीडीएफ मिला रही हूँ।" : "Merging PDFs.");
  }
  if (lowerText.match(/(?:^|\s)(pdf to images|pdf ko images|पीडीएफ को इमेज)(?:\s|$)/i)) {
    return createResponse('PDF_TO_IMAGES', isHindi ? "पीडीएफ को इमेज में बदल रही हूँ।" : "Converting PDF to images.");
  }
  if (lowerText.match(/(?:^|\s)(images to pdf|images ko pdf|इमेज को पीडीएफ)(?:\s|$)/i)) {
    return createResponse('IMAGES_TO_PDF', isHindi ? "इमेज को पीडीएफ में बदल रही हूँ।" : "Converting images to PDF.");
  }
  if (lowerText.match(/(?:^|\s)(batch pdf|folder pdf|सारे पीडीएफ|फोल्डर पीडीएफ)(?:\s|$)/i)) {
    return createResponse('BATCH_PDF', isHindi ? "फोल्डर की सभी इमेजेज को पीडीएफ में बदल रही हूँ।" : "Converting all images in the folder to PDF.");
  }
  if (lowerText.match(/(?:^|\s)(scan folder|folder scan|फोल्डर स्कैन)(?:\s|$)/i)) {
    return createResponse('SCAN_FOLDER', isHindi ? "फोल्डर स्कैन कर रही हूँ।" : "Scanning folder for files.");
  }
  if (lowerText.match(/(?:^|\s)(make drawing|drawing banao|sketch banao|ड्राइंग बनाओ|पेंट)(?:\s|$)/i)) {
    return createResponse('MAKE_DRAWING', isHindi ? "पेंट खोल रही हूँ।" : "Opening Paint for drawing.");
  }
  if (lowerText.match(/(?:^|\s)(get selected text|select kiya hua text|चुना हुआ टेक्स्ट)(?:\s|$)/i)) {
    return createResponse('GET_SELECTED_TEXT', isHindi ? "चुना हुआ टेक्स्ट पढ़ रही हूँ।" : "Retrieving selected text.");
  }
  if (lowerText.match(/(?:^|\s)(read pdf|pdf padho|पीडीएफ पढ़ो)(?:\s|$)/i)) {
    return createResponse('READ_PDF', isHindi ? "पीडीएफ फाइल पढ़ रही हूँ।" : "Reading the PDF file.");
  }
  if (lowerText.match(/(?:^|\s)(narrate screen|screen padho|dekho kya hai|स्क्रीन पढ़ो|स्क्रीन पर क्या है)(?:\s|$)/i)) {
    return createResponse('NARRATE_SCREEN', isHindi ? "स्क्रीन पर जो है वो पढ़ कर सुनाती हूँ।" : "Narrating what's on the screen.");
  }
  if (lowerText.match(/(?:^|\s)(screen summary|summary of screen|स्क्रीन सारांश)(?:\s|$)/i)) {
    return createResponse('SCREEN_SUMMARY', isHindi ? "स्क्रीन का सारांश निकाल रही हूँ।" : "Getting a summary of the screen.");
  }

  // ── Calendar & Schedule ────────────────────────────────────────────────────
  if (lowerText.match(/\b(calendar|schedule|appointment|meeting|event|kalendar|taareekh)\b/i)) {
    if (lowerText.match(/(?:^|\s)(add|create|new|schedule|banao|जोड़ो)(?:\s|$)/i)) {
      const eventTitle = extractQuery(cleanText, ['add', 'create', 'new', 'schedule', 'calendar', 'event', 'appointment', 'meeting', 'banao', 'जोड़ो']);
      return createResponse('CALENDAR_ADD', isHindi ? "इवेंट जोड़ रही हूँ।" : "Adding event to calendar.", {
        event: {
          title: eventTitle || (isHindi ? 'नया इवेंट' : 'New Event'),
          start_time: new Date(Date.now() + 3600000).toISOString(), // Default: 1 hour from now
          end_time: new Date(Date.now() + 7200000).toISOString()
        }
      });
    }
    return createResponse('CALENDAR_SHOW', isHindi ? "कैलेंडर दिखा रही हूँ।" : "Showing calendar.");
  }

  // ── Household Knowledge ────────────────────────────────────────────────────
  if (lowerText.match(/(?:^|\s)(household|inventory|where is|location|saman|kahan|kahan hai|सामान|कहाँ है)(?:\s|$)/i)) {
    if (lowerText.match(/(?:^|\s)(add|create|new|save|remember|banao|yaad|rakho|रखो|याद)(?:\s|$)/i)) {
      const item = extractQuery(cleanText, ['add', 'create', 'new', 'save', 'remember', 'household', 'item', 'saman', 'yaad', 'rakho', 'रखो', 'याद']);
      return createResponse('HOUSEHOLD_ITEM_ADD', isHindi ? "घरेलू सामान जोड़ा गया।" : "Household item saved.", { item });
    }
    return createResponse('HOUSEHOLD_SHOW', isHindi ? "घरेलू इंटेलिजेंस लोड हो रही है।" : "Loading household intelligence.");
  }

  // ── Gifts & Social ─────────────────────────────────────────────────────────
  if (lowerText.match(/(?:^|\s)(gift|surprise|stealth|upahar|gift idea|उपहार)(?:\s|$)/i)) {
    if (lowerText.match(/(?:^|\s)(add|create|new|save|banao|joḍo|daal|daalo|डालो|जोड़ो)(?:\s|$)/i)) {
      const gift = extractQuery(cleanText, ['add', 'create', 'new', 'save', 'gift', 'idea', 'upahar', 'daal', 'daalo', 'डालो', 'जोड़ो']);
      return createResponse('GIFT_IDEAS_ADD', isHindi ? "उपहार आइडिया जोड़ा गया।" : "Gift idea added.", { gift });
    }
    return createResponse('GIFTS_SHOW', isHindi ? "उपहार प्रोटोकॉल सक्रिय।" : "Stealth gift protocol active.");
  }

  // ── Notes & Reminders ─────────────────────────────────────────────────────
  if (lowerText.match(/(?:^|\s)(note|notes|note ban|नोट|नोट्स|नोट बनाओ)(?:\s|$)/i)) {
    return createResponse('NOTES_SHOW', isHindi ? "नोट्स दिखा रही हूँ।" : "Showing notes.");
  }
  if (lowerText.match(/\b(remind|reminder|yaad|remember|yaad dilao|remind me)\b/i)) {
    if (lowerText.match(/(?:^|\s)(add|create|set|new|banao|जोड़ो)(?:\s|$)/i)) {
      return createResponse('REMINDER_ADD', isHindi ? "रिमाइंडर सेट कर रही हूँ।" : "Setting reminder.");
    }
    return createResponse('REMINDER_SHOW', isHindi ? "रिमाइंडर दिखा रही हूँ।" : "Showing reminders.");
  }

  // ── Smart Home Extended ───────────────────────────────────────────────────
  if (lowerText.match(/(?:^|\s)(fan|पंखा|pankha)(?:\s|$)/i)) {
    const isOn = lowerText.match(/\b(on|chalu|jalao)\b/) !== null;
    return createResponse('SMART_HOME_ACTION', isHindi ? (isOn ? "पंखा चालू।" : "पंखा बंद।") : (isOn ? "Fan turned on." : "Fan turned off."), { deviceType: 'fan', state: isOn });
  }
  if (lowerText.match(/(?:^|\s)(ac|air conditioner|air condition|एसी|एयर कंडीशनर)(?:\s|$)/i)) {
    const isOn = lowerText.match(/\b(on|chalu|jalao)\b/) !== null;
    return createResponse('SMART_HOME_ACTION', isHindi ? (isOn ? "एसी चालू।" : "एसी बंद।") : (isOn ? "AC turned on." : "AC turned off."), { deviceType: 'ac', state: isOn });
  }
  if (lowerText.match(/(?:^|\s)(thermostat|temperature|tapman|तापमान)(?:\s|$)/i)) {
    const tempMatch = lowerText.match(/(\d+)\s*(degree|°)?/);
    const temp = tempMatch ? parseInt(tempMatch[1]) : 24;
    return createResponse('SMART_HOME_ACTION', isHindi ? `तापमान ${temp} डिग्री सेट कर रही हूँ।` : `Setting temperature to ${temp} degrees.`, { deviceType: 'thermostat', state: temp });
  }
  if (lowerText.match(/(?:^|\s)(lock|unlock|ताला|लॉक|unlock)(?:\s|$)/i)) {
    const isLock = lowerText.match(/(?:^|\s)(lock|ताला|लॉक)(?:\s|$)/) !== null;
    return createResponse('SMART_HOME_ACTION', isHindi ? (isLock ? "ताला लगा दिया।" : "ताला खोल दिया।") : (isLock ? "Door locked." : "Door unlocked."), { deviceType: 'lock', state: isLock });
  }

  // ── Calculator Extended ────────────────────────────────────────────────────
  if (lowerText.match(/(?:^|\s)(calculate|calculate|hisab|गणना|गुणा|भाग|घटाओ|बढ़ाओ)(?:\s|$)/i)) {
    const expression = lowerText
      .replace(/calculate|hisab|compute|गणना|गुणा|गुना|भाग|जोड़|घटाओ|बढ़ाओ/gi, '')
      .trim();
    if (expression) {
      const mathMatch = expression.match(/(\d+(?:\.\d+)?)\s*([-+*/])\s*(\d+(?:\.\d+)?)/);
      if (mathMatch) {
        try {
          const res: number = eval(mathMatch[0]);
          const rounded = parseFloat(res.toFixed(4));
          return createResponse(
            'CALCULATION',
            isHindi ? `${mathMatch[0]} का उत्तर है ${rounded}` : `The result of ${mathMatch[0]} is ${rounded}`,
            { result: rounded, expression: mathMatch[0] }
          );
        } catch (e) { /* fallthrough */ }
      }
    }
    return createResponse('CALCULATOR_OPEN', isHindi ? "कैलकुलेटर खोल रही हूँ।" : "Opening calculator.");
  }

  // ── Currency & Unit Conversion ────────────────────────────────────────────
  if (lowerText.match(/(?:^|\s)(convert|currency|exchange|तबदला|विनिमय)(?:\s|$)/i)) {
    if (lowerText.match(/(?:^|\s)(dollar|usd|डॉलर)(?:\s|$)/i) && lowerText.match(/(?:^|\s)(rupee|inr|रुपया)(?:\s|$)/i)) {
      return createResponse('CONVERSION', isHindi ? "विनिमय दर देख रही हूँ..." : "Checking exchange rate...");
    }
    if (lowerText.match(/(?:^|\s)(kilometer|km|किलोमीटर)(?:\s|$)/i) && lowerText.match(/(?:^|\s)(mile|मील)(?:\s|$)/i)) {
      return createResponse('CONVERSION', isHindi ? "किलोमीटर को मील में बदल रही हूँ।" : "Converting kilometers to miles.");
    }
    if (lowerText.match(/(?:^|\s)(celsius|centigrade|सेल्सियस)(?:\s|$)/i) && lowerText.match(/(?:^|\s)(fahrenheit|फारेनहाइट)(?:\s|$)/i)) {
      return createResponse('CONVERSION', isHindi ? "सेल्सियस को फारेनहाइट में बदल रही हूँ।" : "Converting Celsius to Fahrenheit.");
    }
    return createResponse('CONVERSION', isHindi ? "कनवर्ज़न सुविधा खोल रही हूँ।" : "Opening conversion tool.");
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

  // ── Security & Surveillance ──────────────────────────────────────────────
  if (lowerText.match(/(?:^|\s)(sentry mode|security mode|surveillance|activate shields|security protocols|सुरक्षा मोड|संत्री मोड|शील्ड सक्रिय करो)(?:\s|$)/)) {
    return createResponse(
      'SENTRY_MODE',
      isHindi ? "संत्री मोड सक्रिय। सुरक्षा प्रोटोकॉल लोड हो रहे हैं।" : "Sentry mode active. Initializing security protocols."
    );
  }

  // ── Mindfulness ────────────────────────────────────────────────────────────
  if (lowerText.match(/\b(breathe|breathing|meditate|meditation|dhyan|relax|calm|shant)\b/)) {
    return createResponse('MINDFULNESS_START', isHindi ? "साँस लेने का व्यायाम शुरू कर रही हूँ।" : "Initiating breathing sequence.");
  }

  // Web & Search is handled below

  // ── Web & Search ───────────────────────────────────────────────────────
  if (lowerText.match(/(?:^|\s)(search|find|look up|dhundo|खोजो|ढूंढो|khojo|pata|what is|define)(?:\s|$)/)) {
    const query = extractQuery(cleanText, ['search', 'find', 'look', 'up', 'what', 'is', 'the', 'definition', 'of', 'dhundo', 'खोजो', 'ढूंढो', 'khojo', 'pata', 'lagado', 'please']);

    if (query.length >= 2) {
      return createResponse(
        'SEARCH_QUERY',
        isHindi ? `${query} के बारे में खोज रही हूँ।` : `Searching for "${query}".`,
        undefined,
        `https://www.google.com/search?q=${encodeURIComponent(query)}`
      );
    }
  }

  // ── Wikipedia ────────────────────────────────────────────────────────────
  if (lowerText.match(/(?:^|\s)(wikipedia|विकिपीडिया|wiki)(?:\s|$)/)) {
    const query = extractQuery(cleanText, ['wikipedia', 'विकिपीडिया', 'wiki', 'about', 'on']);
    if (query.length >= 2) {
      return createResponse(
        'WIKIPEDIA_FETCH',
        isHindi ? `${query} के बारे में जानकारी खोज रही हूँ।` : `Looking up "${query}" on Wikipedia.`,
        undefined,
        `https://en.wikipedia.org/wiki/${encodeURIComponent(query.replace(/ /g, '_'))}`
      );
    }
  }

  // ── Weather ──────────────────────────────────────────────────────────────
  if (lowerText.match(/(?:^|\s)(weather|mausam|temperature|temp|baarish|rain|sunny|forecast|मौसम|तापमान|बारिश|धूप)(?:\s|$)/)) {
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

  // ── App & Web Navigation ──────────────────────────────────────────────────
  // JARVIS-style Hindi app name → command mapping
  const HINDI_APP_MAP: Record<string, { action: string; url?: string; label: string; labelHi: string }> = {
    'notepad': { action: 'OPEN_APP', label: 'Notepad', labelHi: 'नोटपैड' },
    'नोटपैड': { action: 'OPEN_APP', label: 'Notepad', labelHi: 'नोटपैड' },
    'calculator': { action: 'OPEN_APP', label: 'Calculator', labelHi: 'कैलकुलेटर' },
    'कैलकुलेटर': { action: 'OPEN_APP', label: 'Calculator', labelHi: 'कैलकुलेटर' },
    'vlc': { action: 'OPEN_APP', label: 'VLC', labelHi: 'वीएलसी' },
    'वीएलसी': { action: 'OPEN_APP', label: 'VLC', labelHi: 'वीएलसी' },
    'paint': { action: 'OPEN_APP', label: 'Paint', labelHi: 'पेंट' },
    'पेंट': { action: 'OPEN_APP', label: 'Paint', labelHi: 'पेंट' },
    'word': { action: 'OPEN_APP', label: 'Word', labelHi: 'वर्ड' },
    'वर्ड': { action: 'OPEN_APP', label: 'Word', labelHi: 'वर्ड' },
    'excel': { action: 'OPEN_APP', label: 'Excel', labelHi: 'एक्सेल' },
    'एक्सेल': { action: 'OPEN_APP', label: 'Excel', labelHi: 'एक्सेल' },
    'powerpoint': { action: 'OPEN_APP', label: 'PowerPoint', labelHi: 'पॉवरपॉइंट' },
    'पॉवरपॉइंट': { action: 'OPEN_APP', label: 'PowerPoint', labelHi: 'पॉवरपॉइंट' },
    'cmd': { action: 'OPEN_APP', label: 'Command Prompt', labelHi: 'कमांड प्रॉम्प्ट' },
    'कमांड': { action: 'OPEN_APP', label: 'Command Prompt', labelHi: 'कमांड प्रॉम्प्ट' },
    'terminal': { action: 'OPEN_APP', label: 'Terminal', labelHi: 'टर्मिनल' },
    'टर्मिनल': { action: 'OPEN_APP', label: 'Terminal', labelHi: 'टर्मिनल' },
    'vscode': { action: 'OPEN_APP', label: 'VS Code', labelHi: 'बीएस कोड' },
    'vs code': { action: 'OPEN_APP', label: 'VS Code', labelHi: 'बीएस कोड' },
    'कोड': { action: 'OPEN_APP', label: 'VS Code', labelHi: 'कोड' },
    'chrome': { action: 'OPEN_APP', label: 'Chrome', labelHi: 'क्रोम' },
    'क्रोम': { action: 'OPEN_APP', label: 'Chrome', labelHi: 'क्रोम' },
    'firefox': { action: 'OPEN_APP', label: 'Firefox', labelHi: 'फायरफॉक्स' },
    'explorer': { action: 'OPEN_APP', label: 'File Explorer', labelHi: 'फाइल एक्सप्लोरर' },
    'एक्सप्लोरर': { action: 'OPEN_APP', label: 'File Explorer', labelHi: 'एक्सप्लोरर' },
    'spotify': { action: 'OPEN_APP', label: 'Spotify', labelHi: 'स्पॉटिफाई' },
    'स्पॉटिफाई': { action: 'OPEN_APP', label: 'Spotify', labelHi: 'स्पॉटिफाई' },
    'amazon': { action: 'NAVIGATE', label: 'Amazon', labelHi: 'अमेज़न', url: 'https://www.amazon.in' },
    'अमेज़न': { action: 'NAVIGATE', label: 'Amazon', labelHi: 'अमेज़न', url: 'https://www.amazon.in' },
    'flipkart': { action: 'NAVIGATE', label: 'Flipkart', labelHi: 'फ्लिपकार्ट', url: 'https://www.flipkart.com' },
    'फ्लिपकार्ट': { action: 'NAVIGATE', label: 'Flipkart', labelHi: 'फ्लिपकार्ट', url: 'https://www.flipkart.com' },
    'wikipedia': { action: 'NAVIGATE', label: 'Wikipedia', labelHi: 'विकिपीडिया', url: 'https://www.wikipedia.org' },
    'विकिपीडिया': { action: 'NAVIGATE', label: 'Wikipedia', labelHi: 'विकिपीडिया', url: 'https://hi.wikipedia.org' },
    'github': { action: 'NAVIGATE', label: 'GitHub', labelHi: 'गिटहब', url: 'https://github.com' },
    'गिटहब': { action: 'NAVIGATE', label: 'GitHub', labelHi: 'गिटहब', url: 'https://github.com' },
    'gmail': { action: 'NAVIGATE', label: 'Gmail', labelHi: 'जीमेल', url: 'https://mail.google.com' },
    'जीमेल': { action: 'NAVIGATE', label: 'Gmail', labelHi: 'जीमेल', url: 'https://mail.google.com' },
    'chatgpt': { action: 'NAVIGATE', label: 'ChatGPT', labelHi: 'चैटजीपीटी', url: 'https://chatgpt.com' },
    'instagram': { action: 'NAVIGATE', label: 'Instagram', labelHi: 'इंस्टाग्राम', url: 'https://www.instagram.com' },
    'netflix': { action: 'NAVIGATE', label: 'Netflix', labelHi: 'नेटफ्लिक्स', url: 'https://www.netflix.com' },
    'twitter': { action: 'NAVIGATE', label: 'Twitter', labelHi: 'ट्विटर', url: 'https://www.twitter.com' },
    'reddit': { action: 'NAVIGATE', label: 'Reddit', labelHi: 'रेडिट', url: 'https://www.reddit.com' },
  };

  if (lowerText.match(/(?:^|\s)(open|kholo|launch|chalao|start|ओपन|खोलो|चलाओ|शुरू)(?:\s|$)/)) {
    const target = extractQuery(cleanText, ['open', 'kholo', 'launch', 'chalao', 'start', 'please', 'app', 'website', 'ओपन', 'खोलो', 'चलाओ', 'the', 'a', 'an']);
    const targetLower = target.toLowerCase().trim();

    // Check JARVIS-style Hindi app map first
    const appEntry = HINDI_APP_MAP[targetLower] || HINDI_APP_MAP[target];
    if (appEntry) {
      if (appEntry.url) {
        return createResponse('NAVIGATE', isHindi ? `${appEntry.labelHi} खोल रही हूँ।` : `Opening ${appEntry.label}.`, { target: appEntry.label }, appEntry.url);
      }
      return createResponse('OPEN_APP', isHindi ? `${appEntry.labelHi} खोल रही हूँ।` : `Opening ${appEntry.label}.`, { app: appEntry.label.toLowerCase() });
    }

    if (target.match(/spotify/i)) {
      return createResponse('MEDIA_PLAY', isHindi ? "Spotify खोल रही हूँ।" : "Opening Spotify.", { title: 'Spotify', isPlaying: true }, 'https://open.spotify.com');
    }
    if (target.match(/youtube|यूट्यूब|युटुब/i)) {
      return createResponse('SEARCH_QUERY', isHindi ? "YouTube खोल रही हूँ।" : "Opening YouTube.", null, 'https://www.youtube.com');
    }
    if (target.match(/whatsapp|व्हाट्सएप/i)) {
      return createResponse('COMM_MESSAGE_DRAFT', isHindi ? "WhatsApp खोल रही हूँ।" : "Opening WhatsApp.", { type: 'message', contact: 'WhatsApp' }, 'https://web.whatsapp.com');
    }
    if (target.match(/google/i)) {
      return createResponse('NAVIGATE', isHindi ? "Google खोल रही हूँ।" : "Opening Google.", null, 'https://www.google.com');
    }
    if (target.match(/github/i)) {
      return createResponse('NAVIGATE', isHindi ? "GitHub खोल रही हूँ।" : "Opening GitHub.", null, 'https://github.com');
    }
    if (target.match(/chatgpt/i)) {
      return createResponse('NAVIGATE', isHindi ? "ChatGPT खोल रही हूँ।" : "Opening ChatGPT.", null, 'https://chatgpt.com');
    }

    // Generic navigate
    if (target.length > 0 && target.length < 20) {
      return createResponse('NAVIGATE',
        isHindi ? `${target} खोलने का प्रयास कर रही हूँ।` : `Attempting to open ${target}.`,
        { target },
        `https://${target.toLowerCase().replace(/\s+/g, '')}.com`
      );
    }
  }

  // ── Direct App Commands ───────────────────────────────────────────────────
  if (lowerText.match(/(?:^|\s)(spotify|स्पॉटिफाई)(?:\s|$)/i)) {
    return createResponse('MEDIA_PLAY', isHindi ? "Spotify खोल रही हूँ।" : "Opening Spotify.", { title: 'Spotify', isPlaying: true }, 'https://open.spotify.com');
  }

  // ── Open Folders ────────────────────────────────────────────────────────────
  if (lowerText.match(/(?:^|\s)(downloads|download|डाउनलोड)(?:\s|$)/i)) {
    return createResponse('OPEN_FOLDER', isHindi ? "Downloads खोल रही हूँ।" : "Opening Downloads folder.", { folder: 'downloads' });
  }
  if (lowerText.match(/(?:^|\s)(documents|docs|डॉक्युमेंट्स|डॉक्यूमेंट)(?:\s|$)/i)) {
    return createResponse('OPEN_FOLDER', isHindi ? "Documents खोल रही हूँ।" : "Opening Documents folder.", { folder: 'documents' });
  }
  if (lowerText.match(/(?:^|\s)(desktop|डेस्कटॉप)(?:\s|$)/i)) {
    return createResponse('OPEN_FOLDER', isHindi ? "Desktop खोल रही हूँ।" : "Opening Desktop folder.", { folder: 'desktop' });
  }
  if (lowerText.match(/(?:^|\s)(pictures|photos|images|फोटो|पिक्चर्स|तस्वीरें)(?:\s|$)/i)) {
    return createResponse('OPEN_FOLDER', isHindi ? "Pictures खोल रही हूँ।" : "Opening Pictures folder.", { folder: 'pictures' });
  }
  if (lowerText.match(/(?:^|\s)(videos|movies|वीडियो|मूवी)(?:\s|$)/i)) {
    return createResponse('OPEN_FOLDER', isHindi ? "Videos खोल रही हूँ।" : "Opening Videos folder.", { folder: 'videos' });
  }
  if (lowerText.match(/(?:^|\s)(music|gaana|gaane|गाना|गाने|म्यूजिक)(?:\s|$)/i)) {
    return createResponse('OPEN_FOLDER', isHindi ? "Music खोल रही हूँ।" : "Opening Music folder.", { folder: 'music' });
  }

  // ── Power Control ────────────────────────────────────────────────────────
  if (lowerText.match(/(?:^|\s)(shutdown|band karo|pc band|computer band|system band|शटडाउन|बंद करो)(?:\s|$)/i)) {
    return createResponse('SHUTDOWN_CONFIRM', isHindi ? "क्या आप वाकई कंप्यूटर बंद करना चाहते हैं?" : "Are you sure you want to shutdown the computer?");
  }
  if (lowerText.match(/(?:^|\s)(restart|dobara shuru|fir se chalu|reboot|रीस्टार्ट|दोबारा शुरू)(?:\s|$)/i)) {
    return createResponse('RESTART_CONFIRM', isHindi ? "क्या आप वाकई कंप्यूटर दोबारा शुरू करना चाहते हैं?" : "Are you sure you want to restart the computer?");
  }
  if (lowerText.match(/(?:^|\s)(sleep|sone do|suspend|स्लीप|सोने दो)(?:\s|$)/i)) {
    return createResponse('SLEEP_CONFIRM', isHindi ? "क्या आप कंप्यूटर को स्लीप मोड में डालना चाहते हैं?" : "Do you want to put the computer to sleep?");
  }

  // ── Advanced System Info ──────────────────────────────────────────────────
  if (lowerText.match(/(?:^|\s)(uptime|अपटाइम|कितनी देर|चालू है|up time)(?:\s|$)/)) {
    return createResponse('UPTIME', isHindi ? "सिस्टम को चालू हुए काफी समय हो गया है।" : "Calculating system uptime...");
  }
  if (lowerText.match(/(?:^|\s)(system health|health report|pc status|how is my pc|स्वास्थ्य|हाइत|सिस्टम रिपोर्ट|कैसा है)(?:\s|$)/)) {
    return createResponse('SYSTEM_HEALTH', isHindi ? "सिस्टम स्वास्थ्य की जाँच कर रही हूँ..." : "Checking system health and vitals...");
  }
  if (lowerText.match(/(?:^|\s)(network|ip address|internet status|नेटवर्क|आईपी एड्रेस|इंटरनेट)(?:\s|$)/)) {
    return createResponse('NETWORK_INFO', isHindi ? "नेटवर्क विवरण प्राप्त कर रही हूँ..." : "Retrieving network configuration...");
  }

  // ── Desktop Customization ────────────────────────────────────────────────
  if (lowerText.match(/(?:^|\s)(wallpaper|background|वॉलपेपर|बैकग्राउंड)(?:\s|$)/i)) {
    return createResponse('CHANGE_WALLPAPER', isHindi ? "वॉलपेपर बदलने के लिए इमेज चुनें।" : "Please provide an image to change the wallpaper.");
  }
  if (lowerText.match(/(?:^|\s)(recycle bin|trash|kachra|कूड़ा|कचरा)(?:\s|$)/i)) {
    return createResponse('EMPTY_RECYCLE_BIN', isHindi ? "रीसायकल बिन खाली कर रही हूँ।" : "Emptying the recycle bin.");
  }
  if (lowerText.match(/(?:^|\s)(taskbar|टास्कबार)(?:\s|$)/i)) {
    return createResponse('TOGGLE_TASKBAR', isHindi ? "टास्कबार टॉगल कर रही हूँ।" : "Toggling taskbar visibility.");
  }

  // ── Screen Control ─────────────────────────────────────────────────────────
  // Window snapping (from JARVIS reference)
  if (lowerText.match(/(?:^|\s)(snap left|bayan snap|window left|khidki bayan|बाईं ओर|बाएं snap|विंडो बाईं|snap window left)(?:\s|$)/i)) {
    return createResponse('SNAP_LEFT', isHindi ? "विंडो बाईं ओर स्नैप की।" : "Window snapped to the left.");
  }
  if (lowerText.match(/(?:^|\s)(snap right|dayan snap|window right|khidki dayan|दाईं ओर|दाएं snap|विंडो दाईं|snap window right)(?:\s|$)/i)) {
    return createResponse('SNAP_RIGHT', isHindi ? "विंडो दाईं ओर स्नैप की।" : "Window snapped to the right.");
  }
  if (lowerText.match(/(?:^|\s)(center window|window center|beech mein|विंडो बीच में|center karo|window ko center|khidki beech mein)(?:\s|$)/i)) {
    return createResponse('CENTER_WINDOW', isHindi ? "विंडो स्क्रीन के बीच में की।" : "Active window centered on screen.");
  }
  // List running apps
  if (lowerText.match(/(?:^|\s)(list apps|running apps|kaunse apps|show apps|कौनसे ऐप|ऐप सूची|चल रहे ऐप्स)(?:\s|$)/i)) {
    return createResponse('LIST_APPS', isHindi ? "चल रहे ऐप्स की सूची दिखा रही हूँ।" : "Listing running applications.");
  }

  if (lowerText.match(/(?:^|\s)(zoom in|bada dikhao|ज़ूम इन|बड़ा दिखाओ)(?:\s|$)/i)) {
    return createResponse('ZOOM_IN', isHindi ? "ज़ूम इन कर रही हूँ।" : "Zooming in.");
  }
  if (lowerText.match(/(?:^|\s)(zoom out|chhota dikhao|ज़ूम आउट|छोटा दिखाओ)(?:\s|$)/i)) {
    return createResponse('ZOOM_OUT', isHindi ? "ज़ूम आउट कर रही हूँ।" : "Zooming out.");
  }

  // ── Brightness Control ───────────────────────────────────────────────────
  if (lowerText.match(/(?:^|\s)(brightness|light|screen|चमक|रोशनी)(?:\s|$)/)) {
    if (lowerText.match(/(?:^|\s)(up|increase|badhao|tez|zyada|jyada|बढ़ाओ|तेज़|ज्यादा)(?:\s|$)/)) {
      return createResponse('BRIGHTNESS_UP', isHindi ? "चमक बढ़ा रही हूँ।" : "Increasing brightness.");
    }
    if (lowerText.match(/(?:^|\s)(down|decrease|kam|dheere|ghata|कम|घटाओ|धीरे)(?:\s|$)/)) {
      return createResponse('BRIGHTNESS_DOWN', isHindi ? "चमक कम कर रही हूँ।" : "Decreasing brightness.");
    }
  }

  // ── Screenshot ──────────────────────────────────────────────────────────────
  if (lowerText.match(/(?:^|\s)(screenshot|screen capture|photo|फोटो|स्क्रीनशॉट|कैप्चर|खींचो|खींचिए)(?:\s|$)/i)) {
    return createResponse('SCREENSHOT', isHindi ? "स्क्रीनशॉट ले रही हूँ।" : "Taking screenshot.");
  }

  // ── WhatsApp ──────────────────────────────────────────────────────────────
  if (lowerText.match(/(?:^|\s)(whatsapp|व्हाट्सएप|व्हाट्सapp)(?:\s|$)/i)) {
    return createResponse('COMM_MESSAGE_DRAFT', isHindi ? "WhatsApp खोल रही हूँ।" : "Opening WhatsApp.", { type: 'message', contact: 'WhatsApp' }, 'https://web.whatsapp.com');
  }

  // ── YouTube Search ───────────────────────────────────────────────────────
  if (lowerText.match(/(?:^|\s)(youtube|video|watch|dekho|dekhna|यूट्यूब|युटुब|वीडियो|देखना|देखो)(?:\s|$)/i)) {
    const query = extractQuery(cleanText, ['youtube', 'video', 'watch', 'dekho', 'dekhna', 'search', 'please', 'on', 'in', 'par', 'यूट्यूब', 'युटुब', 'वीडियो', 'पर', 'में', 'दिखाओ']);
    return createResponse(
      'SEARCH_QUERY',
      isHindi ? `YouTube पर "${query}" खोज रही हूँ।` : `Searching YouTube for "${query}".`,
      null,
      `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
    );
  }

  // ── Clipboard & Keyboard Shortcuts (JARVIS-inspired) ───────────────────────
  if (lowerText.match(/(?:^|\s)(copy|ctrl c|clipboard copy|copy selection|कॉपी|कॉपी करो|चुनाव कॉपी)(?:\s|$)/i) &&
    !lowerText.match(/\b(paste|pasting)\b/i)) {
    return createResponse('CLIPBOARD_COPY', isHindi ? "सेलेक्शन कॉपी कर रही हूँ।" : "Copying selection.");
  }
  if (lowerText.match(/(?:^|\s)(paste|ctrl v|clipboard paste|पेस्ट|पेस्ट करो|चिपकाओ)(?:\s|$)/i)) {
    return createResponse('CLIPBOARD_PASTE', isHindi ? "क्लिपबोर्ड पेस्ट कर रही हूँ।" : "Pasting clipboard.");
  }
  if (lowerText.match(/(?:^|\s)(get clipboard|clipboard text|what is in clipboard|clipboard mein kya|क्लिपबोर्ड क्या है|क्लिपबोर्ड पढ़ो)(?:\s|$)/i)) {
    return createResponse('GET_CLIPBOARD', isHindi ? "क्लिपबोर्ड पढ़ रही हूँ।" : "Reading clipboard contents.");
  }
  if (lowerText.match(/(?:^|\s)(save file|ctrl s|file save|document save|सेव करो|फाइल सेव|बचाओ)(?:\s|$)/i)) {
    return createResponse('HOTKEY_SAVE', isHindi ? "फ़ाइल सेव कर रही हूँ।" : "Saving file.");
  }
  if (lowerText.match(/(?:^|\s)(undo|ctrl z|last action|undo karo|वापस करो|अनडू)(?:\s|$)/i)) {
    return createResponse('HOTKEY_UNDO', isHindi ? "पिछला काम वापस ले रही हूँ।" : "Undoing last action.");
  }
  if (lowerText.match(/(?:^|\s)(new tab|open tab|ctrl t|नया टैब|टैब खोलो)(?:\s|$)/i)) {
    return createResponse('NEW_TAB', isHindi ? "नया टैब खोल रही हूँ।" : "Opening new tab.");
  }
  if (lowerText.match(/(?:^|\s)(close tab|ctrl w|current tab close|टैब बंद|टैब बंद करो)(?:\s|$)/i)) {
    return createResponse('CLOSE_TAB', isHindi ? "टैब बंद कर रही हूँ।" : "Closing current tab.");
  }
  if (lowerText.match(/(?:^|\s)(scroll up|upar scroll|page up|ऊपर स्क्रॉल|ऊपर जाओ)(?:\s|$)/i)) {
    return createResponse('SCROLL_UP', isHindi ? "ऊपर स्क्रॉल कर रही हूँ।" : "Scrolling up.");
  }
  if (lowerText.match(/(?:^|\s)(scroll down|neeche scroll|page down|नीचे स्क्रॉल|नीचे जाओ)(?:\s|$)/i)) {
    return createResponse('SCROLL_DOWN', isHindi ? "नीचे स्क्रॉल कर रही हूँ।" : "Scrolling down.");
  }

  // ── Vision & OCR (Phase 21) ────────────────────────────────────────────────
  if (lowerText.match(/(?:^|\s)(extract text|ocr|image to text|फोटो से टेक्स्ट|टेक्स्ट निकालो)(?:\s|$)/i)) {
    return createResponse('OCR_IMAGE', isHindi ? "फोटो से टेक्स्ट निकाल रही हूँ।" : "Extracting text from image.");
  }
  if (lowerText.match(/(?:^|\s)(narrate screen|read screen|what's on screen|screen par kya|स्क्रीन पढ़ो|स्क्रीन पर क्या है)(?:\s|$)/i)) {
    return createResponse('NARRATE_SCREEN', isHindi ? "स्क्रीन पर जो है वो पढ़ रही हूँ।" : "Narrating what's on your screen.");
  }
  if (lowerText.match(/(?:^|\s)(screen summary|summary of screen|screen detail|स्क्रीन का सारांश)(?:\s|$)/i)) {
    return createResponse('SCREEN_SUMMARY', isHindi ? "स्क्रीन का सारांश दे रही हूँ।" : "Generating summary of your screen.");
  }
  if (lowerText.match(/(?:^|\s)(read pdf|pdf read|पीडीएफ पढ़ो|pdf सुनाओ)(?:\s|$)/i)) {
    return createResponse('READ_PDF', isHindi ? "पीडीएफ पढ़ रही हूँ।" : "Reading the PDF for you.");
  }
  if (lowerText.match(/(?:^|\s)(get selected text|selected text|what is selected|क्या चुना है|चुना हुआ टेक्स्ट)(?:\s|$)/i)) {
    return createResponse('GET_SELECTED_TEXT', isHindi ? "चुना हुआ टेक्स्ट पढ़ रही हूँ।" : "Retrieving the selected text.");
  }
  if (lowerText.match(/(?:^|\s)(make drawing|draw|paint|mspaint|ड्राइइंग बनाओ|पेंट खोलें)(?:\s|$)/i)) {
    return createResponse('MAKE_DRAWING', isHindi ? "पेंट खोल रही हूँ।" : "Opening drawing application.");
  }

  // ── Math / Calculator ────────────────────────────────────────────────────
  const mathMatch = lowerText.match(/(\d+(?:\.\d+)?)\s*([-+*/])\s*(\d+(?:\.\d+)?)/);
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
  if (lowerText.match(/(?:^|\s)(help|madad|what can|kya kar|capabilities|features|commands list|सहायता|मदद|क्या कर सकती हो)(?:\s|$)/)) {
    const enHelp = "I can help you with: Media playback, Smart Home, Weather, News, Health, Tasks, Timers, Calculations, Communication, Jokes, Facts, Drawing, Sentry Mode, and more. Just ask!";
    const hiHelp = "मैं इन चीजों में मदद कर सकती हूँ: संगीत, स्मार्ट होम, मौसम, समाचार, स्वास्थ्य, कार्य, टाइमर, गणना, संचार, मजाक, तथ्य, ड्रॉइंग, निगरानी मोड और बहुत कुछ। बस पूछो!";
    return createResponse('HELP', isHindi ? hiHelp : enHelp);
  }

  // ── Settings ────────────────────────────────────────────────────────────
  if (lowerText.match(/(?:^|\s)(settings|preferences|config|options|configuration|सेटिंग्स|विकल्प)(?:\s|$)/)) {
    return createResponse('SETTINGS_OPEN', isHindi ? "सेटिंग्स खोल रही हूँ।" : "Opening settings.");
  }

  // ── Display / Show ─────────────────────────────────────────────────────
  if (lowerText.match(/(?:^|\s)(show|display|list|open|dikhao|दिखाओ|खोलो|kholo)(?:\s|$)/)) {
    if (lowerText.match(/(?:^|\s)(task|todo|kaam|कार्य)(?:\s|$)/)) {
      return createResponse('TASK_SHOW', isHindi ? "कार्य सूची दिख रही है।" : "Displaying task list.");
    }
    if (lowerText.match(/(?:^|\s)(news|samachar|खबर)(?:\s|$)/)) {
      return createResponse('NEWS_FETCH', isHindi ? "समाचार फीड लोड हो रही है..." : "Accessing global news feeds...");
    }
    if (lowerText.match(/(?:^|\s)(weather|mausam|मौसम)(?:\s|$)/)) {
      return createResponse('WEATHER_FETCH', isHindi ? "मौसम की जानकारी ला रही हूँ..." : "Fetching meteorological data...");
    }
    if (lowerText.match(/(?:^|\s)(automation status|task list|scheduled tasks|ऑटोमेशन स्टेटस|टास्क लिस्ट)(?:\s|$)/)) {
      return createResponse('AUTOMATION_STATUS', isHindi ? "ऑटोमेशन स्टेटस दिखा रही हूँ।" : "Showing automation status.");
    }
  }

  // ── Automation & Macros ────────────────────────────────────────────────────
  if (lowerText.match(/(?:^|\s)(run macro|macro chalao|automation|मैक्रो चलाओ|ऑटोमेशन शुरू करो)(?:\s|$)/i)) {
    const macroName = extractQuery(cleanText, ['run', 'macro', 'chalao', 'automation', 'मैक्रो', 'चलाओ', 'ऑटोमेशन', 'शुरू', 'करो']);
    return createResponse('RUN_MACRO', isHindi ? `मैक्रो "${macroName}" चला रही हूँ।` : `Running macro: ${macroName}`, { macro: macroName });
  }

  // ── AI Fallback ──────────────────────────────────────────────────────────
  const aiResponse = await AIService.getAIResponse(cleanText, detectedLang);
  if (aiResponse && aiResponse.length > 0) {
    return createResponse('AI_RESPONSE', aiResponse);
  }

  // ── Web Search (final fallback) ──────────────────────────────────────────
  const query = extractQuery(cleanText, ['search', 'find', 'google', 'look up', 'dhundo', 'khojo', 'please']);

  // Final safety check: If query is very short and not AI-handled, don't search
  if (query.length < 2 || query.match(/^(hello|hi|hey|namaste|नमस्ते|ok|okay|bye|goodbye|thanks|thank|dhanyavad|shukriya)$/i)) {
    const enResponses = [
      "Hello! How can I help you today?",
      "Hi there! What would you like me to do?",
      "I'm listening. What do you need?",
      "Yes? How can I assist you?"
    ];
    const hiResponses = [
      "नमस्ते! मैं आपकी क्या सहायता कर सकती हूँ?",
      "हाँ, बताइए क्या चाहिए?",
      "मैं सुन रही हूँ। क्या करना है?",
      "जी, बताइए!"
    ];
    const fallback = isHindi
      ? hiResponses[Math.floor(Math.random() * hiResponses.length)]
      : enResponses[Math.floor(Math.random() * enResponses.length)];
    return createResponse('SYSTEM_STATUS', fallback);
  }

  // Refine Search Response: Only search if explicitly asked or very likely a question
  const searchTriggers = ['what', 'how', 'who', 'where', 'when', 'why', 'meaning', 'tell me about', 'kya', 'kaise', 'kaun', 'kab', 'kyun', 'kahan', 'kisne', 'batao', 'khojo', 'search', 'find'];
  const explicitSearch = lowerText.match(/(?:^|\s)(search|find|google|look up|dhundo|khojo|pata lagao|खोजो|ढूंढो)(?:\s|$)/i);
  const informationalTrigger = searchTriggers.some(t => lowerText.startsWith(t) || lowerText.endsWith(t));

  if (!explicitSearch && !informationalTrigger && query.length < 25) {
    return createResponse('UNKNOWN_COMMAND', isHindi ? "क्षमा करें, मुझे समझ नहीं आया। क्या आप 'खोज' या किसी और चीज़ में मदद चाहते हैं?" : "I didn't quite catch that. Would you like me to search the web for you?");
  }

  return createResponse(
    'SEARCH_QUERY',
    isHindi ? `वेब पर खोज रही हूँ: "${query}"` : `Searching the web for "${query}"`,
    undefined,
    `https://www.google.com/search?q=${encodeURIComponent(query || cleanText)}`
  );
};
