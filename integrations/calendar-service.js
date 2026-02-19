/**
 * SOFIYA Calendar Service
 * Phase 5.1: Calendar Integration
 * 
 * Connects to Google Calendar for event management.
 * Supports OAuth 2.0, event creation, fetching, and conflict detection.
 */

import 'dotenv/config';
import { google } from 'googleapis';
import { parseNaturalDate } from '../voice-engine/nlp-processor.js';

export class CalendarService {
    constructor(options = {}) {
        this.clientId = options.clientId || process.env.GOOGLE_CALENDAR_CLIENT_ID;
        this.clientSecret = options.clientSecret || process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
        this.redirectUri = options.redirectUri || process.env.GOOGLE_CALENDAR_REDIRECT_URI;
        this.accessToken = options.accessToken || null;
        this.refreshToken = options.refreshToken || null;
        
        this.oauth2Client = null;
        this.calendar = null;
    }

    /**
     * Initializes OAuth2 client and Calendar API
     */
    async initialize() {
        this.oauth2Client = new google.auth.OAuth2(
            this.clientId,
            this.clientSecret,
            this.redirectUri
        );

        if (this.accessToken && this.refreshToken) {
            this.oauth2Client.setCredentials({
                access_token: this.accessToken,
                refresh_token: this.refreshToken
            });
        }

        this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

        console.log('[CalendarService] Initialized');
    }

    /**
     * Gets OAuth authorization URL
     * @returns {string} Authorization URL
     */
    getAuthUrl() {
        if (!this.oauth2Client) {
            this.initialize();
        }

        const scopes = [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events'
        ];

        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            prompt: 'consent'
        });
    }

    /**
     * Exchanges authorization code for tokens
     * @param {string} code - Authorization code
     * @returns {Promise<Object>} Tokens
     */
    async exchangeCode(code) {
        const { tokens } = await this.oauth2Client.getToken(code);
        
        this.accessToken = tokens.access_token;
        this.refreshToken = tokens.refresh_token;
        
        this.oauth2Client.setCredentials(tokens);
        
        return tokens;
    }

    /**
     * Sets access tokens
     * @param {string} accessToken - Access token
     * @param {string} refreshToken - Refresh token
     */
    setTokens(accessToken, refreshToken) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.oauth2Client.setCredentials({
            access_token: accessToken,
            refresh_token: refreshToken
        });
    }

    /**
     * Gets calendar events
     * @param {Object} options - Query options
     * @param {Date} options.startTime - Start time (default: now)
     * @param {Date} options.endTime - End time (default: +7 days)
     * @param {string} options.calendarId - Calendar ID (default: 'primary')
     * @param {number} options.maxResults - Max results (default: 50)
     * @returns {Promise<Array>} List of events
     */
    async getEvents(options = {}) {
        if (!this.calendar) {
            await this.initialize();
        }

        const {
            startTime = new Date(),
            endTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            calendarId = 'primary',
            maxResults = 50
        } = options;

        try {
            const response = await this.calendar.events.list({
                calendarId,
                timeMin: startTime.toISOString(),
                timeMax: endTime.toISOString(),
                maxResults,
                singleEvents: true,
                orderBy: 'startTime'
            });

            return response.data.items.map(event => this.formatEvent(event));
        } catch (error) {
            console.error('[CalendarService] Error fetching events:', error);
            throw new Error(`Failed to fetch events: ${error.message}`);
        }
    }

    /**
     * Creates a new calendar event
     * @param {Object} eventData - Event data
     * @param {string} eventData.title - Event title
     * @param {Date|string} eventData.start - Start time
     * @param {Date|string} eventData.end - End time
     * @param {string} eventData.description - Event description
     * @param {string} eventData.location - Event location
     * @param {Array} eventData.attendees - Attendee emails
     * @param {string} eventData.calendarId - Calendar ID (default: 'primary')
     * @returns {Promise<Object>} Created event
     */
    async createEvent(eventData) {
        if (!this.calendar) {
            await this.initialize();
        }

        const {
            title,
            start,
            end,
            description = '',
            location = '',
            attendees = [],
            calendarId = 'primary'
        } = eventData;

        // Parse natural language dates
        const startDate = this.parseDate(start);
        const endDate = end ? this.parseDate(end) : new Date(startDate.getTime() + 60 * 60 * 1000); // Default 1 hour

        // Check for conflicts
        const conflicts = await this.checkConflicts(startDate, endDate, calendarId);
        if (conflicts.length > 0) {
            return {
                success: false,
                error: 'conflict',
                conflicts,
                message: `Event conflicts with ${conflicts.length} existing event(s)`
            };
        }

        const event = {
            summary: title,
            description,
            location,
            start: {
                dateTime: startDate.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            end: {
                dateTime: endDate.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            attendees: attendees.map(email => ({ email })),
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'email', minutes: 24 * 60 }, // 1 day before
                    { method: 'popup', minutes: 15 } // 15 minutes before
                ]
            }
        };

        try {
            const response = await this.calendar.events.insert({
                calendarId,
                requestBody: event
            });

            return {
                success: true,
                event: this.formatEvent(response.data)
            };
        } catch (error) {
            console.error('[CalendarService] Error creating event:', error);
            throw new Error(`Failed to create event: ${error.message}`);
        }
    }

    /**
     * Creates event from natural language
     * @param {string} text - Natural language text (e.g., "Meeting tomorrow at 3 PM")
     * @returns {Promise<Object>} Created event
     */
    async createEventFromText(text) {
        // Parse natural language
        const parsed = parseNaturalDate(text);
        
        const eventData = {
            title: parsed.title || 'New Event',
            start: parsed.date || new Date(),
            end: parsed.endDate || null,
            description: parsed.description || '',
            location: parsed.location || ''
        };

        return await this.createEvent(eventData);
    }

    /**
     * Updates an event
     * @param {string} eventId - Event ID
     * @param {Object} updates - Updates to apply
     * @param {string} updates.calendarId - Calendar ID (default: 'primary')
     * @returns {Promise<Object>} Updated event
     */
    async updateEvent(eventId, updates, calendarId = 'primary') {
        if (!this.calendar) {
            await this.initialize();
        }

        try {
            // Get existing event
            const existing = await this.calendar.events.get({
                calendarId,
                eventId
            });

            // Merge updates
            const updated = {
                ...existing.data,
                ...updates,
                start: updates.start ? {
                    dateTime: this.parseDate(updates.start).toISOString(),
                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                } : existing.data.start,
                end: updates.end ? {
                    dateTime: this.parseDate(updates.end).toISOString(),
                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                } : existing.data.end
            };

            const response = await this.calendar.events.update({
                calendarId,
                eventId,
                requestBody: updated
            });

            return {
                success: true,
                event: this.formatEvent(response.data)
            };
        } catch (error) {
            console.error('[CalendarService] Error updating event:', error);
            throw new Error(`Failed to update event: ${error.message}`);
        }
    }

    /**
     * Deletes an event
     * @param {string} eventId - Event ID
     * @param {string} calendarId - Calendar ID (default: 'primary')
     * @returns {Promise<boolean>} Success status
     */
    async deleteEvent(eventId, calendarId = 'primary') {
        if (!this.calendar) {
            await this.initialize();
        }

        try {
            await this.calendar.events.delete({
                calendarId,
                eventId
            });

            return true;
        } catch (error) {
            console.error('[CalendarService] Error deleting event:', error);
            return false;
        }
    }

    /**
     * Checks for scheduling conflicts
     * @param {Date} startTime - Start time
     * @param {Date} endTime - End time
     * @param {string} calendarId - Calendar ID
     * @returns {Promise<Array>} Conflicting events
     */
    async checkConflicts(startTime, endTime, calendarId = 'primary') {
        const events = await this.getEvents({
            startTime,
            endTime: new Date(endTime.getTime() + 24 * 60 * 60 * 1000), // Check next day too
            calendarId
        });

        return events.filter(event => {
            const eventStart = new Date(event.start);
            const eventEnd = new Date(event.end);
            
            // Check for overlap
            return (startTime < eventEnd && endTime > eventStart);
        });
    }

    /**
     * Gets upcoming events
     * @param {number} hours - Hours ahead to look (default: 24)
     * @returns {Promise<Array>} Upcoming events
     */
    async getUpcomingEvents(hours = 24) {
        const startTime = new Date();
        const endTime = new Date(Date.now() + hours * 60 * 60 * 1000);

        return await this.getEvents({ startTime, endTime });
    }

    /**
     * Formats event for consistent output
     * @private
     */
    formatEvent(event) {
        return {
            id: event.id,
            title: event.summary || 'Untitled Event',
            description: event.description || '',
            location: event.location || '',
            start: event.start?.dateTime || event.start?.date,
            end: event.end?.dateTime || event.end?.date,
            attendees: event.attendees?.map(a => a.email) || [],
            organizer: event.organizer?.email || '',
            status: event.status,
            created: event.created,
            updated: event.updated
        };
    }

    /**
     * Parses date string or Date object
     * @private
     */
    parseDate(dateInput) {
        if (dateInput instanceof Date) {
            return dateInput;
        }

        if (typeof dateInput === 'string') {
            // Try parsing natural language dates
            const parsed = parseNaturalDate(dateInput);
            if (parsed.date) {
                return parsed.date;
            }

            // Try ISO string
            const isoDate = new Date(dateInput);
            if (!isNaN(isoDate.getTime())) {
                return isoDate;
            }
        }

        return new Date();
    }
}

// Example usage:
// const calendar = new CalendarService();
// await calendar.initialize();
// const events = await calendar.getEvents();
// await calendar.createEvent({
//     title: 'Team Meeting',
//     start: '2026-02-20T15:00:00',
//     end: '2026-02-20T16:00:00',
//     location: 'Conference Room A'
// });
