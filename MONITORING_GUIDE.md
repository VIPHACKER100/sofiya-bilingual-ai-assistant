# SOFIYA Monitoring & Observability Guide

## 🎯 Overview

SOFIYA includes comprehensive monitoring, alerting, and observability capabilities to ensure production reliability and performance.

---

## 📊 Components

### 1. Metrics Collector (`backend/metrics-collector.js`)

**Purpose:** Collects metrics on every aspect of the system.

**Usage:**
```javascript
import { MetricsCollector } from './metrics-collector.js';

const metrics = new MetricsCollector({ redis: redisClient });
await metrics.initialize();

// Record API request
metrics.recordAPIRequest('/api/commands/execute', 'POST', 200, 150);

// Record voice command
metrics.recordVoiceCommand('send_message', 800, 0.95, true);

// Record integration operation
metrics.recordIntegration('whatsapp', 'send_message', 200, true);

// Record database query
metrics.recordDatabaseQuery('get_user_preferences', 50, true);

// Record cache operation
metrics.recordCacheOperation('hit', 'redis');

// Get histogram statistics
const stats = metrics.getHistogramStats('api_request_duration_ms', {});
// Returns: { count, min, max, avg, p50, p95, p99 }

// Export Prometheus format
const prometheus = metrics.exportPrometheus();
// Use at /metrics endpoint for Prometheus scraping
```

**Tracked Metrics:**
- API requests (count, latency, status codes)
- Voice commands (count, latency, accuracy, confidence)
- Integration operations (success rate, duration)
- Database queries (count, duration, errors)
- Cache operations (hits, misses, sets)
- System resources (memory, CPU, uptime)

---

### 2. Alerting Rules (`backend/alerting-rules.js`)

**Purpose:** Defines alert conditions and sends notifications when thresholds are exceeded.

**Usage:**
```javascript
import { AlertingRules } from './alerting-rules.js';

const alerting = new AlertingRules({
    metricsCollector: metrics,
    notificationEngine: notificationEngine
});

// Start periodic evaluation (every minute)
alerting.startEvaluation(60000);

// Evaluate rules manually
const activeAlerts = await alerting.evaluateRules();

// Get active alerts
const alerts = alerting.getActiveAlerts();

// Get alert history
const history = alerting.getAlertHistory(24); // Last 24 hours
```

**Default Alert Rules:**
- **High API Latency**: p95 > 1000ms
- **High Error Rate**: >1% error rate
- **Low Voice Accuracy**: <85% accuracy
- **High Database Connections**: >80% capacity
- **High Disk Usage**: >80%
- **WhatsApp API Unavailable**: >50% failure rate
- **High Memory Usage**: >90%
- **Voice Command Timeouts**: >5% timeout rate

**Adding Custom Rules:**
```javascript
alerting.addRule({
    name: 'custom_alert',
    condition: (metrics) => {
        const value = metrics.getMetric('custom_metric', {});
        return value > 100;
    },
    severity: 'warning',
    message: 'Custom metric exceeds threshold',
    threshold: 100
});
```

---

### 3. Distributed Tracing (`backend/distributed-tracing.js`)

**Purpose:** Tracks requests across multiple services to identify bottlenecks.

**Usage:**
```javascript
import { DistributedTracing } from './distributed-tracing.js';

const tracing = new DistributedTracing({ serviceName: 'sofiya-backend' });

// Start trace
const traceContext = tracing.startTrace('voice_command');

// Start child span
const span = tracing.startSpan('nlp_processing', traceContext);

// Add tags
tracing.addTags(span, { intent: 'send_message', confidence: 0.95 });

// Add log
tracing.addLog(span, 'Processing NLP result', { result: 'success' });

// End span
tracing.endSpan(span, { success: true });

// End trace
tracing.endSpan(traceContext, { total_duration: 800 });

// Get trace
const trace = tracing.getTrace(traceContext.traceId);

// Export OpenTelemetry format
const otelTrace = tracing.exportOpenTelemetry(traceContext.traceId);

// Get slow traces
const slowTraces = tracing.getSlowTraces(1000); // >1s
```

**HTTP Middleware Integration:**
```javascript
// Express middleware
app.use((req, res, next) => {
    const context = tracing.getContextFromHeaders(req.headers) || 
                   tracing.startTrace(`${req.method} ${req.path}`);
    
    req.traceContext = context;
    
    res.on('finish', () => {
        tracing.endSpan(context, { 
            status: res.statusCode,
            duration: Date.now() - context.startTime 
        });
    });
    
    next();
});
```

---

### 4. SLA & SLO Monitor (`backend/sla-monitor.js`)

**Purpose:** Tracks service reliability commitments and compliance.

**Usage:**
```javascript
import { SLAMonitor } from './sla-monitor.js';

const slaMonitor = new SLAMonitor({ metricsCollector: metrics });

// Record uptime
slaMonitor.recordUptime(true); // Service is up

// Record API request
slaMonitor.recordAPIRequest(150, true);

// Record voice command
slaMonitor.recordVoiceCommand(800, true, false);

// Get compliance status
const compliance = slaMonitor.calculateSLACompliance();
// Returns: { uptime, apiLatency, voiceLatency, errorRate, overall }

// Get dashboard
const dashboard = slaMonitor.getDashboard();
// Returns: { period, compliance, metrics, alerts }

// Export report
const report = slaMonitor.exportReport();
```

**SLA Definitions:**
- **Uptime**: 99.5% per month (max 3.6 hours downtime)
- **API Latency**: p95 < 200ms
- **Voice Latency**: p99 < 1s
- **Error Rate**: <0.1%

**Dashboard Endpoint:**
```javascript
app.get('/api/sla/dashboard', (req, res) => {
    const dashboard = slaMonitor.getDashboard();
    res.json(dashboard);
});
```

---

## 🔧 Integration Examples

### Express Middleware for Metrics

```javascript
import express from 'express';
import { MetricsCollector } from './metrics-collector.js';

const app = express();
const metrics = new MetricsCollector({ redis: redisClient });
await metrics.initialize();

// Metrics middleware
app.use((req, res, next) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        metrics.recordAPIRequest(
            req.path,
            req.method,
            res.statusCode,
            duration
        );
    });
    
    next();
});

// Prometheus metrics endpoint
app.get('/metrics', (req, res) => {
    res.set('Content-Type', 'text/plain');
    res.send(metrics.exportPrometheus());
});
```

### Voice Command Tracing

```javascript
import { DistributedTracing } from './distributed-tracing.js';

const tracing = new DistributedTracing();

async function processVoiceCommand(audioData) {
    const traceContext = tracing.startTrace('voice_command');
    
    try {
        // Voice recognition span
        const voiceSpan = tracing.startSpan('voice_recognition', traceContext);
        const transcript = await recognizeVoice(audioData);
        tracing.endSpan(voiceSpan, { success: true });
        
        // NLP span
        const nlpSpan = tracing.startSpan('nlp_processing', traceContext);
        const nlpResult = await processNLP(transcript);
        tracing.endSpan(nlpSpan, { success: true });
        
        // Routing span
        const routeSpan = tracing.startSpan('command_routing', traceContext);
        const routeResult = await routeCommand(nlpResult);
        tracing.endSpan(routeSpan, { success: true });
        
        tracing.endSpan(traceContext, { success: true });
        return { ...routeResult, traceId: traceContext.traceId };
    } catch (error) {
        tracing.endSpan(traceContext, { success: false, error: error.message });
        throw error;
    }
}
```

---

## 📈 Monitoring Dashboard

### Key Metrics to Track

1. **API Performance**
   - Request rate (requests/second)
   - Latency (p50, p95, p99)
   - Error rate (%)
   - Status code distribution

2. **Voice Processing**
   - Command rate (commands/minute)
   - Recognition accuracy (%)
   - Processing latency (p95, p99)
   - Timeout rate (%)

3. **System Health**
   - CPU usage (%)
   - Memory usage (%)
   - Disk usage (%)
   - Database connections (active/max)

4. **Integrations**
   - WhatsApp success rate (%)
   - Smart home success rate (%)
   - Calendar sync success rate (%)
   - Average operation duration (ms)

5. **SLA Compliance**
   - Uptime percentage
   - API latency compliance
   - Voice latency compliance
   - Error rate compliance

---

## 🚨 Alerting Best Practices

1. **Set Appropriate Thresholds**
   - Start conservative, adjust based on actual performance
   - Use percentiles (p95, p99) for latency alerts
   - Use rates (%) for error rate alerts

2. **Avoid Alert Fatigue**
   - Use cooldown periods (5+ minutes)
   - Group related alerts
   - Escalate only critical alerts

3. **Alert Channels**
   - Critical: PagerDuty, SMS, Phone call
   - Warning: Slack, Email
   - Info: Dashboard only

4. **Alert Response**
   - Document runbooks for each alert
   - Set up on-call rotation
   - Track alert resolution time

---

## 📊 Prometheus Integration

### Scraping Configuration

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'sofiya'
    scrape_interval: 15s
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
```

### Grafana Dashboard

Import Prometheus metrics into Grafana:
1. Add Prometheus data source
2. Create dashboard with panels for:
   - API request rate
   - API latency (p95, p99)
   - Error rate
   - Voice command metrics
   - System resources
   - SLA compliance

---

## 🔍 Troubleshooting

### High Latency
1. Check API latency histogram (p95, p99)
2. Review distributed traces for slow spans
3. Check database query times
4. Verify cache hit rate

### High Error Rate
1. Review error logs
2. Check integration status (WhatsApp, smart home)
3. Review database connection pool
4. Check system resources (memory, CPU)

### SLA Violations
1. Review SLA dashboard for specific violations
2. Check remaining downtime budget
3. Review alert history for patterns
4. Analyze slow traces for bottlenecks

---

## 📚 Further Reading

- `metrics-collector.js` - Full metrics implementation
- `alerting-rules.js` - Alert configuration
- `distributed-tracing.js` - Tracing implementation
- `sla-monitor.js` - SLA tracking
- `PERFORMANCE_GUIDE.md` - Performance optimization
