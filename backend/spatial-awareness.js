/**
 * SOFIYA Spatial Awareness Module
 * Phase 9.2: Track location of items and people indoors
 * 
 * Integrates with vision service for item recognition.
 * Camera-based item tracking, user profiles for household.
 */

import 'dotenv/config';
import { createClient } from 'pg';
import { VisionService } from '../integrations/vision-service.js';

export class SpatialAwareness {
    constructor(options = {}) {
        this.db = options.db || null;
        this.visionService = options.visionService || new VisionService();
        this.itemLocations = new Map();
    }

    /**
     * Initializes spatial awareness
     */
    async initialize() {
        if (this.visionService.initialize) {
            await this.visionService.initialize();
        }
        if (this.db) {
            await this.loadItemLocations();
        }
        console.log('[SpatialAwareness] Initialized');
    }

    /**
     * Finds item location
     * @param {string} userId - User ID
     * @param {string} itemName - Item name (e.g., 'keys', 'wallet')
     * @param {Buffer} imageData - Optional image for camera scan
     * @returns {Promise<Object>} Item location
     */
    async findItem(userId, itemName, imageData = null) {
        // Check stored locations first
        const stored = await this.getStoredLocation(userId, itemName);
        if (stored) {
            return stored;
        }

        // Use vision service if image provided - process image to detect items
        if (imageData && this.visionService.processImage) {
            const detections = await this.visionService.processImage(imageData, 'scan');
            const match = detections.find(d => d.class?.toLowerCase().includes(itemName.toLowerCase()));
            if (match) {
                await this.storeItemLocation(userId, itemName, match.location || 'detected in view');
                return { item: itemName, location: match.location, found: true };
            }
        }

        // Fallback: check vision service's stored locations
        const visionLocation = await this.visionService.findItem?.(itemName, userId);
        if (visionLocation) {
            return { ...visionLocation, found: true };
        }

        return {
            item: itemName,
            found: false,
            message: `I couldn't find ${itemName}. Try scanning the room with your camera.`,
            lastLocation: null
        };
    }

    /**
     * Records item location
     * @param {string} userId - User ID
     * @param {string} itemName - Item name
     * @param {string} location - Location name (e.g., 'kitchen counter', 'living room table')
     */
    async recordItemLocation(userId, itemName, location) {
        await this.storeItemLocation(userId, itemName, location);
    }

    /**
     * Gets stored location
     * @private
     */
    async getStoredLocation(userId, itemName) {
        const key = `${userId}:${itemName.toLowerCase()}`;
        if (this.itemLocations.has(key)) {
            return this.itemLocations.get(key);
        }

        if (this.db) {
            try {
                const query = `
                    SELECT item_name, location, room, updated_at
                    FROM item_locations
                    WHERE user_id = $1 AND LOWER(item_name) = LOWER($2)
                `;

                const result = await this.db.query(query, [userId, itemName]);
                if (result.rows.length > 0) {
                    const row = result.rows[0];
                    const loc = {
                        item: row.item_name,
                        location: row.location,
                        room: row.room,
                        lastSeen: row.updated_at,
                        found: true
                    };
                    this.itemLocations.set(key, loc);
                    return loc;
                }
            } catch (error) {
                console.error('[SpatialAwareness] Error getting location:', error);
            }
        }

        return null;
    }

    /**
     * Stores item location
     * @private
     */
    async storeItemLocation(userId, itemName, location, room = null) {
        const key = `${userId}:${itemName.toLowerCase()}`;
        const loc = {
            item: itemName,
            location,
            room: room || this.inferRoom(location),
            lastSeen: new Date(),
            found: true
        };

        this.itemLocations.set(key, loc);

        if (this.db) {
            try {
                const query = `
                    INSERT INTO item_locations (user_id, item_name, location, room, updated_at)
                    VALUES ($1, $2, $3, $4, NOW())
                    ON CONFLICT (user_id, item_name) DO UPDATE
                    SET location = $3, room = $4, updated_at = NOW()
                `;

                await this.db.query(query, [userId, itemName, location, loc.room]);
            } catch (error) {
                console.error('[SpatialAwareness] Error storing location:', error);
            }
        }
    }

    /**
     * Infers room from location string
     * @private
     */
    inferRoom(location) {
        const lower = location.toLowerCase();
        if (lower.includes('kitchen') || lower.includes('counter')) return 'kitchen';
        if (lower.includes('living') || lower.includes('couch')) return 'living_room';
        if (lower.includes('bedroom') || lower.includes('bed')) return 'bedroom';
        if (lower.includes('bathroom')) return 'bathroom';
        if (lower.includes('desk') || lower.includes('office')) return 'office';
        return 'unknown';
    }

    /**
     * Loads item locations from database
     * @private
     */
    async loadItemLocations() {
        if (!this.db) return;

        try {
            const query = `SELECT user_id, item_name, location, room, updated_at FROM item_locations`;
            const result = await this.db.query(query);
            result.rows.forEach(row => {
                const key = `${row.user_id}:${row.item_name.toLowerCase()}`;
                this.itemLocations.set(key, {
                    item: row.item_name,
                    location: row.location,
                    room: row.room,
                    lastSeen: row.updated_at,
                    found: true
                });
            });
        } catch (error) {
            console.error('[SpatialAwareness] Error loading locations:', error);
        }
    }

    /**
     * Gets all tracked items for user
     * @param {string} userId - User ID
     * @returns {Promise<Array>} Tracked items
     */
    async getTrackedItems(userId) {
        const items = [];
        for (const [key, value] of this.itemLocations.entries()) {
            if (key.startsWith(`${userId}:`)) {
                items.push(value);
            }
        }
        return items;
    }
}
