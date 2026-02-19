/**
 * SOFIYA Security Monitor
 * Phase 10.2: Security Monitoring System
 * 
 * Monitors accounts, detects phishing, password management,
 * alerts on suspicious activity.
 */

import 'dotenv/config';
import { createClient } from 'pg';

export class SecurityMonitor {
    constructor(options = {}) {
        this.db = options.db || null;
        this.notificationService = options.notificationService || null;
        this.failedLogins = new Map();
        this.loginThreshold = 5;
    }

    /**
     * Records failed login attempt
     * @param {string} userId - User ID or identifier
     * @param {string} ip - IP address
     * @returns {Promise<Object>} Status (locked, attempt count)
     */
    async recordFailedLogin(userId, ip) {
        const key = `${userId}:${ip}`;
        const current = (this.failedLogins.get(key) || 0) + 1;
        this.failedLogins.set(key, current);

        if (this.db) {
            await this.logSecurityEvent('failed_login', { userId, ip });
        }

        if (current >= this.loginThreshold) {
            await this.alertSuspiciousActivity(userId, 'multiple_failed_logins', { count: current });
            return { locked: true, attempts: current };
        }

        return { locked: false, attempts: current };
    }

    /**
     * Resets failed login count on success
     */
    recordSuccessfulLogin(userId, ip) {
        this.failedLogins.delete(`${userId}:${ip}`);
    }

    /**
     * Checks if message/email looks like phishing
     * @param {string} content - Message content
     * @returns {Object} Phishing analysis
     */
    analyzePhishingRisk(content) {
        const indicators = [
            { pattern: /urgent|immediately|act now/i, weight: 1 },
            { pattern: /verify your account|confirm identity/i, weight: 2 },
            { pattern: /click here|http[s]?:\/\/[^\s]+/i, weight: 1 },
            { pattern: /\bpassword\b.*\breset\b/i, weight: 2 },
            { pattern: /suspended|locked|disabled/i, weight: 1 }
        ];

        let score = 0;
        const matches = [];

        indicators.forEach(({ pattern, weight }) => {
            if (pattern.test(content)) {
                score += weight;
                matches.push(pattern.toString());
            }
        });

        return {
            riskLevel: score >= 4 ? 'high' : score >= 2 ? 'medium' : 'low',
            score,
            matches,
            recommendation: score >= 4 ? 'Do not click links. Verify sender separately.' : null
        };
    }

    /**
     * Generates strong password suggestion
     * @param {number} length - Length (default 16)
     * @returns {string} Password suggestion
     */
    generatePassword(length = 16) {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*';
        let password = '';
        for (let i = 0; i < length; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }

    /**
     * Alerts on suspicious activity
     * @private
     */
    async alertSuspiciousActivity(userId, eventType, details) {
        if (this.notificationService) {
            await this.notificationService.sendNotification({
                userId,
                type: 'security_alert',
                title: 'Security Alert',
                message: `Suspicious activity detected: ${eventType}`,
                priority: 'high',
                metadata: details
            });
        }

        if (this.db) {
            await this.logSecurityEvent(eventType, { userId, ...details });
        }
    }

    /**
     * Logs security event
     * @private
     */
    async logSecurityEvent(eventType, details) {
        if (!this.db) return;

        try {
            const query = `
                INSERT INTO security_events (event_type, details, created_at)
                VALUES ($1, $2, NOW())
            `;
            await this.db.query(query, [eventType, JSON.stringify(details)]);
        } catch (error) {
            console.error('[SecurityMonitor] Error logging event:', error);
        }
    }

    /**
     * Gets recent security events for user
     * @param {string} userId - User ID
     * @param {number} limit - Limit
     */
    async getSecurityEvents(userId, limit = 20) {
        if (!this.db) return [];

        try {
            const query = `
                SELECT * FROM security_events
                WHERE details->>'userId' = $1
                ORDER BY created_at DESC
                LIMIT $2
            `;
            const result = await this.db.query(query, [userId, limit]);
            return result.rows;
        } catch (error) {
            return [];
        }
    }
}
