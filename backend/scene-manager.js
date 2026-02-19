/**
 * SOFIYA Scene Manager
 * Phase 4.2: Complex Automation Scenes
 * 
 * Manages pre-built and custom smart home scenes.
 * Executes scenes atomically (all-or-nothing).
 */

import 'dotenv/config';
import { createClient } from 'pg';
import { GoogleHomeConnector } from '../integrations/google-home-connector.js';
import { AlexaConnector } from '../integrations/alexa-connector.js';
import { IFTTTConnector } from '../integrations/ifttt-connector.js';

export class SceneManager {
    constructor(options = {}) {
        this.db = options.db || null;
        this.googleHome = options.googleHome || new GoogleHomeConnector();
        this.alexa = options.alexa || new AlexaConnector();
        this.ifttt = options.ifttt || new IFTTTConnector();

        // Pre-built scenes
        this.preBuiltScenes = {
            movie_night: {
                name: 'Movie Night',
                description: 'Perfect setup for watching movies',
                actions: [
                    { service: 'google_home', device: 'light_living_room', command: 'set_brightness', value: 20 },
                    { service: 'ifttt', action: 'close_blinds', value: null },
                    { service: 'google_home', device: 'thermostat_main', command: 'set_temperature', value: 68 },
                    { service: 'ifttt', action: 'tv_power', value: 'on' },
                    { service: 'ifttt', action: 'mute_notifications', value: true }
                ]
            },
            good_morning: {
                name: 'Good Morning',
                description: 'Wake up routine',
                actions: [
                    { service: 'google_home', device: 'light_bedroom', command: 'turn_on', value: true },
                    { service: 'google_home', device: 'light_bedroom', command: 'set_brightness', value: 80 },
                    { service: 'google_home', device: 'thermostat_main', command: 'set_temperature', value: 72 },
                    { service: 'ifttt', action: 'open_blinds', value: null },
                    { service: 'ifttt', action: 'play_morning_music', value: null }
                ]
            },
            focus_work: {
                name: 'Focus Work',
                description: 'Productivity mode',
                actions: [
                    { service: 'google_home', device: 'light_living_room', command: 'set_brightness', value: 100 },
                    { service: 'google_home', device: 'light_living_room', command: 'set_color', value: 'cool_white' },
                    { service: 'ifttt', action: 'mute_notifications', value: true },
                    { service: 'ifttt', action: 'close_blinds', value: null }
                ]
            },
            bedtime: {
                name: 'Bedtime',
                description: 'Wind down for sleep',
                actions: [
                    { service: 'google_home', device: 'light_living_room', command: 'turn_off', value: false },
                    { service: 'google_home', device: 'light_bedroom', command: 'set_brightness', value: 10 },
                    { service: 'google_home', device: 'light_bedroom', command: 'set_color', value: 'warm_white' },
                    { service: 'google_home', device: 'thermostat_main', command: 'set_temperature', value: 65 },
                    { service: 'ifttt', action: 'close_blinds', value: null },
                    { service: 'ifttt', action: 'play_sleep_sounds', value: null }
                ]
            },
            party_mode: {
                name: 'Party Mode',
                description: 'Party atmosphere',
                actions: [
                    { service: 'google_home', device: 'light_living_room', command: 'set_brightness', value: 100 },
                    { service: 'google_home', device: 'light_living_room', command: 'set_color', value: 'colorful' },
                    { service: 'ifttt', action: 'play_party_music', value: null },
                    { service: 'google_home', device: 'thermostat_main', command: 'set_temperature', value: 70 }
                ]
            },
            relax: {
                name: 'Relax',
                description: 'Relaxation mode',
                actions: [
                    { service: 'google_home', device: 'light_living_room', command: 'set_brightness', value: 40 },
                    { service: 'google_home', device: 'light_living_room', command: 'set_color', value: 'warm_white' },
                    { service: 'ifttt', action: 'play_relaxing_music', value: null },
                    { service: 'google_home', device: 'thermostat_main', command: 'set_temperature', value: 70 }
                ]
            },
            away_mode: {
                name: 'Away Mode',
                description: 'Security mode when away',
                actions: [
                    { service: 'google_home', device: 'light_living_room', command: 'turn_off', value: false },
                    { service: 'google_home', device: 'light_bedroom', command: 'turn_off', value: false },
                    { service: 'ifttt', action: 'arm_security', value: true },
                    { service: 'ifttt', action: 'close_blinds', value: null }
                ]
            },
            arriving_home: {
                name: 'Arriving Home',
                description: 'Welcome home routine',
                actions: [
                    { service: 'google_home', device: 'light_living_room', command: 'turn_on', value: true },
                    { service: 'google_home', device: 'light_living_room', command: 'set_brightness', value: 60 },
                    { service: 'google_home', device: 'thermostat_main', command: 'set_temperature', value: 72 },
                    { service: 'ifttt', action: 'disarm_security', value: false },
                    { service: 'ifttt', action: 'play_welcome_sound', value: null }
                ]
            }
        };
    }

    /**
     * Executes a scene
     * @param {string} sceneId - Scene ID (pre-built or custom)
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Execution result
     */
    async executeScene(sceneId, userId = 'default') {
        console.log(`[SceneManager] Executing scene: ${sceneId}`);

        // Get scene definition
        const scene = await this.getScene(sceneId, userId);
        if (!scene) {
            throw new Error(`Scene not found: ${sceneId}`);
        }

        const results = [];
        const errors = [];

        // Execute all actions atomically
        for (const action of scene.actions) {
            try {
                const result = await this.executeAction(action);
                results.push(result);
            } catch (error) {
                errors.push({
                    action,
                    error: error.message
                });

                // If atomic execution required, rollback on error
                if (scene.atomic) {
                    await this.rollbackScene(sceneId, results);
                    throw new Error(`Scene execution failed: ${error.message}`);
                }
            }
        }

        // Log scene execution
        await this.logSceneExecution(sceneId, userId, results, errors);

        return {
            sceneId,
            sceneName: scene.name,
            executed: results.length,
            failed: errors.length,
            results,
            errors,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Executes a single action
     * @private
     */
    async executeAction(action) {
        const { service, device, command, action: actionName, value } = action;

        switch (service) {
            case 'google_home':
                return await this.googleHome.controlDevice(device, command, value);

            case 'alexa':
                return await this.alexa.controlDevice(device, actionName || command, value);

            case 'ifttt':
                if (device) {
                    return await this.ifttt.controlDevice(device, actionName || command, value);
                } else {
                    return await this.ifttt.triggerWebhook(actionName || command, { value1: value });
                }

            default:
                throw new Error(`Unknown service: ${service}`);
        }
    }

    /**
     * Gets scene definition
     * @private
     */
    async getScene(sceneId, userId) {
        // Check pre-built scenes first
        if (this.preBuiltScenes[sceneId]) {
            return this.preBuiltScenes[sceneId];
        }

        // Check custom scenes in database
        if (this.db) {
            try {
                const query = `
                    SELECT name, description, actions, atomic
                    FROM scenes
                    WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)
                `;

                const result = await this.db.query(query, [sceneId, userId]);
                if (result.rows.length > 0) {
                    return {
                        name: result.rows[0].name,
                        description: result.rows[0].description,
                        actions: result.rows[0].actions,
                        atomic: result.rows[0].atomic || false
                    };
                }
            } catch (error) {
                console.error('[SceneManager] Error fetching scene:', error);
            }
        }

        return null;
    }

    /**
     * Creates a custom scene
     * @param {string} userId - User ID
     * @param {string} sceneId - Scene ID
     * @param {string} name - Scene name
     * @param {string} description - Scene description
     * @param {Array} actions - Scene actions
     * @param {boolean} atomic - Whether to execute atomically
     * @returns {Promise<Object>} Created scene
     */
    async createScene(userId, sceneId, name, description, actions, atomic = false) {
        if (!this.db) {
            throw new Error('Database not configured');
        }

        try {
            const query = `
                INSERT INTO scenes (id, user_id, name, description, actions, atomic, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, NOW())
                ON CONFLICT (id, user_id) DO UPDATE
                SET name = $3, description = $4, actions = $5, atomic = $6, updated_at = NOW()
                RETURNING *
            `;

            const result = await this.db.query(query, [
                sceneId,
                userId,
                name,
                description,
                JSON.stringify(actions),
                atomic
            ]);

            console.log(`[SceneManager] Created scene: ${sceneId}`);
            return result.rows[0];
        } catch (error) {
            console.error('[SceneManager] Error creating scene:', error);
            throw new Error(`Failed to create scene: ${error.message}`);
        }
    }

    /**
     * Gets all available scenes
     * @param {string} userId - User ID
     * @returns {Promise<Array>} List of scenes
     */
    async getAllScenes(userId = 'default') {
        const scenes = [];

        // Add pre-built scenes
        Object.entries(this.preBuiltScenes).forEach(([id, scene]) => {
            scenes.push({
                id,
                ...scene,
                type: 'pre-built'
            });
        });

        // Add custom scenes
        if (this.db) {
            try {
                const query = `
                    SELECT id, name, description, actions, atomic
                    FROM scenes
                    WHERE user_id = $1 OR user_id IS NULL
                    ORDER BY created_at DESC
                `;

                const result = await this.db.query(query, [userId]);
                result.rows.forEach(row => {
                    scenes.push({
                        id: row.id,
                        name: row.name,
                        description: row.description,
                        actions: row.actions,
                        atomic: row.atomic,
                        type: 'custom'
                    });
                });
            } catch (error) {
                console.error('[SceneManager] Error fetching scenes:', error);
            }
        }

        return scenes;
    }

    /**
     * Deletes a custom scene
     * @param {string} userId - User ID
     * @param {string} sceneId - Scene ID
     * @returns {Promise<boolean>} Success status
     */
    async deleteScene(userId, sceneId) {
        // Can't delete pre-built scenes
        if (this.preBuiltScenes[sceneId]) {
            throw new Error('Cannot delete pre-built scene');
        }

        if (!this.db) {
            return false;
        }

        try {
            const query = `
                DELETE FROM scenes
                WHERE id = $1 AND user_id = $2
            `;

            const result = await this.db.query(query, [sceneId, userId]);
            return result.rowCount > 0;
        } catch (error) {
            console.error('[SceneManager] Error deleting scene:', error);
            return false;
        }
    }

    /**
     * Rolls back scene execution
     * @private
     */
    async rollbackScene(sceneId, executedActions) {
        console.log(`[SceneManager] Rolling back scene: ${sceneId}`);

        // Reverse executed actions
        for (const action of executedActions.reverse()) {
            try {
                // Reverse the action (e.g., turn on → turn off)
                const reverseAction = this.getReverseAction(action);
                if (reverseAction) {
                    await this.executeAction(reverseAction);
                }
            } catch (error) {
                console.error('[SceneManager] Error during rollback:', error);
            }
        }
    }

    /**
     * Gets reverse action for rollback
     * @private
     */
    getReverseAction(action) {
        const { command, action: actionName, value } = action;

        // Simple reversal logic
        if (command === 'turn_on' || actionName === 'turnOn') {
            return { ...action, command: 'turn_off', action: 'turnOff', value: false };
        }
        if (command === 'turn_off' || actionName === 'turnOff') {
            return { ...action, command: 'turn_on', action: 'turnOn', value: true };
        }

        // For other actions, might need to store previous state
        return null;
    }

    /**
     * Logs scene execution
     * @private
     */
    async logSceneExecution(sceneId, userId, results, errors) {
        if (!this.db) {
            return;
        }

        try {
            const query = `
                INSERT INTO scene_executions (scene_id, user_id, results, errors, executed_at)
                VALUES ($1, $2, $3, $4, NOW())
            `;

            await this.db.query(query, [
                sceneId,
                userId,
                JSON.stringify(results),
                JSON.stringify(errors)
            ]);
        } catch (error) {
            console.error('[SceneManager] Error logging execution:', error);
        }
    }
}

// Example usage:
// const sceneManager = new SceneManager({
//     db: dbConnection,
//     googleHome: googleHomeConnector,
//     alexa: alexaConnector,
//     ifttt: iftttConnector
// });
// await sceneManager.executeScene('movie_night', 'user123');
