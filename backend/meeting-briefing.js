/**
 * SOFIYA Meeting Briefing
 * Phase 8.2: Meeting Briefing Feature
 * 
 * Prepares context for upcoming meetings and interactions.
 * Surfaces recent news, interests, and common topics.
 */

import 'dotenv/config';
import { createClient } from 'pg';
import { CalendarService } from '../integrations/calendar-service.js';

export class MeetingBriefing {
    constructor(options = {}) {
        this.db = options.db || null;
        this.calendarService = options.calendarService || null;
        this.newsService = options.newsService || null;
        this.notificationService = options.notificationService || null;
    }

    /**
     * Gets briefing for upcoming meetings
     * @param {string} userId - User ID
     * @param {number} hoursAhead - Hours to look ahead (default: 24)
     * @returns {Promise<Array>} Meeting briefings
     */
    async getMeetingBriefings(userId, hoursAhead = 24) {
        if (!this.calendarService) {
            return [];
        }

        const events = await this.calendarService.getUpcomingEvents(hoursAhead);
        const briefings = [];

        for (const event of events) {
            const attendees = event.attendees || [];
            
            for (const attendee of attendees) {
                if (attendee && attendee !== '') {
                    const briefing = await this.generateBriefingForPerson(userId, attendee, event);
                    briefings.push(briefing);
                }
            }

            // If no attendees, create general briefing
            if (attendees.length === 0) {
                briefings.push({
                    event,
                    person: null,
                    briefing: await this.generateGeneralBriefing(event),
                    generatedAt: new Date().toISOString()
                });
            }
        }

        return briefings;
    }

    /**
     * Generates briefing for a specific person
     * @private
     */
    async generateBriefingForPerson(userId, attendeeEmail, event) {
        const personInfo = await this.getPersonInfo(attendeeEmail);
        const recentNews = await this.getRecentNewsAboutPerson(attendeeEmail, personInfo);
        const commonTopics = await this.getCommonTopics(userId, attendeeEmail);
        const pastInteractions = await this.getPastInteractions(userId, attendeeEmail);

        const briefing = {
            person: attendeeEmail,
            name: personInfo?.name || attendeeEmail.split('@')[0],
            event: {
                title: event.title,
                start: event.start,
                end: event.end,
                location: event.location
            },
            recentNews: recentNews.slice(0, 3),
            interests: personInfo?.interests || [],
            commonTopics,
            pastInteractions: pastInteractions.slice(0, 5),
            suggestedTalkingPoints: this.generateTalkingPoints(personInfo, recentNews, commonTopics),
            timing: this.getOptimalBriefingTime(event.start)
        };

        return {
            event,
            person: attendeeEmail,
            briefing,
            generatedAt: new Date().toISOString()
        };
    }

    /**
     * Gets person info from contacts
     * @private
     */
    async getPersonInfo(email) {
        if (!this.db) {
            return null;
        }

        try {
            const query = `
                SELECT * FROM social_contacts
                WHERE email = $1 OR phone LIKE $2
                LIMIT 1
            `;

            const result = await this.db.query(query, [email, `%${email}%`]);
            if (result.rows.length > 0) {
                const contact = result.rows[0];
                return {
                    name: contact.name,
                    interests: JSON.parse(contact.preferences || '{}'),
                    notes: contact.notes
                };
            }
        } catch (error) {
            console.error('[MeetingBriefing] Error getting person info:', error);
        }

        return null;
    }

    /**
     * Gets recent news about person (placeholder - would use LinkedIn/social APIs)
     * @private
     */
    async getRecentNewsAboutPerson(email, personInfo) {
        if (!this.newsService || !personInfo?.name) {
            return [];
        }

        try {
            const results = await this.newsService.searchNews(personInfo.name, { pageSize: 5 });
            return results;
        } catch (error) {
            return [];
        }
    }

    /**
     * Gets common topics between user and contact
     * @private
     */
    async getCommonTopics(userId, attendeeEmail) {
        if (!this.db) {
            return [];
        }

        try {
            const query = `
                SELECT topic FROM reading_history
                WHERE user_id = $1
                AND topic IN (
                    SELECT topic FROM meeting_topics
                    WHERE attendee_email = $2
                )
                LIMIT 5
            `;

            const result = await this.db.query(query, [userId, attendeeEmail]);
            return result.rows.map(r => r.topic);
        } catch (error) {
            return [];
        }
    }

    /**
     * Gets past interactions
     * @private
     */
    async getPastInteractions(userId, attendeeEmail) {
        if (!this.db) {
            return [];
        }

        try {
            const query = `
                SELECT event_title, event_date, notes
                FROM meeting_history
                WHERE user_id = $1 AND attendee_email = $2
                ORDER BY event_date DESC
                LIMIT 10
            `;

            const result = await this.db.query(query, [userId, attendeeEmail]);
            return result.rows;
        } catch (error) {
            return [];
        }
    }

    /**
     * Generates talking points
     * @private
     */
    generateTalkingPoints(personInfo, recentNews, commonTopics) {
        const points = [];

        if (recentNews.length > 0) {
            points.push(`Recent news: "${recentNews[0].title}" - could be a conversation starter`);
        }

        if (commonTopics.length > 0) {
            points.push(`Shared interests: ${commonTopics.join(', ')}`);
        }

        if (personInfo?.interests) {
            const interests = Object.values(personInfo.interests);
            if (interests.length > 0) {
                points.push(`Their interests: ${interests.join(', ')}`);
            }
        }

        points.push('Ask about their recent projects or how they\'ve been');
        points.push('Follow up on any previous discussion topics');

        return points.slice(0, 5);
    }

    /**
     * Generates general briefing for event
     * @private
     */
    async generateGeneralBriefing(event) {
        return {
            event: {
                title: event.title,
                start: event.start,
                end: event.end,
                location: event.location
            },
            suggestedPreparation: [
                'Review meeting agenda if available',
                'Prepare key points to discuss',
                'Check if any materials need to be shared beforehand'
            ],
            timing: this.getOptimalBriefingTime(event.start)
        };
    }

    /**
     * Gets optimal time to send briefing (30 min before)
     * @private
     */
    getOptimalBriefingTime(eventStart) {
        const start = new Date(eventStart);
        const briefingTime = new Date(start.getTime() - 30 * 60 * 1000);
        return {
            sendAt: briefingTime.toISOString(),
            message: 'Briefing should be delivered 30 minutes before meeting'
        };
    }

    /**
     * Sends briefing notification
     * @param {string} userId - User ID
     * @param {Object} briefing - Briefing data
     */
    async sendBriefingNotification(userId, briefing) {
        if (!this.notificationService) {
            return;
        }

        const message = this.formatBriefingMessage(briefing);
        
        await this.notificationService.sendNotification({
            userId,
            type: 'meeting_briefing',
            title: `Meeting Briefing: ${briefing.event?.title || 'Upcoming Meeting'}`,
            message,
            priority: 'medium',
            metadata: { briefing }
        });
    }

    /**
     * Formats briefing as readable message
     * @private
     */
    formatBriefingMessage(briefing) {
        let message = `Meeting: ${briefing.event?.title}\n\n`;

        if (briefing.person) {
            message += `With: ${briefing.person}\n`;
        }

        if (briefing.suggestedTalkingPoints?.length > 0) {
            message += `\nTalking points:\n`;
            briefing.suggestedTalkingPoints.forEach((point, i) => {
                message += `${i + 1}. ${point}\n`;
            });
        }

        return message;
    }
}
