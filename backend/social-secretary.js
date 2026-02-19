/**
 * SOFIYA Social Secretary
 * Phase 8.1: Social & Relationship Management
 * 
 * Manages contacts with birthdays, preferences, gift ideas.
 * Generates heartfelt messages and suggests personalized gifts.
 */

import 'dotenv/config';
import { createClient } from 'pg';

export class SocialSecretary {
    constructor(options = {}) {
        this.db = options.db || null;
        this.notificationService = options.notificationService || null;
        this.whatsappService = options.whatsappService || null;
    }

    /**
     * Adds contact with social metadata
     * @param {Object} contactData - Contact data
     * @returns {Promise<Object>} Created contact
     */
    async addContact(contactData) {
        const {
            userId,
            name,
            phone,
            email,
            birthday,
            anniversary,
            preferences = {},
            giftIdeas = [],
            notes = ''
        } = contactData;

        if (!this.db) {
            throw new Error('Database not configured');
        }

        try {
            const query = `
                INSERT INTO social_contacts (
                    user_id, name, phone, email, birthday, anniversary,
                    preferences, gift_ideas, notes, created_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
                RETURNING *
            `;

            const result = await this.db.query(query, [
                userId,
                name,
                phone,
                email,
                birthday || null,
                anniversary || null,
                JSON.stringify(preferences),
                JSON.stringify(giftIdeas),
                notes
            ]);

            return result.rows[0];
        } catch (error) {
            console.error('[SocialSecretary] Error adding contact:', error);
            throw new Error(`Failed to add contact: ${error.message}`);
        }
    }

    /**
     * Gets upcoming birthdays
     * @param {string} userId - User ID
     * @param {number} daysAhead - Days to look ahead (default: 30)
     * @returns {Promise<Array>} Upcoming birthdays
     */
    async getUpcomingBirthdays(userId, daysAhead = 30) {
        if (!this.db) {
            return [];
        }

        try {
            const query = `
                SELECT * FROM social_contacts
                WHERE user_id = $1 AND birthday IS NOT NULL
                ORDER BY 
                    CASE 
                        WHEN EXTRACT(DOY FROM birthday) >= EXTRACT(DOY FROM CURRENT_DATE)
                        THEN EXTRACT(DOY FROM birthday)
                        ELSE EXTRACT(DOY FROM birthday) + 365
                    END
                LIMIT 50
            `;

            const result = await this.db.query(query, [userId]);
            const today = new Date();
            const cutoff = new Date(today);
            cutoff.setDate(cutoff.getDate() + daysAhead);

            return result.rows.filter(row => {
                const bday = new Date(row.birthday);
                bday.setFullYear(today.getFullYear());
                return bday >= today && bday <= cutoff;
            });
        } catch (error) {
            console.error('[SocialSecretary] Error getting birthdays:', error);
            return [];
        }
    }

    /**
     * Sets birthday reminders
     * @param {string} userId - User ID
     * @param {Array} reminderDays - Days before to remind (e.g., [14, 7, 1])
     */
    async setBirthdayReminders(userId, reminderDays = [14, 7, 1]) {
        const birthdays = await this.getUpcomingBirthdays(userId, 30);

        if (!this.notificationService) {
            return;
        }

        for (const contact of birthdays) {
            const bday = new Date(contact.birthday);
            
            for (const daysBefore of reminderDays) {
                const reminderDate = new Date(bday);
                reminderDate.setDate(reminderDate.getDate() - daysBefore);
                reminderDate.setFullYear(new Date().getFullYear());

                if (reminderDate >= new Date()) {
                    await this.notificationService.sendNotification({
                        userId,
                        type: 'birthday_reminder',
                        title: `Birthday in ${daysBefore} days`,
                        message: `${contact.name}'s birthday is coming up. Consider getting a gift!`,
                        scheduledFor: reminderDate,
                        metadata: { contactId: contact.id, contactName: contact.name }
                    });
                }
            }
        }
    }

    /**
     * Suggests gift ideas for contact
     * @param {string} contactId - Contact ID
     * @returns {Promise<Array>} Gift suggestions
     */
    async suggestGiftIdeas(contactId) {
        if (!this.db) {
            return [];
        }

        try {
            const query = `SELECT gift_ideas, preferences FROM social_contacts WHERE id = $1`;
            const result = await this.db.query(query, [contactId]);

            if (result.rows.length === 0) {
                return [];
            }

            const contact = result.rows[0];
            const storedIdeas = JSON.parse(contact.gift_ideas || '[]');
            const preferences = JSON.parse(contact.preferences || '{}');

            // Add suggestions based on preferences
            const preferenceIdeas = this.generateIdeasFromPreferences(preferences);

            return [...new Set([...storedIdeas, ...preferenceIdeas])];
        } catch (error) {
            console.error('[SocialSecretary] Error suggesting gifts:', error);
            return [];
        }
    }

    /**
     * Generates gift ideas from preferences
     * @private
     */
    generateIdeasFromPreferences(preferences) {
        const ideas = [];
        const preferenceMap = {
            hobbies: ['gift card for hobby store', 'equipment for their hobby', 'book about their interest'],
            favorite_store: ['gift card', 'popular item from store'],
            interests: ['personalized item', 'experience related to interest'],
            dietary: ['gourmet food basket', 'restaurant gift card']
        };

        Object.entries(preferences).forEach(([key, value]) => {
            const templates = preferenceMap[key];
            if (templates && value) {
                ideas.push(`${value} - ${templates[0]}`);
            }
        });

        return ideas;
    }

    /**
     * Generates birthday/anniversary message
     * @param {string} contactName - Contact name
     * @param {string} occasion - Occasion (birthday, anniversary)
     * @param {string} tone - Tone (heartfelt, casual, formal)
     * @returns {Promise<string>} Generated message
     */
    async generateMessage(contactName, occasion = 'birthday', tone = 'heartfelt') {
        const templates = {
            birthday: {
                heartfelt: [
                    `Happy Birthday, ${contactName}! Wishing you a day filled with joy and a year ahead full of wonderful moments. 🎂`,
                    `Dear ${contactName}, may your birthday bring you everything your heart desires. Celebrating you today! 🎉`,
                    `Happy Birthday to an amazing person! ${contactName}, here's to another year of making memories together. 🌟`
                ],
                casual: [
                    `Hey ${contactName}! Happy Birthday! Hope you have an awesome day! 🎂`,
                    `Happy B-day ${contactName}! Have a great one! 🎉`
                ],
                formal: [
                    `Dear ${contactName}, Wishing you a very Happy Birthday. May the coming year bring you health, happiness, and success.`
                ]
            },
            anniversary: {
                heartfelt: [
                    `Happy Anniversary, ${contactName}! Wishing you both many more years of love and happiness together. 💕`,
                    `Celebrating your special day! May your love continue to grow stronger. Happy Anniversary! 💑`
                ],
                casual: [
                    `Happy Anniversary! Hope you have a wonderful celebration! 🎉`
                ],
                formal: [
                    `Wishing you a very Happy Anniversary. May you continue to share many joyful years together.`
                ]
            }
        };

        const occasionTemplates = templates[occasion]?.[tone] || templates.birthday.heartfelt;
        const randomIndex = Math.floor(Math.random() * occasionTemplates.length);
        return occasionTemplates[randomIndex];
    }

    /**
     * Gets all social contacts
     * @param {string} userId - User ID
     * @returns {Promise<Array>} Contacts
     */
    async getContacts(userId) {
        if (!this.db) {
            return [];
        }

        try {
            const query = `
                SELECT * FROM social_contacts
                WHERE user_id = $1
                ORDER BY name
            `;

            const result = await this.db.query(query, [userId]);
            return result.rows;
        } catch (error) {
            console.error('[SocialSecretary] Error getting contacts:', error);
            return [];
        }
    }

    /**
     * Updates contact
     * @param {string} contactId - Contact ID
     * @param {Object} updates - Updates
     */
    async updateContact(contactId, updates) {
        if (!this.db) {
            throw new Error('Database not configured');
        }

        const allowedFields = ['name', 'phone', 'email', 'birthday', 'anniversary', 'preferences', 'gift_ideas', 'notes'];
        const setClauses = [];
        const values = [];
        let paramIndex = 1;

        Object.entries(updates).forEach(([key, value]) => {
            if (allowedFields.includes(key)) {
                setClauses.push(`${key} = $${paramIndex}`);
                values.push(typeof value === 'object' ? JSON.stringify(value) : value);
                paramIndex++;
            }
        });

        if (setClauses.length === 0) {
            throw new Error('No valid updates provided');
        }

        values.push(contactId);
        const query = `UPDATE social_contacts SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`;
        const result = await this.db.query(query, values);
        return result.rows[0];
    }
}
