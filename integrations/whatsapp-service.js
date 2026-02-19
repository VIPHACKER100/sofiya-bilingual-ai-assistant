/**
 * SOFIYA WhatsApp Service Module
 * Phase 3.2: WhatsApp Business API Integration
 * 
 * Handles sending and receiving WhatsApp messages via Twilio or WhatsApp Business API.
 * Supports rich media (images, documents) and message delivery confirmation.
 */

import 'dotenv/config';
import twilio from 'twilio';

export class WhatsAppService {
    constructor(options = {}) {
        // Twilio configuration
        this.accountSid = options.accountSid || process.env.TWILIO_ACCOUNT_SID;
        this.authToken = options.authToken || process.env.TWILIO_AUTH_TOKEN;
        this.whatsappNumber = options.whatsappNumber || process.env.TWILIO_WHATSAPP_NUMBER;

        // Initialize Twilio client
        this.client = null;
        if (this.accountSid && this.authToken) {
            this.client = twilio(this.accountSid, this.authToken);
        }

        // Retry configuration
        this.maxRetries = options.maxRetries || 3;
        this.retryDelay = options.retryDelay || 1000; // milliseconds
    }

    /**
     * Initializes the WhatsApp service
     */
    async initialize() {
        if (!this.client) {
            throw new Error('Twilio credentials not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.');
        }

        console.log('[WhatsApp] Service initialized');
        return true;
    }

    /**
     * Sends a WhatsApp message
     * @param {string} phoneNumber - Recipient phone number (E.164 format: +1234567890)
     * @param {string} message - Message text
     * @param {Object} options - Additional options (media, etc.)
     * @returns {Promise<Object>} Message result with messageId and status
     */
    async sendMessage(phoneNumber, message, options = {}) {
        if (!this.client) {
            throw new Error('WhatsApp service not initialized');
        }

        // Validate phone number format
        const normalizedNumber = this.normalizePhoneNumber(phoneNumber);
        if (!normalizedNumber) {
            throw new Error(`Invalid phone number format: ${phoneNumber}`);
        }

        // Format WhatsApp number (whatsapp: prefix)
        const toNumber = `whatsapp:${normalizedNumber}`;
        const fromNumber = this.whatsappNumber || 'whatsapp:+14155238886'; // Twilio sandbox

        console.log(`[WhatsApp] Sending message to ${normalizedNumber}`);

        let lastError = null;

        // Retry logic
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                const messageOptions = {
                    from: fromNumber,
                    to: toNumber,
                    body: message
                };

                // Add media if provided
                if (options.mediaUrl) {
                    messageOptions.mediaUrl = Array.isArray(options.mediaUrl)
                        ? options.mediaUrl
                        : [options.mediaUrl];
                }

                const result = await this.client.messages.create(messageOptions);

                console.log(`[WhatsApp] Message sent successfully: ${result.sid}`);

                return {
                    messageId: result.sid,
                    status: result.status,
                    to: normalizedNumber,
                    timestamp: new Date().toISOString(),
                    deliveryStatus: 'sent'
                };
            } catch (error) {
                lastError = error;
                console.error(`[WhatsApp] Attempt ${attempt} failed:`, error.message);

                // Don't retry on certain errors (invalid number, etc.)
                if (error.code === 21211 || error.code === 21608) {
                    throw new Error(`Invalid recipient number: ${normalizedNumber}`);
                }

                // Wait before retry (exponential backoff)
                if (attempt < this.maxRetries) {
                    await this.sleep(this.retryDelay * attempt);
                }
            }
        }

        throw new Error(`Failed to send message after ${this.maxRetries} attempts: ${lastError?.message}`);
    }

    /**
     * Sends a message with media (image, document, etc.)
     * @param {string} phoneNumber - Recipient phone number
     * @param {string} message - Message text
     * @param {string|Array} mediaUrl - URL(s) to media file(s)
     * @returns {Promise<Object>} Message result
     */
    async sendMedia(phoneNumber, message, mediaUrl) {
        return await this.sendMessage(phoneNumber, message, { mediaUrl });
    }

    /**
     * Checks message delivery status
     * @param {string} messageId - Twilio message SID
     * @returns {Promise<Object>} Delivery status
     */
    async checkDeliveryStatus(messageId) {
        if (!this.client) {
            throw new Error('WhatsApp service not initialized');
        }

        try {
            const message = await this.client.messages(messageId).fetch();

            return {
                messageId: message.sid,
                status: message.status,
                dateSent: message.dateSent,
                dateUpdated: message.dateUpdated,
                errorCode: message.errorCode,
                errorMessage: message.errorMessage
            };
        } catch (error) {
            console.error(`[WhatsApp] Error checking delivery status:`, error);
            throw new Error(`Failed to check delivery status: ${error.message}`);
        }
    }

    /**
     * Normalizes phone number to E.164 format
     * @param {string} phoneNumber - Phone number in various formats
     * @returns {string|null} Normalized number or null if invalid
     */
    normalizePhoneNumber(phoneNumber) {
        if (!phoneNumber) {
            return null;
        }

        // Remove all non-digit characters except +
        let cleaned = phoneNumber.replace(/[^\d+]/g, '');

        // If starts with +, assume E.164 format
        if (cleaned.startsWith('+')) {
            // Validate length (country code + number, typically 10-15 digits)
            if (cleaned.length >= 11 && cleaned.length <= 16) {
                return cleaned;
            }
        }

        // If starts with country code without +, add +
        // Common patterns: 91XXXXXXXXXX (India), 1XXXXXXXXXX (US)
        if (cleaned.length === 12 && cleaned.startsWith('91')) {
            return `+${cleaned}`;
        }
        if (cleaned.length === 11 && cleaned.startsWith('1')) {
            return `+${cleaned}`;
        }

        // If 10 digits, assume US number
        if (cleaned.length === 10) {
            return `+1${cleaned}`;
        }

        // If already in E.164 format
        if (cleaned.match(/^\+\d{10,15}$/)) {
            return cleaned;
        }

        return null;
    }

    /**
     * Validates phone number format
     * @param {string} phoneNumber - Phone number to validate
     * @returns {boolean} True if valid
     */
    validatePhoneNumber(phoneNumber) {
        return this.normalizePhoneNumber(phoneNumber) !== null;
    }

    /**
     * Sleep utility for retry delays
     * @private
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Handles incoming webhook from Twilio
     * @param {Object} webhookData - Webhook payload from Twilio
     * @returns {Object} Parsed message data
     */
    parseWebhook(webhookData) {
        return {
            messageId: webhookData.MessageSid,
            from: webhookData.From?.replace('whatsapp:', '') || null,
            to: webhookData.To?.replace('whatsapp:', '') || null,
            body: webhookData.Body || '',
            mediaUrl: webhookData.MediaUrl0 || null,
            mediaCount: parseInt(webhookData.NumMedia || '0', 10),
            timestamp: webhookData.Timestamp || new Date().toISOString(),
            status: webhookData.MessageStatus || 'received'
        };
    }
}

// Example usage:
// const whatsapp = new WhatsAppService();
// await whatsapp.initialize();
// const result = await whatsapp.sendMessage('+1234567890', 'Hello from SOFIYA!');
// console.log(result);
