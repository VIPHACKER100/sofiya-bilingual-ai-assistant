/**
 * SOFIYA Group Coordinator
 * Phase 8.3: Group Coordination Module
 * 
 * Simplifies scheduling group events.
 * Queries calendars for free times and suggests optimal slots.
 */

import 'dotenv/config';
import { CalendarService } from './calendar-service.js';
import { WhatsAppService } from './whatsapp-service.js';

export class GroupCoordinator {
    constructor(options = {}) {
        this.calendarService = options.calendarService || null;
        this.whatsappService = options.whatsappService || null;
        this.db = options.db || null;
    }

    /**
     * Finds optimal time slots for group event
     * @param {Object} eventData - Event data
     * @param {Array} eventData.attendees - List of attendee emails/IDs
     * @param {number} eventData.durationMinutes - Event duration
     * @param {Date} eventData.startDate - Start of search range
     * @param {Date} eventData.endDate - End of search range
     * @param {string} eventData.preferredTime - Preferred time (e.g., 'morning', 'afternoon')
     * @returns {Promise<Array>} Suggested time slots
     */
    async findOptimalSlots(eventData) {
        const {
            attendees = [],
            durationMinutes = 60,
            startDate = new Date(),
            endDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks
            preferredTime = null
        } = eventData;

        if (attendees.length === 0) {
            return this.generateDefaultSlots(startDate, endDate, durationMinutes);
        }

        // Get busy times for each attendee
        const busySlots = await this.getBusyTimes(attendees, startDate, endDate);

        // Find free slots
        const freeSlots = this.findFreeSlots(busySlots, startDate, endDate, durationMinutes);

        // Apply preferred time filter
        const filteredSlots = preferredTime 
            ? this.filterByPreferredTime(freeSlots, preferredTime)
            : freeSlots;

        // Rank by optimality
        return this.rankSlots(filteredSlots, attendees).slice(0, 5);
    }

    /**
     * Gets busy times for attendees
     * @private
     */
    async getBusyTimes(attendees, startDate, endDate) {
        const allBusy = [];

        for (const attendee of attendees) {
            try {
                if (this.calendarService) {
                    const events = await this.calendarService.getEvents({
                        startTime: startDate,
                        endTime: endDate,
                        calendarId: attendee // In production, map to calendar ID
                    });

                    events.forEach(event => {
                        allBusy.push({
                            start: new Date(event.start),
                            end: new Date(event.end),
                            attendee
                        });
                    });
                }
            } catch (error) {
                console.warn(`[GroupCoordinator] Could not get calendar for ${attendee}:`, error.message);
            }
        }

        return allBusy;
    }

    /**
     * Finds free slots from busy times
     * @private
     */
    findFreeSlots(busySlots, startDate, endDate, durationMinutes) {
        const slots = [];
        const durationMs = durationMinutes * 60 * 1000;
        let current = new Date(startDate);
        current.setHours(9, 0, 0, 0); // Start at 9 AM

        const end = new Date(endDate);
        end.setHours(18, 0, 0, 0); // End at 6 PM

        while (current < end) {
            const slotEnd = new Date(current.getTime() + durationMs);

            if (slotEnd <= end) {
                const isBusy = busySlots.some(busy => {
                    return (current >= busy.start && current < busy.end) ||
                           (slotEnd > busy.start && slotEnd <= busy.end) ||
                           (current <= busy.start && slotEnd >= busy.end);
                });

                if (!isBusy) {
                    slots.push({
                        start: new Date(current),
                        end: slotEnd,
                        durationMinutes
                    });
                }
            }

            current.setTime(current.getTime() + 30 * 60 * 1000); // Check every 30 min
        }

        return slots;
    }

    /**
     * Filters slots by preferred time
     * @private
     */
    filterByPreferredTime(slots, preferredTime) {
        const timeRanges = {
            morning: [9, 12],
            afternoon: [12, 17],
            evening: [17, 21]
        };

        const [startHour, endHour] = timeRanges[preferredTime] || [9, 18];

        return slots.filter(slot => {
            const hour = slot.start.getHours();
            return hour >= startHour && hour < endHour;
        });
    }

    /**
     * Ranks slots by optimality
     * @private
     */
    rankSlots(slots, attendees) {
        return slots.map(slot => {
            let score = 100;

            // Prefer weekdays
            const day = slot.start.getDay();
            if (day === 0 || day === 6) score -= 20;

            // Prefer mid-morning/afternoon (10 AM - 3 PM)
            const hour = slot.start.getHours();
            if (hour >= 10 && hour <= 15) score += 10;

            // Prefer sooner
            const daysUntil = (slot.start - new Date()) / (24 * 60 * 60 * 1000);
            if (daysUntil < 3) score += 5;

            return { ...slot, score };
        }).sort((a, b) => b.score - a.score);
    }

    /**
     * Generates default slots when no calendar data
     * @private
     */
    generateDefaultSlots(startDate, endDate, durationMinutes) {
        const slots = [];
        const current = new Date(startDate);
        current.setHours(10, 0, 0, 0);

        for (let i = 0; i < 5; i++) {
            const slotStart = new Date(current);
            slotStart.setDate(slotStart.getDate() + i);
            const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60 * 1000);

            if (slotStart.getDay() !== 0 && slotStart.getDay() !== 6 && slotEnd <= endDate) {
                slots.push({
                    start: slotStart,
                    end: slotEnd,
                    durationMinutes,
                    score: 100 - i * 5
                });
            }
        }

        return slots;
    }

    /**
     * Sends meeting invites
     * @param {Object} inviteData - Invite data
     * @param {string} inviteData.eventTitle - Event title
     * @param {Date} inviteData.startTime - Start time
     * @param {Date} inviteData.endTime - End time
     * @param {string} inviteData.location - Location
     * @param {Array} inviteData.attendees - Attendees (email or phone)
     * @param {string} inviteData.channel - Channel (email, whatsapp)
     * @returns {Promise<Object>} Invite result
     */
    async sendInvites(inviteData) {
        const {
            eventTitle,
            startTime,
            endTime,
            location = '',
            attendees = [],
            channel = 'whatsapp'
        } = inviteData;

        const message = this.formatInviteMessage(eventTitle, startTime, endTime, location);
        const results = [];

        for (const attendee of attendees) {
            try {
                if (channel === 'whatsapp' && this.whatsappService) {
                    const result = await this.whatsappService.sendMessage(attendee, message);
                    results.push({ attendee, success: true, result });
                } else {
                    results.push({ attendee, success: false, error: 'Channel not configured' });
                }
            } catch (error) {
                results.push({ attendee, success: false, error: error.message });
            }
        }

        return {
            sent: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            results
        };
    }

    /**
     * Formats invite message
     * @private
     */
    formatInviteMessage(title, start, end, location) {
        const startStr = new Date(start).toLocaleString();
        const endStr = new Date(end).toLocaleString();

        let message = `📅 Meeting Invitation\n\n`;
        message += `**${title}**\n\n`;
        message += `📆 Date & Time: ${startStr} - ${endStr}\n`;
        if (location) {
            message += `📍 Location: ${location}\n`;
        }
        message += `\nPlease confirm your availability.`;

        return message;
    }

    /**
     * Tracks RSVPs
     * @param {string} eventId - Event ID
     * @param {string} attendee - Attendee
     * @param {string} response - Response (accepted, declined, tentative)
     */
    async trackRSVP(eventId, attendee, response) {
        if (!this.db) {
            return;
        }

        try {
            const query = `
                INSERT INTO event_rsvps (event_id, attendee, response, responded_at)
                VALUES ($1, $2, $3, NOW())
                ON CONFLICT (event_id, attendee) DO UPDATE
                SET response = $3, responded_at = NOW()
            `;

            await this.db.query(query, [eventId, attendee, response]);
        } catch (error) {
            console.error('[GroupCoordinator] Error tracking RSVP:', error);
        }
    }

    /**
     * Gets RSVP status for event
     * @param {string} eventId - Event ID
     * @returns {Promise<Object>} RSVP summary
     */
    async getRSVPStatus(eventId) {
        if (!this.db) {
            return { accepted: 0, declined: 0, tentative: 0, pending: 0 };
        }

        try {
            const query = `
                SELECT response, COUNT(*) as count
                FROM event_rsvps
                WHERE event_id = $1
                GROUP BY response
            `;

            const result = await this.db.query(query, [eventId]);
            const status = { accepted: 0, declined: 0, tentative: 0, pending: 0 };

            result.rows.forEach(row => {
                status[row.response] = parseInt(row.count);
            });

            return status;
        } catch (error) {
            return { accepted: 0, declined: 0, tentative: 0, pending: 0 };
        }
    }
}
