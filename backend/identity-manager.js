/**
 * SOFIYA Identity Manager
 * Phase 9.3: Identity Recognition / Multi-User Support
 * 
 * Switches profiles based on who is speaking.
 * Voice biometric + optional facial recognition.
 * Enforces privacy (hide other users' data).
 */

import 'dotenv/config';
import { FacialRecognition } from '../integrations/facial-recognition.js';

export class IdentityManager {
    constructor(options = {}) {
        this.db = options.db || null;
        this.facialRecognition = options.facialRecognition || new FacialRecognition();
        this.voiceProfiles = new Map();
        this.activeUser = null;
    }

    /**
     * Initializes identity manager
     */
    async initialize() {
        if (this.facialRecognition.initialize) {
            await this.facialRecognition.initialize();
        }
        if (this.db) {
            await this.loadVoiceProfiles();
        }
        console.log('[IdentityManager] Initialized');
    }

    /**
     * Registers user with voice sample
     * @param {string} userId - User ID
     * @param {Buffer} audioSample - Voice sample
     * @returns {Promise<Object>} Registration result
     */
    async registerVoiceProfile(userId, audioSample) {
        // In production, extract voice features and store
        const profileId = `voice_${userId}_${Date.now()}`;

        if (this.db) {
            try {
                const query = `
                    INSERT INTO voice_profiles (user_id, profile_id, created_at)
                    VALUES ($1, $2, NOW())
                `;

                await this.db.query(query, [userId, profileId]);
            } catch (error) {
                if (error.code === 'ECONNREFUSED' || (error.message && error.message.includes('ECONNREFUSED'))) {
                    console.warn('[IdentityManager] PostgreSQL unavailable. Skipping voice profile persistence.');
                } else {
                    console.error('[IdentityManager] Error registering voice:', error);
                }
            }
        }

        this.voiceProfiles.set(userId, { profileId, samples: 1 });

        return {
            success: true,
            userId,
            profileId,
            message: 'Voice profile registered. Say 3-5 more phrases for better accuracy.'
        };
    }

    /**
     * Identifies user from voice
     * @param {Buffer} audioSample - Voice sample
     * @returns {Promise<string|null>} User ID or null
     */
    async identifyFromVoice(audioSample) {
        if (!audioSample || this.voiceProfiles.size === 0) {
            return null;
        }

        console.log(`[IdentityManager] Analyzing voice sample (${audioSample.length || 0} bytes)...`);

        // SIMULATED BIOMETRIC MATCHING:
        // In production, this would call a Python ML bridge (e.g., SpeechBrain/DeepSpeaker)
        // to extract acoustic features (MFCCs, embeddings) and compute cosine similarity 
        // against the stored voice embeddings.

        let bestMatch = null;
        let highestConfidence = 0;

        for (const [userId, profile] of this.voiceProfiles.entries()) {
            // Mock confidence score between 0.4 and 0.95
            const confidence = 0.4 + (Math.random() * 0.55);
            
            if (confidence > highestConfidence) {
                highestConfidence = confidence;
                bestMatch = userId;
            }
        }

        // Require at least 80% confidence for a biometric match
        if (highestConfidence > 0.80 && bestMatch) {
            console.log(`[IdentityManager] Voice match found: ${bestMatch} (${(highestConfidence * 100).toFixed(1)}% confidence)`);
            return bestMatch;
        }

        console.log('[IdentityManager] No confident voice match found.');
        return null;
    }

    /**
     * Identifies user from face
     * @param {Buffer} imageData - Face image
     * @returns {Promise<string|null>} User ID or null
     */
    async identifyFromFace(imageData) {
        if (!this.facialRecognition.recognizeFace) {
            return null;
        }

        const result = await this.facialRecognition.recognizeFace(imageData);
        return result?.userId || null;
    }

    /**
     * Identifies user (tries voice first, then face)
     * @param {Object} input - Input data
     * @param {Buffer} input.audio - Audio sample
     * @param {Buffer} input.image - Face image
     * @returns {Promise<string|null>} User ID or null
     */
    async identifyUser(input = {}) {
        if (input.audio) {
            const voiceId = await this.identifyFromVoice(input.audio);
            if (voiceId) return voiceId;
        }

        if (input.image) {
            const faceId = await this.identifyFromFace(input.image);
            if (faceId) return faceId;
        }

        return null;
    }

    /**
     * Switches to user profile
     * @param {string} userId - User ID
     */
    async switchProfile(userId) {
        this.activeUser = userId;
        return {
            success: true,
            userId,
            message: `Switched to ${userId}'s profile`
        };
    }

    /**
     * Gets active user
     */
    getActiveUser() {
        return this.activeUser;
    }

    /**
     * Checks if current user can access resource
     * @param {string} resourceOwner - Resource owner user ID
     * @param {string} resourceType - Resource type (calendar, messages, etc.)
     * @param {boolean} isShared - Whether the resource is marked as shared
     * @returns {boolean} Whether access is allowed
     */
    canAccessResource(resourceOwner, resourceType, isShared = false) {
        if (isShared) return true;
        if (!this.activeUser) return false;
        if (this.activeUser === resourceOwner) return true;

        // In production, check family/group permissions
        return false;
    }

    /**
     * Gets user-specific data (with privacy filter)
     * @param {string} userId - User ID
     * @param {string} dataType - Data type
     * @param {string} requestor - Requesting user ID
     * @returns {Promise<Object|null>} Data or null if not allowed
     */
    async getUserData(userId, dataType, requestor) {
        if (!this.canAccessResource(userId, dataType)) {
            return null;
        }

        // In production, fetch from database with privacy filter
        return { userId, dataType };
    }

    /**
     * Loads voice profiles from database
     * @private
     */
    async loadVoiceProfiles() {
        if (!this.db) return;

        try {
            const query = `SELECT user_id, profile_id FROM voice_profiles`;
            const result = await this.db.query(query);
            result.rows.forEach(row => {
                this.voiceProfiles.set(row.user_id, { profileId: row.profile_id });
            });
        } catch (error) {
            if (error.code === 'ECONNREFUSED' || (error.message && error.message.includes('ECONNREFUSED'))) {
                console.warn('[IdentityManager] PostgreSQL unavailable. Skipping voice profiles load.');
            } else {
                console.error('[IdentityManager] Error loading profiles:', error);
            }
        }
    }
}
