/**
 * SOFIYA Voice Processing Pipeline Optimizer
 * Phase 24.4: Speed Up Voice Command Processing
 * 
 * Implements parallel processing, streaming, and optimization techniques
 * to reduce voice command latency to <1 second.
 */

import { VoiceInputEngine } from './voice-input.js';
import { NLPProcessor } from './nlp-processor.js';

export class VoicePipelineOptimizer {
    constructor(options = {}) {
        this.voiceEngine = options.voiceEngine || new VoiceInputEngine();
        this.nlpProcessor = options.nlpProcessor || new NLPProcessor();
        this.timeout = options.timeout || 5000; // 5 seconds default timeout
        this.enableStreaming = options.enableStreaming !== false;
        this.enableParallel = options.enableParallel !== false;
        this.fallbackModel = null; // Lightweight fallback model
    }

    /**
     * Processes voice command with optimizations
     * @param {Buffer|Stream} audioData - Audio input
     * @param {Object} options - Processing options
     * @returns {Promise<Object>} Processing result
     */
    async processVoiceCommand(audioData, options = {}) {
        const startTime = Date.now();
        const timeoutPromise = this.createTimeout(this.timeout);

        try {
            // Start parallel processing
            const processingPromise = this.processWithOptimizations(audioData, options);
            
            // Race between processing and timeout
            const result = await Promise.race([
                processingPromise,
                timeoutPromise
            ]);

            const latency = Date.now() - startTime;
            
            return {
                ...result,
                latency,
                optimized: true
            };
        } catch (error) {
            if (error.message === 'TIMEOUT') {
                // Return best-guess result on timeout
                return await this.handleTimeout(audioData, options);
            }
            throw error;
        }
    }

    /**
     * Processes audio with optimizations (parallel, streaming)
     * @private
     */
    async processWithOptimizations(audioData, options) {
        if (this.enableStreaming && this.isStream(audioData)) {
            return await this.processStreaming(audioData, options);
        }

        // Parallel processing: decode and transcribe simultaneously
        const [transcript, audioMetadata] = await Promise.all([
            this.transcribeAudio(audioData),
            this.extractAudioMetadata(audioData)
        ]);

        // Start NLP processing as soon as we have transcript (even partial)
        const nlpPromise = this.nlpProcessor.process(transcript);

        // Process in parallel: NLP + emotion detection
        const [nlpResult, emotionResult] = await Promise.all([
            nlpPromise,
            this.detectEmotion(transcript, audioMetadata)
        ]);

        return {
            transcript,
            nlp: nlpResult,
            emotion: emotionResult,
            audioMetadata
        };
    }

    /**
     * Processes streaming audio for real-time results
     * @private
     */
    async processStreaming(audioStream, options) {
        return new Promise((resolve, reject) => {
            let partialTranscript = '';
            let finalTranscript = '';
            let nlpResult = null;

            // Start NLP processing on partial results
            const processPartial = async (text) => {
                if (!nlpResult && text.length > 10) {
                    nlpResult = await this.nlpProcessor.process(text);
                }
            };

            // Stream transcription
            this.voiceEngine.processStreamingAudio(
                audioStream,
                async (transcript, error, isFinal) => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    if (isFinal) {
                        finalTranscript = transcript;
                        if (!nlpResult) {
                            nlpResult = await this.nlpProcessor.process(finalTranscript);
                        }
                        resolve({
                            transcript: finalTranscript,
                            nlp: nlpResult,
                            streaming: true
                        });
                    } else {
                        partialTranscript = transcript;
                        await processPartial(partialTranscript);
                    }
                },
                options
            );
        });
    }

    /**
     * Transcribes audio (with fallback on timeout)
     * @private
     */
    async transcribeAudio(audioData) {
        try {
            return await this.voiceEngine.processAudioStream(audioData);
        } catch (error) {
            // Fallback to lightweight model if available
            if (this.fallbackModel) {
                console.warn('[VoicePipelineOptimizer] Using fallback model');
                return await this.fallbackModel.transcribe(audioData);
            }
            throw error;
        }
    }

    /**
     * Extracts audio metadata in parallel
     * @private
     */
    async extractAudioMetadata(audioData) {
        // Extract basic metadata (duration, sample rate, etc.)
        // This can be done in parallel with transcription
        return {
            duration: this.estimateDuration(audioData),
            sampleRate: 16000, // Default
            channels: 1
        };
    }

    /**
     * Detects emotion from transcript and audio
     * @private
     */
    async detectEmotion(transcript, audioMetadata) {
        // Import emotion detector dynamically to avoid circular dependency
        const { EmotionDetector } = await import('./emotion-detector.js');
        const detector = new EmotionDetector();
        
        return detector.analyzeText(transcript, {
            pitch: audioMetadata.pitch || 0.5,
            energy: audioMetadata.energy || 0.5,
            speakingRate: audioMetadata.speakingRate || 1.0
        });
    }

    /**
     * Creates timeout promise
     * @private
     */
    createTimeout(ms) {
        return new Promise((_, reject) => {
            setTimeout(() => reject(new Error('TIMEOUT')), ms);
        });
    }

    /**
     * Handles timeout scenario
     * @private
     */
    async handleTimeout(audioData, options) {
        console.warn('[VoicePipelineOptimizer] Processing timeout, returning best-guess');

        // Try lightweight fallback
        if (this.fallbackModel) {
            try {
                const transcript = await Promise.race([
                    this.fallbackModel.transcribe(audioData),
                    this.createTimeout(2000) // 2s timeout for fallback
                ]);

                const nlpResult = await this.nlpProcessor.process(transcript);
                
                return {
                    transcript,
                    nlp: nlpResult,
                    timeout: true,
                    fallback: true
                };
            } catch (error) {
                // Fallback also failed
            }
        }

        // Return generic response
        return {
            transcript: '',
            nlp: {
                intent: 'unknown',
                confidence: 0,
                message: 'Processing timeout, please try again'
            },
            timeout: true,
            fallback: false
        };
    }

    /**
     * Checks if input is a stream
     * @private
     */
    isStream(data) {
        return data && typeof data.pipe === 'function';
    }

    /**
     * Estimates audio duration
     * @private
     */
    estimateDuration(audioData) {
        if (Buffer.isBuffer(audioData)) {
            // Assume 16-bit PCM, mono, 16kHz
            const bytesPerSample = 2;
            const samples = audioData.length / bytesPerSample;
            return samples / 16000; // seconds
        }
        return 0;
    }

    /**
     * Optimizes model for faster inference
     * Uses quantization or model optimization techniques
     */
    async optimizeModel() {
        // In production, this would:
        // 1. Quantize model weights (reduce precision)
        // 2. Prune unnecessary connections
        // 3. Use TensorFlow Lite or ONNX runtime
        // 4. Cache model in memory
        
        console.log('[VoicePipelineOptimizer] Model optimization not implemented (requires ML framework)');
    }

    /**
     * Preloads models for faster first inference
     */
    async preloadModels() {
        // Preload NLP model
        await this.nlpProcessor.process('test'); // Warm up
        
        // Preload voice engine
        await this.voiceEngine.initialize();
        
        console.log('[VoicePipelineOptimizer] Models preloaded');
    }

    /**
     * Gets pipeline performance metrics
     * @returns {Object} Performance metrics
     */
    getMetrics() {
        return {
            streamingEnabled: this.enableStreaming,
            parallelEnabled: this.enableParallel,
            timeout: this.timeout,
            fallbackAvailable: this.fallbackModel !== null
        };
    }

    /**
     * Sets timeout for processing
     * @param {number} ms - Timeout in milliseconds
     */
    setTimeout(ms) {
        this.timeout = ms;
    }

    /**
     * Enables/disables streaming
     * @param {boolean} enabled - Enable streaming
     */
    setStreaming(enabled) {
        this.enableStreaming = enabled;
    }

    /**
     * Enables/disables parallel processing
     * @param {boolean} enabled - Enable parallel processing
     */
    setParallel(enabled) {
        this.enableParallel = enabled;
    }
}

// Example usage:
// const optimizer = new VoicePipelineOptimizer({
//     voiceEngine: voiceInputEngine,
//     nlpProcessor: nlpProcessor,
//     timeout: 3000
// });
// await optimizer.preloadModels();
// const result = await optimizer.processVoiceCommand(audioBuffer);
