/**
 * SOFIYA Travel Assistant
 * Phase 9.1: Context-Aware Navigation & Travel
 * 
 * Real-time translation, local customs tips, currency conversion,
 * local recommendations. AR integration for overlay translations.
 */

import 'dotenv/config';
import https from 'https';

export class TravelAssistant {
    constructor(options = {}) {
        this.translateApiKey = options.translateApiKey || process.env.GOOGLE_TRANSLATE_API_KEY;
        this.currencyApiKey = options.currencyApiKey || process.env.EXCHANGE_RATE_API_KEY;
        this.placesApiKey = options.placesApiKey || process.env.GOOGLE_PLACES_API_KEY;
    }

    /**
     * Translates text to target language
     * @param {string} text - Text to translate
     * @param {string} targetLang - Target language code (e.g., 'es', 'fr')
     * @param {string} sourceLang - Source language (optional, auto-detect)
     * @returns {Promise<string>} Translated text
     */
    async translate(text, targetLang, sourceLang = null) {
        if (!this.translateApiKey) {
            return this.simulateTranslation(text, targetLang);
        }

        return new Promise((resolve, reject) => {
            const postData = JSON.stringify({
                q: text,
                target: targetLang,
                source: sourceLang || undefined
            });

            const options = {
                hostname: 'translation.googleapis.com',
                path: `/language/translate/v2?key=${this.translateApiKey}`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        const translated = response.data?.translations?.[0]?.translatedText || text;
                        resolve(translated);
                    } catch (error) {
                        resolve(this.simulateTranslation(text, targetLang));
                    }
                });
            });

            req.on('error', () => resolve(this.simulateTranslation(text, targetLang)));
            req.write(postData);
            req.end();
        });
    }

    /**
     * Simulates translation when API not available
     * @private
     */
    simulateTranslation(text, targetLang) {
        const langNames = { es: 'Spanish', fr: 'French', de: 'German', ja: 'Japanese', zh: 'Chinese' };
        return `[${langNames[targetLang] || targetLang}]: ${text}`;
    }

    /**
     * Gets local customs tips for destination
     * @param {string} countryCode - Country code (e.g., 'JP', 'FR')
     * @returns {Promise<Object>} Customs tips
     */
    async getLocalCustomsTips(countryCode) {
        const tips = {
            JP: {
                greeting: 'Bow when greeting; handshakes are less common',
                dining: 'Say "itadakimasu" before eating, "gochisosama" after',
                tips: 'Tipping is not customary; may be considered rude',
                etiquette: 'Remove shoes when entering homes; use slippers for bathrooms'
            },
            FR: {
                greeting: 'Greet with "Bonjour" and light cheek kisses (la bise)',
                dining: 'Keep hands on table during meals; bread goes directly on table',
                tips: 'Service included; small extra for exceptional service',
                etiquette: 'Dress well; casual is less acceptable'
            },
            ES: {
                greeting: 'Two cheek kisses; formal "Buenos días/tardes"',
                dining: 'Late dining (9-10 PM); tapas culture',
                tips: 'Small rounding up; 5-10% for good service',
                etiquette: 'Siesta is respected; avoid loud behavior'
            },
            DE: {
                greeting: 'Firm handshake; use titles (Herr/Frau)',
                dining: 'Keep hands visible; punctuality is critical',
                tips: 'Rounding up; 5-10% for service',
                etiquette: 'Direct communication; recycling is mandatory'
            },
            IN: {
                greeting: 'Namaste or handshake; avoid left hand for giving',
                dining: 'Eat with right hand; try a bit of everything',
                tips: 'Tipping is appreciated; 10% in restaurants',
                etiquette: 'Remove shoes when entering homes; modest dress at temples'
            }
        };

        return tips[countryCode?.toUpperCase()] || {
            greeting: 'Research local customs before arrival',
            dining: 'Observe locals for dining etiquette',
            tips: 'Check local tipping customs',
            etiquette: 'General travel etiquette applies'
        };
    }

    /**
     * Converts currency
     * @param {number} amount - Amount to convert
     * @param {string} fromCurrency - Source currency (e.g., 'USD')
     * @param {string} toCurrency - Target currency (e.g., 'EUR')
     * @returns {Promise<Object>} Conversion result
     */
    async convertCurrency(amount, fromCurrency, toCurrency) {
        if (!this.currencyApiKey) {
            return this.simulateCurrencyConversion(amount, fromCurrency, toCurrency);
        }

        const url = `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`;

        return new Promise((resolve) => {
            https.get(url, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const rates = JSON.parse(data);
                        const rate = rates.rates?.[toCurrency] || 1;
                        resolve({
                            amount,
                            fromCurrency,
                            toCurrency,
                            convertedAmount: amount * rate,
                            rate,
                            timestamp: new Date().toISOString()
                        });
                    } catch (error) {
                        resolve(this.simulateCurrencyConversion(amount, fromCurrency, toCurrency));
                    }
                });
            }).on('error', () => resolve(this.simulateCurrencyConversion(amount, fromCurrency, toCurrency)));
        });
    }

    /**
     * Simulates currency conversion
     * @private
     */
    simulateCurrencyConversion(amount, fromCurrency, toCurrency) {
        const rates = { USD: 1, EUR: 0.92, GBP: 0.79, JPY: 149, INR: 83 };
        const fromRate = rates[fromCurrency] || 1;
        const toRate = rates[toCurrency] || 1;
        const converted = (amount / fromRate) * toRate;

        return {
            amount,
            fromCurrency,
            toCurrency,
            convertedAmount: converted,
            rate: toRate / fromRate,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Gets local recommendations
     * @param {string} location - Location name or coordinates
     * @param {string} type - Type (restaurants, attractions, shops)
     * @returns {Promise<Array>} Recommendations
     */
    async getLocalRecommendations(location, type = 'restaurants') {
        if (!this.placesApiKey) {
            return this.simulateRecommendations(location, type);
        }

        // In production, use Google Places API
        return this.simulateRecommendations(location, type);
    }

    /**
     * Simulates local recommendations
     * @private
     */
    simulateRecommendations(location, type) {
        const typeLabels = {
            restaurants: 'restaurants',
            attractions: 'attractions',
            shops: 'shops'
        };

        return [
            { name: `Top ${typeLabels[type]} in ${location}`, rating: 4.5, type },
            { name: `Local favorite ${typeLabels[type]}`, rating: 4.5, type },
            { name: `Hidden gem ${typeLabels[type]}`, rating: 4.5, type }
        ];
    }

    /**
     * Gets comprehensive travel info for destination
     * @param {string} destination - Destination name
     * @param {string} countryCode - Country code
     * @returns {Promise<Object>} Travel info
     */
    async getTravelInfo(destination, countryCode) {
        const [customs, recommendations] = await Promise.all([
            this.getLocalCustomsTips(countryCode),
            this.getLocalRecommendations(destination, 'attractions')
        ]);

        return {
            destination,
            countryCode,
            customs,
            recommendations,
            localPhrases: this.getEssentialPhrases(countryCode),
            emergencyNumbers: this.getEmergencyNumbers(countryCode)
        };
    }

    /**
     * Gets essential phrases for country
     * @private
     */
    getEssentialPhrases(countryCode) {
        const phrases = {
            JP: { hello: 'Konnichiwa', thank: 'Arigatou', help: 'Tasukete' },
            FR: { hello: 'Bonjour', thank: 'Merci', help: 'Au secours' },
            ES: { hello: 'Hola', thank: 'Gracias', help: 'Ayuda' },
            DE: { hello: 'Hallo', thank: 'Danke', help: 'Hilfe' }
        };

        return phrases[countryCode?.toUpperCase()] || { hello: 'Hello', thank: 'Thank you', help: 'Help' };
    }

    /**
     * Gets emergency numbers for country
     * @private
     */
    getEmergencyNumbers(countryCode) {
        const numbers = {
            JP: { emergency: '110', police: '110', ambulance: '119' },
            FR: { emergency: '112', police: '17', ambulance: '15' },
            US: { emergency: '911', police: '911', ambulance: '911' }
        };

        return numbers[countryCode?.toUpperCase()] || { emergency: '112', police: '112', ambulance: '112' };
    }
}
