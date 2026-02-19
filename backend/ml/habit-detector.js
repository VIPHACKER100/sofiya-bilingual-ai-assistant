/**
 * SOFIYA Habit Detector
 * Phase 17.3: Detect Recurring User Patterns and Habits
 * 
 * Uses time-series clustering and anomaly detection to identify habits
 * and suggest optimizations.
 */

import 'dotenv/config';
import { createClient } from 'pg';

export class HabitDetector {
    constructor(options = {}) {
        this.db = options.db || null;
        this.minOccurrences = options.minOccurrences || 5; // Minimum times to be a habit
        this.timeWindow = options.timeWindow || 7; // Days to analyze
    }

    /**
     * Detects habits for a user
     * @param {string} userId - User ID
     * @param {number} days - Number of days to analyze
     * @returns {Promise<Array>} Detected habits with patterns
     */
    async detectHabits(userId, days = 30) {
        if (!this.db) {
            return [];
        }

        try {
            // Fetch action history
            const actions = await this.fetchActionHistory(userId, days);
            
            if (actions.length < this.minOccurrences) {
                return [];
            }

            // Cluster actions by time patterns
            const clusters = await this.clusterByTime(actions);
            
            // Identify recurring patterns
            const habits = await this.identifyHabits(clusters, actions);
            
            // Detect anomalies
            const anomalies = await this.detectAnomalies(actions, habits);
            
            // Generate insights
            const insights = this.generateInsights(habits, anomalies);

            return {
                habits,
                anomalies,
                insights,
                analyzedDays: days,
                totalActions: actions.length
            };
        } catch (error) {
            console.error('[HabitDetector] Error detecting habits:', error);
            return { habits: [], anomalies: [], insights: [] };
        }
    }

    /**
     * Fetches action history from database
     * @private
     */
    async fetchActionHistory(userId, days) {
        const query = `
            SELECT 
                action_type,
                timestamp,
                context_data,
                location
            FROM voice_commands
            WHERE user_id = $1
            AND timestamp > NOW() - INTERVAL '${days} days'
            ORDER BY timestamp ASC
        `;

        const result = await this.db.query(query, [userId]);
        return result.rows.map(row => ({
            action: row.action_type,
            timestamp: new Date(row.timestamp),
            hour: new Date(row.timestamp).getHours(),
            dayOfWeek: new Date(row.timestamp).getDay(),
            location: row.location || 'unknown',
            context: row.context_data || {}
        }));
    }

    /**
     * Clusters actions by time patterns using K-means-like approach
     * @private
     */
    async clusterByTime(actions) {
        // Group actions by hour and day of week
        const timeGroups = {};
        
        actions.forEach(action => {
            const key = `${action.hour}_${action.dayOfWeek}_${action.action}`;
            if (!timeGroups[key]) {
                timeGroups[key] = [];
            }
            timeGroups[key].push(action);
        });

        // Filter groups with minimum occurrences
        const clusters = [];
        Object.keys(timeGroups).forEach(key => {
            const group = timeGroups[key];
            if (group.length >= this.minOccurrences) {
                clusters.push({
                    pattern: key,
                    actions: group,
                    count: group.length,
                    avgHour: group.reduce((sum, a) => sum + a.hour, 0) / group.length,
                    avgDayOfWeek: group.reduce((sum, a) => sum + a.dayOfWeek, 0) / group.length
                });
            }
        });

        return clusters;
    }

    /**
     * Identifies habits from clusters
     * @private
     */
    async identifyHabits(clusters, allActions) {
        const habits = [];

        clusters.forEach(cluster => {
            const [hour, dayOfWeek, action] = cluster.pattern.split('_');
            
            // Calculate frequency
            const totalDays = Math.ceil(
                (allActions[allActions.length - 1].timestamp - allActions[0].timestamp) / 
                (1000 * 60 * 60 * 24)
            );
            const frequency = cluster.count / totalDays;

            // Calculate consistency (standard deviation of timing)
            const timestamps = cluster.actions.map(a => a.timestamp.getTime());
            const mean = timestamps.reduce((a, b) => a + b, 0) / timestamps.length;
            const variance = timestamps.reduce((sum, t) => sum + Math.pow(t - mean, 2), 0) / timestamps.length;
            const stdDev = Math.sqrt(variance);
            const consistency = 1 - Math.min(1, stdDev / (1000 * 60 * 60 * 2)); // Normalize to 0-1

            habits.push({
                action,
                time: {
                    hour: parseInt(hour),
                    dayOfWeek: parseInt(dayOfWeek),
                    dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][parseInt(dayOfWeek)]
                },
                frequency: Math.round(frequency * 10) / 10, // Round to 1 decimal
                consistency: Math.round(consistency * 100) / 100,
                occurrences: cluster.count,
                confidence: Math.min(1.0, cluster.count / 10) // Higher confidence with more occurrences
            });
        });

        return habits.sort((a, b) => b.confidence - a.confidence);
    }

    /**
     * Detects anomalies in behavior
     * @private
     */
    async detectAnomalies(actions, habits) {
        const anomalies = [];

        // Check for missing expected actions
        habits.forEach(habit => {
            const expectedTimes = this.getExpectedTimes(habit, actions);
            const actualTimes = actions.filter(a => 
                a.action === habit.action &&
                a.hour === habit.time.hour &&
                a.dayOfWeek === habit.time.dayOfWeek
            ).map(a => a.timestamp);

            // Find days where habit was expected but didn't occur
            expectedTimes.forEach(expectedTime => {
                const occurred = actualTimes.some(actualTime => {
                    const diff = Math.abs(actualTime - expectedTime);
                    return diff < (1000 * 60 * 60 * 2); // Within 2 hours
                });

                if (!occurred) {
                    anomalies.push({
                        type: 'missing_habit',
                        habit: habit.action,
                        expectedTime: new Date(expectedTime),
                        severity: 'medium'
                    });
                }
            });
        });

        // Check for unusual timing
        actions.forEach(action => {
            const matchingHabit = habits.find(h => h.action === action.action);
            if (matchingHabit) {
                const hourDiff = Math.abs(action.hour - matchingHabit.time.hour);
                if (hourDiff > 3) {
                    anomalies.push({
                        type: 'unusual_timing',
                        action: action.action,
                        expectedHour: matchingHabit.time.hour,
                        actualHour: action.hour,
                        timestamp: action.timestamp,
                        severity: 'low'
                    });
                }
            }
        });

        return anomalies;
    }

    /**
     * Gets expected times for a habit
     * @private
     */
    getExpectedTimes(habit, actions) {
        if (actions.length === 0) {
            return [];
        }

        const startDate = actions[0].timestamp;
        const endDate = actions[actions.length - 1].timestamp;
        const expectedTimes = [];

        // Generate expected times based on habit pattern
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            if (currentDate.getDay() === habit.time.dayOfWeek) {
                const expectedTime = new Date(currentDate);
                expectedTime.setHours(habit.time.hour, 0, 0, 0);
                expectedTimes.push(expectedTime.getTime());
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return expectedTimes;
    }

    /**
     * Generates insights and suggestions
     * @private
     */
    generateInsights(habits, anomalies) {
        const insights = [];

        // Habit summarization
        habits.forEach(habit => {
            insights.push({
                type: 'habit_summary',
                text: `You ${habit.action} around ${habit.time.hour}:00 on ${habit.time.dayName}s (${habit.occurrences} times in the last period)`,
                confidence: habit.confidence
            });
        });

        // Optimization suggestions
        const emailHabits = habits.filter(h => h.action.includes('email') || h.action.includes('message'));
        if (emailHabits.length >= 3) {
            insights.push({
                type: 'optimization',
                text: `You check email ${emailHabits.length} times throughout the day. Consider batching into 2-3 focused sessions to improve productivity.`,
                suggestion: 'batch_email'
            });
        }

        // Anomaly insights
        const missingHabits = anomalies.filter(a => a.type === 'missing_habit');
        if (missingHabits.length > 0) {
            insights.push({
                type: 'anomaly',
                text: `You missed ${missingHabits.length} expected habits. This might indicate stress or schedule changes.`,
                suggestion: 'check_in'
            });
        }

        return insights;
    }

    /**
     * Gets habit summary in natural language
     * @param {string} userId - User ID
     * @returns {Promise<string>} Natural language summary
     */
    async getHabitSummary(userId) {
        const result = await this.detectHabits(userId);
        
        if (result.habits.length === 0) {
            return "I haven't detected any strong patterns yet. Keep using SOFIYA and I'll learn your habits!";
        }

        const summaries = result.habits.slice(0, 5).map(habit => {
            const timeStr = `${habit.time.hour}:00 on ${habit.time.dayName}s`;
            return `You ${habit.action} around ${timeStr}`;
        });

        return `Here are your habits: ${summaries.join('. ')}.`;
    }
}

// Example usage:
// const detector = new HabitDetector({ db: dbConnection });
// const result = await detector.detectHabits('user123', 30);
// const summary = await detector.getHabitSummary('user123');
