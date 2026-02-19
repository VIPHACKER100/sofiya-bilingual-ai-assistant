/**
 * SOFIYA Ambient Listener
 * Phase 18.3: Privacy-Respecting Passive Listening
 * 
 * Lightweight continuous audio processing (opt-in only).
 * Detects keywords for privacy-respecting insights without recording/storage.
 */

import 'dotenv/config';
import { WakeWordDetector } from './wake-word-detector.js';

export class AmbientListener {
    constructor(options = {}) {
        this.enabled = options.enabled || false;
        this.wakeWordDetector = options.wakeWordDetector || null;
        this.onInsight = options.onInsight || null;
        
        // Keyword patterns for insights (privacy-respecting)
        this.keywordPatterns = {
            'tired': {
                pattern: /\b(tired|exhausted|sleepy|drained|worn out)\b/i,
                action: 'suggest_rest',
                insight: 'User seems tired'
            },
            'stressed': {
                pattern: /\b(stressed|overwhelmed|pressure|anxious|worried)\b/i,
                action: 'suggest_breathing',
                insight: 'User seems stressed'
            },
            'rain': {
                pattern: /\b(raining|rain|umbrella|wet|storm)\b/i,
                action: 'remind_umbrella',
                insight: 'User mentioned rain'
            },
            'store': {
                pattern: /\b(store|shopping|grocery|market|buy)\b/i,
                action: 'show_shopping_list',
                insight: 'User at store'
            },
            'hungry': {
                pattern: /\b(hungry|food|eat|meal|lunch|dinner)\b/i,
                action: 'suggest_meal',
                insight: 'User seems hungry'
            },
            'meeting': {
                pattern: /\b(meeting|appointment|call|conference)\b/i,
                action: 'check_calendar',
                insight: 'User mentioned meeting'
            }
        };

        // Processing state
        this.isProcessing = false;
        this.audioBuffer = [];
        this.processingInterval = null;
    }

    /**
     * Enables ambient listening
     * @param {Function} onInsight - Callback when insight detected
     */
    async enable(onInsight = null) {
        if (this.enabled) {
            return;
        }

        if (onInsight) {
            this.onInsight = onInsight;
        }

        this.enabled = true;
        console.log('[AmbientListener] Enabled (privacy-respecting mode)');

        // Start processing audio stream
        await this.startProcessing();
    }

    /**
     * Disables ambient listening
     */
    disable() {
        if (!this.enabled) {
            return;
        }

        this.enabled = false;
        this.stopProcessing();
        console.log('[AmbientListener] Disabled');
    }

    /**
     * Starts audio processing
     * @private
     */
    async startProcessing() {
        // In production, this would:
        // 1. Start microphone capture
        // 2. Process audio in small chunks
        // 3. Detect keywords without storing audio
        // 4. Trigger insights when keywords detected

        // For now, simulate with periodic checks
        // In production, use Web Audio API or similar
        console.log('[AmbientListener] Started processing (simulated)');
    }

    /**
     * Stops audio processing
     * @private
     */
    stopProcessing() {
        if (this.processingInterval) {
            clearInterval(this.processingInterval);
            this.processingInterval = null;
        }
        this.audioBuffer = [];
        console.log('[AmbientListener] Stopped processing');
    }

    /**
     * Processes audio chunk (called from audio stream)
     * @param {Buffer} audioChunk - Audio data chunk
     */
    async processAudioChunk(audioChunk) {
        if (!this.enabled || this.isProcessing) {
            return;
        }

        this.isProcessing = true;

        try {
            // In production, transcribe audio chunk
            // For now, simulate transcription
            // const transcript = await this.transcribeChunk(audioChunk);
            
            // For demonstration, we'll process text input
            // In real implementation, audioChunk would be transcribed first
            const transcript = ''; // Would come from STT

            if (transcript) {
                await this.analyzeTranscript(transcript);
            }
        } catch (error) {
            console.error('[AmbientListener] Error processing chunk:', error);
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Analyzes transcript for keywords (without storing)
     * @private
     */
    async analyzeTranscript(transcript) {
        // Check for keyword patterns
        for (const [keyword, config] of Object.entries(this.keywordPatterns)) {
            if (config.pattern.test(transcript)) {
                // Keyword detected - trigger insight
                await this.triggerInsight(config, transcript);
                break; // Only trigger one insight per transcript
            }
        }

        // Clear transcript immediately (privacy)
        // Transcript is never stored, only processed
    }

    /**
     * Triggers insight action
     * @private
     */
    async triggerInsight(config, transcript) {
        console.log(`[AmbientListener] Insight detected: ${config.insight}`);

        if (this.onInsight) {
            await this.onInsight({
                keyword: config.keyword,
                action: config.action,
                insight: config.insight,
                context: transcript.substring(0, 50) // Only store snippet
            });
        }

        // Execute action
        await this.executeAction(config.action);
    }

    /**
     * Executes insight action
     * @private
     */
    async executeAction(action) {
        switch (action) {
            case 'suggest_rest':
                // Suggest rest break
                console.log('[AmbientListener] Action: Suggest rest break');
                break;

            case 'suggest_breathing':
                // Suggest breathing exercise
                console.log('[AmbientListener] Action: Suggest breathing exercise');
                break;

            case 'remind_umbrella':
                // Remind about umbrella
                console.log('[AmbientListener] Action: Remind about umbrella');
                break;

            case 'show_shopping_list':
                // Show shopping list
                console.log('[AmbientListener] Action: Show shopping list');
                break;

            case 'suggest_meal':
                // Suggest meal options
                console.log('[AmbientListener] Action: Suggest meal');
                break;

            case 'check_calendar':
                // Check calendar for meetings
                console.log('[AmbientListener] Action: Check calendar');
                break;

            default:
                console.log(`[AmbientListener] Unknown action: ${action}`);
        }
    }

    /**
     * Adds custom keyword pattern
     * @param {string} keyword - Keyword identifier
     * @param {RegExp} pattern - Pattern to match
     * @param {string} action - Action to trigger
     * @param {string} insight - Insight description
     */
    addKeywordPattern(keyword, pattern, action, insight) {
        this.keywordPatterns[keyword] = {
            pattern,
            action,
            insight
        };
    }

    /**
     * Removes keyword pattern
     * @param {string} keyword - Keyword identifier
     */
    removeKeywordPattern(keyword) {
        delete this.keywordPatterns[keyword];
    }

    /**
     * Gets privacy status
     * @returns {Object} Privacy information
     */
    getPrivacyStatus() {
        return {
            enabled: this.enabled,
            recording: false, // Never recording
            storing: false, // Never storing audio
            processing: 'local', // Process locally only
            keywordsOnly: true, // Only detect keywords, not full transcription
            dataRetention: 0 // No data retention
        };
    }
}

// Example usage:
// const listener = new AmbientListener({
//     enabled: false, // Opt-in only
//     onInsight: async (insight) => {
//         console.log('Insight:', insight);
//         // Trigger appropriate action
//     }
// });
// await listener.enable();
// // Audio processing happens automatically
// listener.disable();
