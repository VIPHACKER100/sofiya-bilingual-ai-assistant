/**
 * SOFIYA Health Analytics Module
 * Phase 6.2: Health Data Analysis
 * 
 * Analyzes health data for trends, anomalies, and insights.
 * Correlates behaviors with outcomes and generates recommendations.
 */

import 'dotenv/config';
import { createClient } from 'pg';

export class HealthAnalytics {
    constructor(options = {}) {
        this.db = options.db || null;
        this.windowDays = options.windowDays || 30; // Rolling window for averages
    }

    /**
     * Calculates rolling averages for health metrics
     * @param {string} userId - User ID
     * @param {string} metric - Metric name (steps, sleep, heartRate, weight)
     * @param {number} days - Number of days (default: 7, 30)
     * @returns {Promise<Object>} Rolling averages
     */
    async calculateRollingAverages(userId, metric, days = 30) {
        if (!this.db) {
            return { average: null, trend: null };
        }

        try {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const query = `
                SELECT AVG(value) as average, 
                       COUNT(*) as count,
                       MIN(value) as min,
                       MAX(value) as max
                FROM health_data
                WHERE user_id = $1 
                AND metric = $2
                AND date >= $3
                AND date <= $4
            `;

            const result = await this.db.query(query, [
                userId,
                metric,
                startDate.toISOString(),
                endDate.toISOString()
            ]);

            const average = parseFloat(result.rows[0]?.average || 0);
            const count = parseInt(result.rows[0]?.count || 0);

            // Calculate trend (compare last 7 days vs previous 7 days)
            const trend = await this.calculateTrend(userId, metric, 7);

            return {
                average,
                count,
                min: parseFloat(result.rows[0]?.min || 0),
                max: parseFloat(result.rows[0]?.max || 0),
                trend,
                period: `${days} days`
            };
        } catch (error) {
            console.error('[HealthAnalytics] Error calculating averages:', error);
            return { average: null, trend: null };
        }
    }

    /**
     * Calculates trend (improving, declining, stable)
     * @private
     */
    async calculateTrend(userId, metric, days = 7) {
        if (!this.db) {
            return null;
        }

        try {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days * 2);

            const query = `
                SELECT 
                    CASE 
                        WHEN date >= $3 THEN 'recent'
                        ELSE 'previous'
                    END as period,
                    AVG(value) as average
                FROM health_data
                WHERE user_id = $1 
                AND metric = $2
                AND date >= $4
                GROUP BY period
            `;

            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);

            const result = await this.db.query(query, [
                userId,
                metric,
                cutoffDate.toISOString(),
                startDate.toISOString()
            ]);

            const recent = result.rows.find(r => r.period === 'recent')?.average || 0;
            const previous = result.rows.find(r => r.period === 'previous')?.average || 0;

            const change = recent - previous;
            const percentChange = previous > 0 ? (change / previous) * 100 : 0;

            if (Math.abs(percentChange) < 5) {
                return { direction: 'stable', change, percentChange };
            } else if (percentChange > 0) {
                return { direction: 'improving', change, percentChange };
            } else {
                return { direction: 'declining', change, percentChange };
            }
        } catch (error) {
            console.error('[HealthAnalytics] Error calculating trend:', error);
            return null;
        }
    }

    /**
     * Detects anomalies in health data
     * @param {string} userId - User ID
     * @param {string} metric - Metric name
     * @param {number} threshold - Standard deviations threshold (default: 2)
     * @returns {Promise<Array>} Anomalies detected
     */
    async detectAnomalies(userId, metric, threshold = 2) {
        if (!this.db) {
            return [];
        }

        try {
            // Get baseline statistics
            const baseline = await this.calculateRollingAverages(userId, metric, 30);
            if (!baseline.average) {
                return [];
            }

            // Get recent data
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 7);

            const query = `
                SELECT date, value
                FROM health_data
                WHERE user_id = $1 
                AND metric = $2
                AND date >= $3
                AND date <= $4
                ORDER BY date DESC
            `;

            const result = await this.db.query(query, [
                userId,
                metric,
                startDate.toISOString(),
                endDate.toISOString()
            ]);

            // Calculate standard deviation (simplified)
            const stdDev = baseline.max - baseline.min / 4; // Approximation
            const anomalies = [];

            result.rows.forEach(row => {
                const deviation = Math.abs(row.value - baseline.average);
                if (deviation > threshold * stdDev) {
                    anomalies.push({
                        date: row.date,
                        value: row.value,
                        expected: baseline.average,
                        deviation,
                        severity: deviation > threshold * 2 * stdDev ? 'high' : 'medium'
                    });
                }
            });

            return anomalies;
        } catch (error) {
            console.error('[HealthAnalytics] Error detecting anomalies:', error);
            return [];
        }
    }

    /**
     * Correlates behaviors with health outcomes
     * @param {string} userId - User ID
     * @param {string} outcomeMetric - Outcome metric (e.g., 'sleep_quality')
     * @param {Array} behaviorMetrics - Behavior metrics to correlate
     * @returns {Promise<Object>} Correlations
     */
    async correlateBehaviors(userId, outcomeMetric, behaviorMetrics = []) {
        if (!this.db || behaviorMetrics.length === 0) {
            return { correlations: [] };
        }

        try {
            const correlations = [];

            for (const behaviorMetric of behaviorMetrics) {
                // Simple correlation: check if behavior changes align with outcome changes
                const behaviorTrend = await this.calculateTrend(userId, behaviorMetric, 7);
                const outcomeTrend = await this.calculateTrend(userId, outcomeMetric, 7);

                if (behaviorTrend && outcomeTrend) {
                    const correlation = this.calculateCorrelation(
                        behaviorTrend.direction,
                        outcomeTrend.direction
                    );

                    correlations.push({
                        behavior: behaviorMetric,
                        outcome: outcomeMetric,
                        correlation,
                        behaviorTrend: behaviorTrend.direction,
                        outcomeTrend: outcomeTrend.direction
                    });
                }
            }

            return { correlations };
        } catch (error) {
            console.error('[HealthAnalytics] Error correlating behaviors:', error);
            return { correlations: [] };
        }
    }

    /**
     * Calculates simple correlation between trends
     * @private
     */
    calculateCorrelation(behaviorDirection, outcomeDirection) {
        if (behaviorDirection === outcomeDirection) {
            return 'positive';
        } else if (behaviorDirection === 'stable' || outcomeDirection === 'stable') {
            return 'neutral';
        } else {
            return 'negative';
        }
    }

    /**
     * Generates personalized health insights
     * @param {string} userId - User ID
     * @returns {Promise<Array>} Health insights
     */
    async generateInsights(userId) {
        const insights = [];

        // Check sleep quality
        const sleepAvg = await this.calculateRollingAverages(userId, 'sleep_hours', 7);
        if (sleepAvg.average < 6) {
            insights.push({
                type: 'warning',
                metric: 'sleep',
                message: `Your average sleep is ${sleepAvg.average.toFixed(1)} hours. Consider aiming for 7-9 hours for optimal health.`,
                recommendation: 'Try going to bed 30 minutes earlier'
            });
        }

        // Check steps
        const stepsAvg = await this.calculateRollingAverages(userId, 'steps', 7);
        if (stepsAvg.average < 5000) {
            insights.push({
                type: 'suggestion',
                metric: 'activity',
                message: `Your average daily steps is ${Math.round(stepsAvg.average)}. Consider increasing to 10,000 steps for better health.`,
                recommendation: 'Take a 10-minute walk after meals'
            });
        }

        // Check for anomalies
        const sleepAnomalies = await this.detectAnomalies(userId, 'sleep_hours');
        if (sleepAnomalies.length > 0) {
            insights.push({
                type: 'alert',
                metric: 'sleep',
                message: `Unusual sleep patterns detected ${sleepAnomalies.length} times in the past week.`,
                recommendation: 'Review your sleep schedule and consider sleep hygiene practices'
            });
        }

        // Correlate behaviors
        const correlations = await this.correlateBehaviors(userId, 'sleep_quality', [
            'screen_time',
            'exercise_minutes',
            'caffeine_intake'
        ]);

        correlations.correlations.forEach(corr => {
            if (corr.correlation === 'positive' && corr.outcomeTrend === 'improving') {
                insights.push({
                    type: 'positive',
                    metric: corr.behavior,
                    message: `Your ${corr.behavior} improvements are correlating with better ${corr.outcome}. Keep it up!`,
                    recommendation: `Continue your current ${corr.behavior} habits`
                });
            }
        });

        return insights;
    }

    /**
     * Gets health summary for user
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Health summary
     */
    async getHealthSummary(userId) {
        const [steps, sleep, heartRate, weight] = await Promise.all([
            this.calculateRollingAverages(userId, 'steps', 7),
            this.calculateRollingAverages(userId, 'sleep_hours', 7),
            this.calculateRollingAverages(userId, 'heart_rate', 7),
            this.calculateRollingAverages(userId, 'weight', 30)
        ]);

        const insights = await this.generateInsights(userId);

        return {
            userId,
            metrics: {
                steps,
                sleep,
                heartRate,
                weight
            },
            insights,
            generatedAt: new Date().toISOString()
        };
    }
}

// Example usage:
// const analytics = new HealthAnalytics({ db });
// const summary = await analytics.getHealthSummary('user123');
// const anomalies = await analytics.detectAnomalies('user123', 'sleep_hours');
// const insights = await analytics.generateInsights('user123');
