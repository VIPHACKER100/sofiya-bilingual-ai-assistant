/**
 * SOFIYA Reminder Engine
 * Phase 5.2: Task & Reminder System
 * 
 * Manages time-based and location-based reminders with escalation levels.
 * Supports snoozing, completion tracking, and delegation.
 */

import 'dotenv/config';
import { createClient } from 'pg';
import { createClient as createRedisClient } from 'redis';

export class ReminderEngine {
    constructor(options = {}) {
        this.db = options.db || null;
        this.redis = options.redis || null;
        this.notificationService = options.notificationService || null;
        
        this.activeReminders = new Map();
        this.locationReminders = new Map();
        this.checkInterval = null;
    }

    /**
     * Initializes reminder engine
     */
    async initialize() {
        // Start checking for due reminders
        this.startReminderChecker();

        // Load active reminders from database
        if (this.db) {
            await this.loadActiveReminders();
        }

        console.log('[ReminderEngine] Initialized');
    }

    /**
     * Creates a time-based reminder
     * @param {Object} reminderData - Reminder data
     * @param {string} reminderData.userId - User ID
     * @param {string} reminderData.title - Reminder title
     * @param {string} reminderData.description - Reminder description
     * @param {Date|string} reminderData.dueTime - Due time
     * @param {string} reminderData.priority - Priority (low, medium, high)
     * @param {boolean} reminderData.recurring - Whether recurring
     * @param {string} reminderData.recurrencePattern - Recurrence pattern (daily, weekly, monthly)
     * @returns {Promise<Object>} Created reminder
     */
    async createReminder(reminderData) {
        const {
            userId,
            title,
            description = '',
            dueTime,
            priority = 'medium',
            recurring = false,
            recurrencePattern = null
        } = reminderData;

        const dueDate = dueTime instanceof Date ? dueTime : new Date(dueTime);

        if (!this.db) {
            throw new Error('Database not configured');
        }

        try {
            const query = `
                INSERT INTO reminders (
                    user_id, title, description, due_time, priority,
                    recurring, recurrence_pattern, status, created_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', NOW())
                RETURNING *
            `;

            const result = await this.db.query(query, [
                userId,
                title,
                description,
                dueDate.toISOString(),
                priority,
                recurring,
                recurrencePattern
            ]);

            const reminder = result.rows[0];

            // Schedule reminder check
            this.scheduleReminder(reminder);

            console.log(`[ReminderEngine] Created reminder: ${reminder.id}`);
            return reminder;
        } catch (error) {
            console.error('[ReminderEngine] Error creating reminder:', error);
            throw new Error(`Failed to create reminder: ${error.message}`);
        }
    }

    /**
     * Creates a location-based reminder
     * @param {Object} reminderData - Reminder data
     * @param {string} reminderData.userId - User ID
     * @param {string} reminderData.title - Reminder title
     * @param {string} reminderData.description - Reminder description
     * @param {string} reminderData.location - Location name or coordinates
     * @param {number} reminderData.radius - Trigger radius in meters (default: 100)
     * @returns {Promise<Object>} Created reminder
     */
    async createLocationReminder(reminderData) {
        const {
            userId,
            title,
            description = '',
            location,
            radius = 100
        } = reminderData;

        if (!this.db) {
            throw new Error('Database not configured');
        }

        try {
            const query = `
                INSERT INTO location_reminders (
                    user_id, title, description, location, radius, status, created_at
                )
                VALUES ($1, $2, $3, $4, $5, 'pending', NOW())
                RETURNING *
            `;

            const result = await this.db.query(query, [
                userId,
                title,
                description,
                location,
                radius
            ]);

            const reminder = result.rows[0];

            // Store in memory for quick lookup
            this.locationReminders.set(reminder.id, reminder);

            console.log(`[ReminderEngine] Created location reminder: ${reminder.id}`);
            return reminder;
        } catch (error) {
            console.error('[ReminderEngine] Error creating location reminder:', error);
            throw new Error(`Failed to create location reminder: ${error.message}`);
        }
    }

    /**
     * Checks location-based reminders
     * @param {string} userId - User ID
     * @param {Object} currentLocation - Current location { lat, lng }
     */
    async checkLocationReminders(userId, currentLocation) {
        const userReminders = Array.from(this.locationReminders.values())
            .filter(r => r.user_id === userId && r.status === 'pending');

        for (const reminder of userReminders) {
            const distance = this.calculateDistance(
                currentLocation,
                this.parseLocation(reminder.location)
            );

            if (distance <= reminder.radius) {
                await this.triggerReminder(reminder.id, 'location');
            }
        }
    }

    /**
     * Schedules a reminder check
     * @private
     */
    scheduleReminder(reminder) {
        const dueTime = new Date(reminder.due_time);
        const now = new Date();

        if (dueTime <= now) {
            // Already due, trigger immediately
            this.triggerReminder(reminder.id, 'time');
        } else {
            // Schedule for later
            const delay = dueTime.getTime() - now.getTime();
            setTimeout(() => {
                this.triggerReminder(reminder.id, 'time');
            }, delay);
        }

        this.activeReminders.set(reminder.id, reminder);
    }

    /**
     * Triggers a reminder
     * @private
     */
    async triggerReminder(reminderId, triggerType) {
        if (!this.db) {
            return;
        }

        try {
            // Get reminder
            const query = `
                SELECT * FROM reminders
                WHERE id = $1 AND status = 'pending'
            `;

            const result = await this.db.query(query, [reminderId]);
            if (result.rows.length === 0) {
                return;
            }

            const reminder = result.rows[0];

            // Send notification with escalation
            await this.sendReminderNotification(reminder, 1);

            // Update reminder status
            await this.db.query(
                `UPDATE reminders SET status = 'triggered', triggered_at = NOW() WHERE id = $1`,
                [reminderId]
            );

            // Handle recurring reminders
            if (reminder.recurring) {
                await this.createNextRecurrence(reminder);
            }
        } catch (error) {
            console.error('[ReminderEngine] Error triggering reminder:', error);
        }
    }

    /**
     * Sends reminder notification with escalation
     * @private
     */
    async sendReminderNotification(reminder, level) {
        if (!this.notificationService) {
            console.log(`[ReminderEngine] Reminder: ${reminder.title} (Level ${level})`);
            return;
        }

        const message = `Reminder: ${reminder.title}${reminder.description ? ` - ${reminder.description}` : ''}`;

        switch (level) {
            case 1:
                // Level 1: Visual cue on screen
                await this.notificationService.sendNotification({
                    userId: reminder.user_id,
                    type: 'reminder',
                    title: 'Reminder',
                    message,
                    priority: reminder.priority,
                    visual: true
                });
                break;

            case 2:
                // Level 2: Audible notification
                await this.notificationService.sendNotification({
                    userId: reminder.user_id,
                    type: 'reminder',
                    title: 'Reminder',
                    message,
                    priority: reminder.priority,
                    visual: true,
                    sound: true
                });
                break;

            case 3:
                // Level 3: Repeated notifications every 5 minutes
                await this.notificationService.sendNotification({
                    userId: reminder.user_id,
                    type: 'reminder',
                    title: 'Reminder (Repeated)',
                    message,
                    priority: 'high',
                    visual: true,
                    sound: true,
                    repeat: true,
                    repeatInterval: 5 * 60 * 1000 // 5 minutes
                });
                break;
        }

        // Escalate if not acknowledged
        if (level < 3) {
            setTimeout(async () => {
                const acknowledged = await this.isReminderAcknowledged(reminder.id);
                if (!acknowledged) {
                    await this.sendReminderNotification(reminder, level + 1);
                }
            }, 5 * 60 * 1000); // Check after 5 minutes
        }
    }

    /**
     * Checks if reminder is acknowledged
     * @private
     */
    async isReminderAcknowledged(reminderId) {
        if (!this.db) {
            return false;
        }

        const query = `
            SELECT status FROM reminders
            WHERE id = $1
        `;

        const result = await this.db.query(query, [reminderId]);
        return result.rows[0]?.status === 'completed' || result.rows[0]?.status === 'snoozed';
    }

    /**
     * Marks reminder as completed
     * @param {string} reminderId - Reminder ID
     * @returns {Promise<boolean>} Success status
     */
    async completeReminder(reminderId) {
        if (!this.db) {
            return false;
        }

        try {
            await this.db.query(
                `UPDATE reminders SET status = 'completed', completed_at = NOW() WHERE id = $1`,
                [reminderId]
            );

            this.activeReminders.delete(reminderId);
            return true;
        } catch (error) {
            console.error('[ReminderEngine] Error completing reminder:', error);
            return false;
        }
    }

    /**
     * Snoozes a reminder
     * @param {string} reminderId - Reminder ID
     * @param {number} minutes - Minutes to snooze (default: 15)
     * @returns {Promise<boolean>} Success status
     */
    async snoozeReminder(reminderId, minutes = 15) {
        if (!this.db) {
            return false;
        }

        try {
            const newDueTime = new Date(Date.now() + minutes * 60 * 1000);

            await this.db.query(
                `UPDATE reminders SET status = 'pending', due_time = $1, snoozed_at = NOW() WHERE id = $2`,
                [newDueTime.toISOString(), reminderId]
            );

            // Reschedule
            const reminder = await this.getReminder(reminderId);
            if (reminder) {
                this.scheduleReminder(reminder);
            }

            return true;
        } catch (error) {
            console.error('[ReminderEngine] Error snoozing reminder:', error);
            return false;
        }
    }

    /**
     * Gets reminder by ID
     * @private
     */
    async getReminder(reminderId) {
        if (!this.db) {
            return null;
        }

        const query = `SELECT * FROM reminders WHERE id = $1`;
        const result = await this.db.query(query, [reminderId]);
        return result.rows[0] || null;
    }

    /**
     * Gets user's reminders
     * @param {string} userId - User ID
     * @param {string} status - Filter by status (optional)
     * @returns {Promise<Array>} List of reminders
     */
    async getUserReminders(userId, status = null) {
        if (!this.db) {
            return [];
        }

        let query = `SELECT * FROM reminders WHERE user_id = $1`;
        const params = [userId];

        if (status) {
            query += ` AND status = $2`;
            params.push(status);
        }

        query += ` ORDER BY due_time ASC`;

        const result = await this.db.query(query, params);
        return result.rows;
    }

    /**
     * Creates next recurrence
     * @private
     */
    async createNextRecurrence(reminder) {
        const dueTime = new Date(reminder.due_time);
        let nextDueTime;

        switch (reminder.recurrence_pattern) {
            case 'daily':
                nextDueTime = new Date(dueTime.getTime() + 24 * 60 * 60 * 1000);
                break;
            case 'weekly':
                nextDueTime = new Date(dueTime.getTime() + 7 * 24 * 60 * 60 * 1000);
                break;
            case 'monthly':
                nextDueTime = new Date(dueTime);
                nextDueTime.setMonth(nextDueTime.getMonth() + 1);
                break;
            default:
                return;
        }

        await this.createReminder({
            userId: reminder.user_id,
            title: reminder.title,
            description: reminder.description,
            dueTime: nextDueTime,
            priority: reminder.priority,
            recurring: true,
            recurrencePattern: reminder.recurrence_pattern
        });
    }

    /**
     * Starts reminder checker
     * @private
     */
    startReminderChecker() {
        // Check every minute
        this.checkInterval = setInterval(async () => {
            await this.checkDueReminders();
        }, 60 * 1000);
    }

    /**
     * Checks for due reminders
     * @private
     */
    async checkDueReminders() {
        if (!this.db) {
            return;
        }

        try {
            const query = `
                SELECT * FROM reminders
                WHERE status = 'pending'
                AND due_time <= NOW()
            `;

            const result = await this.db.query(query);
            for (const reminder of result.rows) {
                await this.triggerReminder(reminder.id, 'time');
            }
        } catch (error) {
            console.error('[ReminderEngine] Error checking reminders:', error);
        }
    }

    /**
     * Loads active reminders from database
     * @private
     */
    async loadActiveReminders() {
        if (!this.db) {
            return;
        }

        try {
            const query = `
                SELECT * FROM reminders
                WHERE status = 'pending'
                AND due_time > NOW()
            `;

            const result = await this.db.query(query);
            result.rows.forEach(reminder => {
                this.scheduleReminder(reminder);
            });
        } catch (error) {
            console.error('[ReminderEngine] Error loading reminders:', error);
        }
    }

    /**
     * Calculates distance between two coordinates
     * @private
     */
    calculateDistance(loc1, loc2) {
        const R = 6371000; // Earth radius in meters
        const dLat = this.toRad(loc2.lat - loc1.lat);
        const dLon = this.toRad(loc2.lng - loc1.lng);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRad(loc1.lat)) * Math.cos(this.toRad(loc2.lat)) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Converts degrees to radians
     * @private
     */
    toRad(degrees) {
        return degrees * (Math.PI / 180);
    }

    /**
     * Parses location string to coordinates
     * @private
     */
    parseLocation(location) {
        // If already coordinates, return as-is
        if (typeof location === 'object' && location.lat && location.lng) {
            return location;
        }

        // For now, return placeholder (in production, use geocoding API)
        return { lat: 0, lng: 0 };
    }

    /**
     * Stops reminder engine
     */
    stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }
}

// Example usage:
// const reminderEngine = new ReminderEngine({ db, notificationService });
// await reminderEngine.initialize();
// await reminderEngine.createReminder({
//     userId: 'user123',
//     title: 'Call Mom',
//     dueTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
//     priority: 'high'
// });
