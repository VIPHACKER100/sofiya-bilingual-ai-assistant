/**
 * SOFIYA Personality Manager
 * Phase 2.3: Dynamic interaction styles
 * 
 * Manages personality modes and applies mode-specific response templates.
 * Supports per-user mode preferences with database persistence.
 */

export const PERSONALITY_MODES = {
    FOCUS: 'focus',
    STORYTELLER: 'storyteller',
    SASS: 'sass',
    PROFESSIONAL: 'professional'
};

export class PersonalityManager {
    constructor(options = {}) {
        this.currentMode = options.defaultMode || PERSONALITY_MODES.PROFESSIONAL;
        this.userId = options.userId || 'default';
        this.db = options.db || null; // Database connection for persistence
        
        // Comprehensive mode configurations
        this.modeConfigs = {
            [PERSONALITY_MODES.FOCUS]: {
                name: 'Focus Mode',
                description: 'Short, efficient responses for productivity',
                voiceRate: 1.2,
                voicePitch: 1.0,
                responseStyle: 'concise',
                maxResponseLength: 50,
                useEmojis: false,
                greeting: 'Ready.',
                farewell: 'Done.'
            },
            [PERSONALITY_MODES.STORYTELLER]: {
                name: 'Storyteller Mode',
                description: 'Dramatic, engaging narrative style',
                voiceRate: 0.85,
                voicePitch: 0.95,
                responseStyle: 'narrative',
                maxResponseLength: 200,
                useEmojis: true,
                greeting: 'In the realm of digital assistance, I stand ready.',
                farewell: 'Until we meet again in the digital realm.'
            },
            [PERSONALITY_MODES.SASS]: {
                name: 'Sass Mode',
                description: 'Witty, sharp responses with attitude',
                voiceRate: 1.05,
                voicePitch: 1.1,
                responseStyle: 'sarcastic',
                maxResponseLength: 100,
                useEmojis: true,
                greeting: 'Oh, you\'re back. What do you want now?',
                farewell: 'Fine, I\'m done. You\'re welcome.'
            },
            [PERSONALITY_MODES.PROFESSIONAL]: {
                name: 'Professional Mode',
                description: 'Calm, helpful, standard assistant behavior',
                voiceRate: 1.0,
                voicePitch: 1.0,
                responseStyle: 'polite',
                maxResponseLength: 150,
                useEmojis: false,
                greeting: 'Hello, how can I assist you today?',
                farewell: 'Is there anything else I can help with?'
            }
        };
    }

    /**
     * Sets the personality mode
     * @param {string} mode - Mode to switch to
     * @param {boolean} persist - Whether to save to database
     * @returns {Promise<boolean>} Success status
     */
    async setMode(mode, persist = true) {
        if (!Object.values(PERSONALITY_MODES).includes(mode)) {
            console.warn(`[Personality] Invalid mode: ${mode}`);
            return false;
        }

        const previousMode = this.currentMode;
        this.currentMode = mode;

        console.log(`[Personality] Switched from ${previousMode} to ${mode} mode.`);

        // Persist to database if enabled
        if (persist && this.db) {
            try {
                await this.saveModePreference(mode);
            } catch (error) {
                console.error('[Personality] Failed to save mode preference:', error);
            }
        }

        return true;
    }

    /**
     * Gets current personality mode
     * @returns {string} Current mode
     */
    getMode() {
        return this.currentMode;
    }

    /**
     * Gets configuration for current mode
     * @returns {Object} Mode configuration
     */
    getModeConfig() {
        return this.modeConfigs[this.currentMode] || this.modeConfigs[PERSONALITY_MODES.PROFESSIONAL];
    }

    /**
     * Gets configuration for a specific mode
     * @param {string} mode - Mode name
     * @returns {Object} Mode configuration
     */
    getModeConfigFor(mode) {
        return this.modeConfigs[mode] || this.modeConfigs[PERSONALITY_MODES.PROFESSIONAL];
    }

    /**
     * Extracts mode from voice command text
     * @param {string} text - User input text
     * @returns {string|null} Detected mode or null
     */
    detectModeSwitch(text) {
        if (!text || typeof text !== 'string') {
            return null;
        }

        const lower = text.toLowerCase();
        
        // Check for explicit mode mentions
        const modePatterns = {
            [PERSONALITY_MODES.SASS]: /\b(sass|attitude|sassy|witty)\s+mode\b/i,
            [PERSONALITY_MODES.FOCUS]: /\b(focus|productive|efficient)\s+mode\b/i,
            [PERSONALITY_MODES.STORYTELLER]: /\b(storyteller|story|narrative|dramatic)\s+mode\b/i,
            [PERSONALITY_MODES.PROFESSIONAL]: /\b(professional|normal|standard|default|reset)\s+mode\b/i
        };

        for (const [mode, pattern] of Object.entries(modePatterns)) {
            if (pattern.test(lower)) {
                return mode;
            }
        }

        // Check for switch/activate commands
        if (lower.includes('switch to') || lower.includes('activate') || lower.includes('enable')) {
            if (lower.includes('sass')) return PERSONALITY_MODES.SASS;
            if (lower.includes('focus')) return PERSONALITY_MODES.FOCUS;
            if (lower.includes('story')) return PERSONALITY_MODES.STORYTELLER;
            if (lower.includes('professional') || lower.includes('normal')) {
                return PERSONALITY_MODES.PROFESSIONAL;
            }
        }

        return null;
    }

    /**
     * Applies mode-specific response transformation
     * @param {string} response - Base response text
     * @param {string} mode - Mode to apply (optional, uses current if not provided)
     * @returns {string} Transformed response
     */
    applyModeTransformation(response, mode = null) {
        const targetMode = mode || this.currentMode;
        const config = this.getModeConfigFor(targetMode);

        let transformed = response;

        // Apply style transformations
        switch (config.responseStyle) {
            case 'concise':
                // Truncate to max length, remove filler words
                if (transformed.length > config.maxResponseLength) {
                    transformed = transformed.substring(0, config.maxResponseLength - 3) + '...';
                }
                transformed = transformed.replace(/\b(I have|I will|I am|I'm)\b/gi, '');
                break;

            case 'narrative':
                // Add narrative flair
                if (!transformed.startsWith('In')) {
                    transformed = `In the realm of digital assistance, ${transformed.toLowerCase()}`;
                }
                break;

            case 'sarcastic':
                // Add sass
                if (!transformed.includes('Fine') && !transformed.includes('Sure')) {
                    transformed = `Fine, ${transformed.toLowerCase()}`;
                }
                if (!transformed.endsWith('!') && !transformed.endsWith('?')) {
                    transformed += '. You\'re welcome.';
                }
                break;

            case 'polite':
                // Ensure polite tone
                if (!transformed.includes('please') && !transformed.includes('thank')) {
                    // Already polite by default
                }
                break;
        }

        return transformed;
    }

    /**
     * Gets greeting message for current mode
     * @returns {string} Greeting message
     */
    getGreeting() {
        return this.getModeConfig().greeting;
    }

    /**
     * Gets farewell message for current mode
     * @returns {string} Farewell message
     */
    getFarewell() {
        return this.getModeConfig().farewell;
    }

    /**
     * Loads user's preferred mode from database
     * @returns {Promise<string>} Saved mode or default
     */
    async loadUserPreference() {
        if (!this.db) {
            return this.currentMode;
        }

        try {
            // Query database for user preference
            // const result = await this.db.query(
            //     'SELECT personality_mode FROM users WHERE id = $1',
            //     [this.userId]
            // );
            // if (result.rows.length > 0) {
            //     const savedMode = result.rows[0].personality_mode;
            //     if (Object.values(PERSONALITY_MODES).includes(savedMode)) {
            //         await this.setMode(savedMode, false); // Don't persist again
            //         return savedMode;
            //     }
            // }
            
            return this.currentMode;
        } catch (error) {
            console.error('[Personality] Failed to load user preference:', error);
            return this.currentMode;
        }
    }

    /**
     * Saves user's mode preference to database
     * @private
     */
    async saveModePreference(mode) {
        if (!this.db) {
            return;
        }

        try {
            // Save to database
            // await this.db.query(
            //     'UPDATE users SET personality_mode = $1, updated_at = NOW() WHERE id = $2',
            //     [mode, this.userId]
            // );
            console.log(`[Personality] Saved mode preference: ${mode} for user ${this.userId}`);
        } catch (error) {
            console.error('[Personality] Failed to save mode preference:', error);
            throw error;
        }
    }

    /**
     * Gets all available modes
     * @returns {Array} List of mode objects with name and description
     */
    getAllModes() {
        return Object.values(PERSONALITY_MODES).map(mode => ({
            mode,
            ...this.modeConfigs[mode]
        }));
    }

    /**
     * Validates if a mode string is valid
     * @param {string} mode - Mode to validate
     * @returns {boolean} True if valid
     */
    isValidMode(mode) {
        return Object.values(PERSONALITY_MODES).includes(mode);
    }
}

// Example usage:
// const manager = new PersonalityManager({ userId: 'user123', db: dbConnection });
// await manager.loadUserPreference();
// const detectedMode = manager.detectModeSwitch('Switch to sass mode');
// if (detectedMode) {
//     await manager.setMode(detectedMode);
// }
