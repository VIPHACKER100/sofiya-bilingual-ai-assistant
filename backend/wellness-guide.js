/**
 * SOFIYA Wellness Guide
 * Phase 6.3: Mindfulness & Wellness Guide
 * 
 * Provides guided meditations, breathing exercises, and wellness content.
 * Triggers suggestions based on stress levels and user state.
 */

import 'dotenv/config';

export class WellnessGuide {
    constructor(options = {}) {
        this.meditationLibrary = this.initializeMeditationLibrary();
        this.breathingExercises = this.initializeBreathingExercises();
        this.bedtimeStories = this.initializeBedtimeStories();
    }

    /**
     * Initializes meditation library
     * @private
     */
    initializeMeditationLibrary() {
        return {
            '3min': {
                title: 'Quick 3-Minute Meditation',
                duration: 180,
                type: 'mindfulness',
                steps: [
                    { time: 0, instruction: 'Find a comfortable seated position' },
                    { time: 30, instruction: 'Close your eyes and take a deep breath' },
                    { time: 60, instruction: 'Focus on your breath, in and out' },
                    { time: 120, instruction: 'Let thoughts come and go without judgment' },
                    { time: 180, instruction: 'Slowly open your eyes and return to the present moment' }
                ]
            },
            '5min': {
                title: '5-Minute Body Scan',
                duration: 300,
                type: 'body_scan',
                steps: [
                    { time: 0, instruction: 'Lie down or sit comfortably' },
                    { time: 60, instruction: 'Bring attention to your toes' },
                    { time: 120, instruction: 'Slowly move attention up through your body' },
                    { time: 240, instruction: 'Notice any tension and release it' },
                    { time: 300, instruction: 'Return attention to your breath' }
                ]
            },
            '10min': {
                title: '10-Minute Guided Meditation',
                duration: 600,
                type: 'guided',
                steps: [
                    { time: 0, instruction: 'Settle into a comfortable position' },
                    { time: 120, instruction: 'Focus on your breathing rhythm' },
                    { time: 300, instruction: 'Visualize a peaceful place' },
                    { time: 480, instruction: 'Feel gratitude for this moment' },
                    { time: 600, instruction: 'Gently return to awareness' }
                ]
            },
            'stress_relief': {
                title: 'Stress Relief Meditation',
                duration: 600,
                type: 'stress_relief',
                steps: [
                    { time: 0, instruction: 'Take three deep breaths' },
                    { time: 120, instruction: 'Identify where you feel stress in your body' },
                    { time: 300, instruction: 'Breathe into those areas and release tension' },
                    { time: 480, instruction: 'Imagine stress leaving your body with each exhale' },
                    { time: 600, instruction: 'Feel lighter and more relaxed' }
                ]
            },
            'sleep': {
                title: 'Sleep Meditation',
                duration: 900,
                type: 'sleep',
                steps: [
                    { time: 0, instruction: 'Lie down in bed, close your eyes' },
                    { time: 180, instruction: 'Relax each part of your body from toes to head' },
                    { time: 420, instruction: 'Count backwards from 10, breathing slowly' },
                    { time: 660, instruction: 'Visualize yourself in a peaceful garden' },
                    { time: 900, instruction: 'Drift into restful sleep' }
                ]
            }
        };
    }

    /**
     * Initializes breathing exercises
     * @private
     */
    initializeBreathingExercises() {
        return {
            '478': {
                name: '4-7-8 Breathing',
                description: 'Calming technique for stress and sleep',
                duration: 120,
                pattern: {
                    inhale: 4,
                    hold: 7,
                    exhale: 8,
                    cycles: 4
                },
                instructions: [
                    'Inhale through your nose for 4 counts',
                    'Hold your breath for 7 counts',
                    'Exhale through your mouth for 8 counts',
                    'Repeat 4 times'
                ]
            },
            'box': {
                name: 'Box Breathing',
                description: 'Equal breathing for focus and calm',
                duration: 120,
                pattern: {
                    inhale: 4,
                    hold: 4,
                    exhale: 4,
                    pause: 4,
                    cycles: 5
                },
                instructions: [
                    'Inhale for 4 counts',
                    'Hold for 4 counts',
                    'Exhale for 4 counts',
                    'Pause for 4 counts',
                    'Repeat 5 times'
                ]
            },
            'deep': {
                name: 'Deep Breathing',
                description: 'Simple deep breaths for relaxation',
                duration: 60,
                pattern: {
                    inhale: 5,
                    exhale: 5,
                    cycles: 6
                },
                instructions: [
                    'Take a slow, deep breath in for 5 counts',
                    'Exhale slowly for 5 counts',
                    'Repeat 6 times'
                ]
            },
            'energizing': {
                name: 'Energizing Breath',
                description: 'Quick breathing to boost energy',
                duration: 60,
                pattern: {
                    inhale: 2,
                    exhale: 2,
                    cycles: 10
                },
                instructions: [
                    'Take quick, sharp breaths in and out',
                    '2 counts in, 2 counts out',
                    'Repeat 10 times',
                    'Feel energized and alert'
                ]
            }
        };
    }

    /**
     * Initializes bedtime stories
     * @private
     */
    initializeBedtimeStories() {
        return {
            'peaceful_forest': {
                title: 'A Walk Through the Peaceful Forest',
                duration: 600,
                type: 'nature',
                story: [
                    'Imagine yourself walking through a peaceful forest',
                    'The path is soft beneath your feet',
                    'Sunlight filters through the trees',
                    'You hear birds singing softly',
                    'A gentle breeze rustles the leaves',
                    'You feel completely safe and relaxed',
                    'Continue walking deeper into tranquility',
                    'Let all worries fade away',
                    'Drift into peaceful sleep'
                ]
            },
            'ocean_waves': {
                title: 'Ocean Waves',
                duration: 600,
                type: 'nature',
                story: [
                    'Picture yourself on a quiet beach',
                    'The sand is warm beneath you',
                    'Ocean waves roll gently to shore',
                    'Each wave brings calm and peace',
                    'The sound is rhythmic and soothing',
                    'Stars twinkle in the night sky',
                    'You feel completely at ease',
                    'Let the waves carry you to sleep'
                ]
            },
            'mountain_retreat': {
                title: 'Mountain Retreat',
                duration: 600,
                type: 'nature',
                story: [
                    'You are in a cozy cabin in the mountains',
                    'A fire crackles softly in the fireplace',
                    'Snow falls gently outside',
                    'You are wrapped in a warm blanket',
                    'Everything is quiet and peaceful',
                    'You feel completely secure',
                    'Let the peacefulness lull you to sleep'
                ]
            }
        };
    }

    /**
     * Gets meditation by duration or type
     * @param {string} duration - Duration ('3min', '5min', '10min') or type
     * @returns {Object|null} Meditation guide
     */
    getMeditation(duration = '5min') {
        return this.meditationLibrary[duration] || this.meditationLibrary['5min'];
    }

    /**
     * Gets breathing exercise by name
     * @param {string} name - Exercise name ('478', 'box', 'deep', 'energizing')
     * @returns {Object|null} Breathing exercise
     */
    getBreathingExercise(name = '478') {
        return this.breathingExercises[name] || this.breathingExercises['478'];
    }

    /**
     * Gets bedtime story by name
     * @param {string} name - Story name
     * @returns {Object|null} Bedtime story
     */
    getBedtimeStory(name = 'peaceful_forest') {
        return this.bedtimeStories[name] || this.bedtimeStories['peaceful_forest'];
    }

    /**
     * Suggests wellness activity based on stress level
     * @param {number} stressLevel - Stress level (0-10)
     * @param {Object} context - User context
     * @returns {Object} Suggestion
     */
    suggestActivity(stressLevel, context = {}) {
        if (stressLevel >= 8) {
            return {
                type: 'breathing',
                activity: this.getBreathingExercise('478'),
                message: 'You seem very stressed. Try 4-7-8 breathing to calm down.',
                priority: 'high'
            };
        } else if (stressLevel >= 5) {
            return {
                type: 'meditation',
                activity: this.getMeditation('stress_relief'),
                message: 'A quick meditation can help reduce stress.',
                priority: 'medium'
            };
        } else if (context.timeOfDay === 'evening' || context.bedtime) {
            return {
                type: 'bedtime_story',
                activity: this.getBedtimeStory('ocean_waves'),
                message: 'A calming bedtime story can help you relax.',
                priority: 'low'
            };
        } else {
            return {
                type: 'breathing',
                activity: this.getBreathingExercise('deep'),
                message: 'Take a moment for deep breathing to stay centered.',
                priority: 'low'
            };
        }
    }

    /**
     * Gets all available meditations
     * @returns {Array} List of meditations
     */
    getAllMeditations() {
        return Object.entries(this.meditationLibrary).map(([key, value]) => ({
            id: key,
            ...value
        }));
    }

    /**
     * Gets all breathing exercises
     * @returns {Array} List of breathing exercises
     */
    getAllBreathingExercises() {
        return Object.entries(this.breathingExercises).map(([key, value]) => ({
            id: key,
            ...value
        }));
    }

    /**
     * Gets all bedtime stories
     * @returns {Array} List of bedtime stories
     */
    getAllBedtimeStories() {
        return Object.entries(this.bedtimeStories).map(([key, value]) => ({
            id: key,
            ...value
        }));
    }
}

// Example usage:
// const wellness = new WellnessGuide();
// const meditation = wellness.getMeditation('5min');
// const breathing = wellness.getBreathingExercise('478');
// const suggestion = wellness.suggestActivity(7, { timeOfDay: 'afternoon' });
