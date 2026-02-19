/**
 * SOFIYA Sentiment & Emotion Detection
 * Phase 1.5: Analyze user tone to adapt SOFIYA's responses
 * 
 * Uses sentiment analysis libraries to detect emotional state from text.
 * Can optionally analyze audio features for stress/fatigue detection.
 */

import 'dotenv/config';
import Sentiment from 'sentiment';

export class EmotionDetector {
    constructor(options = {}) {
        this.sentiment = new Sentiment();
        
        // Extended word lists for better detection
        this.positiveWords = [
            'happy', 'great', 'good', 'joy', 'excited', 'yes', 'awesome', 'fantastic',
            'wonderful', 'amazing', 'perfect', 'love', 'delighted', 'pleased', 'thrilled',
            'excellent', 'brilliant', 'superb', 'outstanding', 'marvelous'
        ];
        
        this.negativeWords = [
            'sad', 'bad', 'angry', 'frustrated', 'no', 'tired', 'hate', 'disappointed',
            'annoyed', 'upset', 'worried', 'stressed', 'exhausted', 'terrible', 'awful',
            'horrible', 'dreadful', 'miserable', 'depressed', 'anxious'
        ];

        this.stressIndicators = [
            'stressed', 'overwhelmed', 'pressure', 'deadline', 'urgent', 'panic',
            'worried', 'anxious', 'nervous', 'tense', 'rushed'
        ];

        this.fatigueIndicators = [
            'tired', 'exhausted', 'sleepy', 'drained', 'worn out', 'fatigued',
            'burned out', 'weary', 'lethargic', 'drowsy'
        ];
    }

    /**
     * Analyzes text for emotional content and sentiment
     * @param {string} text - User input text
     * @param {Object} audioFeatures - Optional audio analysis features (pitch, energy, etc.)
     * @returns {Object} Emotion analysis result
     */
    analyzeText(text, audioFeatures = null) {
        if (!text || typeof text !== 'string') {
            return {
                emotion: 'neutral',
                score: 0,
                sentiment: 'neutral',
                confidence: 0
            };
        }

        // Use Sentiment library for primary analysis
        const sentimentResult = this.sentiment.analyze(text);
        
        // Enhanced analysis with custom word lists
        const tokens = text.toLowerCase().split(/\s+/);
        let customScore = 0;
        let stressScore = 0;
        let fatigueScore = 0;

        tokens.forEach(token => {
            // Remove punctuation for matching
            const cleanToken = token.replace(/[.,!?;:]/g, '');
            
            if (this.positiveWords.includes(cleanToken)) {
                customScore += 1.5;
            }
            if (this.negativeWords.includes(cleanToken)) {
                customScore -= 1.5;
            }
            if (this.stressIndicators.includes(cleanToken)) {
                stressScore += 1;
            }
            if (this.fatigueIndicators.includes(cleanToken)) {
                fatigueScore += 1;
            }
        });

        // Combine sentiment library score with custom analysis
        const combinedScore = (sentimentResult.score * 0.6) + (customScore * 0.4);
        
        // Determine primary emotion
        let emotion = 'neutral';
        if (stressScore >= 2) {
            emotion = 'stress';
        } else if (fatigueScore >= 2) {
            emotion = 'fatigue';
        } else if (combinedScore > 2) {
            emotion = 'joy';
        } else if (combinedScore < -2) {
            emotion = 'frustration';
        } else if (combinedScore > 0.5) {
            emotion = 'positive';
        } else if (combinedScore < -0.5) {
            emotion = 'negative';
        }

        // Audio-based emotion detection (if available)
        if (audioFeatures) {
            emotion = this.analyzeAudioFeatures(audioFeatures, emotion);
        }

        // Calculate confidence based on score magnitude
        const confidence = Math.min(Math.abs(combinedScore) / 10, 1.0);

        return {
            emotion,
            score: combinedScore,
            sentiment: sentimentResult.score > 0 ? 'positive' : (sentimentResult.score < 0 ? 'negative' : 'neutral'),
            confidence,
            comparative: sentimentResult.comparative,
            stressLevel: stressScore,
            fatigueLevel: fatigueScore,
            tokens: sentimentResult.tokens,
            words: sentimentResult.words
        };
    }

    /**
     * Analyzes audio features to detect stress/fatigue
     * @private
     * @param {Object} audioFeatures - Audio analysis data
     * @param {string} currentEmotion - Current text-based emotion
     * @returns {string} Refined emotion based on audio
     */
    analyzeAudioFeatures(audioFeatures, currentEmotion) {
        const { pitch, energy, speakingRate, jitter, shimmer } = audioFeatures;

        // High pitch + high energy + fast rate = stress
        if (pitch > 0.7 && energy > 0.7 && speakingRate > 1.2) {
            return 'stress';
        }

        // Low pitch + low energy + slow rate = fatigue
        if (pitch < 0.4 && energy < 0.4 && speakingRate < 0.8) {
            return 'fatigue';
        }

        // High jitter/shimmer = stress or frustration
        if (jitter > 0.05 || shimmer > 0.1) {
            if (currentEmotion === 'neutral' || currentEmotion === 'negative') {
                return 'frustration';
            }
        }

        return currentEmotion;
    }

    /**
     * Recommends a tone for SOFIYA based on detected emotion
     * @param {string} emotion - Detected emotion
     * @returns {string} Recommended response tone
     */
    getRecommendedResponseTone(emotion) {
        const toneMap = {
            'joy': 'supportive',
            'positive': 'enthusiastic',
            'frustration': 'empathetic',
            'stress': 'calming',
            'fatigue': 'gentle',
            'negative': 'understanding',
            'sad': 'comforting',
            'neutral': 'professional'
        };

        return toneMap[emotion] || 'professional';
    }

    /**
     * Gets adaptive response suggestions based on emotion
     * @param {string} emotion - Detected emotion
     * @returns {Object} Response suggestions
     */
    getAdaptiveResponse(emotion) {
        const responses = {
            'stress': {
                suggestions: [
                    'Would you like me to help you prioritize your tasks?',
                    'I can set up a breathing exercise to help you relax.',
                    'Let me check your calendar and see if we can reschedule anything.'
                ],
                actions: ['start_breathing', 'show_tasks', 'check_calendar']
            },
            'fatigue': {
                suggestions: [
                    'You seem tired. Would you like me to dim the lights?',
                    'I can set a reminder for you to rest later.',
                    'How about some calming music?'
                ],
                actions: ['dim_lights', 'set_reminder', 'play_calming_music']
            },
            'frustration': {
                suggestions: [
                    'I understand that can be frustrating. Let me help.',
                    'Would you like me to break this down into smaller steps?',
                    'I\'m here to assist. What can I do to help?'
                ],
                actions: ['offer_help', 'break_down_task']
            },
            'joy': {
                suggestions: [
                    'That\'s wonderful! I\'m glad to hear it.',
                    'Great! Is there anything else I can help with?',
                    'Excellent! Let me know if you need anything.'
                ],
                actions: ['celebrate', 'offer_more_help']
            }
        };

        return responses[emotion] || {
            suggestions: ['How can I assist you?'],
            actions: []
        };
    }
}

// Example usage:
// const detector = new EmotionDetector();
// const analysis = detector.analyzeText('I am so stressed about this deadline!');
// console.log(analysis); // { emotion: 'stress', score: -3.2, ... }
// const tone = detector.getRecommendedResponseTone(analysis.emotion);
// const suggestions = detector.getAdaptiveResponse(analysis.emotion);
