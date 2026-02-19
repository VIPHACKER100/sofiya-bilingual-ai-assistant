/**
 * SOFIYA Conversation Skill: Restaurant Booking
 * Phase 18.4: Pre-built Conversation Flow
 * 
 * Handles multi-turn conversation for booking a restaurant:
 * - Clarify cuisine preference
 * - Confirm date and time
 * - Get party size
 * - Handle special requests
 */

export class RestaurantBookingSkill {
    constructor() {
        this.name = 'restaurant_booking';
        this.states = {
            INITIAL: 'initial',
            CUISINE: 'cuisine',
            DATE: 'date',
            TIME: 'time',
            PARTY_SIZE: 'party_size',
            SPECIAL_REQUESTS: 'special_requests',
            CONFIRMATION: 'confirmation',
            COMPLETE: 'complete'
        };

        this.currentState = this.states.INITIAL;
        this.context = {};
    }

    /**
     * Processes user input in conversation flow
     * @param {string} userInput - User's input text
     * @param {Object} nlpResult - NLP processing result
     * @returns {Object} Response and next state
     */
    process(userInput, nlpResult) {
        const { intent, entities } = nlpResult;

        switch (this.currentState) {
            case this.states.INITIAL:
                return this.handleInitial(userInput, entities);

            case this.states.CUISINE:
                return this.handleCuisine(userInput, entities);

            case this.states.DATE:
                return this.handleDate(userInput, entities);

            case this.states.TIME:
                return this.handleTime(userInput, entities);

            case this.states.PARTY_SIZE:
                return this.handlePartySize(userInput, entities);

            case this.states.SPECIAL_REQUESTS:
                return this.handleSpecialRequests(userInput, entities);

            case this.states.CONFIRMATION:
                return this.handleConfirmation(userInput, entities);

            default:
                return this.reset();
        }
    }

    /**
     * Handles initial state
     * @private
     */
    handleInitial(userInput, entities) {
        // Check if user already provided some info
        if (entities.cuisine) {
            this.context.cuisine = entities.cuisine;
            this.currentState = this.states.DATE;
            return this.askForDate();
        }

        if (entities.date) {
            this.context.date = entities.date;
            this.currentState = this.states.CUISINE;
            return this.askForCuisine();
        }

        // Start conversation
        this.currentState = this.states.CUISINE;
        return {
            response: "I'd be happy to help you book a restaurant! What type of cuisine would you like?",
            state: this.currentState,
            context: this.context
        };
    }

    /**
     * Handles cuisine selection
     * @private
     */
    handleCuisine(userInput, entities) {
        const cuisine = entities.cuisine || this.extractCuisine(userInput);

        if (cuisine) {
            this.context.cuisine = cuisine;
            this.currentState = this.states.DATE;
            return this.askForDate();
        }

        return {
            response: "I didn't catch the cuisine type. Could you tell me what kind of food you'd like? (Italian, Indian, Chinese, Mexican, etc.)",
            state: this.currentState,
            context: this.context
        };
    }

    /**
     * Handles date selection
     * @private
     */
    handleDate(userInput, entities) {
        const date = entities.date || this.extractDate(userInput);

        if (date) {
            this.context.date = date;
            this.currentState = this.states.TIME;
            return this.askForTime();
        }

        return {
            response: "When would you like to dine? (Today, tomorrow, or a specific date)",
            state: this.currentState,
            context: this.context
        };
    }

    /**
     * Handles time selection
     * @private
     */
    handleTime(userInput, entities) {
        const time = entities.time || this.extractTime(userInput);

        if (time) {
            this.context.time = time;
            this.currentState = this.states.PARTY_SIZE;
            return this.askForPartySize();
        }

        return {
            response: "What time would you like? (e.g., 7 PM, 19:00)",
            state: this.currentState,
            context: this.context
        };
    }

    /**
     * Handles party size
     * @private
     */
    handlePartySize(userInput, entities) {
        const partySize = entities.number || this.extractNumber(userInput);

        if (partySize && partySize > 0) {
            this.context.partySize = partySize;
            this.currentState = this.states.SPECIAL_REQUESTS;
            return {
                response: "Any special requests? (dietary restrictions, seating preferences, etc.)",
                state: this.currentState,
                context: this.context
            };
        }

        return {
            response: "How many people will be dining?",
            state: this.currentState,
            context: this.context
        };
    }

    /**
     * Handles special requests
     * @private
     */
    handleSpecialRequests(userInput, entities) {
        // Accept any input or "none"
        if (userInput.toLowerCase().includes('none') || userInput.toLowerCase().includes('no')) {
            this.context.specialRequests = null;
        } else {
            this.context.specialRequests = userInput;
        }

        this.currentState = this.states.CONFIRMATION;
        return this.askForConfirmation();
    }

    /**
     * Handles confirmation
     * @private
     */
    handleConfirmation(userInput, entities) {
        const confirmed = userInput.toLowerCase().includes('yes') || 
                         userInput.toLowerCase().includes('confirm') ||
                         userInput.toLowerCase().includes('correct');

        if (confirmed) {
            this.currentState = this.states.COMPLETE;
            return {
                response: `Perfect! I've booked a table for ${this.context.partySize} at ${this.context.time} on ${this.context.date} for ${this.context.cuisine} cuisine. You'll receive a confirmation shortly.`,
                state: this.currentState,
                context: this.context,
                complete: true
            };
        } else {
            // User wants to change something
            const change = this.detectChangeRequest(userInput);
            if (change) {
                return this.handleChange(change);
            }

            return {
                response: "Would you like to change anything? (cuisine, date, time, party size)",
                state: this.currentState,
                context: this.context
            };
        }
    }

    /**
     * Asks for date
     * @private
     */
    askForDate() {
        return {
            response: `Great! ${this.context.cuisine} sounds delicious. When would you like to dine?`,
            state: this.currentState,
            context: this.context
        };
    }

    /**
     * Asks for cuisine
     * @private
     */
    askForCuisine() {
        return {
            response: `What type of cuisine would you like for ${this.context.date}?`,
            state: this.currentState,
            context: this.context
        };
    }

    /**
     * Asks for time
     * @private
     */
    askForTime() {
        return {
            response: `What time would you like to dine on ${this.context.date}?`,
            state: this.currentState,
            context: this.context
        };
    }

    /**
     * Asks for party size
     * @private
     */
    askForPartySize() {
        return {
            response: `How many people will be dining?`,
            state: this.currentState,
            context: this.context
        };
    }

    /**
     * Asks for confirmation
     * @private
     */
    askForConfirmation() {
        const summary = `
Let me confirm your reservation:
- Cuisine: ${this.context.cuisine}
- Date: ${this.context.date}
- Time: ${this.context.time}
- Party Size: ${this.context.partySize}
${this.context.specialRequests ? `- Special Requests: ${this.context.specialRequests}` : ''}

Does this look correct?
        `.trim();

        return {
            response: summary,
            state: this.currentState,
            context: this.context
        };
    }

    /**
     * Extracts cuisine from text
     * @private
     */
    extractCuisine(text) {
        const cuisines = ['italian', 'indian', 'chinese', 'mexican', 'japanese', 'thai', 'french', 'american', 'mediterranean'];
        const lower = text.toLowerCase();
        
        for (const cuisine of cuisines) {
            if (lower.includes(cuisine)) {
                return cuisine;
            }
        }
        
        return null;
    }

    /**
     * Extracts date from text
     * @private
     */
    extractDate(text) {
        // Simple date extraction (in production, use NLP date parser)
        if (text.toLowerCase().includes('today')) {
            return 'today';
        }
        if (text.toLowerCase().includes('tomorrow')) {
            return 'tomorrow';
        }
        
        // Try to match date patterns
        const dateMatch = text.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/);
        if (dateMatch) {
            return dateMatch[0];
        }

        return null;
    }

    /**
     * Extracts time from text
     * @private
     */
    extractTime(text) {
        // Match time patterns
        const timeMatch = text.match(/\d{1,2}:\d{2}|\d{1,2}\s*(am|pm)/i);
        if (timeMatch) {
            return timeMatch[0];
        }

        return null;
    }

    /**
     * Extracts number from text
     * @private
     */
    extractNumber(text) {
        const numberMatch = text.match(/\d+/);
        if (numberMatch) {
            return parseInt(numberMatch[0], 10);
        }

        // Check for written numbers
        const writtenNumbers = {
            'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
            'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
        };

        const lower = text.toLowerCase();
        for (const [word, num] of Object.entries(writtenNumbers)) {
            if (lower.includes(word)) {
                return num;
            }
        }

        return null;
    }

    /**
     * Detects change request
     * @private
     */
    detectChangeRequest(text) {
        const lower = text.toLowerCase();
        
        if (lower.includes('cuisine') || lower.includes('food')) {
            return 'cuisine';
        }
        if (lower.includes('date') || lower.includes('day')) {
            return 'date';
        }
        if (lower.includes('time') || lower.includes('hour')) {
            return 'time';
        }
        if (lower.includes('people') || lower.includes('party') || lower.includes('guests')) {
            return 'party_size';
        }

        return null;
    }

    /**
     * Handles change request
     * @private
     */
    handleChange(changeType) {
        delete this.context[changeType];

        switch (changeType) {
            case 'cuisine':
                this.currentState = this.states.CUISINE;
                return this.askForCuisine();
            case 'date':
                this.currentState = this.states.DATE;
                return this.askForDate();
            case 'time':
                this.currentState = this.states.TIME;
                return this.askForTime();
            case 'party_size':
                this.currentState = this.states.PARTY_SIZE;
                return this.askForPartySize();
            default:
                return this.askForConfirmation();
        }
    }

    /**
     * Resets conversation
     */
    reset() {
        this.currentState = this.states.INITIAL;
        this.context = {};
        return {
            response: "Let's start over. What type of cuisine would you like?",
            state: this.currentState,
            context: this.context
        };
    }

    /**
     * Gets current state
     */
    getState() {
        return {
            state: this.currentState,
            context: this.context
        };
    }

    /**
     * Checks if conversation is complete
     */
    isComplete() {
        return this.currentState === this.states.COMPLETE;
    }
}

// Example usage:
// const booking = new RestaurantBookingSkill();
// let result = booking.process("I want to book a restaurant", nlpResult);
// result = booking.process("Italian", nlpResult);
// result = booking.process("Tomorrow", nlpResult);
// // ... continue conversation
