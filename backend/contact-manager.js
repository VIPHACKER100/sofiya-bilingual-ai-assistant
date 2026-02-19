/**
 * SOFIYA Contact Manager
 * Phase 3.3: Recipient Contact Management
 * 
 * Stores and validates WhatsApp contact information.
 * Supports nickname lookup and contact management via voice commands.
 */

import 'dotenv/config';
import { createClient } from 'pg';

export class ContactManager {
    constructor(options = {}) {
        this.db = options.db || null; // PostgreSQL connection
        this.cache = new Map(); // In-memory cache for quick lookups
        this.cacheTTL = options.cacheTTL || 3600000; // 1 hour default
    }

    /**
     * Initializes database connection
     */
    async initialize() {
        if (!this.db) {
            // Create connection if not provided
            this.db = createClient({
                connectionString: process.env.DATABASE_URL
            });
            await this.db.connect();
        }

        // Load contacts into cache
        await this.refreshCache();
        
        console.log('[ContactManager] Initialized');
    }

    /**
     * Adds a new contact
     * @param {string} userId - User ID who owns this contact
     * @param {string} name - Contact name/nickname
     * @param {string} phoneNumber - Phone number
     * @param {Object} metadata - Additional metadata (birthday, relationship, etc.)
     * @returns {Promise<Object>} Created contact
     */
    async addContact(userId, name, phoneNumber, metadata = {}) {
        // Validate phone number
        const normalizedNumber = this.normalizePhoneNumber(phoneNumber);
        if (!normalizedNumber) {
            throw new Error(`Invalid phone number format: ${phoneNumber}`);
        }

        // Check if contact already exists
        const existing = await this.findContact(userId, name);
        if (existing) {
            throw new Error(`Contact "${name}" already exists`);
        }

        try {
            const query = `
                INSERT INTO contacts (user_id, name, phone, metadata, created_at)
                VALUES ($1, $2, $3, $4, NOW())
                RETURNING *
            `;

            const result = await this.db.query(query, [
                userId,
                name,
                normalizedNumber,
                JSON.stringify(metadata)
            ]);

            const contact = this.formatContact(result.rows[0]);
            
            // Update cache
            this.cache.set(`${userId}:${name.toLowerCase()}`, contact);
            
            console.log(`[ContactManager] Added contact: ${name} (${normalizedNumber})`);
            
            return contact;
        } catch (error) {
            console.error('[ContactManager] Error adding contact:', error);
            throw new Error(`Failed to add contact: ${error.message}`);
        }
    }

    /**
     * Finds a contact by name (supports nickname lookup)
     * @param {string} userId - User ID
     * @param {string} nameOrNickname - Contact name or nickname
     * @returns {Promise<Object|null>} Contact or null if not found
     */
    async findContact(userId, nameOrNickname) {
        if (!nameOrNickname) {
            return null;
        }

        const searchKey = nameOrNickname.toLowerCase();
        
        // Check cache first
        const cacheKey = `${userId}:${searchKey}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const query = `
                SELECT * FROM contacts
                WHERE user_id = $1
                AND (LOWER(name) = $2 OR LOWER(name) LIKE $3 OR metadata->>'nickname' = $2)
                LIMIT 1
            `;

            const result = await this.db.query(query, [
                userId,
                searchKey,
                `%${searchKey}%`
            ]);

            if (result.rows.length === 0) {
                return null;
            }

            const contact = this.formatContact(result.rows[0]);
            
            // Update cache
            this.cache.set(cacheKey, contact);
            
            return contact;
        } catch (error) {
            console.error('[ContactManager] Error finding contact:', error);
            return null;
        }
    }

    /**
     * Gets all contacts for a user
     * @param {string} userId - User ID
     * @returns {Promise<Array>} List of contacts
     */
    async getContacts(userId) {
        try {
            const query = `
                SELECT * FROM contacts
                WHERE user_id = $1
                ORDER BY name ASC
            `;

            const result = await this.db.query(query, [userId]);
            
            return result.rows.map(row => this.formatContact(row));
        } catch (error) {
            console.error('[ContactManager] Error getting contacts:', error);
            return [];
        }
    }

    /**
     * Updates a contact
     * @param {string} userId - User ID
     * @param {string} contactId - Contact ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<Object>} Updated contact
     */
    async updateContact(userId, contactId, updates) {
        const allowedFields = ['name', 'phone', 'metadata'];
        const updateFields = [];
        const values = [];
        let paramIndex = 1;

        Object.keys(updates).forEach(key => {
            if (allowedFields.includes(key)) {
                updateFields.push(`${key} = $${paramIndex}`);
                if (key === 'metadata') {
                    values.push(JSON.stringify(updates[key]));
                } else {
                    values.push(updates[key]);
                }
                paramIndex++;
            }
        });

        if (updateFields.length === 0) {
            throw new Error('No valid fields to update');
        }

        updateFields.push(`updated_at = NOW()`);
        values.push(userId, contactId);

        try {
            const query = `
                UPDATE contacts
                SET ${updateFields.join(', ')}
                WHERE user_id = $${paramIndex} AND id = $${paramIndex + 1}
                RETURNING *
            `;

            const result = await this.db.query(query, values);
            
            if (result.rows.length === 0) {
                throw new Error('Contact not found');
            }

            const contact = this.formatContact(result.rows[0]);
            
            // Update cache
            this.cache.set(`${userId}:${contact.name.toLowerCase()}`, contact);
            
            return contact;
        } catch (error) {
            console.error('[ContactManager] Error updating contact:', error);
            throw new Error(`Failed to update contact: ${error.message}`);
        }
    }

    /**
     * Deletes a contact
     * @param {string} userId - User ID
     * @param {string} contactId - Contact ID
     * @returns {Promise<boolean>} Success status
     */
    async deleteContact(userId, contactId) {
        try {
            const query = `
                DELETE FROM contacts
                WHERE user_id = $1 AND id = $2
                RETURNING id
            `;

            const result = await this.db.query(query, [userId, contactId]);
            
            if (result.rows.length === 0) {
                return false;
            }

            // Remove from cache
            for (const [key, contact] of this.cache.entries()) {
                if (contact.id === contactId) {
                    this.cache.delete(key);
                    break;
                }
            }

            console.log(`[ContactManager] Deleted contact: ${contactId}`);
            return true;
        } catch (error) {
            console.error('[ContactManager] Error deleting contact:', error);
            throw new Error(`Failed to delete contact: ${error.message}`);
        }
    }

    /**
     * Parses contact name from voice command
     * @param {string} text - Voice command text
     * @returns {string|null} Extracted contact name
     */
    parseContactFromCommand(text) {
        if (!text) {
            return null;
        }

        // Patterns: "send message to Mom", "message John", "text Sarah"
        const patterns = [
            /(?:send|message|text|whatsapp)\s+(?:to|for)\s+(\w+)/i,
            /(?:send|message|text)\s+(\w+)/i,
            /\b(mom|dad|mother|father|brother|sister|friend)\b/i
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                return match[1];
            }
        }

        return null;
    }

    /**
     * Normalizes phone number format
     * @private
     */
    normalizePhoneNumber(phoneNumber) {
        if (!phoneNumber) {
            return null;
        }

        // Remove all non-digit characters except +
        let cleaned = phoneNumber.replace(/[^\d+]/g, '');

        // E.164 format validation
        if (cleaned.startsWith('+') && cleaned.length >= 11 && cleaned.length <= 16) {
            return cleaned;
        }

        // Add + if missing
        if (cleaned.length === 12 && cleaned.startsWith('91')) {
            return `+${cleaned}`;
        }
        if (cleaned.length === 11 && cleaned.startsWith('1')) {
            return `+${cleaned}`;
        }
        if (cleaned.length === 10) {
            return `+1${cleaned}`;
        }

        return cleaned.match(/^\+\d{10,15}$/) ? cleaned : null;
    }

    /**
     * Formats contact from database row
     * @private
     */
    formatContact(row) {
        return {
            id: row.id,
            userId: row.user_id,
            name: row.name,
            phone: row.phone,
            metadata: typeof row.metadata === 'string' 
                ? JSON.parse(row.metadata) 
                : row.metadata || {},
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }

    /**
     * Refreshes the in-memory cache
     * @private
     */
    async refreshCache() {
        // In production, load frequently accessed contacts
        this.cache.clear();
    }

    /**
     * Closes database connection
     */
    async close() {
        if (this.db && this.db.end) {
            await this.db.end();
        }
        this.cache.clear();
        console.log('[ContactManager] Closed.');
    }
}

// Example usage:
// const contactManager = new ContactManager({ db: dbConnection });
// await contactManager.initialize();
// await contactManager.addContact('user123', 'Mom', '+1234567890', { relationship: 'family' });
// const contact = await contactManager.findContact('user123', 'Mom');
