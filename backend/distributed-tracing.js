/**
 * SOFIYA Distributed Tracing
 * Phase 27.3: Track Requests Across Multiple Services
 * 
 * Implements distributed tracing using OpenTelemetry-compatible format.
 * Tracks requests from voice input through NLP to action execution.
 */

export class DistributedTracing {
    constructor(options = {}) {
        this.serviceName = options.serviceName || 'sofiya-backend';
        this.traceIdHeader = options.traceIdHeader || 'x-trace-id';
        this.spanIdHeader = options.spanIdHeader || 'x-span-id';
        this.enableTracing = options.enableTracing !== false;
        
        // In-memory trace storage (in production, send to Jaeger/Zipkin)
        this.traces = new Map();
        this.maxTraces = 10000; // Keep last 10k traces
    }

    /**
     * Starts a new trace
     * @param {string} operationName - Operation name
     * @param {Object} context - Trace context (optional, for distributed tracing)
     * @returns {Object} Trace context
     */
    startTrace(operationName, context = null) {
        if (!this.enableTracing) {
            return { traceId: null, spanId: null };
        }

        const traceId = context?.traceId || this.generateId();
        const spanId = this.generateId();
        const parentSpanId = context?.spanId || null;

        const trace = {
            traceId,
            spans: [],
            startTime: Date.now(),
            operationName
        };

        const span = {
            spanId,
            parentSpanId,
            operationName,
            startTime: Date.now(),
            tags: {},
            logs: [],
            duration: null
        };

        trace.spans.push(span);
        this.traces.set(traceId, trace);

        // Cleanup old traces
        if (this.traces.size > this.maxTraces) {
            const oldest = Array.from(this.traces.keys())[0];
            this.traces.delete(oldest);
        }

        return {
            traceId,
            spanId,
            parentSpanId
        };
    }

    /**
     * Starts a child span
     * @param {string} operationName - Operation name
     * @param {Object} parentContext - Parent trace context
     * @returns {Object} Span context
     */
    startSpan(operationName, parentContext) {
        if (!this.enableTracing || !parentContext?.traceId) {
            return { spanId: null };
        }

        const trace = this.traces.get(parentContext.traceId);
        if (!trace) {
            return this.startTrace(operationName);
        }

        const spanId = this.generateId();
        const span = {
            spanId,
            parentSpanId: parentContext.spanId,
            operationName,
            startTime: Date.now(),
            tags: {},
            logs: [],
            duration: null
        };

        trace.spans.push(span);
        
        return {
            traceId: parentContext.traceId,
            spanId,
            parentSpanId: parentContext.spanId
        };
    }

    /**
     * Ends a span
     * @param {Object} spanContext - Span context
     * @param {Object} tags - Optional tags to add
     */
    endSpan(spanContext, tags = {}) {
        if (!this.enableTracing || !spanContext?.traceId || !spanContext?.spanId) {
            return;
        }

        const trace = this.traces.get(spanContext.traceId);
        if (!trace) {
            return;
        }

        const span = trace.spans.find(s => s.spanId === spanContext.spanId);
        if (!span) {
            return;
        }

        span.duration = Date.now() - span.startTime;
        span.tags = { ...span.tags, ...tags };
    }

    /**
     * Adds tags to span
     * @param {Object} spanContext - Span context
     * @param {Object} tags - Tags to add
     */
    addTags(spanContext, tags) {
        if (!this.enableTracing || !spanContext?.traceId || !spanContext?.spanId) {
            return;
        }

        const trace = this.traces.get(spanContext.traceId);
        if (!trace) {
            return;
        }

        const span = trace.spans.find(s => s.spanId === spanContext.spanId);
        if (span) {
            span.tags = { ...span.tags, ...tags };
        }
    }

    /**
     * Adds log entry to span
     * @param {Object} spanContext - Span context
     * @param {string} message - Log message
     * @param {Object} fields - Additional log fields
     */
    addLog(spanContext, message, fields = {}) {
        if (!this.enableTracing || !spanContext?.traceId || !spanContext?.spanId) {
            return;
        }

        const trace = this.traces.get(spanContext.traceId);
        if (!trace) {
            return;
        }

        const span = trace.spans.find(s => s.spanId === spanContext.spanId);
        if (span) {
            span.logs.push({
                timestamp: Date.now(),
                message,
                fields
            });
        }
    }

    /**
     * Gets trace by ID
     * @param {string} traceId - Trace ID
     * @returns {Object|null} Trace data
     */
    getTrace(traceId) {
        return this.traces.get(traceId) || null;
    }

    /**
     * Gets trace context from HTTP headers
     * @param {Object} headers - HTTP headers
     * @returns {Object} Trace context
     */
    getContextFromHeaders(headers) {
        const traceId = headers[this.traceIdHeader] || headers[this.traceIdHeader.toLowerCase()];
        const spanId = headers[this.spanIdHeader] || headers[this.spanIdHeader.toLowerCase()];

        if (traceId && spanId) {
            return { traceId, spanId };
        }

        return null;
    }

    /**
     * Adds trace context to HTTP headers
     * @param {Object} context - Trace context
     * @returns {Object} HTTP headers
     */
    addContextToHeaders(context) {
        if (!context?.traceId || !context?.spanId) {
            return {};
        }

        return {
            [this.traceIdHeader]: context.traceId,
            [this.spanIdHeader]: context.spanId
        };
    }

    /**
     * Traces a voice command end-to-end
     * @param {Function} commandHandler - Command handler function
     * @param {Object} audioData - Audio input
     * @param {Object} options - Options
     * @returns {Promise<Object>} Command result with trace
     */
    async traceVoiceCommand(commandHandler, audioData, options = {}) {
        const traceContext = this.startTrace('voice_command');
        
        try {
            // Span 1: Voice recognition
            const voiceSpan = this.startSpan('voice_recognition', traceContext);
            this.addTags(voiceSpan, { audio_length: audioData.length });
            
            const transcript = await commandHandler.recognize(audioData);
            this.addTags(voiceSpan, { transcript_length: transcript.length });
            this.endSpan(voiceSpan, { success: true });

            // Span 2: NLP processing
            const nlpSpan = this.startSpan('nlp_processing', traceContext);
            this.addTags(nlpSpan, { transcript });
            
            const nlpResult = await commandHandler.processNLP(transcript);
            this.addTags(nlpSpan, { intent: nlpResult.intent, confidence: nlpResult.confidence });
            this.endSpan(nlpSpan, { success: true });

            // Span 3: Command routing
            const routingSpan = this.startSpan('command_routing', traceContext);
            this.addTags(routingSpan, { intent: nlpResult.intent });
            
            const routeResult = await commandHandler.route(nlpResult);
            this.addTags(routingSpan, { service: routeResult.service });
            this.endSpan(routingSpan, { success: true });

            // Span 4: Action execution
            const actionSpan = this.startSpan('action_execution', traceContext);
            this.addTags(actionSpan, { service: routeResult.service, action: routeResult.action });
            
            const result = await commandHandler.execute(routeResult);
            this.endSpan(actionSpan, { success: result.success });

            // End trace
            this.endSpan(traceContext, { 
                total_duration: Date.now() - traceContext.startTime,
                success: result.success 
            });

            return {
                ...result,
                traceId: traceContext.traceId
            };
        } catch (error) {
            this.addLog(traceContext, 'Error in voice command', { error: error.message });
            this.endSpan(traceContext, { success: false, error: error.message });
            throw error;
        }
    }

    /**
     * Exports trace in OpenTelemetry format
     * @param {string} traceId - Trace ID
     * @returns {Object} OpenTelemetry trace format
     */
    exportOpenTelemetry(traceId) {
        const trace = this.traces.get(traceId);
        if (!trace) {
            return null;
        }

        return {
            traceId: trace.traceId,
            spans: trace.spans.map(span => ({
                traceId: trace.traceId,
                spanId: span.spanId,
                parentSpanId: span.parentSpanId,
                name: span.operationName,
                startTime: span.startTime * 1000000, // Convert to nanoseconds
                duration: span.duration ? span.duration * 1000000 : null,
                tags: span.tags,
                logs: span.logs.map(log => ({
                    timestamp: log.timestamp * 1000000,
                    fields: [
                        { key: 'message', value: log.message },
                        ...Object.entries(log.fields).map(([k, v]) => ({ key: k, value: String(v) }))
                    ]
                }))
            }))
        };
    }

    /**
     * Generates unique ID
     * @private
     */
    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Gets slow traces (for debugging)
     * @param {number} thresholdMs - Minimum duration in ms
     * @returns {Array} Slow traces
     */
    getSlowTraces(thresholdMs = 1000) {
        const slowTraces = [];

        for (const [traceId, trace] of this.traces.entries()) {
            const totalDuration = Date.now() - trace.startTime;
            if (totalDuration > thresholdMs) {
                slowTraces.push({
                    traceId,
                    operationName: trace.operationName,
                    duration: totalDuration,
                    spans: trace.spans.length
                });
            }
        }

        return slowTraces.sort((a, b) => b.duration - a.duration);
    }
}

// Example usage:
// const tracing = new DistributedTracing({ serviceName: 'sofiya-backend' });
// const context = tracing.startTrace('voice_command');
// const span = tracing.startSpan('nlp_processing', context);
// tracing.addTags(span, { intent: 'send_message' });
// tracing.endSpan(span, { success: true });
