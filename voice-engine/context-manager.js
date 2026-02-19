/**
 * SOFIYA Contextual Memory Module
 * Phase 1.4: Conversation history and context tracking
 * 
 * Uses Redis for fast, scalable conversation history storage.
 * Maintains last 5-10 messages in memory for context-aware responses.
 */

import 'dotenv/config';
import { createClient } from 'redis';

export class ContextManager {
    constructor(options = {}) {
        this.memoryLimit = options.memoryLimit || 10;
        this.userId = options.userId || 'default';
        this.redisClient = null;
        this.useRedis = options.useRedis !== false; // Default to true
        this.history = []; // Fallback in-memory storage
        
        // Redis connection config
        this.redisConfig = {
            url: process.env.REDIS_URL || 'redis://localhost:6379',
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 10) {
                        console.error('[ContextManager] Redis reconnection failed after 10 retries');
                        return new Error('Redis connection failed');
                    }
                    return Math.min(retries * 50, 1000);
                }
            }
        };
    }

    /**
     * Initializes Redis connection
     */
    async initialize() {
        if (!this.useRedis) {
            console.log('[ContextManager] Using in-memory storage (Redis disabled)');
            return;
        }

        try {
            console.log('[ContextManager] Connecting to Redis...');
            this.redisClient = createClient(this.redisConfig);
            
            this.redisClient.on('error', (err) => {
                console.error('[ContextManager] Redis error:', err);
                this.useRedis = false; // Fallback to in-memory
            });

            this.redisClient.on('connect', () => {
                console.log('[ContextManager] Redis connected');
            });

            await this.redisClient.connect();
            console.log('[ContextManager] Redis initialized successfully');
        } catch (error) {
            console.warn('[ContextManager] Redis connection failed, using in-memory storage:', error.message);
            this.useRedis = false;
        }
    }

    /**
     * Adds a new turn to the conversation history
     * @param {string} userRequest - User's input text
     * @param {object} processedResponse - SOFIYA's response object
     */
    async saveTurn(userRequest, processedResponse) {
        const turn = {
            user: userRequest,
            sofiya: processedResponse,
            timestamp: Date.now(),
            sessionId: this.userId
        };

        if (this.useRedis && this.redisClient?.isOpen) {
            try {
                const key = `context:${this.userId}`;
                const serializedTurn = JSON.stringify(turn);
                
                // Add to Redis list (left push to maintain order)
                await this.redisClient.lPush(key, serializedTurn);
                
                // Trim list to memory limit
                await this.redisClient.lTrim(key, 0, this.memoryLimit - 1);
                
                // Set expiration (1 hour)
                await this.redisClient.expire(key, 3600);
            } catch (error) {
                console.error('[ContextManager] Error saving to Redis:', error);
                // Fallback to in-memory
                this.history.push(turn);
                if (this.history.length > this.memoryLimit) {
                    this.history.shift();
                }
            }
        } else {
            // In-memory storage
            this.history.push(turn);
            if (this.history.length > this.memoryLimit) {
                this.history.shift();
            }
        }
    }

    /**
     * Retrieves the recent conversation context
     * @param {number} limit - Number of recent turns to retrieve
     * @returns {Array} Array of conversation turns
     */
    async getContext(limit = this.memoryLimit) {
        if (this.useRedis && this.redisClient?.isOpen) {
            try {
                const key = `context:${this.userId}`;
                const rawTurns = await this.redisClient.lRange(key, 0, limit - 1);
                
                return rawTurns
                    .map(turn => JSON.parse(turn))
                    .reverse(); // Reverse to get chronological order (oldest first)
            } catch (error) {
                console.error('[ContextManager] Error retrieving from Redis:', error);
                return this.history.slice(-limit);
            }
        } else {
            return this.history.slice(-limit);
        }
    }

    /**
     * Clears context for a new session
     */
    async clear() {
        if (this.useRedis && this.redisClient?.isOpen) {
            try {
                const key = `context:${this.userId}`;
                await this.redisClient.del(key);
            } catch (error) {
                console.error('[ContextManager] Error clearing Redis:', error);
            }
        }
        
        this.history = [];
        console.log('[ContextManager] Context cleared');
    }

    /**
     * Resolves pronouns or missing entities based on history
     * Links current request to previous conversation context
     * @param {string} currentText - Current user input
     * @returns {string} Resolved text with context applied
     */
    async resolveContextualEntities(currentText) {
        const context = await this.getContext(5); // Get last 5 turns
        
        if (context.length === 0) {
            return currentText;
        }

        let resolvedText = currentText;
        const lastTurn = context[context.length - 1];

        // Resolve pronouns
        // "How did that meeting go?" -> "How did the meeting with John go?"
        if (currentText.toLowerCase().includes('that meeting') && lastTurn?.sofiya?.data?.meeting) {
            resolvedText = currentText.replace(/that meeting/i, `the meeting with ${lastTurn.sofiya.data.meeting}`);
        }

        // Resolve "it" references
        if (currentText.toLowerCase().includes('how did it go') && lastTurn?.user) {
            const lastIntent = lastTurn.sofiya?.intent || '';
            resolvedText = currentText.replace(/it/i, lastIntent);
        }

        // Resolve location references
        // "What's the weather?" -> "What's the weather in NYC?" (if previous context mentioned NYC)
        if (currentText.toLowerCase().includes('weather') && !currentText.match(/\b(in|at|for)\s+\w+/i)) {
            const lastLocation = this.extractLocationFromContext(context);
            if (lastLocation) {
                resolvedText = `${currentText} in ${lastLocation}`;
            }
        }

        // Resolve time references
        // "Remind me about it" -> "Remind me about the meeting tomorrow at 3 PM"
        if (currentText.toLowerCase().includes('remind me about it') && lastTurn?.sofiya?.data?.event) {
            resolvedText = `remind me about ${lastTurn.sofiya.data.event}`;
        }

        return resolvedText;
    }

    /**
     * Extracts location from conversation context
     * @private
     */
    extractLocationFromContext(context) {
        for (const turn of context.reverse()) {
            const location = turn.sofiya?.data?.location || turn.user?.match(/\b(NYC|London|New York|Mumbai|Delhi)\b/i)?.[0];
            if (location) return location;
        }
        return null;
    }

    /**
     * Retrieves user preferences from database (placeholder)
     * In production, this would query PostgreSQL
     */
    async getUserPreferences() {
        // Placeholder - would query database
        return {
            language: 'en',
            personality: 'default',
            timezone: 'UTC'
        };
    }

    /**
     * Cleanup resources
     */
    async close() {
        if (this.redisClient?.isOpen) {
            await this.redisClient.quit();
            this.redisClient = null;
        }
        console.log('[ContextManager] Closed.');
    }
}

// Example usage:
// const contextManager = new ContextManager({ userId: 'user123' });
// await contextManager.initialize();
// await contextManager.saveTurn('What is the weather?', { response: 'It is sunny' });
// const context = await contextManager.getContext();
