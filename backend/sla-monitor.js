/**
 * SOFIYA SLA & SLO Monitor
 * Phase 27.4: Track Service Reliability Commitments
 * 
 * Monitors SLA/SLO compliance and generates dashboards.
 * Tracks uptime, latency, error rates, and availability.
 */

import 'dotenv/config';
import { MetricsCollector } from './metrics-collector.js';

export class SLAMonitor {
    constructor(options = {}) {
        this.metricsCollector = options.metricsCollector || null;
        
        // SLA/SLO definitions
        this.slas = {
            uptime: {
                target: 99.5, // 99.5% uptime per month (max 3.6 hours downtime)
                measurement: 'percentage',
                window: 'monthly'
            },
            apiLatency: {
                target: 200, // p95 < 200ms
                measurement: 'p95',
                window: 'rolling_24h'
            },
            voiceLatency: {
                target: 1000, // p99 < 1s
                measurement: 'p99',
                window: 'rolling_24h'
            },
            errorRate: {
                target: 0.1, // <0.1% error rate
                measurement: 'percentage',
                window: 'rolling_24h'
            }
        };

        // Current month tracking
        this.monthlyMetrics = {
            startDate: new Date(),
            uptime: {
                totalMinutes: 0,
                downtimeMinutes: 0
            },
            apiRequests: {
                total: 0,
                errors: 0
            },
            voiceCommands: {
                total: 0,
                errors: 0,
                timeouts: 0
            }
        };
    }

    /**
     * Records uptime/downtime
     * @param {boolean} isUp - Whether service is up
     */
    recordUptime(isUp) {
        if (!isUp) {
            this.monthlyMetrics.uptime.downtimeMinutes += 1;
        }
        this.monthlyMetrics.uptime.totalMinutes += 1;
    }

    /**
     * Records API request for SLA tracking
     * @param {number} latency - Request latency in ms
     * @param {boolean} success - Whether request succeeded
     */
    recordAPIRequest(latency, success) {
        this.monthlyMetrics.apiRequests.total++;
        if (!success) {
            this.monthlyMetrics.apiRequests.errors++;
        }

        // Also record in metrics collector
        if (this.metricsCollector) {
            this.metricsCollector.recordAPIRequest('api', 'POST', success ? 200 : 500, latency);
        }
    }

    /**
     * Records voice command for SLA tracking
     * @param {number} latency - Command latency in ms
     * @param {boolean} success - Whether command succeeded
     * @param {boolean} timeout - Whether command timed out
     */
    recordVoiceCommand(latency, success, timeout = false) {
        this.monthlyMetrics.voiceCommands.total++;
        if (!success) {
            this.monthlyMetrics.voiceCommands.errors++;
        }
        if (timeout) {
            this.monthlyMetrics.voiceCommands.timeouts++;
        }
    }

    /**
     * Calculates current SLA compliance
     * @returns {Object} SLA compliance status
     */
    calculateSLACompliance() {
        const compliance = {};

        // Uptime SLA
        const uptimeMinutes = this.monthlyMetrics.uptime.totalMinutes;
        const downtimeMinutes = this.monthlyMetrics.uptime.downtimeMinutes;
        const uptimePercent = uptimeMinutes > 0 
            ? ((uptimeMinutes - downtimeMinutes) / uptimeMinutes) * 100 
            : 100;
        
        compliance.uptime = {
            target: this.slas.uptime.target,
            current: Math.round(uptimePercent * 100) / 100,
            compliant: uptimePercent >= this.slas.uptime.target,
            remainingDowntime: this.calculateRemainingDowntime(uptimePercent)
        };

        // API Latency SLA
        if (this.metricsCollector) {
            const apiStats = this.metricsCollector.getHistogramStats('api_request_duration_ms', {});
            if (apiStats) {
                compliance.apiLatency = {
                    target: this.slas.apiLatency.target,
                    current: Math.round(apiStats.p95),
                    compliant: apiStats.p95 <= this.slas.apiLatency.target,
                    p50: Math.round(apiStats.p50),
                    p99: Math.round(apiStats.p99)
                };
            }
        }

        // Voice Latency SLA
        if (this.metricsCollector) {
            const voiceStats = this.metricsCollector.getHistogramStats('voice_command_latency_ms', {});
            if (voiceStats) {
                compliance.voiceLatency = {
                    target: this.slas.voiceLatency.target,
                    current: Math.round(voiceStats.p99),
                    compliant: voiceStats.p99 <= this.slas.voiceLatency.target,
                    p50: Math.round(voiceStats.p50),
                    p95: Math.round(voiceStats.p95)
                };
            }
        }

        // Error Rate SLA
        const apiTotal = this.monthlyMetrics.apiRequests.total;
        const apiErrors = this.monthlyMetrics.apiRequests.errors;
        const errorRate = apiTotal > 0 ? (apiErrors / apiTotal) * 100 : 0;

        compliance.errorRate = {
            target: this.slas.errorRate.target,
            current: Math.round(errorRate * 1000) / 1000, // Round to 3 decimals
            compliant: errorRate <= this.slas.errorRate.target,
            totalRequests: apiTotal,
            errors: apiErrors
        };

        // Overall compliance
        compliance.overall = {
            compliant: Object.values(compliance)
                .filter(c => typeof c === 'object' && 'compliant' in c)
                .every(c => c.compliant),
            metrics: Object.keys(compliance).length - 1 // Exclude 'overall'
        };

        return compliance;
    }

    /**
     * Calculates remaining downtime budget
     * @private
     */
    calculateRemainingDowntime(uptimePercent) {
        const targetPercent = this.slas.uptime.target;
        const currentMonthMinutes = this.monthlyMetrics.uptime.totalMinutes;
        const maxDowntimeMinutes = currentMonthMinutes * (1 - targetPercent / 100);
        const usedDowntimeMinutes = this.monthlyMetrics.uptime.downtimeMinutes;
        
        return {
            used: usedDowntimeMinutes,
            max: maxDowntimeMinutes,
            remaining: Math.max(0, maxDowntimeMinutes - usedDowntimeMinutes),
            percentUsed: maxDowntimeMinutes > 0 
                ? (usedDowntimeMinutes / maxDowntimeMinutes) * 100 
                : 0
        };
    }

    /**
     * Gets SLA dashboard data
     * @returns {Object} Dashboard data
     */
    getDashboard() {
        const compliance = this.calculateSLACompliance();
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const daysInMonth = Math.floor((now - monthStart) / (1000 * 60 * 60 * 24));

        return {
            period: {
                start: monthStart.toISOString(),
                current: now.toISOString(),
                daysElapsed: daysInMonth,
                daysRemaining: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - daysInMonth
            },
            compliance,
            metrics: {
                uptime: {
                    ...this.monthlyMetrics.uptime,
                    percent: compliance.uptime?.current || 100
                },
                api: {
                    ...this.monthlyMetrics.apiRequests,
                    errorRate: compliance.errorRate?.current || 0
                },
                voice: {
                    ...this.monthlyMetrics.voiceCommands,
                    errorRate: this.monthlyMetrics.voiceCommands.total > 0
                        ? (this.monthlyMetrics.voiceCommands.errors / this.monthlyMetrics.voiceCommands.total) * 100
                        : 0,
                    timeoutRate: this.monthlyMetrics.voiceCommands.total > 0
                        ? (this.monthlyMetrics.voiceCommands.timeouts / this.monthlyMetrics.voiceCommands.total) * 100
                        : 0
                }
            },
            alerts: this.getSLAAlerts(compliance)
        };
    }

    /**
     * Gets SLA alerts (warnings when trending toward violation)
     * @private
     */
    getSLAAlerts(compliance) {
        const alerts = [];

        // Uptime alert
        if (compliance.uptime) {
            const remaining = compliance.uptime.remainingDowntime;
            if (remaining.percentUsed > 80) {
                alerts.push({
                    type: 'warning',
                    metric: 'uptime',
                    message: `Uptime SLA at risk: ${remaining.percentUsed.toFixed(1)}% of downtime budget used`,
                    severity: remaining.percentUsed > 95 ? 'critical' : 'warning'
                });
            }
        }

        // API Latency alert
        if (compliance.apiLatency && !compliance.apiLatency.compliant) {
            alerts.push({
                type: 'violation',
                metric: 'apiLatency',
                message: `API latency p95 (${compliance.apiLatency.current}ms) exceeds SLA (${compliance.apiLatency.target}ms)`,
                severity: 'critical'
            });
        }

        // Voice Latency alert
        if (compliance.voiceLatency && !compliance.voiceLatency.compliant) {
            alerts.push({
                type: 'violation',
                metric: 'voiceLatency',
                message: `Voice latency p99 (${compliance.voiceLatency.current}ms) exceeds SLA (${compliance.voiceLatency.target}ms)`,
                severity: 'critical'
            });
        }

        // Error Rate alert
        if (compliance.errorRate && !compliance.errorRate.compliant) {
            alerts.push({
                type: 'violation',
                metric: 'errorRate',
                message: `Error rate (${compliance.errorRate.current}%) exceeds SLA (${compliance.errorRate.target}%)`,
                severity: 'critical'
            });
        }

        return alerts;
    }

    /**
     * Resets monthly metrics (call at start of each month)
     */
    resetMonthlyMetrics() {
        this.monthlyMetrics = {
            startDate: new Date(),
            uptime: {
                totalMinutes: 0,
                downtimeMinutes: 0
            },
            apiRequests: {
                total: 0,
                errors: 0
            },
            voiceCommands: {
                total: 0,
                errors: 0,
                timeouts: 0
            }
        };
    }

    /**
     * Exports SLA report
     * @returns {Object} SLA report
     */
    exportReport() {
        const compliance = this.calculateSLACompliance();
        const dashboard = this.getDashboard();

        return {
            reportDate: new Date().toISOString(),
            period: dashboard.period,
            slaDefinitions: this.slas,
            compliance,
            metrics: dashboard.metrics,
            alerts: dashboard.alerts,
            summary: {
                overallCompliant: compliance.overall.compliant,
                metricsTracked: compliance.overall.metrics,
                violations: dashboard.alerts.filter(a => a.type === 'violation').length,
                warnings: dashboard.alerts.filter(a => a.type === 'warning').length
            }
        };
    }
}

// Example usage:
// const slaMonitor = new SLAMonitor({ metricsCollector: metrics });
// slaMonitor.recordUptime(true);
// slaMonitor.recordAPIRequest(150, true);
// slaMonitor.recordVoiceCommand(800, true);
// const dashboard = slaMonitor.getDashboard();
// const report = slaMonitor.exportReport();
