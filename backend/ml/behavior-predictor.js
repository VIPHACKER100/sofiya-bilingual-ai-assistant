/**
 * SOFIYA Behavior Predictor
 * Phase 17.1: ML Model to Predict User Actions
 * 
 * Predicts next likely action given current context using statistical analysis
 * and pattern matching. Can be enhanced with LSTM neural networks later.
 */

import 'dotenv/config';
import { createClient } from 'pg';

export class BehaviorPredictor {
    constructor(options = {}) {
        this.db = options.db || null;
        this.confidenceThreshold = options.confidenceThreshold || 0.8;
        this.model = null; // Will store trained model
        this.modelPath = options.modelPath || './ml/models/behavior_predictor_v1.pkl';
    }

    /**
     * Trains the prediction model using historical data
     * @param {Object} trainingData - Historical user actions
     * @returns {Promise<Object>} Training results
     */
    async trainModel(trainingData = null) {
        console.log('[BehaviorPredictor] Training model...');

        // Fetch training data from database if not provided
        if (!trainingData && this.db) {
            trainingData = await this.fetchTrainingData();
        }

        if (!trainingData || trainingData.length === 0) {
            console.warn('[BehaviorPredictor] No training data available');
            return { success: false, message: 'No training data' };
        }

        // Extract features from training data
        const features = this.extractFeatures(trainingData);
        
        // Build Markov chain transition matrix
        const transitionMatrix = this.buildMarkovChain(features);
        
        // Calculate action probabilities by context
        const contextProbabilities = this.calculateContextProbabilities(features);

        // Store model
        this.model = {
            transitionMatrix,
            contextProbabilities,
            trainedAt: new Date().toISOString(),
            trainingDataSize: trainingData.length
        };

        // Save model to file (in production, use proper serialization)
        await this.saveModel(this.model);

        console.log(`[BehaviorPredictor] Model trained on ${trainingData.length} samples`);
        
        return {
            success: true,
            trainingSamples: trainingData.length,
            modelSize: Object.keys(transitionMatrix).length
        };
    }

    /**
     * Predicts next likely action given current context
     * @param {Object} context - Current context (hour, day, location, recent actions)
     * @returns {Promise<Object>} Prediction with confidence score
     */
    async predict(context) {
        if (!this.model) {
            // Load model if not in memory
            await this.loadModel();
        }

        if (!this.model) {
            return {
                prediction: null,
                confidence: 0,
                message: 'Model not trained'
            };
        }

        // Extract features from context
        const contextFeatures = this.extractContextFeatures(context);

        // Get predictions from Markov chain
        const markovPrediction = this.predictFromMarkov(contextFeatures);
        
        // Get predictions from context probabilities
        const contextPrediction = this.predictFromContext(contextFeatures);

        // Combine predictions (weighted average)
        const combinedPrediction = this.combinePredictions(
            markovPrediction,
            contextPrediction
        );

        // Filter by confidence threshold
        if (combinedPrediction.confidence < this.confidenceThreshold) {
            return {
                prediction: null,
                confidence: combinedPrediction.confidence,
                message: 'Confidence below threshold'
            };
        }

        return {
            prediction: combinedPrediction.action,
            confidence: combinedPrediction.confidence,
            context: contextFeatures,
            alternatives: combinedPrediction.alternatives || []
        };
    }

    /**
     * Fetches training data from database
     * @private
     */
    async fetchTrainingData() {
        if (!this.db) {
            return [];
        }

        try {
            const query = `
                SELECT 
                    user_id,
                    action_type,
                    timestamp,
                    context_data,
                    location,
                    device_info
                FROM voice_commands
                WHERE timestamp > NOW() - INTERVAL '90 days'
                ORDER BY user_id, timestamp
            `;

            const result = await this.db.query(query);
            return result.rows;
        } catch (error) {
            console.error('[BehaviorPredictor] Error fetching training data:', error);
            return [];
        }
    }

    /**
     * Extracts features from training data
     * @private
     */
    extractFeatures(data) {
        return data.map(row => ({
            hour: new Date(row.timestamp).getHours(),
            dayOfWeek: new Date(row.timestamp).getDay(),
            action: row.action_type,
            location: row.location || 'unknown',
            previousAction: null // Will be filled in sequence
        }));
    }

    /**
     * Builds Markov chain transition matrix
     * @private
     */
    buildMarkovChain(features) {
        const transitions = {};
        
        // Group by user and create sequences
        const userSequences = {};
        features.forEach(f => {
            if (!userSequences[f.user_id]) {
                userSequences[f.user_id] = [];
            }
            userSequences[f.user_id].push(f);
        });

        // Count transitions
        Object.values(userSequences).forEach(sequence => {
            for (let i = 0; i < sequence.length - 1; i++) {
                const from = sequence[i].action;
                const to = sequence[i + 1].action;
                
                if (!transitions[from]) {
                    transitions[from] = {};
                }
                if (!transitions[from][to]) {
                    transitions[from][to] = 0;
                }
                transitions[from][to]++;
            }
        });

        // Normalize to probabilities
        Object.keys(transitions).forEach(from => {
            const total = Object.values(transitions[from]).reduce((a, b) => a + b, 0);
            Object.keys(transitions[from]).forEach(to => {
                transitions[from][to] = transitions[from][to] / total;
            });
        });

        return transitions;
    }

    /**
     * Calculates action probabilities by context
     * @private
     */
    calculateContextProbabilities(features) {
        const contextCounts = {};

        features.forEach(f => {
            const contextKey = `${f.hour}_${f.dayOfWeek}_${f.location}`;
            
            if (!contextCounts[contextKey]) {
                contextCounts[contextKey] = {};
            }
            if (!contextCounts[contextKey][f.action]) {
                contextCounts[contextKey][f.action] = 0;
            }
            contextCounts[contextKey][f.action]++;
        });

        // Normalize to probabilities
        const probabilities = {};
        Object.keys(contextCounts).forEach(contextKey => {
            const total = Object.values(contextCounts[contextKey]).reduce((a, b) => a + b, 0);
            probabilities[contextKey] = {};
            Object.keys(contextCounts[contextKey]).forEach(action => {
                probabilities[contextKey][action] = contextCounts[contextKey][action] / total;
            });
        });

        return probabilities;
    }

    /**
     * Extracts features from current context
     * @private
     */
    extractContextFeatures(context) {
        const now = new Date();
        return {
            hour: context.hour || now.getHours(),
            dayOfWeek: context.dayOfWeek || now.getDay(),
            location: context.location || 'unknown',
            recentActions: context.recentActions || [],
            weather: context.weather || null
        };
    }

    /**
     * Predicts from Markov chain
     * @private
     */
    predictFromMarkov(contextFeatures) {
        if (!this.model || !this.model.transitionMatrix) {
            return { action: null, confidence: 0 };
        }

        const lastAction = contextFeatures.recentActions[contextFeatures.recentActions.length - 1];
        if (!lastAction || !this.model.transitionMatrix[lastAction]) {
            return { action: null, confidence: 0 };
        }

        // Find most likely next action
        const transitions = this.model.transitionMatrix[lastAction];
        let maxProb = 0;
        let bestAction = null;

        Object.keys(transitions).forEach(action => {
            if (transitions[action] > maxProb) {
                maxProb = transitions[action];
                bestAction = action;
            }
        });

        return {
            action: bestAction,
            confidence: maxProb
        };
    }

    /**
     * Predicts from context probabilities
     * @private
     */
    predictFromContext(contextFeatures) {
        if (!this.model || !this.model.contextProbabilities) {
            return { action: null, confidence: 0 };
        }

        const contextKey = `${contextFeatures.hour}_${contextFeatures.dayOfWeek}_${contextFeatures.location}`;
        const probabilities = this.model.contextProbabilities[contextKey];

        if (!probabilities) {
            return { action: null, confidence: 0 };
        }

        // Find most likely action for this context
        let maxProb = 0;
        let bestAction = null;

        Object.keys(probabilities).forEach(action => {
            if (probabilities[action] > maxProb) {
                maxProb = probabilities[action];
                bestAction = action;
            }
        });

        return {
            action: bestAction,
            confidence: maxProb
        };
    }

    /**
     * Combines predictions from multiple sources
     * @private
     */
    combinePredictions(markovPrediction, contextPrediction) {
        // Weighted combination (Markov 60%, Context 40%)
        const weights = { markov: 0.6, context: 0.4 };

        if (!markovPrediction.action && !contextPrediction.action) {
            return { action: null, confidence: 0 };
        }

        if (markovPrediction.action === contextPrediction.action) {
            // Both agree - high confidence
            return {
                action: markovPrediction.action,
                confidence: Math.min(
                    markovPrediction.confidence * weights.markov + 
                    contextPrediction.confidence * weights.context,
                    1.0
                )
            };
        }

        // They disagree - use the one with higher confidence
        if (markovPrediction.confidence > contextPrediction.confidence) {
            return {
                action: markovPrediction.action,
                confidence: markovPrediction.confidence * weights.markov,
                alternatives: [contextPrediction.action]
            };
        } else {
            return {
                action: contextPrediction.action,
                confidence: contextPrediction.confidence * weights.context,
                alternatives: [markovPrediction.action]
            };
        }
    }

    /**
     * Saves model to file
     * @private
     */
    async saveModel(model) {
        // In production, use proper serialization (JSON for now)
        const fs = await import('fs/promises');
        const path = await import('path');
        const modelDir = path.dirname(this.modelPath);
        
        try {
            await fs.mkdir(modelDir, { recursive: true });
            await fs.writeFile(
                this.modelPath.replace('.pkl', '.json'),
                JSON.stringify(model, null, 2)
            );
            console.log(`[BehaviorPredictor] Model saved to ${this.modelPath}`);
        } catch (error) {
            console.error('[BehaviorPredictor] Error saving model:', error);
        }
    }

    /**
     * Loads model from file
     * @private
     */
    async loadModel() {
        const fs = await import('fs/promises');
        const path = await import('path');
        const modelFile = this.modelPath.replace('.pkl', '.json');

        try {
            const data = await fs.readFile(modelFile, 'utf-8');
            this.model = JSON.parse(data);
            console.log('[BehaviorPredictor] Model loaded from file');
        } catch (error) {
            console.warn('[BehaviorPredictor] Could not load model:', error.message);
            this.model = null;
        }
    }

    /**
     * Updates model with new data (incremental learning)
     * @param {Array} newData - New action data
     */
    async updateModel(newData) {
        // In production, implement incremental learning
        // For now, retrain periodically
        console.log('[BehaviorPredictor] Model update requested - will retrain on next schedule');
    }
}

// Example usage:
// const predictor = new BehaviorPredictor({ db: dbConnection });
// await predictor.trainModel();
// const prediction = await predictor.predict({
//     hour: 9,
//     dayOfWeek: 1,
//     location: 'home',
//     recentActions: ['check_weather', 'check_calendar']
// });
