/**
 * SOFIYA NLP Processor
 * Phase 1.3: Intent recognition and entity extraction
 * 
 * Uses regex patterns for intent classification and entity extraction.
 * Supports multi-part requests and can integrate with transformer models.
 */

import 'dotenv/config';
import { WordTokenizer, SentenceTokenizer } from 'natural';

export class NLPProcessor {
    constructor(options = {}) {
        // Extended intent patterns with priority ordering
        this.intents = [
            // High priority - specific actions
            { name: 'send_message', pattern: /\b(send|message|whatsapp|text|sms)\s+(?:to|for)\s+(\w+)/i, priority: 10 },
            { name: 'control_device', pattern: /\b(turn\s+(?:on|off)|switch|toggle|dim|brighten)\s+(?:the\s+)?(?:lights?|light|fan|ac|thermostat|tv|television)/i, priority: 9 },
            { name: 'schedule', pattern: /\b(schedule|meeting|appointment|calendar|book|set\s+up)\b/i, priority: 8 },
            { name: 'smart_home_scene', pattern: /\b(movie\s+night|good\s+morning|bedtime|focus\s+mode|party\s+mode|relax\s+mode)/i, priority: 9 },
            
            // Medium priority - information requests
            { name: 'weather', pattern: /\b(weather|temperature|forecast|mausam|how\s+hot|how\s+cold)/i, priority: 7 },
            { name: 'news', pattern: /\b(news|headlines|latest|samachar|khabar)/i, priority: 7 },
            { name: 'search', pattern: /\b(search|find|lookup|who\s+is|what\s+is|where\s+is|google|youtube)/i, priority: 6 },
            { name: 'time_date', pattern: /\b(what\s+time|what\s+date|kya\s+baje|kya\s+tarikh|current\s+time)/i, priority: 7 },
            
            // Wellness and health
            { name: 'wellness', pattern: /\b(breathe|meditate|relax|stress|breathing\s+exercise|mindfulness)/i, priority: 7 },
            { name: 'health', pattern: /\b(health|steps|heart\s+rate|sleep|calories|sehat)/i, priority: 6 },
            
            // Media control
            { name: 'media_play', pattern: /\b(play|start|begin)\s+(?:music|song|track|video|lo-fi|music)/i, priority: 8 },
            { name: 'media_pause', pattern: /\b(pause|stop|halt)\s+(?:music|song|track|video|playback)/i, priority: 8 },
            { name: 'media_resume', pattern: /\b(resume|continue|play\s+again|unpause)/i, priority: 8 },
            
            // Tasks and reminders
            { name: 'task_add', pattern: /\b(add|create|new)\s+task\s+(.+)/i, priority: 8 },
            { name: 'reminder', pattern: /\b(remind|reminder|alert|notify)\s+(?:me\s+)?(?:about|to|at|in)/i, priority: 8 },
            
            // Volume control
            { name: 'volume_up', pattern: /\b(increase|turn\s+up|raise|louder|badhao|tez)\s+volume/i, priority: 7 },
            { name: 'volume_down', pattern: /\b(decrease|turn\s+down|lower|quieter|kam|dheera)\s+volume/i, priority: 7 },
            { name: 'volume_mute', pattern: /\b(mute|silence|chup|quiet)/i, priority: 7 },
            
            // System commands
            { name: 'system_status', pattern: /\b(status|how\s+are\s+you|hello|hi|namaste|kaisi\s+ho)/i, priority: 5 },
            { name: 'personality_change', pattern: /\b(switch\s+to|activate|enable|change\s+to)\s+(?:sass|focus|storyteller|professional)\s+mode/i, priority: 6 }
        ];

        // Sort by priority (higher first)
        this.intents.sort((a, b) => b.priority - a.priority);

        this.tokenizer = new WordTokenizer();
        this.sentenceTokenizer = new SentenceTokenizer();
        
        // Entity extraction patterns
        this.entityPatterns = {
            date: [
                /\b(today|tomorrow|yesterday|now)\b/i,
                /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
                /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}/i,
                /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/,
                /\b(in|at|on)\s+(\d+)\s+(minutes?|hours?|days?|weeks?)\b/i
            ],
            time: [
                /\b\d{1,2}:\d{2}\s*(?:am|pm)?\b/i,
                /\b(at|by|before|after)\s+\d{1,2}\s*(?:o\'?clock|am|pm)\b/i,
                /\b(morning|afternoon|evening|night|midnight|noon)\b/i
            ],
            location: [
                /\b(in|at|to|from)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/,
                /\b(NYC|New York|London|Mumbai|Delhi|Bangalore|Kitchen|Bedroom|Living Room|Office)\b/i
            ],
            contact: [
                /\b(to|for|contact)\s+([A-Z][a-z]+)\b/,
                /\b(mom|dad|mother|father|brother|sister|friend)\b/i
            ],
            number: [
                /\b\d+\b/
            ],
            device: [
                /\b(lights?|light|fan|ac|thermostat|tv|television|speaker|door|lock)\b/i
            ]
        };

        // Multi-intent separators
        this.multiIntentSeparators = [',', 'and', 'also', 'then', 'after that'];
    }

    /**
     * Processes raw text to extract intent and entities
     * Supports multi-part requests
     * @param {string} text - Transcribed voice input
     * @returns {Promise<Object>} NLP processing result
     */
    async process(text) {
        if (!text || typeof text !== 'string') {
            return {
                text: '',
                intent: 'unknown',
                entities: {},
                confidence: 0,
                timestamp: new Date().toISOString()
            };
        }

        console.log(`[NLP] Processing: "${text}"`);

        // Check for multi-part requests
        const multiIntents = this.detectMultiIntents(text);
        
        if (multiIntents.length > 1) {
            console.log(`[NLP] Detected ${multiIntents.length} intents in request`);
            return {
                text,
                intent: 'multi_intent',
                intents: multiIntents,
                entities: this.extractEntities(text),
                confidence: 0.85,
                timestamp: new Date().toISOString()
            };
        }

        // Single intent processing
        const result = await this.processSingleIntent(text);
        return result;
    }

    /**
     * Processes a single intent from text
     * @private
     */
    async processSingleIntent(text) {
        let matchedIntent = 'unknown';
        let confidence = 0.0;
        let matchedPattern = null;

        // Try to match intents in priority order
        for (const intent of this.intents) {
            const match = text.match(intent.pattern);
            if (match) {
                matchedIntent = intent.name;
                matchedPattern = match;
                confidence = 0.95 - (10 - intent.priority) * 0.02; // Higher priority = higher confidence
                break;
            }
        }

        // If no match found, try fuzzy matching or fallback to AI
        if (matchedIntent === 'unknown') {
            // Simple keyword-based fallback
            const keywords = this.tokenizer.tokenize(text.toLowerCase());
            const keywordMatch = this.matchByKeywords(keywords);
            if (keywordMatch) {
                matchedIntent = keywordMatch.intent;
                confidence = keywordMatch.confidence;
            }
        }

        // Extract entities
        const entities = this.extractEntities(text, matchedPattern);

        return {
            text,
            intent: matchedIntent,
            entities,
            confidence,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Detects multiple intents in a single request
     * @private
     */
    detectMultiIntents(text) {
        const intents = [];
        
        // Split by common separators
        const parts = text.split(new RegExp(this.multiIntentSeparators.join('|'), 'i'))
            .map(part => part.trim())
            .filter(part => part.length > 0);

        if (parts.length <= 1) {
            return [];
        }

        // Process each part
        for (const part of parts) {
            for (const intent of this.intents) {
                if (intent.pattern.test(part)) {
                    intents.push({
                        text: part,
                        intent: intent.name,
                        entities: this.extractEntities(part),
                        confidence: 0.9
                    });
                    break;
                }
            }
        }

        return intents;
    }

    /**
     * Extract entities from text using pattern matching
     * @param {string} text - Input text
     * @param {Array} matchedPattern - Regex match result from intent pattern
     * @returns {Object} Extracted entities
     */
    extractEntities(text, matchedPattern = null) {
        const entities = {};

        // Extract date
        for (const pattern of this.entityPatterns.date) {
            const match = text.match(pattern);
            if (match) {
                entities.date = match[0];
                break;
            }
        }

        // Extract time
        for (const pattern of this.entityPatterns.time) {
            const match = text.match(pattern);
            if (match) {
                entities.time = match[0];
                break;
            }
        }

        // Extract location
        for (const pattern of this.entityPatterns.location) {
            const match = text.match(pattern);
            if (match) {
                entities.location = match[match.length - 1]; // Get captured group
                break;
            }
        }

        // Extract contact name
        for (const pattern of this.entityPatterns.contact) {
            const match = text.match(pattern);
            if (match) {
                entities.contact = match[match.length - 1];
                break;
            }
        }

        // Extract numbers
        const numbers = text.match(/\b\d+\b/g);
        if (numbers) {
            entities.numbers = numbers.map(n => parseInt(n, 10));
            // If single number, also store as value
            if (numbers.length === 1) {
                entities.value = parseInt(numbers[0], 10);
            }
        }

        // Extract device name
        for (const pattern of this.entityPatterns.device) {
            const match = text.match(pattern);
            if (match) {
                entities.device = match[0].toLowerCase();
                break;
            }
        }

        // Extract message content (for send_message intent)
        const messageMatch = text.match(/saying\s+(.+)|message\s+(.+)/i);
        if (messageMatch) {
            entities.message = messageMatch[1] || messageMatch[2];
        }

        // Extract task text (for task_add intent)
        const taskMatch = text.match(/task\s+(.+)/i);
        if (taskMatch) {
            entities.task = taskMatch[1];
        }

        return entities;
    }

    /**
     * Fallback keyword matching when regex patterns don't match
     * @private
     */
    matchByKeywords(keywords) {
        const keywordMap = {
            'schedule': ['schedule', 'meeting', 'appointment', 'calendar'],
            'search': ['search', 'find', 'lookup'],
            'weather': ['weather', 'temperature', 'forecast'],
            'news': ['news', 'headlines', 'latest']
        };

        for (const [intent, keywordList] of Object.entries(keywordMap)) {
            const matches = keywords.filter(k => keywordList.includes(k));
            if (matches.length > 0) {
                return {
                    intent,
                    confidence: 0.7
                };
            }
        }

        return null;
    }

    /**
     * Parse natural language date/time expressions
     * @param {string} dateText - Natural language date string
     * @returns {Date|null} Parsed date or null
     */
    parseNaturalDate(dateText) {
        const now = new Date();
        const lowerText = dateText.toLowerCase();

        if (lowerText.includes('today')) {
            return now;
        }
        if (lowerText.includes('tomorrow')) {
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            return tomorrow;
        }
        if (lowerText.includes('yesterday')) {
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            return yesterday;
        }

        // Parse relative time (e.g., "in 30 minutes")
        const relativeMatch = dateText.match(/(\d+)\s+(minutes?|hours?|days?)/i);
        if (relativeMatch) {
            const value = parseInt(relativeMatch[1], 10);
            const unit = relativeMatch[2].toLowerCase();
            const result = new Date(now);

            if (unit.startsWith('minute')) {
                result.setMinutes(result.getMinutes() + value);
            } else if (unit.startsWith('hour')) {
                result.setHours(result.getHours() + value);
            } else if (unit.startsWith('day')) {
                result.setDate(result.getDate() + value);
            }

            return result;
        }

        return null;
    }
}

// Example usage:
// const processor = new NLPProcessor();
// const result = await processor.process('Book a flight to NYC, find a hotel near Central Park');
// console.log(result); // { intent: 'multi_intent', intents: [...], ... }
