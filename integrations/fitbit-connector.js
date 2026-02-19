/**
 * SOFIYA Fitbit Connector
 * Phase 6.1: Fitbit API Integration
 * 
 * Connects to Fitbit API for fitness and health data.
 * Supports OAuth 2.0, data fetching, and sync.
 */

import 'dotenv/config';
import https from 'https';

export class FitbitConnector {
    constructor(options = {}) {
        this.clientId = options.clientId || process.env.FITBIT_CLIENT_ID;
        this.clientSecret = options.clientSecret || process.env.FITBIT_CLIENT_SECRET;
        this.redirectUri = options.redirectUri || process.env.FITBIT_REDIRECT_URI;
        this.accessToken = options.accessToken || null;
        this.refreshToken = options.refreshToken || null;
        
        this.apiBase = 'https://api.fitbit.com/1';
    }

    /**
     * Initializes connector
     */
    async initialize() {
        if (this.accessToken) {
            console.log('[Fitbit] Connector initialized with access token');
        } else {
            console.log('[Fitbit] Connector initialized (needs OAuth)');
        }
    }

    /**
     * Gets OAuth authorization URL
     * @returns {string} Authorization URL
     */
    getAuthUrl() {
        const params = new URLSearchParams({
            client_id: this.clientId,
            response_type: 'code',
            scope: 'activity heartrate location nutrition profile settings sleep social weight',
            redirect_uri: this.redirectUri
        });

        return `https://www.fitbit.com/oauth2/authorize?${params.toString()}`;
    }

    /**
     * Exchanges authorization code for tokens
     * @param {string} code - Authorization code
     * @returns {Promise<Object>} Tokens
     */
    async exchangeCode(code) {
        const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

        return new Promise((resolve, reject) => {
            const postData = new URLSearchParams({
                client_id: this.clientId,
                grant_type: 'authorization_code',
                redirect_uri: this.redirectUri,
                code
            }).toString();

            const options = {
                hostname: 'api.fitbit.com',
                path: '/oauth2/token',
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const tokens = JSON.parse(data);
                        this.accessToken = tokens.access_token;
                        this.refreshToken = tokens.refresh_token;
                        resolve(tokens);
                    } catch (error) {
                        reject(error);
                    }
                });
            });

            req.on('error', reject);
            req.write(postData);
            req.end();
        });
    }

    /**
     * Refreshes access token
     * @returns {Promise<Object>} New tokens
     */
    async refreshAccessToken() {
        const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

        return new Promise((resolve, reject) => {
            const postData = new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: this.refreshToken
            }).toString();

            const options = {
                hostname: 'api.fitbit.com',
                path: '/oauth2/token',
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const tokens = JSON.parse(data);
                        this.accessToken = tokens.access_token;
                        this.refreshToken = tokens.refresh_token;
                        resolve(tokens);
                    } catch (error) {
                        reject(error);
                    }
                });
            });

            req.on('error', reject);
            req.write(postData);
            req.end();
        });
    }

    /**
     * Makes API request
     * @private
     */
    async apiRequest(method, path, body = null) {
        if (!this.accessToken) {
            throw new Error('Access token not available');
        }

        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'api.fitbit.com',
                path: path,
                method: method,
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    if (res.statusCode === 401) {
                        // Token expired, try refresh
                        this.refreshAccessToken()
                            .then(() => this.apiRequest(method, path, body))
                            .then(resolve)
                            .catch(reject);
                        return;
                    }

                    try {
                        resolve(JSON.parse(data));
                    } catch (error) {
                        resolve(data);
                    }
                });
            });

            req.on('error', reject);

            if (body) {
                req.write(JSON.stringify(body));
            }

            req.end();
        });
    }

    /**
     * Gets daily activity summary
     * @param {string} date - Date (YYYY-MM-DD) or 'today'
     * @returns {Promise<Object>} Activity data
     */
    async getDailyActivity(date = 'today') {
        const path = `/user/-/activities/date/${date}.json`;
        return await this.apiRequest('GET', path);
    }

    /**
     * Gets sleep data
     * @param {string} date - Date (YYYY-MM-DD) or 'today'
     * @returns {Promise<Object>} Sleep data
     */
    async getSleepData(date = 'today') {
        const path = `/user/-/sleep/date/${date}.json`;
        return await this.apiRequest('GET', path);
    }

    /**
     * Gets heart rate data
     * @param {string} date - Date (YYYY-MM-DD) or 'today'
     * @returns {Promise<Object>} Heart rate data
     */
    async getHeartRate(date = 'today') {
        const path = `/user/-/activities/heart/date/${date}/1d.json`;
        return await this.apiRequest('GET', path);
    }

    /**
     * Gets weight data
     * @param {string} date - Date (YYYY-MM-DD) or 'today'
     * @returns {Promise<Object>} Weight data
     */
    async getWeight(date = 'today') {
        const path = `/user/-/body/log/weight/date/${date}.json`;
        return await this.apiRequest('GET', path);
    }

    /**
     * Gets steps data
     * @param {string} date - Date (YYYY-MM-DD) or 'today'
     * @returns {Promise<Object>} Steps data
     */
    async getSteps(date = 'today') {
        const activity = await this.getDailyActivity(date);
        return {
            steps: activity.summary?.steps || 0,
            distance: activity.summary?.distances?.[0]?.distance || 0,
            calories: activity.summary?.caloriesOut || 0,
            activeMinutes: activity.summary?.fairlyActiveMinutes + activity.summary?.veryActiveMinutes || 0
        };
    }

    /**
     * Syncs all health data for a date
     * @param {string} userId - User ID
     * @param {string} date - Date (YYYY-MM-DD) or 'today'
     * @returns {Promise<Object>} Synced data
     */
    async syncHealthData(userId, date = 'today') {
        const [activity, sleep, heartRate, weight, steps] = await Promise.all([
            this.getDailyActivity(date),
            this.getSleepData(date),
            this.getHeartRate(date),
            this.getWeight(date),
            this.getSteps(date)
        ]);

        return {
            userId,
            date,
            activity,
            sleep,
            heartRate,
            weight,
            steps,
            syncedAt: new Date().toISOString()
        };
    }
}

// Example usage:
// const fitbit = new FitbitConnector();
// await fitbit.initialize();
// const authUrl = fitbit.getAuthUrl();
// const tokens = await fitbit.exchangeCode(authCode);
// const steps = await fitbit.getSteps('today');
// const sleep = await fitbit.getSleepData('today');
