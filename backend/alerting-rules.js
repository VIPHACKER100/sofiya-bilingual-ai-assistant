/**
 * SOFIYA Alerting Rules
 * Phase 27.2: Alert Configuration and Management
 * 
 * Defines alerting rules and integrates with Prometheus Alertmanager
 * or custom notification systems.
 */

import 'dotenv/config';
import { MetricsCollector } from './metrics-collector.js';

export class AlertingRules {
    constructor(options = {}) {
        this.metricsCollector = options.metricsCollector || null;
        this.notificationEngine = options.notificationEngine || null;
        this.alertHistory = new Map();
        
        // Alert rules configuration
        this.rules = [
            {
                name: 'high_api_latency',
                condition: (metrics) => {
                    const stats = metrics.getHistogramStats('api_request_duration_ms', {});
                    return stats && stats.p95 > 1000; // p95 > 1s
                },
                severity: 'warning',
                message: 'API latency p95 exceeds 1000ms',
                threshold: 1000
            },
            {
                name: 'high_error_rate',
                condition: (metrics) => {
                    const total = metrics.getMetric('api_requests_total', {}) || 0;
                    const errors = metrics.getMetric('api_responses_total', { status: '500' }) || 0;
                    const rate = total > 0 ? (errors / total) * 100 : 0;
                    return rate > 1; // >1% error rate
                },
                severity: 'critical',
                message: 'API error rate exceeds 1%',
                threshold: 1
            },
            {
                name: 'low_voice_accuracy',
                condition: (metrics) => {
                    const accuracy = metrics.getMetric('voice_recognition_accuracy_current', {}) || 1.0;
                    return accuracy < 0.85; // <85% accuracy
                },
                severity: 'warning',
                message: 'Voice recognition accuracy below 85%',
                threshold: 0.85
            },
            {
                name: 'high_database_connections',
                condition: (metrics) => {
                    const connections = metrics.getMetric('database_connections_active', {}) || 0;
                    return connections > 80; // >80% of 100 max
                },
                severity: 'warning',
                message: 'Database connections exceed 80% capacity',
                threshold: 80
            },
            {
                name: 'high_disk_usage',
                condition: (metrics) => {
                    const usage = metrics.getMetric('disk_usage_percent', {}) || 0;
                    return usage > 80; // >80%
                },
                severity: 'warning',
                message: 'Disk usage exceeds 80%',
                threshold: 80
            },
            {
                name: 'whatsapp_api_unavailable',
                condition: (metrics) => {
                    const errors = metrics.getMetric('integration_errors_total', { service: 'whatsapp' }) || 0;
                    const total = metrics.getMetric('integration_operations_total', { service: 'whatsapp' }) || 1;
                    const failureRate = (errors / total) * 100;
                    return failureRate > 50 && total > 10; // >50% failure rate with >10 attempts
                },
                severity: 'critical',
                message: 'WhatsApp API unavailable (>50% failure rate)',
                threshold: 50
            },
            {
                name: 'high_memory_usage',
                condition: (metrics) => {
                    const heapUsed = metrics.getMetric('memory_heap_used_bytes', {}) || 0;
                    const heapTotal = metrics.getMetric('memory_heap_total_bytes', {}) || 1;
                    const usage = (heapUsed / heapTotal) * 100;
                    return usage > 90; // >90%
                },
                severity: 'warning',
                message: 'Memory usage exceeds 90%',
                threshold: 90
            },
            {
                name: 'voice_command_timeout_rate',
                condition: (metrics) => {
                    const timeouts = metrics.getMetric('voice_commands_timeout_total', {}) || 0;
                    const total = metrics.getMetric('voice_commands_total', {}) || 1;
                    const timeoutRate = (timeouts / total) * 100;
                    return timeoutRate > 5; // >5% timeout rate
                },
                severity: 'warning',
                message: 'Voice command timeout rate exceeds 5%',
                threshold: 5
            }
        ];
    }

    /**
     * Evaluates all alert rules
     * @returns {Promise<Array>} Active alerts
     */
    async evaluateRules() {
        if (!this.metricsCollector) {
            return [];
        }

        const activeAlerts = [];

        for (const rule of this.rules) {
            try {
                const triggered = rule.condition(this.metricsCollector);
                
                if (triggered) {
                    const alert = {
                        name: rule.name,
                        severity: rule.severity,
                        message: rule.message,
                        threshold: rule.threshold,
                        timestamp: new Date().toISOString(),
                        resolved: false
                    };

                    // Check if this alert was already fired (avoid spam)
                    const lastAlert = this.alertHistory.get(rule.name);
                    const shouldNotify = !lastAlert || 
                        (Date.now() - new Date(lastAlert.timestamp).getTime()) > 300000; // 5 min cooldown

                    if (shouldNotify) {
                        activeAlerts.push(alert);
                        this.alertHistory.set(rule.name, alert);
                        
                        // Send notification
                        await this.sendAlert(alert);
                    }
                } else {
                    // Alert resolved
                    const lastAlert = this.alertHistory.get(rule.name);
                    if (lastAlert && !lastAlert.resolved) {
                        await this.resolveAlert(rule.name);
                    }
                }
            } catch (error) {
                console.error(`[AlertingRules] Error evaluating rule ${rule.name}:`, error);
            }
        }

        return activeAlerts;
    }

    /**
     * Sends alert notification
     * @private
     */
    async sendAlert(alert) {
        console.log(`[AlertingRules] ALERT [${alert.severity.toUpperCase()}]: ${alert.message}`);

        if (this.notificationEngine) {
            try {
                await this.notificationEngine.sendNotification('admin', {
                    type: 'alert',
                    title: `Alert: ${alert.name}`,
                    body: alert.message,
                    priority: alert.severity === 'critical' ? 'critical' : 'high',
                    data: alert
                });
            } catch (error) {
                console.error('[AlertingRules] Error sending alert notification:', error);
            }
        }

        // Also log to console/file
        this.logAlert(alert);
    }

    /**
     * Resolves an alert
     * @private
     */
    async resolveAlert(alertName) {
        const alert = this.alertHistory.get(alertName);
        if (alert) {
            alert.resolved = true;
            alert.resolvedAt = new Date().toISOString();
            this.alertHistory.set(alertName, alert);

            console.log(`[AlertingRules] Alert resolved: ${alertName}`);

            if (this.notificationEngine) {
                await this.notificationEngine.sendNotification('admin', {
                    type: 'alert_resolved',
                    title: `Alert Resolved: ${alertName}`,
                    body: `Alert "${alert.message}" has been resolved`,
                    priority: 'medium',
                    data: alert
                });
            }
        }
    }

    /**
     * Logs alert to file/console
     * @private
     */
    logAlert(alert) {
        const logEntry = {
            timestamp: alert.timestamp,
            severity: alert.severity,
            name: alert.name,
            message: alert.message
        };

        // In production, write to log file or send to logging service
        console.error('[ALERT]', JSON.stringify(logEntry));
    }

    /**
     * Gets active alerts
     * @returns {Array} Active alerts
     */
    getActiveAlerts() {
        return Array.from(this.alertHistory.values())
            .filter(alert => !alert.resolved);
    }

    /**
     * Gets alert history
     * @param {number} hours - Hours of history to retrieve
     * @returns {Array} Alert history
     */
    getAlertHistory(hours = 24) {
        const cutoff = Date.now() - (hours * 60 * 60 * 1000);
        
        return Array.from(this.alertHistory.values())
            .filter(alert => new Date(alert.timestamp).getTime() > cutoff)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    /**
     * Adds custom alert rule
     * @param {Object} rule - Alert rule definition
     */
    addRule(rule) {
        this.rules.push(rule);
    }

    /**
     * Removes alert rule
     * @param {string} name - Rule name
     */
    removeRule(name) {
        this.rules = this.rules.filter(r => r.name !== name);
    }

    /**
     * Starts periodic rule evaluation
     * @param {number} intervalMs - Evaluation interval in milliseconds
     */
    startEvaluation(intervalMs = 60000) {
        // Evaluate immediately
        this.evaluateRules();

        // Then evaluate periodically
        setInterval(() => {
            this.evaluateRules();
        }, intervalMs);

        console.log(`[AlertingRules] Started evaluation every ${intervalMs}ms`);
    }

    /**
     * Exports rules in Prometheus Alertmanager format
     * @returns {Object} Prometheus alert rules
     */
    exportPrometheusRules() {
        return {
            groups: [
                {
                    name: 'sofiya_alerts',
                    interval: '1m',
                    rules: this.rules.map(rule => ({
                        alert: rule.name,
                        expr: this.buildPrometheusExpr(rule),
                        for: '5m',
                        labels: {
                            severity: rule.severity
                        },
                        annotations: {
                            summary: rule.message
                        }
                    }))
                }
            ]
        };
    }

    /**
     * Builds Prometheus expression from rule
     * @private
     */
    buildPrometheusExpr(rule) {
        // This would need to be customized based on actual Prometheus metrics
        // For now, return a placeholder
        return `sofiya_${rule.name}_condition > ${rule.threshold}`;
    }
}

// Example usage:
// const alerting = new AlertingRules({
//     metricsCollector: metrics,
//     notificationEngine: notificationEngine
// });
// alerting.startEvaluation(60000); // Evaluate every minute
// const activeAlerts = await alerting.evaluateRules();
