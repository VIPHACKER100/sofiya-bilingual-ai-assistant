/**
 * SOFIYA Mood Tracker
 * Phase 17.4: Track Emotional Patterns Over Time
 * 
 * Infers mood from voice patterns, text, and interaction frequency.
 * Correlates mood with external factors and suggests interventions.
 */

import 'dotenv/config';
import { EmotionDetector } from '../../voice-engine/emotion-detector.js';
import { createClient } from 'pg';

export class MoodTracker {
    constructor(options = {}) {
        this.db = options.db || null;
        this.emotionDetector = new EmotionDetector();
        this.trackingWindow = options.trackingWindow || 7; // Days to track
    }

    /**
     * Tracks mood for a user over time
     * @param {string} userId - User ID
     * @param {number} days - Number of days to analyze
     * @returns {Promise<Object>} Mood analysis with trends and correlations
     */
    async trackMood(userId, days = 7) {
        if (!this.db) {
            return { error: 'Database not configured' };
        }

        try {
            // Fetch interaction data
            const interactions = await this.fetchInteractions(userId, days);
            
            // Analyze mood from interactions
            const moodScores = await this.analyzeMoodScores(interactions);
            
            // Fetch external factors
            const externalFactors = await this.fetchExternalFactors(userId, days);
            
            // Correlate mood with external factors
            const correlations = this.correlateMoodWithFactors(moodScores, externalFactors);
            
            // Detect trends
            const trends = this.detectTrends(moodScores);
            
            // Generate insights and suggestions
            const insights = this.generateMoodInsights(moodScores, correlations, trends);

            return {
                userId,
                period: days,
                moodScores,
                trends,
                correlations,
                insights,
                overallMood: this.calculateOverallMood(moodScores)
            };
        } catch (error) {
            console.error('[MoodTracker] Error tracking mood:', error);
            return { error: error.message };
        }
    }

    /**
     * Fetches user interactions from database
     * @private
     */
    async fetchInteractions(userId, days) {
        const query = `
            SELECT 
                vc.timestamp,
                vc.transcript,
                vc.action_type,
                vc.context_data,
                vc.audio_features
            FROM voice_commands vc
            WHERE vc.user_id = $1
            AND vc.timestamp > NOW() - INTERVAL '${days} days'
            ORDER BY vc.timestamp ASC
        `;

        const result = await this.db.query(query, [userId]);
        return result.rows.map(row => ({
            timestamp: new Date(row.timestamp),
            text: row.transcript || '',
            action: row.action_type,
            audioFeatures: row.audio_features || null,
            context: row.context_data || {}
        }));
    }

    /**
     * Analyzes mood scores from interactions
     * @private
     */
    async analyzeMoodScores(interactions) {
        const moodScores = [];

        interactions.forEach(interaction => {
            // Analyze text sentiment
            const textAnalysis = this.emotionDetector.analyzeText(
                interaction.text,
                interaction.audioFeatures
            );

            // Analyze audio features if available
            let audioMood = null;
            if (interaction.audioFeatures) {
                audioMood = this.analyzeAudioMood(interaction.audioFeatures);
            }

            // Combine text and audio analysis
            const combinedMood = this.combineMoodAnalysis(textAnalysis, audioMood);

            moodScores.push({
                timestamp: interaction.timestamp,
                mood: combinedMood.emotion,
                score: combinedMood.score,
                sentiment: combinedMood.sentiment,
                confidence: combinedMood.confidence
            });
        });

        return moodScores;
    }

    /**
     * Analyzes mood from audio features
     * @private
     */
    analyzeAudioMood(audioFeatures) {
        const { pitch, energy, speakingRate, jitter, shimmer } = audioFeatures;

        // High pitch + high energy = positive/excited
        // Low pitch + low energy = tired/sad
        // High jitter/shimmer = stress/anxiety

        let mood = 'neutral';
        let score = 0;

        if (pitch > 0.7 && energy > 0.7) {
            mood = 'positive';
            score = 0.7;
        } else if (pitch < 0.4 && energy < 0.4) {
            mood = 'tired';
            score = -0.5;
        } else if (jitter > 0.05 || shimmer > 0.1) {
            mood = 'stressed';
            score = -0.6;
        }

        return { mood, score };
    }

    /**
     * Combines text and audio mood analysis
     * @private
     */
    combineMoodAnalysis(textAnalysis, audioMood) {
        if (!audioMood) {
            return textAnalysis;
        }

        // Weighted combination (text 70%, audio 30%)
        const textWeight = 0.7;
        const audioWeight = 0.3;

        const combinedScore = (textAnalysis.score * textWeight) + (audioMood.score * audioWeight);
        
        // Determine dominant emotion
        let emotion = textAnalysis.emotion;
        if (Math.abs(audioMood.score) > Math.abs(textAnalysis.score)) {
            emotion = audioMood.mood;
        }

        return {
            emotion,
            score: combinedScore,
            sentiment: combinedScore > 0 ? 'positive' : (combinedScore < 0 ? 'negative' : 'neutral'),
            confidence: Math.max(textAnalysis.confidence || 0.5, 0.5)
        };
    }

    /**
     * Fetches external factors that might affect mood
     * @private
     */
    async fetchExternalFactors(userId, days) {
        const factors = [];

        // Fetch weather data
        const weatherQuery = `
            SELECT date, condition, temperature
            FROM weather_history
            WHERE user_id = $1
            AND date > NOW() - INTERVAL '${days} days'
            ORDER BY date ASC
        `;

        try {
            const weatherResult = await this.db.query(weatherQuery, [userId]);
            weatherResult.rows.forEach(row => {
                factors.push({
                    date: new Date(row.date),
                    type: 'weather',
                    value: {
                        condition: row.condition,
                        temperature: row.temperature
                    }
                });
            });
        } catch (error) {
            // Weather data might not exist
        }

        // Fetch sleep data
        const sleepQuery = `
            SELECT date, sleep_quality, sleep_hours
            FROM health_data
            WHERE user_id = $1
            AND metric_type = 'sleep'
            AND date > NOW() - INTERVAL '${days} days'
            ORDER BY date ASC
        `;

        try {
            const sleepResult = await this.db.query(sleepQuery, [userId]);
            sleepResult.rows.forEach(row => {
                factors.push({
                    date: new Date(row.date),
                    type: 'sleep',
                    value: {
                        quality: row.sleep_quality,
                        hours: row.sleep_hours
                    }
                });
            });
        } catch (error) {
            // Sleep data might not exist
        }

        // Fetch exercise data
        const exerciseQuery = `
            SELECT date, steps, activity_minutes
            FROM health_data
            WHERE user_id = $1
            AND metric_type = 'activity'
            AND date > NOW() - INTERVAL '${days} days'
            ORDER BY date ASC
        `;

        try {
            const exerciseResult = await this.db.query(exerciseQuery, [userId]);
            exerciseResult.rows.forEach(row => {
                factors.push({
                    date: new Date(row.date),
                    type: 'exercise',
                    value: {
                        steps: row.steps,
                        minutes: row.activity_minutes
                    }
                });
            });
        } catch (error) {
            // Exercise data might not exist
        }

        return factors;
    }

    /**
     * Correlates mood with external factors
     * @private
     */
    correlateMoodWithFactors(moodScores, factors) {
        const correlations = [];

        // Group factors by type
        const factorsByType = {};
        factors.forEach(f => {
            if (!factorsByType[f.type]) {
                factorsByType[f.type] = [];
            }
            factorsByType[f.type].push(f);
        });

        // Calculate correlations
        Object.keys(factorsByType).forEach(factorType => {
            const typeFactors = factorsByType[factorType];
            
            // Match mood scores with factors by date
            const matchedPairs = [];
            moodScores.forEach(mood => {
                const moodDate = new Date(mood.timestamp);
                const matchingFactor = typeFactors.find(f => {
                    const factorDate = new Date(f.date);
                    const diff = Math.abs(moodDate - factorDate);
                    return diff < (1000 * 60 * 60 * 24); // Within 24 hours
                });

                if (matchingFactor) {
                    matchedPairs.push({
                        mood: mood.score,
                        factor: matchingFactor.value
                    });
                }
            });

            if (matchedPairs.length >= 3) {
                const correlation = this.calculateCorrelation(matchedPairs);
                if (Math.abs(correlation) > 0.3) {
                    correlations.push({
                        factor: factorType,
                        correlation: Math.round(correlation * 100) / 100,
                        strength: Math.abs(correlation) > 0.7 ? 'strong' : 'moderate',
                        direction: correlation > 0 ? 'positive' : 'negative'
                    });
                }
            }
        });

        return correlations;
    }

    /**
     * Calculates correlation coefficient
     * @private
     */
    calculateCorrelation(pairs) {
        // Simplified correlation calculation
        const moods = pairs.map(p => p.mood);
        const factors = pairs.map(p => {
            // Normalize factor value (simplified)
            if (typeof p.factor === 'number') {
                return p.factor;
            }
            if (p.factor.quality) {
                return p.factor.quality;
            }
            if (p.factor.steps) {
                return p.factor.steps / 10000; // Normalize steps
            }
            return 0;
        });

        const moodMean = moods.reduce((a, b) => a + b, 0) / moods.length;
        const factorMean = factors.reduce((a, b) => a + b, 0) / factors.length;

        let numerator = 0;
        let moodVariance = 0;
        let factorVariance = 0;

        for (let i = 0; i < moods.length; i++) {
            const moodDiff = moods[i] - moodMean;
            const factorDiff = factors[i] - factorMean;
            numerator += moodDiff * factorDiff;
            moodVariance += moodDiff * moodDiff;
            factorVariance += factorDiff * factorDiff;
        }

        const denominator = Math.sqrt(moodVariance * factorVariance);
        return denominator === 0 ? 0 : numerator / denominator;
    }

    /**
     * Detects mood trends
     * @private
     */
    detectTrends(moodScores) {
        if (moodScores.length < 3) {
            return { trend: 'insufficient_data' };
        }

        // Calculate trend using linear regression
        const n = moodScores.length;
        let sumX = 0;
        let sumY = 0;
        let sumXY = 0;
        let sumX2 = 0;

        moodScores.forEach((score, index) => {
            const x = index;
            const y = score.score;
            sumX += x;
            sumY += y;
            sumXY += x * y;
            sumX2 += x * x;
        });

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const trend = slope > 0.1 ? 'improving' : (slope < -0.1 ? 'declining' : 'stable');

        return {
            trend,
            slope: Math.round(slope * 100) / 100,
            recentAverage: moodScores.slice(-3).reduce((sum, s) => sum + s.score, 0) / 3
        };
    }

    /**
     * Generates mood insights and intervention suggestions
     * @private
     */
    generateMoodInsights(moodScores, correlations, trends) {
        const insights = [];

        // Trend insights
        if (trends.trend === 'declining') {
            insights.push({
                type: 'trend',
                severity: 'medium',
                text: 'Your mood has been declining over the past period.',
                suggestion: 'schedule_break',
                action: 'Consider taking a break or doing something you enjoy.'
            });
        }

        // Correlation insights
        correlations.forEach(corr => {
            if (corr.factor === 'sleep' && corr.direction === 'positive') {
                insights.push({
                    type: 'correlation',
                    text: 'Better sleep quality correlates with improved mood.',
                    suggestion: 'improve_sleep',
                    action: 'Try to maintain consistent sleep schedule.'
                });
            }

            if (corr.factor === 'exercise' && corr.direction === 'positive') {
                insights.push({
                    type: 'correlation',
                    text: 'More exercise correlates with better mood.',
                    suggestion: 'increase_exercise',
                    action: 'Consider adding more physical activity to your routine.'
                });
            }
        });

        // Low mood intervention
        const recentMoods = moodScores.slice(-3);
        const avgRecentMood = recentMoods.reduce((sum, m) => sum + m.score, 0) / recentMoods.length;
        
        if (avgRecentMood < -0.5) {
            insights.push({
                type: 'intervention',
                severity: 'high',
                text: 'Your mood has been consistently low. Would you like me to suggest some activities?',
                suggestion: 'wellness_check',
                actions: [
                    'Start a breathing exercise',
                    'Suggest a walk outside',
                    'Play calming music',
                    'Schedule time with friends'
                ]
            });
        }

        return insights;
    }

    /**
     * Calculates overall mood from scores
     * @private
     */
    calculateOverallMood(moodScores) {
        if (moodScores.length === 0) {
            return 'unknown';
        }

        const avgScore = moodScores.reduce((sum, m) => sum + m.score, 0) / moodScores.length;
        
        if (avgScore > 0.3) {
            return 'positive';
        } else if (avgScore < -0.3) {
            return 'negative';
        } else {
            return 'neutral';
        }
    }
}

// Example usage:
// const tracker = new MoodTracker({ db: dbConnection });
// const analysis = await tracker.trackMood('user123', 7);
// console.log(analysis.overallMood, analysis.insights);
