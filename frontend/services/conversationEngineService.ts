import { emotionService, EmotionAnalysis } from './emotionService';

interface ConversationIntent {
  intent: string;
  confidence: number;
  entities: Record<string, string>;
}

interface SentimentAnalysis {
  polarity: 'positive' | 'negative' | 'neutral';
  score: number;
  urgency: 'low' | 'medium' | 'high';
  detailed?: EmotionAnalysis;
}

class ConversationEngineService {
  private multiIntentPatterns = [
    { pattern: /\b(and|then|also|after that|plus)\b/gi, isMulti: true },
    { pattern: /\b(first|then|next|finally)\b/gi, isSequence: true }
  ];

  async parseMultiIntent(transcript: string): Promise<ConversationIntent[]> {
    const intents: ConversationIntent[] = [];
    const sentences = transcript.split(/[,;]|and|then|also/);

    for (const sentence of sentences) {
      const cleaned = sentence.trim();
      if (!cleaned) continue;

      const intent = await this.identifyIntent(cleaned);
      intents.push(intent);
    }

    return intents;
  }

  async identifyIntent(text: string): Promise<ConversationIntent> {
    const lower = text.toLowerCase();

    const intentPatterns: Record<string, RegExp[]> = {
      BOOKING: [/\b(book|reserve|schedule|appointment)\b/],
      TASK_CREATE: [/\b(add|create|new|todo|remind)\b/],
      TASK_SHOW: [/\b(show|list|display|todo list|tasks)\b/],
      TASK_DELETE: [/\b(delete|remove|clear|complete|done)\b/],
      MEDIA_CONTROL: [/\b(play|pause|stop|resume|skip|next|previous)\b/],
      MEDIA_PLAY: [/\b(play|start|open|music|song|gaana)\b/],
      MEDIA_PAUSE: [/\b(pause|stop|halt)\b/],
      SMART_HOME: [/\b(light|lamp|thermostat|ac|lock|door|fan|bulb)\b/],
      SMART_HOME_ON: [/\b(on|chalu|jalao|enable|activate)\b/],
      SMART_HOME_OFF: [/\b(off|band|मute|deactivate)\b/],
      INFORMATION: [/\b(show|display|tell|what|how|when|where|explain)\b/],
      COMMUNICATION: [/\b(call|message|text|whatsapp|email|send)\b/],
      HEALTH: [/\b(health|heart|steps|sleep|fitness|wellness|heart rate|pulse)\b/],
      WEATHER: [/\b(weather|temperature|mausam|rain|forecast)\b/],
      NEWS: [/\b(news|headlines|samachar|khabar)\b/],
      TIME: [/\b(time|clock|samay|waqt)\b/],
      DATE: [/\b(date|tarikh|din|today)\b/],
      CALENDAR: [/\b(calendar|schedule|appointment|meeting|event)\b/],
      REMINDER: [/\b(remind|reminder|alarm|notify)\b/],
      CALCULATE: [/\b(calculate|compute|math|hisab|guna|भाग)\b/],
      CONVERT: [/\b(convert|change|exchange|तबदील)\b/],
      SEARCH: [/\b(search|find|look|google|dhundo|खोजो)\b/],
      OPEN: [/\b(open|kholo|launch|start|खोलो)\b/],
      CLOSE: [/\b(close|exit|quit|band|बंद)\b/],
      SETTINGS: [/\b(settings|preferences|config|options)\b/],
      HELP: [/\b(help|aid|support|madad)\b/],
      EMERGENCY: [/\b(help|emergency|urgent|danger|help|sos)\b/]
    };

    let bestIntent = 'GENERAL_QUERY';
    let highestConfidence = 0;

    for (const [intent, patterns] of Object.entries(intentPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(lower)) {
          const confidence = this.calculateConfidence(lower, pattern);
          if (confidence > highestConfidence) {
            highestConfidence = confidence;
            bestIntent = intent;
          }
        }
      }
    }

    return {
      intent: bestIntent,
      confidence: highestConfidence,
      entities: this.extractEntities(lower)
    };
  }

  private extractEntities(text: string): Record<string, string> {
    const entities: Record<string, string> = {};

    const timePatterns = [
      { regex: /\b(today|tomorrow|tonight|now)\b/i, key: 'time' },
      { regex: /\b(\d+)\s*(minute|hour|day|week|month|year|मिनट|घंटा|दिन|महीना|साल)\b/i, key: 'duration' },
      { regex: /\b(morning|afternoon|evening|night|subah|sham|raat)\b/i, key: 'timeOfDay' },
      { regex: /\b(\d{1,2}):(\d{2})\b/, key: 'timeValue' }
    ];

    for (const { regex, key } of timePatterns) {
      const match = text.match(regex);
      if (match) entities[key] = match[0];
    }

    const numberPatterns = [
      { regex: /\b(\d+)\b/, key: 'number' },
      { regex: /\$?\s*(\d+(?:,\d{3})*(?:\.\d+)?)/, key: 'amount' }
    ];

    for (const { regex, key } of numberPatterns) {
      const match = text.match(regex);
      if (match) entities[key] = match[1] || match[0];
    }

    const namePatterns = [
      { regex: /\b(mom|dad|mother|father|sister|brother|friend|boss|teacher)\b/i, key: 'contact' },
      { regex: /(?:to|for|ko)\s+(\w+)/i, key: 'target' }
    ];

    for (const { regex, key } of namePatterns) {
      const match = text.match(regex);
      if (match) entities[key] = match[1];
    }

    return entities;
  }

  private calculateConfidence(text: string, pattern: RegExp): number {
    const match = text.match(pattern);
    if (!match) return 0;

    const baseScore = match[0].length / 10;
    return Math.min(0.95, baseScore + 0.3);
  }

  analyzeSentiment(text: string): SentimentAnalysis {
    const lower = text.toLowerCase();

    const positiveWords = [
      'great', 'wonderful', 'amazing', 'love', 'happy', 'excellent', 'perfect', 
      'thank', 'thanks', 'good', 'nice', 'awesome', 'fantastic', 'brilliant',
      'accha', 'बहुत अच्छा', 'शानदार', 'बढ़िया', 'धन्यवाद', 'शुक्रिया'
    ];
    const negativeWords = [
      'hate', 'terrible', 'awful', 'sad', 'angry', 'frustrated', 'bad', 'wrong', 
      'broken', 'issue', 'problem', 'error', 'fail',
      'बुरा', 'गलत', 'खराब', 'नहीं'
    ];
    const urgentWords = [
      'urgent', 'emergency', 'asap', 'now', 'immediately', 'critical', 'important',
      'जल्दी', 'तुरंत', 'फौरन', 'emergency'
    ];

    const positiveCount = positiveWords.filter(w => lower.includes(w)).length;
    const negativeCount = negativeWords.filter(w => lower.includes(w)).length;
    const urgentCount = urgentWords.filter(w => lower.includes(w)).length;

    const score = (positiveCount - negativeCount) / Math.max(1, positiveCount + negativeCount + 1);

    let polarity: SentimentAnalysis['polarity'] = 'neutral';
    if (score > 0.2) polarity = 'positive';
    else if (score < -0.2) polarity = 'negative';

    const urgency: SentimentAnalysis['urgency'] = urgentCount > 1 ? 'high' : urgentCount > 0 ? 'medium' : 'low';

    return { polarity, score, urgency };
  }

  async processComplexRequest(transcript: string) {
    const rawSentiment = this.analyzeSentiment(transcript);
    const detailedEmotion = emotionService.analyzeEmotion(transcript);

    const sentiment: SentimentAnalysis = {
      ...rawSentiment,
      detailed: detailedEmotion
    };

    const intents = await this.parseMultiIntent(transcript);

    return {
      intents,
      sentiment,
      isMultiIntent: intents.length > 1,
      requiresConfirmation: sentiment.urgency === 'high' || intents.length > 2
    };
  }

  getGreetingResponse(language: 'en' | 'hi'): string {
    const hour = new Date().getHours();
    const isHindi = language === 'hi';
    
    if (hour < 12) {
      return isHindi ? 'सुप्रभात! आप कैसे हैं?' : 'Good morning! How are you?';
    } else if (hour < 17) {
      return isHindi ? 'नमस्ते! क्या मदद चाहिए?' : 'Good afternoon! How can I help?';
    } else {
      return isHindi ? 'शुभ संध्या! क्या करना है?' : 'Good evening! What would you like to do?';
    }
  }

  getFallbackResponse(language: 'en' | 'hi', query: string): string {
    const isHindi = language === 'hi';
    
    const fallbacks: Record<string, Record<'en' | 'hi', string>> = {
      unsure: {
        en: "I'm not sure I understood that. Could you try again?",
        hi: "मुझे समझ नहीं आया। क्या आप फिर से कोशिश कर सकते हैं?"
      },
      notSupported: {
        en: "That feature is not yet available. Try something else!",
        hi: "यह सुविधा अभी उपलब्ध नहीं है। कुछ और कोशिश करें!"
      },
      error: {
        en: "Something went wrong. Please try again.",
        hi: "कुछ गलत हो गया। कृपया पुनः प्रयास करें।"
      }
    };

    return fallbacks.unsure[isHindi ? 'hi' : 'en'];
  }
}

export const conversationEngine = new ConversationEngineService();
