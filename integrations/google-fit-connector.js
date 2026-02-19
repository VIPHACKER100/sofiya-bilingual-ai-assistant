/**
 * SOFIYA Google Fit Connector
 * Phase 6.1: Google Fit API Integration
 * 
 * Connects to Google Fit API for Android health data.
 * Supports OAuth 2.0 and data fetching.
 */

import 'dotenv/config';
import { google } from 'googleapis';

export class GoogleFitConnector {
    constructor(options = {}) {
        this.clientId = options.clientId || process.env.GOOGLE_FIT_CLIENT_ID;
        this.clientSecret = options.clientSecret || process.env.GOOGLE_FIT_CLIENT_SECRET;
        this.redirectUri = options.redirectUri || process.env.GOOGLE_FIT_REDIRECT_URI;
        this.accessToken = options.accessToken || null;
        this.refreshToken = options.refreshToken || null;
        
        this.oauth2Client = null;
        this.fitness = null;
    }

    /**
     * Initializes OAuth2 client and Fitness API
     */
    async initialize() {
        this.oauth2Client = new google.auth.OAuth2(
            this.clientId,
            this.clientSecret,
            this.redirectUri
        );

        if (this.accessToken && this.refreshToken) {
            this.oauth2Client.setCredentials({
                access_token: this.accessToken,
                refresh_token: this.refreshToken
            });
        }

        this.fitness = google.fitness({ version: 'v1', auth: this.oauth2Client });

        console.log('[GoogleFit] Connector initialized');
    }

    /**
     * Gets OAuth authorization URL
     * @returns {string} Authorization URL
     */
    getAuthUrl() {
        if (!this.oauth2Client) {
            this.initialize();
        }

        const scopes = [
            'https://www.googleapis.com/auth/fitness.activity.read',
            'https://www.googleapis.com/auth/fitness.heart_rate.read',
            'https://www.googleapis.com/auth/fitness.sleep.read',
            'https://www.googleapis.com/auth/fitness.body.read'
        ];

        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            prompt: 'consent'
        });
    }

    /**
     * Exchanges authorization code for tokens
     * @param {string} code - Authorization code
     * @returns {Promise<Object>} Tokens
     */
    async exchangeCode(code) {
        const { tokens } = await this.oauth2Client.getToken(code);
        
        this.accessToken = tokens.access_token;
        this.refreshToken = tokens.refresh_token;
        
        this.oauth2Client.setCredentials(tokens);
        
        return tokens;
    }

    /**
     * Gets daily steps
     * @param {string} date - Date (YYYY-MM-DD) or 'today'
     * @returns {Promise<Object>} Steps data
     */
    async getSteps(date = 'today') {
        const targetDate = date === 'today' ? new Date() : new Date(date);
        const startTime = new Date(targetDate);
        startTime.setHours(0, 0, 0, 0);
        const endTime = new Date(targetDate);
        endTime.setHours(23, 59, 59, 999);

        try {
            const response = await this.fitness.users.dataset.aggregate({
                userId: 'me',
                requestBody: {
                    aggregateBy: [{
                        dataTypeName: 'com.google.step_count.delta',
                        dataSourceId: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps'
                    }],
                    bucketByTime: { durationMillis: 86400000 },
                    startTimeMillis: startTime.getTime(),
                    endTimeMillis: endTime.getTime()
                }
            });

            const steps = response.data.bucket?.[0]?.dataset?.[0]?.point?.[0]?.value?.[0]?.intVal || 0;

            return {
                date: date,
                steps,
                timestamp: targetDate.toISOString()
            };
        } catch (error) {
            console.error('[GoogleFit] Error fetching steps:', error);
            throw new Error(`Failed to fetch steps: ${error.message}`);
        }
    }

    /**
     * Gets heart rate data
     * @param {string} date - Date (YYYY-MM-DD) or 'today'
     * @returns {Promise<Object>} Heart rate data
     */
    async getHeartRate(date = 'today') {
        const targetDate = date === 'today' ? new Date() : new Date(date);
        const startTime = new Date(targetDate);
        startTime.setHours(0, 0, 0, 0);
        const endTime = new Date(targetDate);
        endTime.setHours(23, 59, 59, 999);

        try {
            const response = await this.fitness.users.dataSources.datasets.get({
                userId: 'me',
                dataSourceId: 'derived:com.google.heart_rate.bpm:com.google.android.gms:merge_heart_rate_bpm',
                datasetId: `${startTime.getTime()}-${endTime.getTime()}`
            });

            const points = response.data.point || [];
            const heartRates = points.map(p => p.value?.[0]?.fpVal).filter(Boolean);

            return {
                date,
                average: heartRates.length > 0 ? heartRates.reduce((a, b) => a + b, 0) / heartRates.length : null,
                min: heartRates.length > 0 ? Math.min(...heartRates) : null,
                max: heartRates.length > 0 ? Math.max(...heartRates) : null,
                readings: heartRates
            };
        } catch (error) {
            console.error('[GoogleFit] Error fetching heart rate:', error);
            return {
                date,
                average: null,
                min: null,
                max: null,
                readings: []
            };
        }
    }

    /**
     * Gets sleep data
     * @param {string} date - Date (YYYY-MM-DD) or 'today'
     * @returns {Promise<Object>} Sleep data
     */
    async getSleepData(date = 'today') {
        const targetDate = date === 'today' ? new Date() : new Date(date);
        const startTime = new Date(targetDate);
        startTime.setHours(0, 0, 0, 0);
        const endTime = new Date(targetDate);
        endTime.setHours(23, 59, 59, 999);

        try {
            const response = await this.fitness.users.sessions.list({
                userId: 'me',
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                activityType: 72 // Sleep
            });

            const sessions = response.data.session || [];
            const sleepSessions = sessions.map(session => ({
                startTime: session.startTimeMillis,
                endTime: session.endTimeMillis,
                duration: (session.endTimeMillis - session.startTimeMillis) / 1000 / 60 / 60, // hours
                name: session.name
            }));

            const totalSleep = sleepSessions.reduce((sum, s) => sum + s.duration, 0);

            return {
                date,
                totalSleepHours: totalSleep,
                sessions: sleepSessions
            };
        } catch (error) {
            console.error('[GoogleFit] Error fetching sleep:', error);
            return {
                date,
                totalSleepHours: null,
                sessions: []
            };
        }
    }

    /**
     * Gets weight data
     * @param {string} date - Date (YYYY-MM-DD) or 'today'
     * @returns {Promise<Object>} Weight data
     */
    async getWeight(date = 'today') {
        const targetDate = date === 'today' ? new Date() : new Date(date);
        const startTime = new Date(targetDate);
        startTime.setHours(0, 0, 0, 0);
        const endTime = new Date(targetDate);
        endTime.setHours(23, 59, 59, 999);

        try {
            const response = await this.fitness.users.dataSources.datasets.get({
                userId: 'me',
                dataSourceId: 'derived:com.google.weight:com.google.android.gms:merge_weight',
                datasetId: `${startTime.getTime()}-${endTime.getTime()}`
            });

            const points = response.data.point || [];
            const weights = points.map(p => p.value?.[0]?.fpVal).filter(Boolean);

            return {
                date,
                weight: weights.length > 0 ? weights[weights.length - 1] : null, // Latest
                allReadings: weights
            };
        } catch (error) {
            console.error('[GoogleFit] Error fetching weight:', error);
            return {
                date,
                weight: null,
                allReadings: []
            };
        }
    }

    /**
     * Syncs all health data for a date
     * @param {string} userId - User ID
     * @param {string} date - Date (YYYY-MM-DD) or 'today'
     * @returns {Promise<Object>} Synced data
     */
    async syncHealthData(userId, date = 'today') {
        const [steps, heartRate, sleep, weight] = await Promise.all([
            this.getSteps(date),
            this.getHeartRate(date),
            this.getSleepData(date),
            this.getWeight(date)
        ]);

        return {
            userId,
            date,
            steps,
            heartRate,
            sleep,
            weight,
            syncedAt: new Date().toISOString()
        };
    }
}

// Example usage:
// const googleFit = new GoogleFitConnector();
// await googleFit.initialize();
// const authUrl = googleFit.getAuthUrl();
// const tokens = await googleFit.exchangeCode(authCode);
// const steps = await googleFit.getSteps('today');
// const sleep = await googleFit.getSleepData('today');
