/**
 * SOFIYA Predictive Assistance Engine
 * Phase 9.4: Anticipate user needs before they ask
 * 
 * Analyzes calendar + habits + location.
 * Predicts likely next action and proactively suggests.
 */

import 'dotenv/config';
import { BehaviorPredictor } from './ml/behavior-predictor.js';
import { HabitsEngine } from './habits-engine.js';

export class PredictiveEngine {
    constructor(options = {}) {
        this.db = options.db || null;
        this.behaviorPredictor = options.behaviorPredictor || new BehaviorPredictor({ db: options.db });
        this.habitsEngine = options.habitsEngine || null;
    }

    /**
     * Predicts likely next action
     * @param {string} userId - User ID
     * @param {Object} context - Current context
     * @returns {Promise<Object>} Prediction
     */
    async predictNextAction(userId, context = {}) {
        const prediction = await this.behaviorPredictor.predict(userId, context);

        if (prediction) {
            return {
                action: prediction.action,
                confidence: prediction.confidence,
                reason: prediction.reason || 'Based on your patterns',
                context: prediction.context
            };
        }

        // Fallback to habits engine
        if (this.habitsEngine) {
            const habitPrediction = await this.habitsEngine.predictNextAction(userId, context);
            if (habitPrediction.predicted) {
                return {
                    action: habitPrediction.predicted,
                    confidence: habitPrediction.confidence,
                    reason: habitPrediction.reason
                };
            }
        }

        return null;
    }

    /**
     * Gets proactive suggestion
     * @param {string} userId - User ID
     * @param {Object} context - Context (calendar, location, time)
     * @returns {Promise<Object|null>} Suggestion
     */
    async getProactiveSuggestion(userId, context = {}) {
        const prediction = await this.predictNextAction(userId, context);

        if (!prediction || prediction.confidence < 0.8) {
            return null;
        }

        // Generate suggestion message
        const message = this.generateSuggestionMessage(prediction, context);

        return {
            action: prediction.action,
            message,
            confidence: prediction.confidence,
            autoExecute: prediction.confidence > 0.95
        };
    }

    /**
     * Generates suggestion message
     * @private
     */
    generateSuggestionMessage(prediction, context) {
        const { action } = prediction;

        const messages = {
            check_weather: "Your calendar is clear today. Would you like me to check the weather for your plans?",
            order_food: "It's your usual lunch time. Would you like to order your usual?",
            call_contact: "You have a meeting with Sarah in 30 minutes. Would you like a briefing?",
            set_scene: "It's getting dark. Would you like me to activate the evening scene?",
            play_music: "It's your usual music time. Would you like to play your usual playlist?",
            schedule_reminder: "You have a busy day tomorrow. Would you like me to set reminders?",
            book_restaurant: "It's Friday evening. Would you like to book a spa appointment like you usually do monthly?"
        };

        return messages[action] || `Would you like me to ${action.replace(/_/g, ' ')}?`;
    }

    /**
     * Analyzes context for proactive suggestions
     * @param {string} userId - User ID
     * @param {Object} context - Full context
     * @returns {Promise<Array>} List of suggestions
     */
    async analyzeContext(userId, context = {}) {
        const suggestions = [];

        // Calendar-based
        if (context.calendar?.clear) {
            suggestions.push({
                type: 'calendar',
                message: "Your calendar is clear today. Would you like to book something?",
                priority: 'low'
            });
        }

        if (context.calendar?.upcomingMeeting) {
            suggestions.push({
                type: 'meeting',
                message: `Your meeting "${context.calendar.upcomingMeeting}" starts in 30 minutes. Would you like a briefing?`,
                priority: 'high'
            });
        }

        // Time-based
        const hour = context.hour ?? new Date().getHours();
        if (hour === 9) {
            suggestions.push({
                type: 'morning',
                message: "Good morning! Would you like me to check the weather and your schedule?",
                priority: 'medium'
            });
        }

        // Location-based
        if (context.location === 'store') {
            suggestions.push({
                type: 'shopping',
                message: "You're at the store. Would you like me to pull up your shopping list?",
                priority: 'high'
            });
        }

        // Prediction-based
        const prediction = await this.getProactiveSuggestion(userId, context);
        if (prediction) {
            suggestions.push({
                type: 'prediction',
                message: prediction.message,
                priority: 'medium',
                action: prediction.action
            });
        }

        return suggestions.sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
    }
}
