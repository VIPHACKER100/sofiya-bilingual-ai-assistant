/**
 * SOFIYA Language Manager
 * Phase 18.1: Multi-Language Support
 * 
 * Detects language automatically, supports 5+ languages,
 * maintains context across language switches, and stores user preferences.
 */

import 'dotenv/config';
import { createClient } from 'pg';

export class LanguageManager {
    constructor(options = {}) {
        this.db = options.db || null;
        this.supportedLanguages = {
            'en': { code: 'en-US', name: 'English', nativeName: 'English' },
            'hi': { code: 'hi-IN', name: 'Hindi', nativeName: 'हिंदी' },
            'es': { code: 'es-ES', name: 'Spanish', nativeName: 'Español' },
            'fr': { code: 'fr-FR', name: 'French', nativeName: 'Français' },
            'de': { code: 'de-DE', name: 'German', nativeName: 'Deutsch' },
            'zh': { code: 'zh-CN', name: 'Mandarin', nativeName: '中文' },
            'ja': { code: 'ja-JP', name: 'Japanese', nativeName: '日本語' }
        };

        // Language detection patterns
        this.detectionPatterns = {
            'en': [
                /\b(the|and|or|but|in|on|at|to|for|of|with|by)\b/gi,
                /\b(is|are|was|were|have|has|had|do|does|did|will|would|can|could)\b/gi
            ],
            'hi': [
                /\b(करो|है|क्या|कैसे|में|को|का|की|से|पर)\b/gi,
                /\b(नमस्ते|धन्यवाद|हाँ|नहीं|ठीक|अच्छा)\b/gi
            ],
            'es': [
                /\b(el|la|los|las|de|del|en|con|por|para|que|y|o)\b/gi,
                /\b(es|son|está|están|tiene|tienen|hacer|hacerlo)\b/gi
            ],
            'fr': [
                /\b(le|la|les|de|du|des|en|avec|pour|par|que|et|ou)\b/gi,
                /\b(est|sont|être|avoir|faire|aller|venir)\b/gi
            ],
            'de': [
                /\b(der|die|das|den|dem|des|und|oder|mit|von|zu|für)\b/gi,
                /\b(ist|sind|sein|haben|werden|können|müssen)\b/gi
            ],
            'zh': [
                /[\u4e00-\u9fff]+/g, // Chinese characters
                /\b(的|是|在|有|和|或|与|为|了|着)\b/gi
            ],
            'ja': [
                /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+/g, // Hiragana, Katakana, Kanji
                /\b(です|ます|する|ある|いる|の|を|に|が|は)\b/gi
            ]
        };

        // Translation cache
        this.translationCache = new Map();
    }

    /**
     * Detects language from text
     * @param {string} text - Input text
     * @returns {string} Detected language code
     */
    detectLanguage(text) {
        if (!text || typeof text !== 'string') {
            return 'en'; // Default to English
        }

        const scores = {};

        // Score each language
        Object.keys(this.detectionPatterns).forEach(lang => {
            scores[lang] = 0;
            const patterns = this.detectionPatterns[lang];

            patterns.forEach(pattern => {
                const matches = text.match(pattern);
                if (matches) {
                    scores[lang] += matches.length;
                }
            });

            // Bonus for character set matches (Chinese, Japanese)
            if (lang === 'zh' || lang === 'ja') {
                const charPattern = this.detectionPatterns[lang][0];
                if (charPattern.test(text)) {
                    scores[lang] += 10; // Strong indicator
                }
            }
        });

        // Find language with highest score
        let maxScore = 0;
        let detectedLang = 'en';

        Object.entries(scores).forEach(([lang, score]) => {
            if (score > maxScore) {
                maxScore = score;
                detectedLang = lang;
            }
        });

        // If no strong match, default to English
        if (maxScore === 0) {
            return 'en';
        }

        return detectedLang;
    }

    /**
     * Gets user's preferred language
     * @param {string} userId - User ID
     * @returns {Promise<string>} Preferred language code
     */
    async getUserLanguage(userId) {
        if (!this.db) {
            return 'en'; // Default
        }

        try {
            const query = `
                SELECT language_preference
                FROM users
                WHERE id = $1
            `;

            const result = await this.db.query(query, [userId]);
            if (result.rows.length > 0 && result.rows[0].language_preference) {
                return result.rows[0].language_preference;
            }
        } catch (error) {
            console.error('[LanguageManager] Error fetching user language:', error);
        }

        return 'en'; // Default
    }

    /**
     * Sets user's preferred language
     * @param {string} userId - User ID
     * @param {string} languageCode - Language code
     */
    async setUserLanguage(userId, languageCode) {
        if (!this.supportedLanguages[languageCode]) {
            throw new Error(`Unsupported language: ${languageCode}`);
        }

        if (!this.db) {
            return;
        }

        try {
            const query = `
                UPDATE users
                SET language_preference = $1, updated_at = NOW()
                WHERE id = $2
            `;

            await this.db.query(query, [languageCode, userId]);
            console.log(`[LanguageManager] Set language preference for ${userId}: ${languageCode}`);
        } catch (error) {
            console.error('[LanguageManager] Error setting user language:', error);
            throw error;
        }
    }

    /**
     * Gets language configuration for speech recognition
     * @param {string} languageCode - Language code
     * @returns {Object} Language configuration
     */
    getLanguageConfig(languageCode) {
        const lang = this.supportedLanguages[languageCode] || this.supportedLanguages['en'];
        
        return {
            code: lang.code,
            name: lang.name,
            nativeName: lang.nativeName,
            speechRecognition: lang.code,
            textToSpeech: lang.code,
            // Add language-specific NLP models if available
            nlpModel: `nlp_model_${languageCode}`
        };
    }

    /**
     * Translates text between languages
     * @param {string} text - Text to translate
     * @param {string} fromLang - Source language code
     * @param {string} toLang - Target language code
     * @returns {Promise<string>} Translated text
     */
    async translate(text, fromLang, toLang) {
        if (fromLang === toLang) {
            return text;
        }

        // Check cache
        const cacheKey = `${fromLang}:${toLang}:${text}`;
        if (this.translationCache.has(cacheKey)) {
            return this.translationCache.get(cacheKey);
        }

        // In production, use Google Translate API or similar
        // For now, return placeholder
        try {
            // const translation = await googleTranslate.translate(text, {
            //     from: fromLang,
            //     to: toLang
            // });
            
            // Placeholder: return text with language marker
            const translation = `[${toLang}] ${text}`;
            
            // Cache translation
            this.translationCache.set(cacheKey, translation);
            
            // Limit cache size
            if (this.translationCache.size > 1000) {
                const firstKey = this.translationCache.keys().next().value;
                this.translationCache.delete(firstKey);
            }

            return translation;
        } catch (error) {
            console.error('[LanguageManager] Translation error:', error);
            return text; // Return original on error
        }
    }

    /**
     * Maintains context across language switches
     * @param {string} userId - User ID
     * @param {string} currentLang - Current language
     * @param {string} previousLang - Previous language
     * @param {Object} context - Conversation context
     * @returns {Promise<Object>} Translated context
     */
    async maintainContext(userId, currentLang, previousLang, context) {
        if (currentLang === previousLang) {
            return context;
        }

        // Translate key context elements
        const translatedContext = { ...context };

        if (context.lastIntent) {
            translatedContext.lastIntent = await this.translate(
                context.lastIntent,
                previousLang,
                currentLang
            );
        }

        if (context.lastEntities) {
            const translatedEntities = {};
            for (const [key, value] of Object.entries(context.lastEntities)) {
                if (typeof value === 'string') {
                    translatedEntities[key] = await this.translate(value, previousLang, currentLang);
                } else {
                    translatedEntities[key] = value;
                }
            }
            translatedContext.lastEntities = translatedEntities;
        }

        return translatedContext;
    }

    /**
     * Gets all supported languages
     * @returns {Array} List of supported languages
     */
    getSupportedLanguages() {
        return Object.values(this.supportedLanguages);
    }

    /**
     * Checks if language is supported
     * @param {string} languageCode - Language code
     * @returns {boolean} True if supported
     */
    isSupported(languageCode) {
        return languageCode in this.supportedLanguages;
    }

    /**
     * Gets language name in user's preferred language
     * @param {string} languageCode - Language code
     * @param {string} userLang - User's preferred language
     * @returns {string} Language name
     */
    getLanguageName(languageCode, userLang = 'en') {
        const lang = this.supportedLanguages[languageCode];
        if (!lang) {
            return languageCode;
        }

        // Return native name if user speaks that language, otherwise English name
        return userLang === languageCode ? lang.nativeName : lang.name;
    }
}

// Example usage:
// const langManager = new LanguageManager({ db: dbConnection });
// const detected = langManager.detectLanguage('नमस्ते, कैसे हो?');
// const config = langManager.getLanguageConfig('hi');
// await langManager.setUserLanguage('user123', 'hi');
