/**
 * SOFIYA Conversation Skills Manager
 * Phase 18.4: Conversation Skill Library
 * 
 * Manages and routes to different conversation skills.
 * Enables natural multi-turn conversations.
 */

import { RestaurantBookingSkill } from './restaurant-booking.js';
import { TroubleshootingSkill } from './troubleshooting.js';

export class ConversationSkillsManager {
    constructor() {
        this.skills = new Map();
        this.activeSkills = new Map(); // userId -> active skill

        // Register built-in skills
        this.registerSkill(new RestaurantBookingSkill());
        this.registerSkill(new TroubleshootingSkill());
    }

    /**
     * Registers a conversation skill
     * @param {Object} skill - Skill instance
     */
    registerSkill(skill) {
        this.skills.set(skill.name, skill);
        console.log(`[ConversationSkills] Registered skill: ${skill.name}`);
    }

    /**
     * Detects if user wants to start a conversation skill
     * @param {string} userInput - User input
     * @param {Object} nlpResult - NLP result
     * @returns {string|null} Skill name or null
     */
    detectSkill(userInput, nlpResult) {
        const lower = userInput.toLowerCase();

        // Restaurant booking triggers
        if (lower.includes('book') && (lower.includes('restaurant') || lower.includes('table') || lower.includes('dinner'))) {
            return 'restaurant_booking';
        }

        // Troubleshooting triggers
        if (lower.includes('help') || lower.includes('problem') || lower.includes('issue') || lower.includes('not working') || lower.includes('troubleshoot')) {
            return 'troubleshooting';
        }

        // Check if intent matches skill
        if (nlpResult.intent === 'book_restaurant') {
            return 'restaurant_booking';
        }

        if (nlpResult.intent === 'troubleshoot' || nlpResult.intent === 'help') {
            return 'troubleshooting';
        }

        return null;
    }

    /**
     * Processes user input with conversation skill
     * @param {string} userId - User ID
     * @param {string} userInput - User input
     * @param {Object} nlpResult - NLP result
     * @returns {Object} Skill response
     */
    process(userId, userInput, nlpResult) {
        // Check if user has active skill
        let activeSkill = this.activeSkills.get(userId);

        // If no active skill, try to detect one
        if (!activeSkill) {
            const skillName = this.detectSkill(userInput, nlpResult);
            if (skillName) {
                const SkillClass = this.skills.get(skillName);
                if (SkillClass) {
                    // Create new instance for this user
                    activeSkill = new SkillClass.constructor();
                    this.activeSkills.set(userId, activeSkill);
                }
            }
        }

        // If still no active skill, return null (normal command processing)
        if (!activeSkill) {
            return null;
        }

        // Process with skill
        const result = activeSkill.process(userInput, nlpResult);

        // If skill is complete, remove it
        if (result.complete || activeSkill.isComplete()) {
            this.activeSkills.delete(userId);
        }

        return {
            skill: activeSkill.name,
            response: result.response,
            state: result.state,
            context: result.context,
            complete: result.complete || false,
            escalate: result.escalate || false
        };
    }

    /**
     * Gets active skill for user
     * @param {string} userId - User ID
     * @returns {Object|null} Active skill or null
     */
    getActiveSkill(userId) {
        return this.activeSkills.get(userId) || null;
    }

    /**
     * Cancels active skill for user
     * @param {string} userId - User ID
     */
    cancelSkill(userId) {
        const skill = this.activeSkills.get(userId);
        if (skill) {
            skill.reset();
            this.activeSkills.delete(userId);
            return true;
        }
        return false;
    }

    /**
     * Lists all available skills
     * @returns {Array} List of skill names
     */
    listSkills() {
        return Array.from(this.skills.keys());
    }
}

// Example usage:
// const skillsManager = new ConversationSkillsManager();
// const result = skillsManager.process('user123', 'I want to book a restaurant', nlpResult);
// if (result) {
//     // Handle conversation skill response
// } else {
//     // Handle normal command
// }
