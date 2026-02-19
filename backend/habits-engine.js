/**
 * SOFIYA Habits Engine
 * Phase 5.4: Hyper-Automation Habits Engine
 * 
 * Tracks user micro-habits, predicts actions, and proactively offers assistance.
 * Integrates with HabitDetector for ML-based pattern detection.
 */

import 'dotenv/config';
import { createClient } from 'pg';
import { HabitDetector } from './ml/habit-detector.js';

export class HabitsEngine {
    constructor(options = {}) {
        this.db = options.db || null;
        this.habitDetector = options.habitDetector || new HabitDetector({ db: options.db });
        this.reminderEngine = options.reminderEngine || null;

        this.actionLog = [];
        this.userPreferences = new Map();
    }

    /**
     * Initializes habits engine
     */
    async initialize() {
        // Load user preferences
        if (this.db) {
            await this.loadUserPreferences();
        }

        console.log('[HabitsEngine] Initialized');
    }

    /**
     * Logs a user action
     * @param {Object} actionData - Action data
     * @param {string} actionData.userId - User ID
     * @param {string} actionData.action - Action type (e.g., 'check_weather', 'order_food', 'call_contact')
     * @param {Object} actionData.context - Action context (location, time, device state, etc.)
     * @param {Object} actionData.result - Action result
     */
    async logAction(actionData) {
        const {
            userId,
            action,
            context = {},
            result = {}
        } = actionData;

        const actionLog = {
            userId,
            action,
            context: {
                timestamp: new Date().toISOString(),
                hour: new Date().getHours(),
                dayOfWeek: new Date().getDay(),
                location: context.location || null,
                deviceState: context.deviceState || null,
                weather: context.weather || null,
                ...context
            },
            result,
            createdAt: new Date()
        };

        // Store in memory (for quick access)
        this.actionLog.push(actionLog);

        // Store in database
        if (this.db) {
            await this.saveActionToDatabase(actionLog);
        }

        // Check if this forms a pattern
        await this.checkForPattern(userId, action);
    }

    /**
     * Predicts next likely action
     * @param {string} userId - User ID
     * @param {Object} currentContext - Current context
     * @returns {Promise<Object>} Prediction with confidence
     */
    async predictNextAction(userId, currentContext = {}) {
        // Get recent actions
        const recentActions = this.getRecentActions(userId, 10);

        // Use HabitDetector to find patterns
        const habits = await this.habitDetector.detectHabits(userId, 7);

        // Match current context to habits
        const matchingHabits = habits.filter(habit => {
            return this.matchesContext(habit.pattern, currentContext);
        });

        if (matchingHabits.length === 0) {
            return {
                predicted: null,
                confidence: 0,
                reason: 'No matching patterns found'
            };
        }

        // Get most likely habit
        const topHabit = matchingHabits[0];

        return {
            predicted: topHabit.action,
            confidence: topHabit.confidence || 0.8,
            reason: `Based on pattern: ${topHabit.description}`,
            habit: topHabit
        };
    }

    /**
     * Proactively offers assistance based on habits
     * @param {string} userId - User ID
     * @param {Object} currentContext - Current context
     * @returns {Promise<Object|null>} Suggestion or null
     */
    async offerProactiveAssistance(userId, currentContext = {}) {
        const prediction = await this.predictNextAction(userId, currentContext);

        // Only offer if confidence is high enough
        if (prediction.confidence < 0.8) {
            return null;
        }

        // Generate suggestion
        const suggestion = await this.generateSuggestion(prediction, currentContext);

        return {
            action: prediction.predicted,
            suggestion: suggestion.message,
            confidence: prediction.confidence,
            autoExecute: suggestion.autoExecute || false
        };
    }

    /**
     * Generates suggestion message
     * @private
     */
    async generateSuggestion(prediction, context) {
        const { predicted, habit } = prediction;

        // Get user preference for this action
        const preference = this.getUserPreference(prediction.userId, predicted);

        let message = '';
        let autoExecute = false;

        switch (predicted) {
            case 'check_weather':
                message = 'Would you like me to check the weather?';
                break;

            case 'order_food':
                const usualOrder = preference?.usualOrder || 'your usual';
                message = `Would you like to order ${usualOrder}?`;
                break;

            case 'call_contact':
                const usualContact = preference?.usualContact || 'your usual contact';
                message = `Would you like to call ${usualContact}?`;
                break;

            case 'play_music':
                const usualPlaylist = preference?.usualPlaylist || 'your usual playlist';
                message = `Would you like to play ${usualPlaylist}?`;
                break;

            case 'set_scene':
                const usualScene = preference?.usualScene || 'your usual scene';
                message = `Would you like to activate ${usualScene}?`;
                autoExecute = preference?.autoExecute || false;
                break;

            default:
                message = `Would you like me to ${predicted.replace(/_/g, ' ')}?`;
        }

        return { message, autoExecute };
    }

    /**
     * Learns user preference from action
     * @param {string} userId - User ID
     * @param {string} action - Action type
     * @param {Object} preference - Preference data
     */
    async learnPreference(userId, action, preference) {
        if (!this.userPreferences.has(userId)) {
            this.userPreferences.set(userId, {});
        }

        const userPrefs = this.userPreferences.get(userId);
        if (!userPrefs[action]) {
            userPrefs[action] = {};
        }

        // Merge preference
        userPrefs[action] = {
            ...userPrefs[action],
            ...preference,
            updatedAt: new Date()
        };

        // Save to database
        if (this.db) {
            await this.savePreferenceToDatabase(userId, action, userPrefs[action]);
        }
    }

    /**
     * Gets user preference for action
     * @private
     */
    getUserPreference(userId, action) {
        const userPrefs = this.userPreferences.get(userId);
        return userPrefs?.[action] || null;
    }

    /**
     * Checks if action forms a pattern
     * @private
     */
    async checkForPattern(userId, action) {
        const recentActions = this.getRecentActions(userId, 20)
            .filter(a => a.action === action);

        // If action occurred multiple times recently, it might be a habit
        if (recentActions.length >= 3) {
            // Analyze pattern
            const pattern = this.analyzePattern(recentActions);

            if (pattern.confidence > 0.7) {
                // Store as potential habit
                await this.savePotentialHabit(userId, action, pattern);
            }
        }
    }

    /**
     * Analyzes pattern from actions
     * @private
     */
    analyzePattern(actions) {
        // Group by time of day
        const byHour = {};
        actions.forEach(action => {
            const hour = action.context.hour;
            if (!byHour[hour]) {
                byHour[hour] = 0;
            }
            byHour[hour]++;
        });

        // Find most common hour
        const mostCommonHour = Object.keys(byHour).reduce((a, b) =>
            byHour[a] > byHour[b] ? a : b
        );

        return {
            timePattern: mostCommonHour,
            confidence: byHour[mostCommonHour] / actions.length,
            frequency: actions.length
        };
    }

    /**
     * Gets recent actions for user
     * @private
     */
    getRecentActions(userId, limit = 10) {
        return this.actionLog
            .filter(a => a.userId === userId)
            .slice(-limit);
    }

    /**
     * Matches context to habit pattern
     * @private
     */
    matchesContext(pattern, context) {
        // Check time match
        const currentHour = new Date().getHours();
        if (pattern.timePattern && Math.abs(currentHour - pattern.timePattern) > 2) {
            return false;
        }

        // Check day of week match
        const currentDay = new Date().getDay();
        if (pattern.dayPattern && pattern.dayPattern !== currentDay) {
            return false;
        }

        // Check location match
        if (pattern.location && context.location) {
            // Simple distance check (in production, use geocoding)
            if (pattern.location !== context.location) {
                return false;
            }
        }

        return true;
    }

    /**
     * Saves action to database
     * @private
     */
    async saveActionToDatabase(actionLog) {
        if (!this.db) {
            return;
        }

        try {
            const query = `
                INSERT INTO action_history (
                    user_id, action, context, result, created_at
                )
                VALUES ($1, $2, $3, $4, $5)
            `;

            await this.db.query(query, [
                actionLog.userId,
                actionLog.action,
                JSON.stringify(actionLog.context),
                JSON.stringify(actionLog.result),
                actionLog.createdAt
            ]);
        } catch (error) {
            console.error('[HabitsEngine] Error saving action:', error);
        }
    }

    /**
     * Saves preference to database
     * @private
     */
    async savePreferenceToDatabase(userId, action, preference) {
        if (!this.db) {
            return;
        }

        try {
            const query = `
                INSERT INTO user_preferences (user_id, action, preference, updated_at)
                VALUES ($1, $2, $3, NOW())
                ON CONFLICT (user_id, action) DO UPDATE
                SET preference = $3, updated_at = NOW()
            `;

            await this.db.query(query, [
                userId,
                action,
                JSON.stringify(preference)
            ]);
        } catch (error) {
            console.error('[HabitsEngine] Error saving preference:', error);
        }
    }

    /**
     * Saves potential habit
     * @private
     */
    async savePotentialHabit(userId, action, pattern) {
        if (!this.db) {
            return;
        }

        try {
            const query = `
                INSERT INTO detected_habits (
                    user_id, action, pattern, confidence, detected_at
                )
                VALUES ($1, $2, $3, $4, NOW())
                ON CONFLICT (user_id, action) DO UPDATE
                SET pattern = $3, confidence = $4, detected_at = NOW()
            `;

            await this.db.query(query, [
                userId,
                action,
                JSON.stringify(pattern),
                pattern.confidence
            ]);
        } catch (error) {
            console.error('[HabitsEngine] Error saving habit:', error);
        }
    }

    /**
     * Loads user preferences from database
     * @private
     */
    async loadUserPreferences() {
        if (!this.db) {
            return;
        }

        try {
            const query = `SELECT user_id, action, preference FROM user_preferences`;
            const result = await this.db.query(query);

            result.rows.forEach(row => {
                if (!this.userPreferences.has(row.user_id)) {
                    this.userPreferences.set(row.user_id, {});
                }
                this.userPreferences.get(row.user_id)[row.action] = row.preference;
            });
        } catch (error) {
            console.error('[HabitsEngine] Error loading preferences:', error);
        }
    }
}

// Example usage:
// const habitsEngine = new HabitsEngine({ db, habitDetector, reminderEngine });
// await habitsEngine.initialize();
// await habitsEngine.logAction({
//     userId: 'user123',
//     action: 'check_weather',
//     context: { hour: 9, location: 'home' }
// });
// const suggestion = await habitsEngine.offerProactiveAssistance('user123', { hour: 9 });
