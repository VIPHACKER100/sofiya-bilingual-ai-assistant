/**
 * SOFIYA Conversation Skill: Troubleshooting
 * Phase 18.4: Diagnostic Conversation Flow
 * 
 * Guides users through troubleshooting issues systematically
 * by asking diagnostic questions.
 */

export class TroubleshootingSkill {
    constructor() {
        this.name = 'troubleshooting';
        this.states = {
            INITIAL: 'initial',
            IDENTIFY_ISSUE: 'identify_issue',
            DIAGNOSE: 'diagnose',
            SOLUTION: 'solution',
            VERIFY: 'verify',
            ESCALATE: 'escalate'
        };

        this.currentState = this.states.INITIAL;
        this.context = {
            issue: null,
            symptoms: [],
            attemptedSolutions: [],
            diagnosticAnswers: {}
        };

        // Issue database
        this.issueDatabase = {
            'voice_not_working': {
                questions: [
                    'Is your microphone connected?',
                    'Have you granted microphone permissions?',
                    'Are you using Chrome or Edge browser?',
                    'Is your microphone muted?'
                ],
                solutions: [
                    'Check microphone connection',
                    'Grant microphone permissions in browser settings',
                    'Use Chrome or Edge for best compatibility',
                    'Unmute your microphone'
                ]
            },
            'commands_not_recognized': {
                questions: [
                    'Are you speaking clearly?',
                    'Is there background noise?',
                    'What command are you trying to use?',
                    'Have you tried rephrasing?'
                ],
                solutions: [
                    'Speak clearly and at normal pace',
                    'Reduce background noise',
                    'Check voice commands reference',
                    'Try rephrasing your command'
                ]
            },
            'whatsapp_not_sending': {
                questions: [
                    'Is WhatsApp integration connected?',
                    'Is the contact number correct?',
                    'Have you verified the phone number format?',
                    'Is there an error message?'
                ],
                solutions: [
                    'Reconnect WhatsApp integration',
                    'Verify contact phone number',
                    'Use E.164 format (+1234567890)',
                    'Check error logs'
                ]
            }
        };
    }

    /**
     * Processes user input
     * @param {string} userInput - User's input
     * @param {Object} nlpResult - NLP result
     * @returns {Object} Response and next state
     */
    process(userInput, nlpResult) {
        const { intent, entities } = nlpResult;

        switch (this.currentState) {
            case this.states.INITIAL:
                return this.handleInitial(userInput, entities);

            case this.states.IDENTIFY_ISSUE:
                return this.handleIssueIdentification(userInput, entities);

            case this.states.DIAGNOSE:
                return this.handleDiagnosis(userInput, entities);

            case this.states.SOLUTION:
                return this.handleSolution(userInput, entities);

            case this.states.VERIFY:
                return this.handleVerification(userInput, entities);

            default:
                return this.reset();
        }
    }

    /**
     * Handles initial state
     * @private
     */
    handleInitial(userInput, entities) {
        // Try to identify issue from user input
        const issue = this.identifyIssue(userInput);

        if (issue) {
            this.context.issue = issue;
            this.currentState = this.states.DIAGNOSE;
            return this.startDiagnosis();
        }

        // Ask what the problem is
        this.currentState = this.states.IDENTIFY_ISSUE;
        return {
            response: "I'm here to help! What issue are you experiencing? (voice recognition, commands, WhatsApp, smart home, etc.)",
            state: this.currentState,
            context: this.context
        };
    }

    /**
     * Handles issue identification
     * @private
     */
    handleIssueIdentification(userInput, entities) {
        const issue = this.identifyIssue(userInput);

        if (issue) {
            this.context.issue = issue;
            this.currentState = this.states.DIAGNOSE;
            return this.startDiagnosis();
        }

        return {
            response: "I'm not sure what the issue is. Could you describe it? (e.g., 'voice commands not working', 'WhatsApp messages not sending')",
            state: this.currentState,
            context: this.context
        };
    }

    /**
     * Starts diagnosis process
     * @private
     */
    startDiagnosis() {
        const issueData = this.issueDatabase[this.context.issue];

        if (!issueData) {
            return {
                response: `I understand you're having issues with ${this.context.issue}. Let me help you troubleshoot. Can you describe what's happening?`,
                state: this.states.SOLUTION,
                context: this.context
            };
        }

        this.context.currentQuestionIndex = 0;
        this.context.questions = issueData.questions;
        this.context.solutions = issueData.solutions;

        return {
            response: `I see you're having issues with ${this.context.issue}. Let me ask a few questions to diagnose the problem.\n\n${issueData.questions[0]}`,
            state: this.currentState,
            context: this.context
        };
    }

    /**
     * Handles diagnosis questions
     * @private
     */
    handleDiagnosis(userInput, entities) {
        const questionIndex = this.context.currentQuestionIndex || 0;
        const questions = this.context.questions || [];
        const answer = this.parseAnswer(userInput);

        // Store answer
        this.context.diagnosticAnswers[questionIndex] = answer;

        // Move to next question or solution
        if (questionIndex < questions.length - 1) {
            this.context.currentQuestionIndex = questionIndex + 1;
            return {
                response: `${questions[questionIndex + 1]}`,
                state: this.currentState,
                context: this.context
            };
        } else {
            // All questions answered, provide solution
            this.currentState = this.states.SOLUTION;
            return this.provideSolution();
        }
    }

    /**
     * Provides solution based on diagnosis
     * @private
     */
    provideSolution() {
        const solutions = this.context.solutions || [];
        const answers = Object.values(this.context.diagnosticAnswers);

        // Find most relevant solution based on answers
        // For now, provide all solutions
        let solutionText = "Based on your answers, here are some solutions to try:\n\n";
        solutions.forEach((solution, index) => {
            solutionText += `${index + 1}. ${solution}\n`;
        });

        solutionText += "\nTry these solutions and let me know if the issue is resolved.";

        this.currentState = this.states.VERIFY;
        return {
            response: solutionText,
            state: this.currentState,
            context: this.context
        };
    }

    /**
     * Handles solution verification
     * @private
     */
    handleVerification(userInput, entities) {
        const resolved = userInput.toLowerCase().includes('yes') ||
                        userInput.toLowerCase().includes('fixed') ||
                        userInput.toLowerCase().includes('resolved') ||
                        userInput.toLowerCase().includes('working');

        if (resolved) {
            return {
                response: "Great! I'm glad the issue is resolved. Is there anything else I can help with?",
                state: this.states.INITIAL,
                context: { ...this.context, resolved: true },
                complete: true
            };
        } else {
            // Issue not resolved, escalate
            this.currentState = this.states.ESCALATE;
            return {
                response: "I understand the issue persists. Let me escalate this to our support team. They'll contact you shortly. In the meantime, you can also check our troubleshooting guide at /help/troubleshooting.",
                state: this.currentState,
                context: this.context,
                escalate: true
            };
        }
    }

    /**
     * Identifies issue from user input
     * @private
     */
    identifyIssue(text) {
        const lower = text.toLowerCase();

        // Voice recognition issues
        if (lower.includes('voice') || lower.includes('microphone') || lower.includes('not hearing') || lower.includes('not listening')) {
            return 'voice_not_working';
        }

        // Command recognition issues
        if (lower.includes('command') || lower.includes('not understanding') || lower.includes('not recognizing')) {
            return 'commands_not_recognized';
        }

        // WhatsApp issues
        if (lower.includes('whatsapp') || lower.includes('message not sending') || lower.includes('message failed')) {
            return 'whatsapp_not_sending';
        }

        // Smart home issues
        if (lower.includes('smart home') || lower.includes('device') || lower.includes('light') || lower.includes('not working')) {
            return 'smart_home_not_working';
        }

        return null;
    }

    /**
     * Parses yes/no answer
     * @private
     */
    parseAnswer(text) {
        const lower = text.toLowerCase();
        
        if (lower.includes('yes') || lower.includes('yep') || lower.includes('sure') || lower.includes('correct')) {
            return true;
        }
        if (lower.includes('no') || lower.includes('nope') || lower.includes('not')) {
            return false;
        }

        return text; // Return full text if not yes/no
    }

    /**
     * Resets conversation
     */
    reset() {
        this.currentState = this.states.INITIAL;
        this.context = {
            issue: null,
            symptoms: [],
            attemptedSolutions: [],
            diagnosticAnswers: {}
        };
        return {
            response: "Let's start troubleshooting. What issue are you experiencing?",
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
}
