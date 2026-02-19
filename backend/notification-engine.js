/**
 * SOFIYA Notification Engine
 * Phase 20.1: Intelligent Notification Filtering and Prioritization
 * 
 * Aggregates notifications from all sources, deduplicates, prioritizes,
 * and sends at optimal times based on user context.
 */

import 'dotenv/config';
import { createClient } from 'pg';
import { createClient as createRedisClient } from 'redis';

export class NotificationEngine {
    constructor(options = {}) {
        this.db = options.db || null;
        this.redis = options.redis || null;
        this.batchWindow = options.batchWindow || 3600000; // 1 hour
        this.pendingNotifications = new Map(); // userId -> notifications[]
    }

    /**
     * Sends a notification to user
     * @param {string} userId - User ID
     * @param {Object} notification - Notification object
     * @returns {Promise<Object>} Result
     */
    async sendNotification(userId, notification) {
        // Get user preferences
        const preferences = await this.getUserPreferences(userId);
        
        // Check if notification should be sent
        if (!this.shouldSend(notification, preferences)) {
            return {
                sent: false,
                reason: 'filtered_by_preferences'
            };
        }

        // Check optimal timing
        const optimalTime = await this.getOptimalTime(userId, notification);
        const now = Date.now();
        
        if (optimalTime > now) {
            // Queue for later
            await this.queueNotification(userId, notification, optimalTime);
            return {
                sent: false,
            queued: true,
                scheduledFor: new Date(optimalTime)
            };
        }

        // Check if should batch
        if (this.shouldBatch(notification, preferences)) {
            await this.addToBatch(userId, notification);
            return {
                sent: false,
                batched: true
            };
        }

        // Send immediately
        return await this.deliverNotification(userId, notification, preferences);
    }

    /**
     * Gets user notification preferences
     * @private
     */
    async getUserPreferences(userId) {
        if (!this.db) {
            return this.getDefaultPreferences();
        }

        try {
            const query = `
                SELECT preferences
                FROM users
                WHERE id = $1
            `;

            const result = await this.db.query(query, [userId]);
            if (result.rows.length > 0) {
                const prefs = result.rows[0].preferences;
                return {
                    ...this.getDefaultPreferences(),
                    ...(prefs?.notifications || {})
                };
            }
        } catch (error) {
            console.error('[NotificationEngine] Error fetching preferences:', error);
        }

        return this.getDefaultPreferences();
    }

    /**
     * Gets default notification preferences
     * @private
     */
    getDefaultPreferences() {
        return {
            quietHours: { start: 22, end: 8 }, // 10 PM to 8 AM
            dndMode: false,
            channels: {
                push: true,
                sms: false,
                email: false,
                inApp: true
            },
            priorities: {
                critical: true,
                high: true,
                medium: true,
                low: false
            },
            batching: {
                enabled: true,
                window: 3600000 // 1 hour
            }
        };
    }

    /**
     * Determines if notification should be sent
     * @private
     */
    shouldSend(notification, preferences) {
        // Check priority
        if (!preferences.priorities[notification.priority || 'medium']) {
            return false;
        }

        // Check quiet hours
        if (!notification.urgent && this.isQuietHours(preferences.quietHours)) {
            return false;
        }

        // Check DND mode
        if (preferences.dndMode && notification.priority !== 'critical') {
            return false;
        }

        return true;
    }

    /**
     * Checks if current time is in quiet hours
     * @private
     */
    isQuietHours(quietHours) {
        const now = new Date();
        const currentHour = now.getHours();
        const { start, end } = quietHours;

        if (start > end) {
            // Spans midnight (e.g., 22 to 8)
            return currentHour >= start || currentHour < end;
        } else {
            return currentHour >= start && currentHour < end;
        }
    }

    /**
     * Gets optimal time to send notification
     * @private
     */
    async getOptimalTime(userId, notification) {
        const now = Date.now();

        // Critical notifications send immediately
        if (notification.priority === 'critical' || notification.urgent) {
            return now;
        }

        // Check user availability
        const availability = await this.checkAvailability(userId);
        
        if (!availability.available) {
            // Wait until available
            return availability.nextAvailableTime || now + (1000 * 60 * 30); // 30 min default
        }

        // Check if user is in a meeting
        const inMeeting = await this.isInMeeting(userId);
        if (inMeeting) {
            return inMeeting.meetingEndTime || now + (1000 * 60 * 15); // 15 min default
        }

        return now;
    }

    /**
     * Checks user availability
     * @private
     */
    async checkAvailability(userId) {
        // In production, check calendar, location, device activity
        // For now, assume available
        return {
            available: true,
            nextAvailableTime: null
        };
    }

    /**
     * Checks if user is in a meeting
     * @private
     */
    async isInMeeting(userId) {
        if (!this.db) {
            return null;
        }

        try {
            const query = `
                SELECT end_time
                FROM calendar_events
                WHERE user_id = $1
                AND start_time <= NOW()
                AND end_time > NOW()
                AND status = 'confirmed'
                LIMIT 1
            `;

            const result = await this.db.query(query, [userId]);
            if (result.rows.length > 0) {
                return {
                    inMeeting: true,
                    meetingEndTime: new Date(result.rows[0].end_time).getTime()
                };
            }
        } catch (error) {
            console.error('[NotificationEngine] Error checking meetings:', error);
        }

        return null;
    }

    /**
     * Determines if notification should be batched
     * @private
     */
    shouldBatch(notification, preferences) {
        if (!preferences.batching.enabled) {
            return false;
        }

        // Don't batch critical or high priority
        if (notification.priority === 'critical' || notification.priority === 'high') {
            return false;
        }

        return true;
    }

    /**
     * Adds notification to batch
     * @private
     */
    async addToBatch(userId, notification) {
        if (!this.pendingNotifications.has(userId)) {
            this.pendingNotifications.set(userId, []);
        }

        this.pendingNotifications.get(userId).push(notification);

        // Schedule batch send if not already scheduled
        // In production, use a proper job queue
        setTimeout(() => {
            this.sendBatch(userId);
        }, this.batchWindow);
    }

    /**
     * Sends batched notifications
     * @private
     */
    async sendBatch(userId) {
        const notifications = this.pendingNotifications.get(userId) || [];
        if (notifications.length === 0) {
            return;
        }

        // Deduplicate
        const unique = this.deduplicateNotifications(notifications);

        // Prioritize
        const prioritized = this.prioritizeNotifications(unique);

        // Send as grouped notification
        const preferences = await this.getUserPreferences(userId);
        await this.deliverNotification(userId, {
            type: 'batch',
            title: `You have ${prioritized.length} notifications`,
            body: this.formatBatchBody(prioritized),
            data: { notifications: prioritized },
            priority: 'medium'
        }, preferences);

        // Clear batch
        this.pendingNotifications.delete(userId);
    }

    /**
     * Deduplicates notifications
     * @private
     */
    deduplicateNotifications(notifications) {
        const seen = new Set();
        return notifications.filter(notif => {
            const key = `${notif.type}_${notif.sourceId || notif.title}`;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }

    /**
     * Prioritizes notifications
     * @private
     */
    prioritizeNotifications(notifications) {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return notifications.sort((a, b) => {
            const aPriority = priorityOrder[a.priority || 'medium'] || 2;
            const bPriority = priorityOrder[b.priority || 'medium'] || 2;
            return bPriority - aPriority;
        });
    }

    /**
     * Formats batch notification body
     * @private
     */
    formatBatchBody(notifications) {
        const top3 = notifications.slice(0, 3);
        const summaries = top3.map(n => `• ${n.title || n.type}`);
        const remaining = notifications.length - 3;
        
        if (remaining > 0) {
            return summaries.join('\n') + `\n...and ${remaining} more`;
        }
        return summaries.join('\n');
    }

    /**
     * Queues notification for later delivery
     * @private
     */
    async queueNotification(userId, notification, scheduledTime) {
        if (!this.db) {
            return;
        }

        try {
            const query = `
                INSERT INTO notification_queue (user_id, notification_data, scheduled_time, created_at)
                VALUES ($1, $2, $3, NOW())
            `;

            await this.db.query(query, [
                userId,
                JSON.stringify(notification),
                new Date(scheduledTime)
            ]);
        } catch (error) {
            console.error('[NotificationEngine] Error queueing notification:', error);
        }
    }

    /**
     * Delivers notification via appropriate channels
     * @private
     */
    async deliverNotification(userId, notification, preferences) {
        const channels = preferences.channels;
        const results = [];

        // Push notification
        if (channels.push) {
            try {
                await this.sendPushNotification(userId, notification);
                results.push({ channel: 'push', success: true });
            } catch (error) {
                results.push({ channel: 'push', success: false, error: error.message });
            }
        }

        // SMS (for critical only)
        if (channels.sms && notification.priority === 'critical') {
            try {
                await this.sendSMS(userId, notification);
                results.push({ channel: 'sms', success: true });
            } catch (error) {
                results.push({ channel: 'sms', success: false, error: error.message });
            }
        }

        // Email (for low priority, non-urgent)
        if (channels.email && notification.priority === 'low' && !notification.urgent) {
            try {
                await this.sendEmail(userId, notification);
                results.push({ channel: 'email', success: true });
            } catch (error) {
                results.push({ channel: 'email', success: false, error: error.message });
            }
        }

        // In-app (always)
        if (channels.inApp) {
            try {
                await this.sendInApp(userId, notification);
                results.push({ channel: 'inApp', success: true });
            } catch (error) {
                results.push({ channel: 'inApp', success: false, error: error.message });
            }
        }

        // Log notification
        await this.logNotification(userId, notification, results);

        return {
            sent: true,
            channels: results,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Sends push notification
     * @private
     */
    async sendPushNotification(userId, notification) {
        // In production, use FCM, APNS, or similar
        console.log(`[NotificationEngine] Push to ${userId}: ${notification.title}`);
    }

    /**
     * Sends SMS
     * @private
     */
    async sendSMS(userId, notification) {
        // In production, use Twilio SMS
        console.log(`[NotificationEngine] SMS to ${userId}: ${notification.body}`);
    }

    /**
     * Sends email
     * @private
     */
    async sendEmail(userId, notification) {
        // In production, use SendGrid, SES, etc.
        console.log(`[NotificationEngine] Email to ${userId}: ${notification.title}`);
    }

    /**
     * Sends in-app notification
     * @private
     */
    async sendInApp(userId, notification) {
        // Store in database for in-app retrieval
        if (this.db) {
            const query = `
                INSERT INTO user_notifications (user_id, type, title, body, data, priority, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, NOW())
            `;

            await this.db.query(query, [
                userId,
                notification.type,
                notification.title,
                notification.body,
                JSON.stringify(notification.data || {}),
                notification.priority || 'medium'
            ]);
        }
    }

    /**
     * Logs notification delivery
     * @private
     */
    async logNotification(userId, notification, results) {
        if (!this.db) {
            return;
        }

        try {
            const query = `
                INSERT INTO notification_logs (user_id, notification_type, priority, channels, success, created_at)
                VALUES ($1, $2, $3, $4, $5, NOW())
            `;

            const success = results.some(r => r.success);
            await this.db.query(query, [
                userId,
                notification.type,
                notification.priority || 'medium',
                JSON.stringify(results),
                success
            ]);
        } catch (error) {
            console.error('[NotificationEngine] Error logging notification:', error);
        }
    }
}

// Example usage:
// const engine = new NotificationEngine({ db: dbConnection });
// await engine.sendNotification('user123', {
//     type: 'reminder',
//     title: 'Meeting in 15 minutes',
//     body: 'Team standup starts at 10:00 AM',
//     priority: 'high',
//     urgent: false
// });
