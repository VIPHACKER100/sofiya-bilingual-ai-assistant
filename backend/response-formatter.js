/**
 * SOFIYA Response Formatter
 * Phase 2.2: Natural language response generator
 * 
 * Converts structured router results into natural-sounding responses.
 * Adapts tone based on personality mode and user emotion.
 */

export class ResponseFormatter {
    constructor() {
        // Response templates organized by service and action
        this.templates = {
            'whatsapp': {
                'send_message': {
                    'professional': 'Your message to {recipient} has been sent successfully.',
                    'focus': 'Sent to {recipient}.',
                    'sass': 'There you go, message sent to {recipient}. Happy now?',
                    'storyteller': 'Like a digital messenger, your words have flown to {recipient}. The message has been delivered.'
                },
                'draft_message': {
                    'professional': 'I have drafted a WhatsApp message for {recipient}. Shall I send it?',
                    'focus': 'Draft ready for {recipient}. Send?',
                    'sass': 'Fine, I wrote something for {recipient}. Want me to send it or are you going to overthink it?',
                    'storyteller': 'The message has been crafted, awaiting your command to journey to {recipient}.'
                }
            },
            'smart-home': {
                'control': {
                    'professional': 'I have adjusted the {device} as requested.',
                    'focus': '{device} adjusted.',
                    'sass': 'There, I touched your {device}. Was that so hard?',
                    'storyteller': 'With a whisper of command, the {device} has responded to your will.'
                },
                'scene': {
                    'professional': 'Activating {scene} mode now.',
                    'focus': '{scene} activated.',
                    'sass': 'Fine, {scene} mode. Don\'t say I never do anything for you.',
                    'storyteller': 'The scene unfolds before you: {scene} mode has been summoned into existence.'
                }
            },
            'calendar': {
                'create_event': {
                    'professional': 'I have scheduled {title} for {date} at {time}.',
                    'focus': 'Scheduled: {title} on {date}.',
                    'sass': 'Done. {title} is on your calendar for {date}. Try not to forget.',
                    'storyteller': 'The event "{title}" has been etched into time, set for {date} at {time}.'
                },
                'check_events': {
                    'professional': 'You have {count} events scheduled today.',
                    'focus': '{count} events today.',
                    'sass': 'You have {count} things to do. Good luck with that.',
                    'storyteller': 'Your calendar reveals {count} events awaiting your presence today.'
                }
            },
            'task': {
                'add': {
                    'professional': 'I have added "{task}" to your task list.',
                    'focus': 'Task added: {task}.',
                    'sass': 'Sure, "{task}" is now on your list. One more thing to procrastinate about.',
                    'storyteller': 'The task "{task}" has been inscribed into your digital scroll of duties.'
                }
            },
            'reminder': {
                'create': {
                    'professional': 'I will remind you about {text} at {due_time}.',
                    'focus': 'Reminder set for {due_time}.',
                    'sass': 'Fine, I\'ll nag you about {text} at {due_time}. You\'re welcome.',
                    'storyteller': 'A reminder has been planted in time, set to bloom at {due_time} with the message: {text}.'
                }
            },
            'media': {
                'play': {
                    'professional': 'Playing {track} now.',
                    'focus': 'Playing {track}.',
                    'sass': 'There, {track} is playing. Enjoy.',
                    'storyteller': 'The melody of {track} begins to fill the air around you.'
                },
                'pause': {
                    'professional': 'Playback paused.',
                    'focus': 'Paused.',
                    'sass': 'Music stopped. Happy?',
                    'storyteller': 'The music falls silent, awaiting your command to resume.'
                },
                'resume': {
                    'professional': 'Resuming playback.',
                    'focus': 'Resumed.',
                    'sass': 'Fine, playing again.',
                    'storyteller': 'The music awakens once more, continuing its journey.'
                }
            },
            'weather': {
                'fetch': {
                    'professional': 'The weather in {location} is {temperature} degrees with {condition}.',
                    'focus': '{location}: {temperature}°F, {condition}.',
                    'sass': 'It\'s {temperature} degrees in {location} and {condition}. There, I checked the weather for you.',
                    'storyteller': 'The skies over {location} whisper of {temperature} degrees, with {condition} gracing the horizon.'
                }
            },
            'news': {
                'fetch': {
                    'professional': 'Here are the latest headlines: {headlines}.',
                    'focus': '{count} headlines: {headlines}.',
                    'sass': 'Here\'s what\'s happening in the world: {headlines}. Try not to get too depressed.',
                    'storyteller': 'The world\'s stories unfold: {headlines}.'
                }
            },
            'wellness': {
                'start_breathing': {
                    'professional': 'Let\'s take a moment. Follow the animation on your screen to breathe with me.',
                    'focus': 'Breathing exercise starting.',
                    'sass': 'Fine, let\'s breathe. Try not to hyperventilate.',
                    'storyteller': 'A moment of peace awaits. Follow the rhythm of breath, and let tranquility flow through you.'
                }
            },
            'health': {
                'fetch': {
                    'professional': 'Your health summary: {summary}.',
                    'focus': 'Health: {summary}.',
                    'sass': 'Here\'s your health data: {summary}. Try to do better.',
                    'storyteller': 'The story of your wellness unfolds: {summary}.'
                }
            },
            'system': {
                'status': {
                    'professional': 'I am online and ready to assist you.',
                    'focus': 'Online.',
                    'sass': 'Yes, I\'m here. What do you want?',
                    'storyteller': 'I stand ready, a digital companion awaiting your command.'
                },
                'time_date': {
                    'professional': 'The current time is {time} on {date}.',
                    'focus': '{time}, {date}.',
                    'sass': 'It\'s {time} on {date}. You\'re welcome.',
                    'storyteller': 'Time flows: {time} on this day, {date}.'
                },
                'personality_change': {
                    'professional': 'I have switched to {mode} mode.',
                    'focus': '{mode} mode activated.',
                    'sass': 'Fine, {mode} mode. This should be fun.',
                    'storyteller': 'A new persona emerges: {mode} mode has been awakened.'
                },
                'volume_up': {
                    'professional': 'Volume increased by {amount}%.',
                    'focus': 'Volume +{amount}%.',
                    'sass': 'Volume up. Can you hear me now?',
                    'storyteller': 'The sound swells, increasing by {amount} percent.'
                },
                'volume_down': {
                    'professional': 'Volume decreased by {amount}%.',
                    'focus': 'Volume -{amount}%.',
                    'sass': 'Volume down. Better?',
                    'storyteller': 'The sound softens, decreasing by {amount} percent.'
                },
                'volume_mute': {
                    'professional': 'Volume muted.',
                    'focus': 'Muted.',
                    'sass': 'Fine, I\'m quiet now.',
                    'storyteller': 'Silence falls, the sound muted.'
                }
            },
            'error': {
                'default': {
                    'professional': 'I\'m sorry, I couldn\'t complete that action right now. Please try again.',
                    'focus': 'Error. Retry.',
                    'sass': 'Well, that didn\'t work. Want to try again or just give up?',
                    'storyteller': 'Alas, the command could not be fulfilled. The digital realm resists.'
                }
            }
        };
    }

    /**
     * Generates a spoken/text response from router result
     * @param {object} routerResult - Result from command router
     * @param {string} personality - Current personality mode
     * @param {object} emotion - Detected emotion (optional)
     * @returns {string} Formatted natural language response
     */
    format(routerResult, personality = 'professional', emotion = null) {
        const { service, action, status, data, message } = routerResult;

        // Handle error responses
        if (status === 'error') {
            return this.formatError(message || 'An error occurred', personality, emotion);
        }

        // Handle fallback responses
        if (status === 'fallback') {
            return this.formatFallback(routerResult, personality);
        }

        // Get template for this service/action/personality
        const template = this.templates[service]?.[action]?.[personality] 
            || this.templates[service]?.[action]?.['professional']
            || this.templates.error.default[personality]
            || this.templates.error.default['professional'];

        // Replace variables in template
        let response = this.replaceVariables(template, data || {});

        // Apply emotion-based adaptations
        if (emotion) {
            response = this.applyEmotionAdaptation(response, emotion, personality);
        }

        return response;
    }

    /**
     * Replaces variables in template string
     * @private
     */
    replaceVariables(template, data) {
        let response = template;
        
        // Replace {variable} with data values
        Object.keys(data).forEach(key => {
            const value = data[key];
            const placeholder = `{${key}}`;
            
            if (response.includes(placeholder)) {
                // Format value appropriately
                let formattedValue = value;
                
                if (Array.isArray(value)) {
                    formattedValue = value.join(', ');
                } else if (typeof value === 'object' && value !== null) {
                    formattedValue = JSON.stringify(value);
                } else {
                    formattedValue = String(value);
                }
                
                response = response.replace(new RegExp(placeholder, 'g'), formattedValue);
            }
        });

        // Handle special formatting
        response = this.formatSpecialValues(response, data);

        return response;
    }

    /**
     * Formats special values (dates, times, lists, etc.)
     * @private
     */
    formatSpecialValues(response, data) {
        // Format headlines list
        if (data.headlines && Array.isArray(data.headlines)) {
            const headlines = data.headlines.slice(0, 3).join(', ');
            response = response.replace('{headlines}', headlines);
        }

        // Format date/time
        if (data.date && data.time) {
            response = response.replace('{date}', this.formatDate(data.date));
            response = response.replace('{time}', this.formatTime(data.time));
        }

        return response;
    }

    /**
     * Formats date string
     * @private
     */
    formatDate(date) {
        if (typeof date === 'string') {
            return date;
        }
        if (date instanceof Date) {
            return date.toLocaleDateString();
        }
        return String(date);
    }

    /**
     * Formats time string
     * @private
     */
    formatTime(time) {
        if (typeof time === 'string') {
            return time;
        }
        if (time instanceof Date) {
            return time.toLocaleTimeString();
        }
        return String(time);
    }

    /**
     * Applies personality tone to response
     * @param {string} text - Base response text
     * @param {string} personality - Personality mode
     * @returns {string} Adapted response
     */
    applyPersonalityTone(text, personality) {
        const adaptations = {
            'focus': (t) => t.length > 20 ? `Done. ${t.split('.')[0]}.` : t,
            'sass': (t) => t + (t.endsWith('.') ? '' : '.') + " Hope that helps.",
            'storyteller': (t) => `In the realm of digital assistance, ${t.toLowerCase()}`,
            'professional': (t) => t
        };

        const adapt = adaptations[personality] || adaptations['professional'];
        return adapt(text);
    }

    /**
     * Applies emotion-based adaptations
     * @private
     */
    applyEmotionAdaptation(response, emotion, personality) {
        const { emotion: emotionType, sentiment } = emotion;

        // Add empathetic prefixes for negative emotions
        if (sentiment === 'negative' || emotionType === 'stress' || emotionType === 'frustration') {
            const empatheticPrefixes = {
                'professional': 'I understand that can be challenging. ',
                'focus': '',
                'sass': 'I know, life\'s hard. ',
                'storyteller': 'In moments of difficulty, '
            };
            response = (empatheticPrefixes[personality] || '') + response;
        }

        // Add encouraging suffixes for positive emotions
        if (sentiment === 'positive' || emotionType === 'joy') {
            const encouragingSuffixes = {
                'professional': ' Is there anything else I can help with?',
                'focus': '',
                'sass': ' You\'re welcome.',
                'storyteller': ' May your journey continue smoothly.'
            };
            response = response + (encouragingSuffixes[personality] || '');
        }

        return response;
    }

    /**
     * Formats error responses
     * @private
     */
    formatError(message, personality, emotion) {
        const errorTemplates = {
            'professional': `I'm sorry, ${message}. Please try again.`,
            'focus': `Error: ${message}.`,
            'sass': `Well, that didn't work. ${message}. Want to try again?`,
            'storyteller': `Alas, the command could not be fulfilled. ${message}.`
        };

        let response = errorTemplates[personality] || errorTemplates['professional'];

        if (emotion && emotion.sentiment === 'negative') {
            response = `I understand this is frustrating. ${response}`;
        }

        return response;
    }

    /**
     * Formats fallback responses (when no handler matches)
     * @private
     */
    formatFallback(routerResult, personality) {
        const fallbackMessages = {
            'professional': 'I didn\'t quite understand that. Could you rephrase?',
            'focus': 'Not understood. Rephrase.',
            'sass': 'What? Try saying that differently.',
            'storyteller': 'The meaning eludes me. Could you speak in clearer terms?'
        };

        return fallbackMessages[personality] || fallbackMessages['professional'];
    }

    /**
     * Formats multi-intent response
     * @param {object} routerResult - Multi-intent router result
     * @param {string} personality - Personality mode
     * @returns {string} Combined response
     */
    formatMultiIntent(routerResult, personality) {
        const { data } = routerResult;
        const { results } = data || {};

        if (!results || results.length === 0) {
            return this.formatError('No actions could be completed', personality);
        }

        const responses = results
            .filter(r => r.result && r.result.status === 'success')
            .map(r => this.format(r.result, personality));

        if (responses.length === 0) {
            return this.formatError('None of the requested actions could be completed', personality);
        }

        const connector = personality === 'focus' ? ' ' : ' Also, ';
        return responses.join(connector);
    }
}

// Example usage:
// const formatter = new ResponseFormatter();
// const response = formatter.format(routerResult, 'sass', { emotion: 'frustration' });
