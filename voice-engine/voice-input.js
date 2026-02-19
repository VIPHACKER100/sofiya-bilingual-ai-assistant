/**
 * SOFIYA Voice Input Module
 * Phase 1.1: Voice Recognition Engine
 * 
 * Integrates with Google Cloud Speech-to-Text API for accurate transcription.
 * Supports multiple languages including English and Hindi.
 */

import 'dotenv/config';
import { SpeechClient } from '@google-cloud/speech';

export class VoiceInputEngine {
    constructor(options = {}) {
        this.isListening = false;
        this.speechClient = null;
        this.config = {
            encoding: options.encoding || 'LINEAR16',
            sampleRateHertz: options.sampleRateHertz || 16000,
            languageCode: options.languageCode || 'en-US',
            alternativeLanguageCodes: ['hi-IN', 'en-US'], // Support bilingual
            enableAutomaticPunctuation: true,
            enableWordTimeOffsets: false,
            model: 'latest_long', // Best for longer audio
            ...options.config
        };
    }

    /**
     * Initializes the speech-to-text service
     * Requires GOOGLE_APPLICATION_CREDENTIALS environment variable or
     * credentials passed via options
     */
    async initialize() {
        try {
            console.log('[VoiceInput] Initializing Google Cloud Speech-to-Text service...');
            
            // Initialize Speech Client
            // If GOOGLE_APPLICATION_CREDENTIALS is set, it will be used automatically
            // Otherwise, credentials can be passed via options
            this.speechClient = new SpeechClient({
                keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
                projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
            });

            console.log('[VoiceInput] Speech-to-Text service initialized successfully');
            return true;
        } catch (error) {
            console.error('[VoiceInput] Failed to initialize:', error);
            throw new Error(`Failed to initialize Speech-to-Text: ${error.message}`);
        }
    }

    /**
     * Processes audio stream and returns transcribed text
     * @param {Buffer|Stream} audioData - The incoming audio data (Buffer) or stream
     * @param {Object} options - Override config for this request
     * @returns {Promise<string>} Transcribed text
     */
    async processAudioStream(audioData, options = {}) {
        if (this.isListening) {
            throw new Error('Already processing audio stream');
        }

        if (!this.speechClient) {
            await this.initialize();
        }

        this.isListening = true;
        console.log('[VoiceInput] Processing audio stream...');

        try {
            const requestConfig = {
                ...this.config,
                ...options.config
            };

            const request = {
                config: requestConfig,
                audio: {
                    content: Buffer.isBuffer(audioData) 
                        ? audioData.toString('base64')
                        : await this.streamToBuffer(audioData)
                }
            };

            const [response] = await this.speechClient.recognize(request);
            
            if (!response.results || response.results.length === 0) {
                console.log('[VoiceInput] No transcription results');
                return '';
            }

            // Get the first alternative from the first result
            const transcript = response.results[0].alternatives[0].transcript;
            const confidence = response.results[0].alternatives[0].confidence;

            console.log(`[VoiceInput] Transcription complete (confidence: ${confidence?.toFixed(2) || 'N/A'}): "${transcript}"`);

            this.isListening = false;
            return transcript.trim();
        } catch (error) {
            this.isListening = false;
            console.error('[VoiceInput] Error processing audio:', error);
            throw new Error(`Speech recognition failed: ${error.message}`);
        }
    }

    /**
     * Processes streaming audio (real-time transcription)
     * @param {Stream} audioStream - The incoming audio stream
     * @param {Function} onTranscript - Callback for interim/final transcripts
     * @param {Object} options - Override config
     */
    async processStreamingAudio(audioStream, onTranscript, options = {}) {
        if (!this.speechClient) {
            await this.initialize();
        }

        const requestConfig = {
            ...this.config,
            ...options.config,
            enableInterimResults: true
        };

        const recognizeStream = this.speechClient
            .streamingRecognize({
                config: requestConfig
            })
            .on('error', (error) => {
                console.error('[VoiceInput] Streaming error:', error);
                onTranscript(null, error);
            })
            .on('data', (data) => {
                if (data.results[0] && data.results[0].alternatives[0]) {
                    const transcript = data.results[0].alternatives[0].transcript;
                    const isFinal = data.results[0].isFinalTranscript;
                    onTranscript(transcript, null, isFinal);
                }
            });

        audioStream.pipe(recognizeStream);
        return recognizeStream;
    }

    /**
     * Converts a stream to a Buffer
     * @private
     */
    async streamToBuffer(stream) {
        const chunks = [];
        for await (const chunk of stream) {
            chunks.push(chunk);
        }
        return Buffer.concat(chunks).toString('base64');
    }

    /**
     * Sets the language for recognition
     * @param {string} languageCode - Language code (e.g., 'en-US', 'hi-IN')
     */
    setLanguage(languageCode) {
        this.config.languageCode = languageCode;
        console.log(`[VoiceInput] Language set to: ${languageCode}`);
    }

    /**
     * Stop processing
     */
    stop() {
        this.isListening = false;
        console.log('[VoiceInput] Stopped.');
    }

    /**
     * Cleanup resources
     */
    async close() {
        if (this.speechClient) {
            await this.speechClient.close();
            this.speechClient = null;
        }
        this.isListening = false;
        console.log('[VoiceInput] Closed.');
    }
}

// Example usage:
// const engine = new VoiceInputEngine();
// await engine.initialize();
// const transcript = await engine.processAudioStream(audioBuffer);
