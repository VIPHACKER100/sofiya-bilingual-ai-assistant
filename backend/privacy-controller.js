/**
 * SOFIYA Privacy Controller
 * Phase 10.1: On-Device Processing & Privacy Controls
 * 
 * Identifies sensitive data, enables on-device processing where possible,
 * granular privacy settings, data minimization.
 */

import 'dotenv/config';
import { createClient } from 'pg';

export class PrivacyController {
    constructor(options = {}) {
        this.db = options.db || null;
        this.sensitiveDataTypes = [
            'financial', 'health', 'location', 'messages',
            'biometric', 'conversation', 'contacts'
        ];
    }

    /**
     * Identifies if data is sensitive
     * @param {string} dataType - Data type
     * @param {Object} metadata - Optional metadata
     * @returns {boolean} Whether sensitive
     */
    isSensitiveData(dataType, metadata = {}) {
        return this.sensitiveDataTypes.includes(dataType.toLowerCase());
    }

    /**
     * Gets user privacy settings
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Privacy settings
     */
    async getPrivacySettings(userId) {
        if (!this.db) {
            return this.getDefaultSettings();
        }

        try {
            const query = `
                SELECT settings FROM privacy_settings
                WHERE user_id = $1
            `;
            const result = await this.db.query(query, [userId]);
            if (result.rows.length > 0) {
                return { ...this.getDefaultSettings(), ...JSON.parse(result.rows[0].settings || '{}') };
            }
        } catch (error) {
            console.error('[PrivacyController] Error loading settings:', error);
        }

        return this.getDefaultSettings();
    }

    /**
     * Gets default privacy settings
     * @private
     */
    getDefaultSettings() {
        return {
            voiceProcessing: 'cloud', // 'on_device' | 'cloud'
            healthData: 'local_first', // 'local_only' | 'local_first' | 'cloud_ok'
            locationSharing: false,
            conversationHistory: true,
            analytics: true,
            personalization: true,
            dataRetentionDays: 90
        };
    }

    /**
     * Updates privacy settings
     * @param {string} userId - User ID
     * @param {Object} settings - Settings to update
     */
    async updatePrivacySettings(userId, settings) {
        const current = await this.getPrivacySettings(userId);
        const updated = { ...current, ...settings };

        if (this.db) {
            try {
                const query = `
                    INSERT INTO privacy_settings (user_id, settings, updated_at)
                    VALUES ($1, $2, NOW())
                    ON CONFLICT (user_id) DO UPDATE
                    SET settings = $2, updated_at = NOW()
                `;
                await this.db.query(query, [userId, JSON.stringify(updated)]);
            } catch (error) {
                console.error('[PrivacyController] Error saving settings:', error);
            }
        }

        return updated;
    }

    /**
     * Checks if data can be sent to cloud
     * @param {string} userId - User ID
     * @param {string} dataType - Data type
     * @returns {Promise<boolean>} Whether cloud processing allowed
     */
    async canProcessInCloud(userId, dataType) {
        const settings = await this.getPrivacySettings(userId);

        if (this.isSensitiveData(dataType)) {
            if (dataType === 'health' && settings.healthData === 'local_only') return false;
            if (dataType === 'financial') return false;
            if (dataType === 'biometric') return false;
        }

        if (dataType === 'voice' && settings.voiceProcessing === 'on_device') return false;

        return true;
    }

    /**
     * Gets data collection status per service
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Collection status by service
     */
    async getDataCollectionStatus(userId) {
        const settings = await this.getPrivacySettings(userId);

        return {
            voice: settings.voiceProcessing !== 'cloud',
            health: settings.healthData !== 'cloud_ok',
            location: !settings.locationSharing,
            conversations: settings.conversationHistory,
            analytics: settings.analytics,
            personalization: settings.personalization
        };
    }

    /**
     * Deletes user data by type
     * @param {string} userId - User ID
     * @param {string} dataType - Data type to delete
     */
    async deleteUserData(userId, dataType) {
        if (!this.db) return { success: false };

        try {
            const tables = {
                conversation: 'conversation_history',
                health: 'health_data',
                location: 'location_history',
                voice: 'voice_commands',
                contacts: 'contacts'
            };

            const table = tables[dataType];
            if (!table) return { success: false, error: 'Unknown data type' };

            await this.db.query(`DELETE FROM ${table} WHERE user_id = $1`, [userId]);
            return { success: true };
        } catch (error) {
            console.error('[PrivacyController] Error deleting data:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Exports user data (GDPR)
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Export package
     */
    async exportUserData(userId) {
        if (!this.db) return {};

        const exportData = { userId, exportedAt: new Date().toISOString(), data: {} };

        try {
            const tables = [
                { name: 'profile', query: 'SELECT * FROM users WHERE id = $1' },
                { name: 'contacts', query: 'SELECT * FROM contacts WHERE user_id = $1' },
                { name: 'preferences', query: 'SELECT * FROM user_preferences WHERE user_id = $1' }
            ];

            for (const { name, query } of tables) {
                const result = await this.db.query(query, [userId]);
                exportData.data[name] = result.rows;
            }

            return exportData;
        } catch (error) {
            console.error('[PrivacyController] Error exporting:', error);
            return exportData;
        }
    }
}
