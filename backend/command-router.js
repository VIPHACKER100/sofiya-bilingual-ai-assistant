/**
 * SOFIYA Command Router
 * Phase 2.1: Central dispatcher for all commands
 * 
 * Routes intents from NLP processor to appropriate service handlers.
 * Supports multi-intent requests and error handling.
 */

export class CommandRouter {
    constructor(services = {}) {
        // Service dependencies (injected for testability)
        this.services = {
            whatsapp: services.whatsapp || null,
            smartHome: services.smartHome || null,
            calendar: services.calendar || null,
            wellness: services.wellness || null,
            search: services.search || null,
            reminder: services.reminder || null,
            media: services.media || null,
            health: services.health || null,
            news: services.news || null,
            weather: services.weather || null
        };

        // Intent to handler mapping
        this.handlers = {
            // Messaging
            'send_message': this.handleSendMessage.bind(this),
            
            // Smart Home
            'control_device': this.handleDeviceControl.bind(this),
            'smart_home_scene': this.handleSmartHomeScene.bind(this),
            
            // Calendar & Tasks
            'schedule': this.handleSchedule.bind(this),
            'task_add': this.handleTaskAdd.bind(this),
            'reminder': this.handleReminder.bind(this),
            
            // Media
            'media_play': this.handleMediaPlay.bind(this),
            'media_pause': this.handleMediaPause.bind(this),
            'media_resume': this.handleMediaResume.bind(this),
            
            // Information
            'weather': this.handleWeather.bind(this),
            'news': this.handleNews.bind(this),
            'search': this.handleSearch.bind(this),
            'time_date': this.handleTimeDate.bind(this),
            
            // Wellness & Health
            'wellness': this.handleWellness.bind(this),
            'health': this.handleHealth.bind(this),
            
            // Volume Control
            'volume_up': this.handleVolumeUp.bind(this),
            'volume_down': this.handleVolumeDown.bind(this),
            'volume_mute': this.handleVolumeMute.bind(this),
            
            // System
            'system_status': this.handleSystemStatus.bind(this),
            'personality_change': this.handlePersonalityChange.bind(this),
            
            // Multi-intent handler
            'multi_intent': this.handleMultiIntent.bind(this)
        };
    }

    /**
     * Main dispatch function
     * @param {object} nlpResult - Output from NLP module
     * @param {object} context - User context (personality, preferences, etc.)
     * @returns {Promise<object>} Router result with service, action, and data
     */
    async route(nlpResult, context = {}) {
        const { intent, entities, intents } = nlpResult;
        
        console.log(`[Router] Routing intent: ${intent}`, { entities });

        // Handle multi-intent requests
        if (intent === 'multi_intent' && intents) {
            return await this.handleMultiIntent(intents, context);
        }

        const handler = this.handlers[intent];

        if (handler) {
            try {
                const result = await handler(entities, context);
                return {
                    ...result,
                    intent,
                    entities,
                    timestamp: new Date().toISOString()
                };
            } catch (error) {
                console.error(`[Router] Error in handler for ${intent}:`, error);
                return {
                    status: 'error',
                    service: 'system',
                    action: 'error',
                    message: 'I encountered an issue processing that command.',
                    error: error.message
                };
            }
        } else {
            console.log(`[Router] No handler for intent: ${intent}, using AI fallback`);
            return {
                status: 'fallback',
                service: 'ai',
                action: 'ai_response',
                original_intent: intent,
                entities
            };
        }
    }

    // ========== Message Handlers ==========

    async handleSendMessage(entities, context) {
        console.log('[Router] Routing to WhatsApp Service');
        
        if (!this.services.whatsapp) {
            return {
                status: 'error',
                service: 'whatsapp',
                action: 'send_message',
                message: 'WhatsApp service not available'
            };
        }

        const recipient = entities.contact || entities.recipient;
        const message = entities.message || '';

        if (!recipient) {
            return {
                status: 'error',
                service: 'whatsapp',
                action: 'send_message',
                message: 'Please specify a recipient'
            };
        }

        try {
            const result = await this.services.whatsapp.sendMessage(recipient, message);
            return {
                status: 'success',
                service: 'whatsapp',
                action: 'send_message',
                data: {
                    recipient,
                    message,
                    messageId: result.messageId
                }
            };
        } catch (error) {
            throw new Error(`WhatsApp send failed: ${error.message}`);
        }
    }

    // ========== Smart Home Handlers ==========

    async handleDeviceControl(entities, context) {
        console.log('[Router] Routing to Smart Home Service');
        
        if (!this.services.smartHome) {
            return {
                status: 'error',
                service: 'smart-home',
                action: 'control',
                message: 'Smart home service not available'
            };
        }

        const device = entities.device || 'lights';
        const action = entities.action || 'toggle';
        const value = entities.value || null;

        try {
            const result = await this.services.smartHome.controlDevice(device, action, value);
            return {
                status: 'success',
                service: 'smart-home',
                action: 'control',
                data: {
                    device,
                    action,
                    value,
                    state: result.state
                }
            };
        } catch (error) {
            throw new Error(`Device control failed: ${error.message}`);
        }
    }

    async handleSmartHomeScene(entities, context) {
        console.log('[Router] Routing to Smart Home Scene');
        
        if (!this.services.smartHome) {
            return {
                status: 'error',
                service: 'smart-home',
                action: 'scene',
                message: 'Smart home service not available'
            };
        }

        const sceneName = entities.scene || context.text?.match(/(movie night|good morning|bedtime|focus|party|relax)/i)?.[0];

        if (!sceneName) {
            return {
                status: 'error',
                service: 'smart-home',
                action: 'scene',
                message: 'Please specify a scene name'
            };
        }

        try {
            const result = await this.services.smartHome.executeScene(sceneName);
            return {
                status: 'success',
                service: 'smart-home',
                action: 'scene',
                data: {
                    scene: sceneName,
                    devices: result.devices
                }
            };
        } catch (error) {
            throw new Error(`Scene execution failed: ${error.message}`);
        }
    }

    // ========== Calendar & Task Handlers ==========

    async handleSchedule(entities, context) {
        console.log('[Router] Routing to Calendar Service');
        
        if (!this.services.calendar) {
            return {
                status: 'error',
                service: 'calendar',
                action: 'schedule',
                message: 'Calendar service not available'
            };
        }

        try {
            const result = await this.services.calendar.createEvent(entities);
            return {
                status: 'success',
                service: 'calendar',
                action: 'create_event',
                data: {
                    eventId: result.eventId,
                    title: entities.title,
                    date: entities.date,
                    time: entities.time
                }
            };
        } catch (error) {
            throw new Error(`Calendar operation failed: ${error.message}`);
        }
    }

    async handleTaskAdd(entities, context) {
        console.log('[Router] Routing to Task Service');
        
        const taskText = entities.task || entities.text || '';

        if (!taskText) {
            return {
                status: 'error',
                service: 'task',
                action: 'add',
                message: 'Please specify a task'
            };
        }

        // In a real implementation, this would call a task service
        return {
            status: 'success',
            service: 'task',
            action: 'add',
            data: {
                task: taskText,
                taskId: `task_${Date.now()}`
            }
        };
    }

    async handleReminder(entities, context) {
        console.log('[Router] Routing to Reminder Service');
        
        if (!this.services.reminder) {
            return {
                status: 'error',
                service: 'reminder',
                action: 'create',
                message: 'Reminder service not available'
            };
        }

        try {
            const result = await this.services.reminder.createReminder(entities);
            return {
                status: 'success',
                service: 'reminder',
                action: 'create',
                data: {
                    reminderId: result.reminderId,
                    text: entities.text,
                    dueTime: entities.due_time
                }
            };
        } catch (error) {
            throw new Error(`Reminder creation failed: ${error.message}`);
        }
    }

    // ========== Media Handlers ==========

    async handleMediaPlay(entities, context) {
        return {
            status: 'success',
            service: 'media',
            action: 'play',
            data: {
                track: entities.track || 'music'
            }
        };
    }

    async handleMediaPause(entities, context) {
        return {
            status: 'success',
            service: 'media',
            action: 'pause',
            data: {}
        };
    }

    async handleMediaResume(entities, context) {
        return {
            status: 'success',
            service: 'media',
            action: 'resume',
            data: {}
        };
    }

    // ========== Information Handlers ==========

    async handleWeather(entities, context) {
        console.log('[Router] Routing to Weather Service');
        
        if (!this.services.weather) {
            return {
                status: 'error',
                service: 'weather',
                action: 'fetch',
                message: 'Weather service not available'
            };
        }

        const location = entities.location || 'current';

        try {
            const result = await this.services.weather.getWeather(location);
            return {
                status: 'success',
                service: 'weather',
                action: 'fetch',
                data: {
                    location: result.location,
                    temperature: result.temperature,
                    condition: result.condition
                }
            };
        } catch (error) {
            throw new Error(`Weather fetch failed: ${error.message}`);
        }
    }

    async handleNews(entities, context) {
        console.log('[Router] Routing to News Service');
        
        if (!this.services.news) {
            return {
                status: 'error',
                service: 'news',
                action: 'fetch',
                message: 'News service not available'
            };
        }

        try {
            const result = await this.services.news.getHeadlines(entities.topic);
            return {
                status: 'success',
                service: 'news',
                action: 'fetch',
                data: {
                    articles: result.articles,
                    count: result.articles.length
                }
            };
        } catch (error) {
            throw new Error(`News fetch failed: ${error.message}`);
        }
    }

    async handleSearch(entities, context) {
        console.log('[Router] Routing to Search Service');
        
        const query = entities.query || context.text || '';

        return {
            status: 'success',
            service: 'search',
            action: 'web_search',
            data: {
                query,
                searchUrl: `https://www.google.com/search?q=${encodeURIComponent(query)}`
            }
        };
    }

    async handleTimeDate(entities, context) {
        const now = new Date();
        return {
            status: 'success',
            service: 'system',
            action: 'time_date',
            data: {
                time: now.toLocaleTimeString(),
                date: now.toLocaleDateString(),
                timestamp: now.toISOString()
            }
        };
    }

    // ========== Wellness & Health Handlers ==========

    async handleWellness(entities, context) {
        return {
            status: 'success',
            service: 'wellness',
            action: 'start_breathing',
            data: {
                duration: entities.duration || 300 // 5 minutes default
            }
        };
    }

    async handleHealth(entities, context) {
        console.log('[Router] Routing to Health Service');
        
        if (!this.services.health) {
            return {
                status: 'error',
                service: 'health',
                action: 'fetch',
                message: 'Health service not available'
            };
        }

        try {
            const result = await this.services.health.getHealthSummary();
            return {
                status: 'success',
                service: 'health',
                action: 'fetch',
                data: result
            };
        } catch (error) {
            throw new Error(`Health fetch failed: ${error.message}`);
        }
    }

    // ========== Volume Control Handlers ==========

    async handleVolumeUp(entities, context) {
        const amount = entities.value || 10;
        return {
            status: 'success',
            service: 'system',
            action: 'volume_up',
            data: { amount }
        };
    }

    async handleVolumeDown(entities, context) {
        const amount = entities.value || 10;
        return {
            status: 'success',
            service: 'system',
            action: 'volume_down',
            data: { amount }
        };
    }

    async handleVolumeMute(entities, context) {
        return {
            status: 'success',
            service: 'system',
            action: 'volume_mute',
            data: {}
        };
    }

    // ========== System Handlers ==========

    async handleSystemStatus(entities, context) {
        return {
            status: 'success',
            service: 'system',
            action: 'status',
            data: {
                status: 'online',
                version: '1.0.0',
                timestamp: new Date().toISOString()
            }
        };
    }

    async handlePersonalityChange(entities, context) {
        const mode = entities.mode || 'professional';
        return {
            status: 'success',
            service: 'system',
            action: 'personality_change',
            data: {
                mode,
                previousMode: context.personality || 'professional'
            }
        };
    }

    // ========== Multi-Intent Handler ==========

    async handleMultiIntent(intents, context) {
        console.log(`[Router] Processing ${intents.length} intents`);
        
        const results = [];
        
        for (const intentData of intents) {
            const { intent, entities: intentEntities } = intentData;
            const handler = this.handlers[intent];
            
            if (handler) {
                try {
                    const result = await handler(intentEntities, context);
                    results.push({
                        intent,
                        result
                    });
                } catch (error) {
                    results.push({
                        intent,
                        error: error.message
                    });
                }
            }
        }

        return {
            status: 'success',
            service: 'multi',
            action: 'execute',
            data: {
                results,
                count: results.length
            }
        };
    }
}
