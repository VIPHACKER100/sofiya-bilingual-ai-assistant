/**
 * SOFIYA Learning Engine
 * Phase 7.3: Adaptive Learning Pathways
 * 
 * Generates personalized micro-learning plans.
 * Assesses knowledge level, creates learning paths, and tracks progress.
 */

import 'dotenv/config';
import { createClient } from 'pg';

export class LearningEngine {
    constructor(options = {}) {
        this.db = options.db || null;
        this.learningPaths = new Map();
        this.userProgress = new Map();
    }

    /**
     * Initializes learning engine
     */
    async initialize() {
        if (this.db) {
            await this.loadUserProgress();
        }
        console.log('[LearningEngine] Initialized');
    }

    /**
     * Assesses user's current knowledge level
     * @param {string} userId - User ID
     * @param {string} topic - Topic to assess
     * @param {Array} questions - Assessment questions (optional)
     * @returns {Promise<Object>} Assessment result
     */
    async assessKnowledgeLevel(userId, topic, questions = null) {
        // If questions provided, use them; otherwise generate default assessment
        const assessmentQuestions = questions || this.generateAssessmentQuestions(topic);

        // In production, present questions to user and collect answers
        // For now, simulate assessment
        const answers = this.simulateAnswers(assessmentQuestions);
        
        const score = this.calculateScore(assessmentQuestions, answers);
        const level = this.determineLevel(score);

        // Save assessment
        if (this.db) {
            await this.saveAssessment(userId, topic, score, level);
        }

        return {
            userId,
            topic,
            score,
            level, // 'beginner', 'intermediate', 'advanced'
            questions: assessmentQuestions,
            answers,
            assessedAt: new Date().toISOString()
        };
    }

    /**
     * Generates assessment questions for topic
     * @private
     */
    generateAssessmentQuestions(topic) {
        // In production, use AI to generate topic-specific questions
        // For now, return generic questions
        return [
            {
                id: 1,
                question: `What is your familiarity with ${topic}?`,
                type: 'multiple_choice',
                options: ['None', 'Basic', 'Intermediate', 'Advanced'],
                correctAnswer: null // Self-assessment
            },
            {
                id: 2,
                question: `Have you worked with ${topic} before?`,
                type: 'yes_no',
                correctAnswer: null
            },
            {
                id: 3,
                question: `What do you want to learn about ${topic}?`,
                type: 'text',
                correctAnswer: null
            }
        ];
    }

    /**
     * Simulates user answers (for testing)
     * @private
     */
    simulateAnswers(questions) {
        return questions.map(q => ({
            questionId: q.id,
            answer: q.type === 'multiple_choice' ? q.options[1] : 
                   q.type === 'yes_no' ? 'yes' : 'I want to learn the basics'
        }));
    }

    /**
     * Calculates assessment score
     * @private
     */
    calculateScore(questions, answers) {
        // Simple scoring based on self-assessment
        let score = 0;
        answers.forEach(answer => {
            if (answer.answer === 'Advanced') score += 3;
            else if (answer.answer === 'Intermediate') score += 2;
            else if (answer.answer === 'Basic') score += 1;
            else if (answer.answer === 'yes') score += 1;
        });

        return Math.min(score / questions.length, 1) * 100;
    }

    /**
     * Determines knowledge level from score
     * @private
     */
    determineLevel(score) {
        if (score < 30) return 'beginner';
        if (score < 70) return 'intermediate';
        return 'advanced';
    }

    /**
     * Creates personalized learning path
     * @param {string} userId - User ID
     * @param {string} topic - Topic to learn
     * @param {string} duration - Duration ('7days', '30days')
     * @param {string} level - Starting level (optional, will assess if not provided)
     * @returns {Promise<Object>} Learning path
     */
    async createLearningPath(userId, topic, duration = '7days', level = null) {
        // Assess knowledge level if not provided
        if (!level) {
            const assessment = await this.assessKnowledgeLevel(userId, topic);
            level = assessment.level;
        }

        // Generate learning path based on level and duration
        const path = this.generateLearningPath(topic, level, duration);

        // Save learning path
        const pathId = `path_${userId}_${topic}_${Date.now()}`;
        if (this.db) {
            await this.saveLearningPath(userId, pathId, topic, path);
        }

        this.learningPaths.set(pathId, { userId, topic, path, level, duration });

        return {
            pathId,
            userId,
            topic,
            level,
            duration,
            path,
            createdAt: new Date().toISOString()
        };
    }

    /**
     * Generates learning path structure
     * @private
     */
    generateLearningPath(topic, level, duration) {
        const days = duration === '7days' ? 7 : 30;
        const stepsPerDay = duration === '7days' ? 2 : 1;
        const totalSteps = days * stepsPerDay;

        const path = [];

        for (let day = 1; day <= days; day++) {
            for (let step = 1; step <= stepsPerDay; step++) {
                const stepNumber = (day - 1) * stepsPerDay + step;
                
                path.push({
                    day,
                    step: stepNumber,
                    title: this.generateStepTitle(topic, level, stepNumber, totalSteps),
                    type: this.selectContentType(stepNumber, totalSteps),
                    content: this.generateContent(topic, level, stepNumber),
                    estimatedMinutes: this.estimateTime(stepNumber, totalSteps),
                    completed: false
                });
            }
        }

        return path;
    }

    /**
     * Generates step title
     * @private
     */
    generateStepTitle(topic, level, stepNumber, totalSteps) {
        const phase = stepNumber <= totalSteps * 0.3 ? 'Introduction' :
                     stepNumber <= totalSteps * 0.7 ? 'Core Concepts' : 'Advanced Topics';

        return `${phase}: ${topic} - Step ${stepNumber}`;
    }

    /**
     * Selects content type for step
     * @private
     */
    selectContentType(stepNumber, totalSteps) {
        const types = ['video', 'article', 'quiz', 'practice', 'project'];
        const index = Math.floor((stepNumber / totalSteps) * types.length);
        return types[Math.min(index, types.length - 1)];
    }

    /**
     * Generates content for step
     * @private
     */
    generateContent(topic, level, stepNumber) {
        // In production, fetch actual content from knowledge base
        return {
            video: `https://example.com/videos/${topic}/${stepNumber}`,
            article: `https://example.com/articles/${topic}/${stepNumber}`,
            quiz: `https://example.com/quizzes/${topic}/${stepNumber}`,
            practice: `Practice exercises for ${topic} - Step ${stepNumber}`,
            project: `Build a project using ${topic} concepts`
        };
    }

    /**
     * Estimates time for step
     * @private
     */
    estimateTime(stepNumber, totalSteps) {
        const baseTime = 15; // 15 minutes base
        const complexity = stepNumber / totalSteps;
        return Math.round(baseTime * (1 + complexity));
    }

    /**
     * Tracks progress on learning path
     * @param {string} pathId - Learning path ID
     * @param {number} stepNumber - Step number completed
     * @returns {Promise<Object>} Updated progress
     */
    async trackProgress(pathId, stepNumber) {
        const learningPath = this.learningPaths.get(pathId);
        if (!learningPath) {
            throw new Error(`Learning path not found: ${pathId}`);
        }

        // Mark step as completed
        const step = learningPath.path.find(s => s.step === stepNumber);
        if (step) {
            step.completed = true;
            step.completedAt = new Date().toISOString();
        }

        // Calculate overall progress
        const completedSteps = learningPath.path.filter(s => s.completed).length;
        const totalSteps = learningPath.path.length;
        const progress = (completedSteps / totalSteps) * 100;

        // Save progress
        if (this.db) {
            await this.saveProgress(pathId, stepNumber, progress);
        }

        // Update in-memory cache
        if (!this.userProgress.has(learningPath.userId)) {
            this.userProgress.set(learningPath.userId, {});
        }
        this.userProgress.get(learningPath.userId)[pathId] = { progress, completedSteps, totalSteps };

        return {
            pathId,
            stepNumber,
            progress,
            completedSteps,
            totalSteps,
            nextStep: learningPath.path.find(s => !s.completed)
        };
    }

    /**
     * Gets user's learning progress
     * @param {string} userId - User ID
     * @returns {Promise<Array>} Learning paths with progress
     */
    async getUserProgress(userId) {
        const userPaths = Array.from(this.learningPaths.values())
            .filter(p => p.userId === userId);

        return userPaths.map(path => {
            const progress = this.userProgress.get(userId)?.[path.pathId] || {
                progress: 0,
                completedSteps: 0,
                totalSteps: path.path.length
            };

            return {
                pathId: path.pathId,
                topic: path.topic,
                level: path.level,
                duration: path.duration,
                progress: progress.progress,
                completedSteps: progress.completedSteps,
                totalSteps: progress.totalSteps,
                path: path.path
            };
        });
    }

    /**
     * Adjusts learning path difficulty based on performance
     * @param {string} pathId - Learning path ID
     * @param {Object} performance - Performance metrics
     * @returns {Promise<Object>} Adjusted path
     */
    async adjustDifficulty(pathId, performance) {
        const learningPath = this.learningPaths.get(pathId);
        if (!learningPath) {
            throw new Error(`Learning path not found: ${pathId}`);
        }

        // Adjust based on quiz scores, completion time, etc.
        if (performance.averageScore < 60) {
            // Too difficult, add more foundational steps
            learningPath.path = this.addFoundationSteps(learningPath.path);
        } else if (performance.averageScore > 90 && performance.averageTime < 0.7) {
            // Too easy, add more challenging steps
            learningPath.path = this.addAdvancedSteps(learningPath.path);
        }

        return learningPath;
    }

    /**
     * Adds foundation steps to path
     * @private
     */
    addFoundationSteps(path) {
        // In production, insert additional foundational content
        return path;
    }

    /**
     * Adds advanced steps to path
     * @private
     */
    addAdvancedSteps(path) {
        // In production, insert additional advanced content
        return path;
    }

    /**
     * Saves assessment to database
     * @private
     */
    async saveAssessment(userId, topic, score, level) {
        if (!this.db) {
            return;
        }

        try {
            const query = `
                INSERT INTO knowledge_assessments (user_id, topic, score, level, assessed_at)
                VALUES ($1, $2, $3, $4, NOW())
            `;

            await this.db.query(query, [userId, topic, score, level]);
        } catch (error) {
            console.error('[LearningEngine] Error saving assessment:', error);
        }
    }

    /**
     * Saves learning path to database
     * @private
     */
    async saveLearningPath(userId, pathId, topic, path) {
        if (!this.db) {
            return;
        }

        try {
            const query = `
                INSERT INTO learning_paths (path_id, user_id, topic, path_data, created_at)
                VALUES ($1, $2, $3, $4, NOW())
            `;

            await this.db.query(query, [pathId, userId, topic, JSON.stringify(path)]);
        } catch (error) {
            console.error('[LearningEngine] Error saving path:', error);
        }
    }

    /**
     * Saves progress to database
     * @private
     */
    async saveProgress(pathId, stepNumber, progress) {
        if (!this.db) {
            return;
        }

        try {
            const query = `
                INSERT INTO learning_progress (path_id, step_number, progress, updated_at)
                VALUES ($1, $2, $3, NOW())
                ON CONFLICT (path_id, step_number) DO UPDATE
                SET progress = $3, updated_at = NOW()
            `;

            await this.db.query(query, [pathId, stepNumber, progress]);
        } catch (error) {
            console.error('[LearningEngine] Error saving progress:', error);
        }
    }

    /**
     * Loads user progress from database
     * @private
     */
    async loadUserProgress() {
        if (!this.db) {
            return;
        }

        try {
            const query = `
                SELECT path_id, user_id, topic, path_data
                FROM learning_paths
            `;

            const result = await this.db.query(query);
            result.rows.forEach(row => {
                this.learningPaths.set(row.path_id, {
                    userId: row.user_id,
                    topic: row.topic,
                    path: JSON.parse(row.path_data || '[]')
                });
            });
        } catch (error) {
            console.error('[LearningEngine] Error loading progress:', error);
        }
    }
}

// Example usage:
// const learning = new LearningEngine({ db });
// await learning.initialize();
// const assessment = await learning.assessKnowledgeLevel('user123', 'Machine Learning');
// const path = await learning.createLearningPath('user123', 'Machine Learning', '7days');
// await learning.trackProgress(path.pathId, 1);
