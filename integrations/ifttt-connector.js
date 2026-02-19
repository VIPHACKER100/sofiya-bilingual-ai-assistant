/**
 * SOFIYA IFTTT Connector
 * Phase 4.1: IFTTT Webhook Integration
 * 
 * Connects to IFTTT for general automation and device control.
 * Uses IFTTT Webhooks service for triggering applets.
 */

import 'dotenv/config';
import https from 'https';

export class IFTTTConnector {
    constructor(options = {}) {
        this.webhookKey = options.webhookKey || process.env.IFTTT_WEBHOOK_KEY;
        this.webhookUrl = `https://maker.ifttt.com/trigger`;
    }

    /**
     * Initializes connector
     */
    async initialize() {
        if (!this.webhookKey) {
            console.warn('[IFTTT] Webhook key not configured');
        } else {
            console.log('[IFTTT] Connector initialized');
        }
    }

    /**
     * Triggers an IFTTT webhook
     * @param {string} eventName - IFTTT event name
     * @param {Object} values - Values to send (value1, value2, value3)
     * @returns {Promise<Object>} Result
     */
    async triggerWebhook(eventName, values = {}) {
        if (!this.webhookKey) {
            throw new Error('IFTTT webhook key not configured');
        }

        const url = `${this.webhookUrl}/${eventName}/with/key/${this.webhookKey}`;

        return new Promise((resolve, reject) => {
            const postData = JSON.stringify({
                value1: values.value1 || '',
                value2: values.value2 || '',
                value3: values.value3 || ''
            });

            const options = {
                hostname: 'maker.ifttt.com',
                path: `/trigger/${eventName}/with/key/${this.webhookKey}`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        resolve({
                            success: true,
                            event: eventName,
                            timestamp: new Date().toISOString()
                        });
                    } else {
                        reject(new Error(`IFTTT webhook failed: ${res.statusCode}`));
                    }
                });
            });

            req.on('error', reject);
            req.write(postData);
            req.end();
        });
    }

    /**
     * Controls device via IFTTT
     * @param {string} deviceName - Device name (as configured in IFTTT)
     * @param {string} action - Action (on, off, dim, etc.)
     * @param {any} value - Action value
     * @returns {Promise<Object>} Result
     */
    async controlDevice(deviceName, action, value = null) {
        const eventName = `${deviceName}_${action}`;
        const values = {
            value1: deviceName,
            value2: action,
            value3: value ? String(value) : ''
        };

        return await this.triggerWebhook(eventName, values);
    }

    /**
     * Triggers a scene via IFTTT
     * @param {string} sceneName - Scene name
     * @returns {Promise<Object>} Result
     */
    async triggerScene(sceneName) {
        return await this.triggerWebhook(`scene_${sceneName}`, {
            value1: sceneName
        });
    }

    /**
     * Sends notification via IFTTT
     * @param {string} message - Notification message
     * @returns {Promise<Object>} Result
     */
    async sendNotification(message) {
        return await this.triggerWebhook('sofiya_notification', {
            value1: message
        });
    }
}

// Example usage:
// const ifttt = new IFTTTConnector();
// await ifttt.initialize();
// await ifttt.controlDevice('living_room_lights', 'on');
// await ifttt.triggerScene('movie_night');
