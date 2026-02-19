/**
 * SOFIYA Ethics Reasoner
 * Phase 9.5: Ethical Reasoning & Preference Learning
 * 
 * Makes decisions aligned with user values.
 * Stores values, compares options, recommends aligned choices.
 */

import 'dotenv/config';
import { createClient } from 'pg';

export class EthicsReasoner {
    constructor(options = {}) {
        this.db = options.db || null;
        this.userValues = new Map();
    }

    /**
     * Initializes ethics reasoner
     */
    async initialize() {
        if (this.db) {
            await this.loadUserValues();
        }
        console.log('[EthicsReasoner] Initialized');
    }

    /**
     * Sets user values
     * @param {string} userId - User ID
     * @param {Object} values - Values (e.g., { sustainability: 'high', privacy: 'high', budget: 'medium' })
     */
    async setUserValues(userId, values) {
        this.userValues.set(userId, { ...this.userValues.get(userId), ...values });

        if (this.db) {
            try {
                const query = `
                    INSERT INTO user_values (user_id, values, updated_at)
                    VALUES ($1, $2, NOW())
                    ON CONFLICT (user_id) DO UPDATE
                    SET values = $2, updated_at = NOW()
                `;

                await this.db.query(query, [userId, JSON.stringify(this.userValues.get(userId))]);
            } catch (error) {
                console.error('[EthicsReasoner] Error saving values:', error);
            }
        }
    }

    /**
     * Gets user values
     * @param {string} userId - User ID
     * @returns {Object} User values
     */
    async getUserValues(userId) {
        if (this.userValues.has(userId)) {
            return this.userValues.get(userId);
        }

        if (this.db) {
            try {
                const query = `SELECT values FROM user_values WHERE user_id = $1`;
                const result = await this.db.query(query, [userId]);
                if (result.rows.length > 0) {
                    const values = JSON.parse(result.rows[0].values || '{}');
                    this.userValues.set(userId, values);
                    return values;
                }
            } catch (error) {
                console.error('[EthicsReasoner] Error loading values:', error);
            }
        }

        return {};
    }

    /**
     * Evaluates options against user values
     * @param {string} userId - User ID
     * @param {Array} options - Options to evaluate
     * @param {Object} context - Context (e.g., { category: 'restaurant', valueDimensions: ['sustainability', 'price'] })
     * @returns {Promise<Array>} Ranked options with alignment scores
     */
    async evaluateOptions(userId, options, context = {}) {
        const values = await this.getUserValues(userId);

        const evaluated = options.map(option => {
            const alignmentScore = this.calculateAlignment(option, values, context);
            const explanation = this.generateAlignmentExplanation(option, values, alignmentScore);

            return {
                ...option,
                alignmentScore,
                alignmentExplanation: explanation,
                recommended: alignmentScore > 0.7
            };
        });

        return evaluated.sort((a, b) => b.alignmentScore - a.alignmentScore);
    }

    /**
     * Calculates alignment score
     * @private
     */
    calculateAlignment(option, values, context) {
        let score = 0;
        let factors = 0;

        Object.entries(values).forEach(([valueKey, userPreference]) => {
            const optionValue = option[valueKey] || option.attributes?.[valueKey];
            if (optionValue !== undefined) {
                factors++;
                const alignment = this.compareValue(optionValue, userPreference);
                score += alignment;
            }
        });

        return factors > 0 ? score / factors : 0.5;
    }

    /**
     * Compares option value to user preference
     * @private
     */
    compareValue(optionValue, userPreference) {
        const preferenceLevels = { low: 0, medium: 0.5, high: 1 };
        const userLevel = preferenceLevels[userPreference] ?? 0.5;

        if (typeof optionValue === 'number') {
            return 1 - Math.abs(optionValue - userLevel);
        }

        if (typeof optionValue === 'string') {
            const optionLevel = preferenceLevels[optionValue.toLowerCase()] ?? 0.5;
            return 1 - Math.abs(optionLevel - userLevel);
        }

        if (typeof optionValue === 'boolean') {
            return optionValue === (userPreference === 'high') ? 1 : 0;
        }

        return 0.5;
    }

    /**
     * Generates alignment explanation
     * @private
     */
    generateAlignmentExplanation(option, values, score) {
        if (score > 0.8) {
            return 'This option aligns well with your stated values.';
        }
        if (score > 0.5) {
            return 'This option partially aligns with your preferences.';
        }
        return 'This option may not fully align with your values. Consider alternatives.';
    }

    /**
     * Recommends best option based on values
     * @param {string} userId - User ID
     * @param {Array} options - Options
     * @param {Object} context - Context
     * @returns {Promise<Object>} Recommendation
     */
    async recommend(userId, options, context = {}) {
        const evaluated = await this.evaluateOptions(userId, options, context);
        const top = evaluated[0];

        return {
            recommendation: top,
            alternatives: evaluated.slice(1, 4),
            reasoning: top.alignmentExplanation
        };
    }

    /**
     * Learns/updates values from user feedback
     * @param {string} userId - User ID
     * @param {string} choice - Choice made
     * @param {Object} feedback - Feedback (e.g., { liked: true, reason: 'sustainability' })
     */
    async learnFromFeedback(userId, choice, feedback) {
        const values = await this.getUserValues(userId);

        if (feedback.reason) {
            const key = feedback.reason.toLowerCase();
            if (!values[key]) {
                values[key] = 'high';
            } else if (feedback.liked) {
                values[key] = 'high';
            }
        }

        await this.setUserValues(userId, values);
    }

    /**
     * Loads user values from database
     * @private
     */
    async loadUserValues() {
        if (!this.db) return;

        try {
            const query = `SELECT user_id, values FROM user_values`;
            const result = await this.db.query(query);
            result.rows.forEach(row => {
                this.userValues.set(row.user_id, JSON.parse(row.values || '{}'));
            });
        } catch (error) {
            console.error('[EthicsReasoner] Error loading values:', error);
        }
    }
}
