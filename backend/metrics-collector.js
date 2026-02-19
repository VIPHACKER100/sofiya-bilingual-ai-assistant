/**
 * SOFIYA Metrics Collector
 * Phase 27.1: Comprehensive Metrics Collection
 * 
 * Collects metrics on every aspect of the system for monitoring and alerting.
 * Supports Prometheus format and custom metrics storage.
 */

import 'dotenv/config';
import { createClient } from 'redis';

export class MetricsCollector {
    constructor(options = {}) {
        this.redis = options.redis || null;
        this.metricsPrefix = options.prefix || 'sofiya';
        this.enablePrometheus = options.enablePrometheus !== false;
        
        // In-memory metrics storage
        this.metrics = {
            counters: new Map(),
            gauges: new Map(),
            histograms: new Map()
        };

        // Aggregation windows
        this.aggregationWindows = {
            '1m': 60 * 1000,
            '5m': 5 * 60 * 1000,
            '1h': 60 * 60 * 1000,
            '24h': 24 * 60 * 60 * 1000
        };
    }

    /**
     * Initializes metrics collector
     */
    async initialize() {
        if (this.redis) {
            try {
                await this.redis.connect();
            } catch (error) {
                console.warn('[MetricsCollector] Redis not available, using in-memory only');
            }
        }

        // Start periodic aggregation
        this.startAggregation();

        console.log('[MetricsCollector] Initialized');
    }

    /**
     * Increments a counter metric
     * @param {string} name - Metric name
     * @param {Object} labels - Label key-value pairs
     * @param {number} value - Increment value (default: 1)
     */
    increment(name, labels = {}, value = 1) {
        const key = this.buildKey(name, labels);
        const current = this.metrics.counters.get(key) || 0;
        this.metrics.counters.set(key, current + value);
        
        // Also store in Redis for persistence
        if (this.redis?.isOpen) {
            this.redis.incrBy(`${this.metricsPrefix}:counter:${key}`, value).catch(() => {});
        }
    }

    /**
     * Sets a gauge metric (current value)
     * @param {string} name - Metric name
     * @param {number} value - Current value
     * @param {Object} labels - Label key-value pairs
     */
    gauge(name, value, labels = {}) {
        const key = this.buildKey(name, labels);
        this.metrics.gauges.set(key, value);
        
        if (this.redis?.isOpen) {
            this.redis.set(`${this.metricsPrefix}:gauge:${key}`, value.toString()).catch(() => {});
        }
    }

    /**
     * Records a histogram value (for latency, sizes, etc.)
     * @param {string} name - Metric name
     * @param {number} value - Value to record
     * @param {Object} labels - Label key-value pairs
     */
    histogram(name, value, labels = {}) {
        const key = this.buildKey(name, labels);
        
        if (!this.metrics.histograms.has(key)) {
            this.metrics.histograms.set(key, []);
        }
        
        const values = this.metrics.histograms.get(key);
        values.push({
            value,
            timestamp: Date.now()
        });

        // Keep only last 1000 values per histogram
        if (values.length > 1000) {
            values.shift();
        }

        // Store in Redis
        if (this.redis?.isOpen) {
            this.redis.lPush(`${this.metricsPrefix}:histogram:${key}`, JSON.stringify({ value, timestamp: Date.now() })).catch(() => {});
            this.redis.lTrim(`${this.metricsPrefix}:histogram:${key}`, 0, 999).catch(() => {});
        }
    }

    /**
     * Records API request metrics
     * @param {string} endpoint - API endpoint
     * @param {string} method - HTTP method
     * @param {number} statusCode - Response status code
     * @param {number} duration - Request duration in ms
     */
    recordAPIRequest(endpoint, method, statusCode, duration) {
        const labels = { endpoint, method, status: statusCode };
        
        // Increment request counter
        this.increment('api_requests_total', labels);
        
        // Record latency histogram
        this.histogram('api_request_duration_ms', duration, labels);
        
        // Record status code
        this.increment('api_responses_total', { status: statusCode });
    }

    /**
     * Records voice command metrics
     * @param {string} intent - Detected intent
     * @param {number} latency - Processing latency in ms
     * @param {number} confidence - NLP confidence score
     * @param {boolean} success - Whether command succeeded
     */
    recordVoiceCommand(intent, latency, confidence, success) {
        const labels = { intent, success: success.toString() };
        
        this.increment('voice_commands_total', labels);
        this.histogram('voice_command_latency_ms', latency, labels);
        this.histogram('voice_command_confidence', confidence, labels);
        
        if (!success) {
            this.increment('voice_commands_failed', { intent });
        }
    }

    /**
     * Records voice recognition accuracy
     * @param {number} accuracy - Accuracy score (0-1)
     * @param {string} language - Language code
     */
    recordVoiceAccuracy(accuracy, language) {
        this.histogram('voice_recognition_accuracy', accuracy, { language });
        this.gauge('voice_recognition_accuracy_current', accuracy, { language });
    }

    /**
     * Records integration metrics
     * @param {string} service - Service name (whatsapp, smart_home, etc.)
     * @param {string} operation - Operation name
     * @param {number} duration - Operation duration in ms
     * @param {boolean} success - Whether operation succeeded
     */
    recordIntegration(service, operation, duration, success) {
        const labels = { service, operation, success: success.toString() };
        
        this.increment('integration_operations_total', labels);
        this.histogram('integration_operation_duration_ms', duration, labels);
        
        if (!success) {
            this.increment('integration_errors_total', { service, operation });
        }
    }

    /**
     * Records database query metrics
     * @param {string} query - Query identifier
     * @param {number} duration - Query duration in ms
     * @param {boolean} success - Whether query succeeded
     */
    recordDatabaseQuery(query, duration, success) {
        const labels = { query, success: success.toString() };
        
        this.increment('database_queries_total', labels);
        this.histogram('database_query_duration_ms', duration, labels);
        
        if (!success) {
            this.increment('database_errors_total', { query });
        }
    }

    /**
     * Records cache metrics
     * @param {string} operation - Cache operation (hit, miss, set, delete)
     * @param {string} cacheType - Cache type (redis, memory)
     */
    recordCacheOperation(operation, cacheType) {
        this.increment('cache_operations_total', { operation, type: cacheType });
    }

    /**
     * Records system resource metrics
     */
    recordSystemResources() {
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        
        // Memory metrics
        this.gauge('memory_heap_used_bytes', memUsage.heapUsed);
        this.gauge('memory_heap_total_bytes', memUsage.heapTotal);
        this.gauge('memory_rss_bytes', memUsage.rss);
        this.gauge('memory_external_bytes', memUsage.external);
        
        // CPU metrics
        this.gauge('cpu_user_microseconds', cpuUsage.user);
        this.gauge('cpu_system_microseconds', cpuUsage.system);
        
        // Process metrics
        this.gauge('process_uptime_seconds', process.uptime());
    }

    /**
     * Gets metric value
     * @param {string} name - Metric name
     * @param {Object} labels - Label filters
     * @returns {number|null} Metric value
     */
    getMetric(name, labels = {}) {
        const key = this.buildKey(name, labels);
        
        // Try counters first
        if (this.metrics.counters.has(key)) {
            return this.metrics.counters.get(key);
        }
        
        // Try gauges
        if (this.metrics.gauges.has(key)) {
            return this.metrics.gauges.get(key);
        }
        
        return null;
    }

    /**
     * Gets histogram statistics
     * @param {string} name - Metric name
     * @param {Object} labels - Label filters
     * @returns {Object} Statistics (min, max, avg, p50, p95, p99)
     */
    getHistogramStats(name, labels = {}) {
        const key = this.buildKey(name, labels);
        const values = this.metrics.histograms.get(key) || [];
        
        if (values.length === 0) {
            return null;
        }

        const sorted = values.map(v => v.value).sort((a, b) => a - b);
        const sum = sorted.reduce((a, b) => a + b, 0);
        
        return {
            count: sorted.length,
            min: sorted[0],
            max: sorted[sorted.length - 1],
            avg: sum / sorted.length,
            p50: this.percentile(sorted, 50),
            p95: this.percentile(sorted, 95),
            p99: this.percentile(sorted, 99)
        };
    }

    /**
     * Calculates percentile
     * @private
     */
    percentile(sorted, p) {
        if (sorted.length === 0) return 0;
        const index = Math.ceil((p / 100) * sorted.length) - 1;
        return sorted[Math.max(0, index)];
    }

    /**
     * Exports metrics in Prometheus format
     * @returns {string} Prometheus metrics format
     */
    exportPrometheus() {
        const lines = [];

        // Export counters
        for (const [key, value] of this.metrics.counters.entries()) {
            const { name, labels } = this.parseKey(key);
            const labelStr = this.formatLabels(labels);
            lines.push(`${this.metricsPrefix}_${name}_total{${labelStr}} ${value}`);
        }

        // Export gauges
        for (const [key, value] of this.metrics.gauges.entries()) {
            const { name, labels } = this.parseKey(key);
            const labelStr = this.formatLabels(labels);
            lines.push(`${this.metricsPrefix}_${name}{${labelStr}} ${value}`);
        }

        // Export histogram summaries
        for (const [key] of this.metrics.histograms.entries()) {
            const { name, labels } = this.parseKey(key);
            const stats = this.getHistogramStats(name, labels);
            
            if (stats) {
                const labelStr = this.formatLabels(labels);
                lines.push(`${this.metricsPrefix}_${name}_count{${labelStr}} ${stats.count}`);
                lines.push(`${this.metricsPrefix}_${name}_sum{${labelStr}} ${stats.avg * stats.count}`);
                lines.push(`${this.metricsPrefix}_${name}_avg{${labelStr}} ${stats.avg}`);
                lines.push(`${this.metricsPrefix}_${name}_p95{${labelStr}} ${stats.p95}`);
                lines.push(`${this.metricsPrefix}_${name}_p99{${labelStr}} ${stats.p99}`);
            }
        }

        return lines.join('\n') + '\n';
    }

    /**
     * Gets all metrics as JSON
     * @returns {Object} All metrics
     */
    exportJSON() {
        return {
            counters: Object.fromEntries(this.metrics.counters),
            gauges: Object.fromEntries(this.metrics.gauges),
            histograms: Object.fromEntries(
                Array.from(this.metrics.histograms.entries()).map(([key, values]) => [
                    key,
                    this.getHistogramStats(...this.parseKey(key))
                ])
            ),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Starts periodic aggregation
     * @private
     */
    startAggregation() {
        // Record system resources every 30 seconds
        setInterval(() => {
            this.recordSystemResources();
        }, 30000);

        // Aggregate metrics every 5 minutes
        setInterval(() => {
            this.aggregateMetrics();
        }, 5 * 60 * 1000);
    }

    /**
     * Aggregates metrics for different time windows
     * @private
     */
    async aggregateMetrics() {
        // Store aggregated metrics in Redis for historical analysis
        if (!this.redis?.isOpen) {
            return;
        }

        const now = Date.now();
        
        for (const [windowName, windowMs] of Object.entries(this.aggregationWindows)) {
            // Aggregate histograms
            for (const [key, values] of this.metrics.histograms.entries()) {
                const windowValues = values.filter(v => v.timestamp > now - windowMs);
                if (windowValues.length > 0) {
                    const stats = this.getHistogramStatsFromValues(windowValues.map(v => v.value));
                    await this.redis.setEx(
                        `${this.metricsPrefix}:aggregated:${key}:${windowName}`,
                        86400, // 24 hour TTL
                        JSON.stringify(stats)
                    );
                }
            }
        }
    }

    /**
     * Gets histogram stats from values array
     * @private
     */
    getHistogramStatsFromValues(values) {
        const sorted = [...values].sort((a, b) => a - b);
        const sum = sorted.reduce((a, b) => a + b, 0);
        
        return {
            count: sorted.length,
            min: sorted[0],
            max: sorted[sorted.length - 1],
            avg: sum / sorted.length,
            p50: this.percentile(sorted, 50),
            p95: this.percentile(sorted, 95),
            p99: this.percentile(sorted, 99)
        };
    }

    /**
     * Builds metric key from name and labels
     * @private
     */
    buildKey(name, labels) {
        const labelStr = Object.entries(labels)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}=${v}`)
            .join(',');
        return labelStr ? `${name}{${labelStr}}` : name;
    }

    /**
     * Parses key back to name and labels
     * @private
     */
    parseKey(key) {
        const match = key.match(/^(.+?)(?:\{(.+)\})?$/);
        if (!match) {
            return { name: key, labels: {} };
        }

        const name = match[1];
        const labelStr = match[2] || '';
        const labels = {};

        if (labelStr) {
            labelStr.split(',').forEach(pair => {
                const [k, v] = pair.split('=');
                if (k && v) {
                    labels[k] = v;
                }
            });
        }

        return { name, labels };
    }

    /**
     * Formats labels for Prometheus
     * @private
     */
    formatLabels(labels) {
        return Object.entries(labels)
            .map(([k, v]) => `${k}="${v}"`)
            .join(',');
    }
}

// Example usage:
// const metrics = new MetricsCollector({ redis: redisClient });
// await metrics.initialize();
// metrics.recordAPIRequest('/api/commands/execute', 'POST', 200, 150);
// metrics.recordVoiceCommand('send_message', 800, 0.95, true);
// const prometheus = metrics.exportPrometheus();
