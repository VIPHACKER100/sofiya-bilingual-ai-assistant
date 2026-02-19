/**
 * SOFIYA Device Controller
 * Phase 4.3: Individual Device Control Handler
 * 
 * Normalizes device control across different platforms.
 * Maps device names to IDs and queues commands.
 */

import 'dotenv/config';
import { GoogleHomeConnector } from './google-home-connector.js';
import { AlexaConnector } from './alexa-connector.js';
import { IFTTTConnector } from './ifttt-connector.js';

export class DeviceController {
    constructor(options = {}) {
        this.googleHome = options.googleHome || new GoogleHomeConnector();
        this.alexa = options.alexa || new AlexaConnector();
        this.ifttt = options.ifttt || new IFTTTConnector();

        // Device name mapping (friendly names → device IDs)
        this.deviceMap = new Map();

        // Command queue for handling multiple requests
        this.commandQueue = [];
        this.processingQueue = false;
    }

    /**
     * Initializes device controller
     */
    async initialize() {
        // Discover devices from all platforms
        await Promise.all([
            this.discoverGoogleHomeDevices(),
            this.discoverAlexaDevices()
        ]);

        // Build device name mapping
        this.buildDeviceMap();

        console.log(`[DeviceController] Initialized with ${this.deviceMap.size} devices`);
    }

    /**
     * Discovers Google Home devices
     * @private
     */
    async discoverGoogleHomeDevices() {
        try {
            const devices = await this.googleHome.discoverDevices();
            devices.forEach(device => {
                this.deviceMap.set(device.name.toLowerCase(), {
                    id: device.id,
                    platform: 'google_home',
                    type: device.type,
                    device
                });
            });
        } catch (error) {
            console.warn('[DeviceController] Google Home discovery failed:', error.message);
        }
    }

    /**
     * Discovers Alexa devices
     * @private
     */
    async discoverAlexaDevices() {
        try {
            const devices = await this.alexa.discoverDevices();
            devices.forEach(device => {
                this.deviceMap.set(device.name.toLowerCase(), {
                    id: device.id,
                    platform: 'alexa',
                    type: device.type,
                    device
                });
            });
        } catch (error) {
            console.warn('[DeviceController] Alexa discovery failed:', error.message);
        }
    }

    /**
     * Builds device name mapping
     * @private
     */
    buildDeviceMap() {
        // Add common aliases
        const aliases = {
            'lights': 'light_living_room',
            'light': 'light_living_room',
            'lamp': 'light_living_room',
            'thermostat': 'thermostat_main',
            'ac': 'thermostat_main',
            'heater': 'thermostat_main',
            'tv': 'tv_living_room',
            'television': 'tv_living_room'
        };

        Object.entries(aliases).forEach(([alias, deviceId]) => {
            const device = Array.from(this.deviceMap.values()).find(d => d.id === deviceId);
            if (device) {
                this.deviceMap.set(alias, device);
            }
        });
    }

    /**
     * Controls a device by name
     * @param {string} deviceName - Device name or ID
     * @param {string} action - Action (turn_on, turn_off, set_brightness, etc.)
     * @param {any} value - Action value
     * @returns {Promise<Object>} Result
     */
    async controlDevice(deviceName, action, value = null) {
        // Find device
        const deviceInfo = this.findDevice(deviceName);
        if (!deviceInfo) {
            throw new Error(`Device not found: ${deviceName}`);
        }

        // Normalize action
        const normalizedAction = this.normalizeAction(action, deviceInfo.type);

        // Queue command if queue is processing
        if (this.processingQueue) {
            return this.queueCommand(deviceInfo, normalizedAction, value);
        }

        // Execute immediately
        return await this.executeCommand(deviceInfo, normalizedAction, value);
    }

    /**
     * Finds device by name or ID
     * @private
     */
    findDevice(deviceName) {
        const lowerName = deviceName.toLowerCase();

        // Direct match
        if (this.deviceMap.has(lowerName)) {
            return this.deviceMap.get(lowerName);
        }

        // Partial match
        for (const [name, device] of this.deviceMap.entries()) {
            if (name.includes(lowerName) || lowerName.includes(name)) {
                return device;
            }
        }

        // Try as device ID
        const deviceById = Array.from(this.deviceMap.values()).find(d => d.id === deviceName);
        if (deviceById) {
            return deviceById;
        }

        return null;
    }

    /**
     * Normalizes action across platforms
     * @private
     */
    normalizeAction(action, deviceType) {
        const actionMap = {
            'turn_on': {
                google_home: 'action.devices.commands.OnOff',
                alexa: 'turnOn',
                ifttt: 'on'
            },
            'turn_off': {
                google_home: 'action.devices.commands.OnOff',
                alexa: 'turnOff',
                ifttt: 'off'
            },
            'toggle': {
                google_home: 'action.devices.commands.OnOff',
                alexa: 'toggle',
                ifttt: 'toggle'
            },
            'set_brightness': {
                google_home: 'action.devices.commands.BrightnessAbsolute',
                alexa: 'setBrightness',
                ifttt: 'dim'
            },
            'set_temperature': {
                google_home: 'action.devices.commands.SetTemperature',
                alexa: 'setTemperature',
                ifttt: 'setTemperature'
            },
            'set_volume': {
                google_home: 'action.devices.commands.volumeRelative',
                alexa: 'setVolume',
                ifttt: 'setVolume'
            }
        };

        return actionMap[action] || { google_home: action, alexa: action, ifttt: action };
    }

    /**
     * Executes command on device
     * @private
     */
    async executeCommand(deviceInfo, normalizedAction, value) {
        const { platform, id, type } = deviceInfo;

        console.log(`[DeviceController] Controlling ${id} via ${platform}: ${JSON.stringify(normalizedAction)}`);

        try {
            let result;

            switch (platform) {
                case 'google_home':
                    result = await this.googleHome.controlDevice(
                        id,
                        normalizedAction.google_home,
                        value
                    );
                    break;

                case 'alexa':
                    result = await this.alexa.controlDevice(
                        id,
                        normalizedAction.alexa,
                        value
                    );
                    break;

                case 'ifttt':
                    result = await this.ifttt.controlDevice(
                        id,
                        normalizedAction.ifttt,
                        value
                    );
                    break;

                default:
                    throw new Error(`Unknown platform: ${platform}`);
            }

            return {
                deviceId: id,
                deviceName: deviceInfo.device?.name || id,
                platform,
                action: normalizedAction,
                value,
                result,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error(`[DeviceController] Error controlling device ${id}:`, error);
            throw new Error(`Device control failed: ${error.message}`);
        }
    }

    /**
     * Queues command for later execution
     * @private
     */
    queueCommand(deviceInfo, normalizedAction, value) {
        return new Promise((resolve, reject) => {
            this.commandQueue.push({
                deviceInfo,
                normalizedAction,
                value,
                resolve,
                reject
            });

            // Start processing if not already processing
            if (!this.processingQueue) {
                this.processQueue();
            }
        });
    }

    /**
     * Processes command queue
     * @private
     */
    async processQueue() {
        this.processingQueue = true;

        while (this.commandQueue.length > 0) {
            const command = this.commandQueue.shift();

            try {
                const result = await this.executeCommand(
                    command.deviceInfo,
                    command.normalizedAction,
                    command.value
                );
                command.resolve(result);
            } catch (error) {
                command.reject(error);
            }

            // Small delay between commands
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        this.processingQueue = false;
    }

    /**
     * Gets device status
     * @param {string} deviceName - Device name or ID
     * @returns {Promise<Object>} Device status
     */
    async getDeviceStatus(deviceName) {
        const deviceInfo = this.findDevice(deviceName);
        if (!deviceInfo) {
            throw new Error(`Device not found: ${deviceName}`);
        }

        const { platform, id } = deviceInfo;

        switch (platform) {
            case 'google_home':
                return await this.googleHome.getDeviceStatus(id);

            case 'alexa':
                return await this.alexa.getDeviceStatus(id);

            default:
                return {
                    id,
                    name: deviceInfo.device?.name || id,
                    platform,
                    state: deviceInfo.device?.state || {},
                    online: true
                };
        }
    }

    /**
     * Gets all devices
     * @returns {Array} All devices
     */
    getAllDevices() {
        return Array.from(this.deviceMap.values()).map(info => ({
            id: info.id,
            name: info.device?.name || info.id,
            platform: info.platform,
            type: info.type,
            state: info.device?.state || {}
        }));
    }

    /**
     * Searches devices by type
     * @param {string} type - Device type (light, thermostat, tv, etc.)
     * @returns {Array} Matching devices
     */
    getDevicesByType(type) {
        return Array.from(this.deviceMap.values())
            .filter(info => info.type === type)
            .map(info => ({
                id: info.id,
                name: info.device?.name || info.id,
                platform: info.platform,
                state: info.device?.state || {}
            }));
    }
}

// Example usage:
// const controller = new DeviceController({
//     googleHome: googleHomeConnector,
//     alexa: alexaConnector,
//     ifttt: iftttConnector
// });
// await controller.initialize();
// await controller.controlDevice('living room light', 'turn_on', true);
// await controller.controlDevice('thermostat', 'set_temperature', 72);
