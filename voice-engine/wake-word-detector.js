/**
 * SOFIYA Wake-Word Detector
 * Phase 1.2: Always-listening capability with low CPU overhead
 * 
 * Uses Porcupine (Picovoice) for lightweight, accurate wake-word detection.
 * Only processes audio after wake-word is detected, improving privacy and efficiency.
 */

import 'dotenv/config';
import { Porcupine } from '@picovoice/porcupine-node';
import { createReadStream } from 'fs';
import { join } from 'path';

export class WakeWordDetector {
    constructor(options = {}) {
        this.apiKey = options.apiKey || process.env.PICOVOICE_ACCESS_KEY;
        this.sensitivity = options.sensitivity || 0.5;
        this.isListening = false;
        this.porcupine = null;
        this.audioRecorder = null;
        this.onDetectedCallback = null;
    }

    /**
     * Initializes Porcupine with custom wake-word model
     * @param {string} modelPath - Path to custom SOFIYA wake-word model (.ppn file)
     * @param {Function} onDetected - Callback when wake word is detected
     */
    async initialize(modelPath = null, onDetected = null) {
        if (!this.apiKey) {
            throw new Error('Picovoice API key is required. Set PICOVOICE_ACCESS_KEY environment variable.');
        }

        try {
            console.log('[WakeWord] Initializing Porcupine wake-word detector...');

            // Use custom model if provided, otherwise use built-in keywords
            const keywordPaths = modelPath 
                ? [modelPath]
                : [join(process.cwd(), 'models', 'sofiya.ppn')]; // Default custom model path

            const sensitivities = [this.sensitivity];

            this.porcupine = await Porcupine.create(
                this.apiKey,
                keywordPaths,
                sensitivities
            );

            if (onDetected) {
                this.onDetectedCallback = onDetected;
            }

            console.log('[WakeWord] Porcupine initialized successfully');
            return true;
        } catch (error) {
            console.error('[WakeWord] Failed to initialize Porcupine:', error);
            
            // Fallback: Use built-in keyword "Hey Pico" for development
            if (error.message.includes('model') || error.message.includes('file')) {
                console.warn('[WakeWord] Custom model not found, using built-in keyword as fallback');
                try {
                    this.porcupine = await Porcupine.create(
                        this.apiKey,
                        [], // Empty array uses built-in keywords
                        []
                    );
                    console.log('[WakeWord] Using built-in keyword fallback');
                } catch (fallbackError) {
                    throw new Error(`Wake-word detector initialization failed: ${fallbackError.message}`);
                }
            } else {
                throw error;
            }
        }
    }

    /**
     * Starts listening for the wake word "SOFIYA"
     * @param {Function} onDetected - Callback when wake word is detected
     * @param {Object} audioSource - Audio source (microphone stream, file, etc.)
     */
    async start(onDetected = null, audioSource = null) {
        if (!this.porcupine) {
            await this.initialize(null, onDetected || this.onDetectedCallback);
        }

        if (onDetected) {
            this.onDetectedCallback = onDetected;
        }

        if (!this.onDetectedCallback) {
            throw new Error('No detection callback provided');
        }

        console.log('[WakeWord] Starting detector for "SOFIYA"...');
        this.isListening = true;

        // If audio source is provided, process it
        if (audioSource) {
            await this.processAudioSource(audioSource);
        } else {
            // In a real implementation, you would set up microphone capture here
            // For now, this is a placeholder for the audio processing loop
            console.log('[WakeWord] Waiting for audio input...');
        }
    }

    /**
     * Processes audio frames from the audio source
     * @private
     */
    async processAudioSource(audioSource) {
        const frameLength = this.porcupine.frameLength;
        const sampleRate = this.porcupine.sampleRate;

        // Process audio in frames
        // In a real implementation, you would:
        // 1. Capture audio from microphone using a library like node-record-lpcm16
        // 2. Buffer audio into frames of size frameLength
        // 3. Process each frame with porcupine.process()

        // Example conceptual flow:
        /*
        const recorder = require('node-record-lpcm16');
        const audioStream = recorder.record({
            sampleRateHertz: sampleRate,
            threshold: 0.5,
            verbose: false,
            recordProgram: 'rec'
        });

        let audioBuffer = Buffer.alloc(0);
        
        audioStream.on('data', (chunk) => {
            audioBuffer = Buffer.concat([audioBuffer, chunk]);
            
            // Process when we have enough data for a frame
            while (audioBuffer.length >= frameLength * 2) { // *2 for 16-bit samples
                const frame = audioBuffer.slice(0, frameLength * 2);
                audioBuffer = audioBuffer.slice(frameLength * 2);
                
                const pcm16 = new Int16Array(frame.buffer);
                const index = this.porcupine.process(pcm16);
                
                if (index >= 0) {
                    console.log('[WakeWord] Wake word detected!');
                    this.onDetectedCallback();
                }
            }
        });

        audioStream.on('error', (error) => {
            console.error('[WakeWord] Audio stream error:', error);
            this.stop();
        });

        this.audioRecorder = audioStream;
        */
    }

    /**
     * Processes a single audio frame (for manual processing)
     * @param {Int16Array} pcmFrame - Audio frame as Int16Array
     * @returns {number} Index of detected keyword, or -1 if none detected
     */
    processFrame(pcmFrame) {
        if (!this.porcupine || !this.isListening) {
            return -1;
        }

        try {
            const index = this.porcupine.process(pcmFrame);
            
            if (index >= 0) {
                console.log('[WakeWord] Wake word "SOFIYA" detected!');
                if (this.onDetectedCallback) {
                    this.onDetectedCallback();
                }
            }
            
            return index;
        } catch (error) {
            console.error('[WakeWord] Error processing frame:', error);
            return -1;
        }
    }

    /**
     * Stop listening for wake word
     */
    stop() {
        this.isListening = false;
        
        if (this.audioRecorder) {
            this.audioRecorder.stop();
            this.audioRecorder = null;
        }
        
        console.log('[WakeWord] Stopped.');
    }

    /**
     * Cleanup resources
     */
    async release() {
        this.stop();
        
        if (this.porcupine) {
            await this.porcupine.release();
            this.porcupine = null;
        }
        
        console.log('[WakeWord] Released.');
    }

    /**
     * Get Porcupine frame length (for audio processing setup)
     */
    getFrameLength() {
        return this.porcupine ? this.porcupine.frameLength : 512;
    }

    /**
     * Get Porcupine sample rate (for audio processing setup)
     */
    getSampleRate() {
        return this.porcupine ? this.porcupine.sampleRate : 16000;
    }
}

// Example usage:
// const detector = new WakeWordDetector({ sensitivity: 0.6 });
// await detector.initialize();
// await detector.start(() => {
//     console.log('SOFIYA activated!');
// });
