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
      MEDIA_CONTROL: [/\b(play|pause|stop|resume|skip)\b/],
      SMART_HOME: [/\b(light|lamp|thermostat|ac|lock|door)\b/],
      INFORMATION: [/\b(show|display|tell|what|how|when|where)\b/],
      COMMUNICATION: [/\b(call|message|text|whatsapp|email)\b/],
      HEALTH: [/\b(health|heart|steps|sleep|fitness|wellness)\b/],
      EMERGENCY: [/\b(help|emergency|urgent|danger|help)\b/]
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
      { regex: /\b(\d+)\s*(minute|hour|day|week)\b/i, key: 'duration' },
      { regex: /\b(morning|afternoon|evening|night)\b/i, key: 'timeOfDay' }
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

    const positiveWords = ['great', 'wonderful', 'amazing', 'love', 'happy', 'excellent', 'perfect', 'thank', 'thanks', 'good'];
    const negativeWords = ['hate', 'terrible', 'awful', 'sad', 'angry', 'frustrated', 'bad', 'wrong', 'broken', 'issue'];
    const urgentWords = ['urgent', 'emergency', 'asap', 'now', 'immediately', 'critical', 'important'];

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
}

export const conversationEngine = new ConversationEngineService();
