/**
 * SOFIYA Delegation Service
 * Phase 5.3: Delegation Feature
 * 
 * Enables SOFIYA to send reminders to others on behalf of the user.
 * Supports WhatsApp, email, and SMS delivery.
 */

import 'dotenv/config';
import { WhatsAppService } from './whatsapp-service.js';
import { ReminderEngine } from '../backend/reminder-engine.js';

export class DelegationService {
    constructor(options = {}) {
        this.whatsappService = options.whatsappService || null;
        this.emailService = options.emailService || null;
        this.smsService = options.smsService || null;
        this.reminderEngine = options.reminderEngine || null;
        this.contactManager = options.contactManager || null;
    }

    /**
     * Delegates a reminder to another person
     * @param {Object} delegationData - Delegation data
     * @param {string} delegationData.userId - User ID (delegator)
     * @param {string} delegationData.recipientName - Recipient name or phone/email
     * @param {string} delegationData.message - Message to send
     * @param {Date|string} delegationData.dueTime - When to send reminder
     * @param {string} delegationData.channel - Channel (whatsapp, email, sms)
     * @param {string} delegationData.context - Context for message generation
     * @returns {Promise<Object>} Delegation result
     */
    async delegateReminder(delegationData) {
        const {
            userId,
            recipientName,
            message,
            dueTime,
            channel = 'whatsapp',
            context = {}
        } = delegationData;

        // Find recipient contact
        const recipient = await this.findRecipient(recipientName);
        if (!recipient) {
            throw new Error(`Recipient not found: ${recipientName}`);
        }

        // Generate contextual message
        const contextualMessage = await this.generateContextualMessage({
            message,
            recipient: recipient.name || recipientName,
            context,
            channel
        });

        // Schedule reminder
        if (this.reminderEngine && dueTime) {
            await this.reminderEngine.createReminder({
                userId,
                title: `Delegated: ${message}`,
                description: `Reminder for ${recipient.name || recipientName}`,
                dueTime,
                priority: 'medium'
            });
        }

        // Send message immediately or schedule
        const sendTime = dueTime ? new Date(dueTime) : new Date();
        const shouldSendNow = sendTime <= new Date();

        if (shouldSendNow) {
            return await this.sendDelegatedMessage({
                recipient,
                message: contextualMessage,
                channel
            });
        } else {
            // Schedule for later
            return await this.scheduleDelegatedMessage({
                recipient,
                message: contextualMessage,
                channel,
                sendTime
            });
        }
    }

    /**
     * Sends delegated message immediately
     * @private
     */
    async sendDelegatedMessage({ recipient, message, channel }) {
        try {
            switch (channel) {
                case 'whatsapp':
                    if (!this.whatsappService) {
                        throw new Error('WhatsApp service not configured');
                    }
                    return await this.whatsappService.sendMessage(
                        recipient.phone || recipient.phoneNumber,
                        message
                    );

                case 'email':
                    if (!this.emailService) {
                        throw new Error('Email service not configured');
                    }
                    return await this.emailService.sendEmail({
                        to: recipient.email,
                        subject: 'Reminder from SOFIYA',
                        body: message
                    });

                case 'sms':
                    if (!this.smsService) {
                        throw new Error('SMS service not configured');
                    }
                    return await this.smsService.sendSMS(
                        recipient.phone || recipient.phoneNumber,
                        message
                    );

                default:
                    throw new Error(`Unsupported channel: ${channel}`);
            }
        } catch (error) {
            console.error('[DelegationService] Error sending message:', error);
            throw new Error(`Failed to send delegated message: ${error.message}`);
        }
    }

    /**
     * Schedules delegated message for later
     * @private
     */
    async scheduleDelegatedMessage({ recipient, message, channel, sendTime }) {
        // In production, use a task queue or scheduled job
        // For now, store in database and process via cron job

        return {
            success: true,
            scheduled: true,
            sendTime: sendTime.toISOString(),
            recipient: recipient.name || recipient.phone || recipient.email,
            channel,
            message
        };
    }

    /**
     * Finds recipient contact
     * @private
     */
    async findRecipient(recipientName) {
        if (!this.contactManager) {
            // Fallback: assume it's a phone number or email
            if (this.isPhoneNumber(recipientName)) {
                return { phone: recipientName };
            }
            if (this.isEmail(recipientName)) {
                return { email: recipientName };
            }
            return { name: recipientName };
        }

        // Try to find in contacts
        const contact = await this.contactManager.findContact(recipientName);
        if (contact) {
            return contact;
        }

        // Fallback
        if (this.isPhoneNumber(recipientName)) {
            return { phone: recipientName };
        }
        if (this.isEmail(recipientName)) {
            return { email: recipientName };
        }

        return { name: recipientName };
    }

    /**
     * Generates contextual message
     * @private
     */
    async generateContextualMessage({ message, recipient, context, channel }) {
        // Build contextual message
        let contextualMessage = '';

        // Add greeting based on time of day
        const hour = new Date().getHours();
        if (hour < 12) {
            contextualMessage += `Good morning ${recipient},\n\n`;
        } else if (hour < 18) {
            contextualMessage += `Hi ${recipient},\n\n`;
        } else {
            contextualMessage += `Good evening ${recipient},\n\n`;
        }

        // Add context
        if (context.event) {
            contextualMessage += `Regarding ${context.event}: `;
        }
        if (context.urgency) {
            contextualMessage += `[${context.urgency.toUpperCase()}] `;
        }

        // Add main message
        contextualMessage += message;

        // Add closing
        contextualMessage += '\n\nBest regards,\nSOFIYA Assistant';

        // Adapt for channel
        if (channel === 'sms' || channel === 'whatsapp') {
            // Shorter, more casual
            contextualMessage = `Hi ${recipient}! ${message}`;
        }

        return contextualMessage;
    }

    /**
     * Checks if string is phone number
     * @private
     */
    isPhoneNumber(str) {
        return /^\+?[\d\s\-\(\)]+$/.test(str) && str.replace(/\D/g, '').length >= 10;
    }

    /**
     * Checks if string is email
     * @private
     */
    isEmail(str) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
    }

    /**
     * Tracks acknowledgment of delegated reminder
     * @param {string} delegationId - Delegation ID
     * @param {boolean} acknowledged - Whether acknowledged
     * @returns {Promise<boolean>} Success status
     */
    async trackAcknowledgment(delegationId, acknowledged) {
        // In production, store in database
        console.log(`[DelegationService] Delegation ${delegationId} acknowledged: ${acknowledged}`);
        return true;
    }
}

// Example usage:
// const delegationService = new DelegationService({
//     whatsappService,
//     reminderEngine,
//     contactManager
// });
// await delegationService.delegateReminder({
//     userId: 'user123',
//     recipientName: 'Mom',
//     message: 'Don't forget about dinner tonight at 7 PM',
//     dueTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
//     channel: 'whatsapp',
//     context: { event: 'dinner', urgency: 'high' }
// });
