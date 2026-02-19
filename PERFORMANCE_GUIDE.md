# SOFIYA Performance Optimization Guide

## 🎯 Performance Targets

- **API Response Time**: <200ms (p95)
- **Voice Command Latency**: <1 second (p95)
- **Database Query Time**: <100ms (p95)
- **Cache Hit Rate**: >80%
- **Concurrent Users**: 10,000+ per server
- **Throughput**: 1,000+ requests/second per server

---

## 📊 Implemented Optimizations

### 1. Caching Strategy (`backend/cache-strategy.js`)

**Usage:**
```javascript
import { CacheStrategy } from './cache-strategy.js';

const cache = new CacheStrategy();
await cache.initialize();

// Get or fetch pattern
const weather = await cache.getOrFetch(
    'nyc',
    () => fetchWeather('NYC'),
    'weather'
);

// Manual cache management
await cache.set('user123', userData, 'userPreferences');
const user = await cache.get('user123', 'userPreferences');
await cache.invalidate('user123', 'userPreferences');
```

**Cache TTLs:**
- Weather: 15 minutes
- News: 1 hour
- Calendar: 30 minutes
- User Preferences: 24 hours (invalidate on change)
- Smart Home Status: 5 minutes
- Recommendations: 24 hours
- NLP Results: 1 hour

**Monitoring:**
```javascript
const stats = cache.getStats();
console.log(`Hit Rate: ${stats.hitRate}`);
```

---

### 2. Database Optimization (`backend/database-optimizer.js`)

**Create Indexes:**
```javascript
import { DatabaseOptimizer } from './database-optimizer.js';

const optimizer = new DatabaseOptimizer({ db: dbConnection });
const { created, skipped } = await optimizer.createIndexes();
```

**Paginated Queries:**
```javascript
const result = await optimizer.paginate(
    'SELECT * FROM voice_commands WHERE user_id = $1',
    ['user123'],
    { page: 1, pageSize: 50 }
);

// Returns: { data, pagination: { page, totalPages, hasNext, ... } }
```

**Materialized Views:**
```javascript
await optimizer.createMaterializedView(
    'user_activity_summary',
    `SELECT user_id, COUNT(*) as commands FROM voice_commands GROUP BY user_id`
);

// Refresh periodically
await optimizer.refreshMaterializedView('user_activity_summary');
```

**Slow Query Analysis:**
```javascript
const slowQueries = await optimizer.analyzeSlowQueries(100); // >100ms
slowQueries.forEach(q => {
    console.log(`${q.query}: ${q.avgTime}ms (${q.calls} calls)`);
});
```

**Data Archiving:**
```javascript
await optimizer.archiveOldData(
    'voice_commands',
    'voice_commands_archive',
    'timestamp',
    365 // Archive data older than 1 year
);
```

---

### 3. Horizontal Scaling (`backend/scaling-architecture.js`)

**Stateless Sessions:**
```javascript
import { ScalingArchitecture } from './scaling-architecture.js';

const scaling = new ScalingArchitecture({ redis: redisClient });
await scaling.initialize();

// Store session (stateless)
await scaling.setSession('session123', {
    userId: 'user123',
    personality: 'focus'
});

// Retrieve session
const session = await scaling.getSession('session123');
```

**Async Task Queue:**
```javascript
// Enqueue task
const taskId = await scaling.enqueueTask(
    'send_email',
    { to: 'user@example.com', subject: 'Hello' },
    { priority: 8, delay: 0 }
);

// Process tasks (background worker)
await scaling.processTasks(async (taskType, taskData) => {
    if (taskType === 'send_email') {
        await sendEmail(taskData.to, taskData.subject);
    }
});
```

**Distributed Locks:**
```javascript
const lock = await scaling.acquireLock('critical-operation', 10);
if (lock.acquired) {
    try {
        // Critical section
        await performCriticalOperation();
    } finally {
        await lock.release();
    }
}
```

**Server Health:**
```javascript
const health = await scaling.getHealthMetrics();
// Returns: { status, memory, cpu, uptime }
```

---

### 4. Voice Pipeline Optimization (`voice-engine/voice-pipeline-optimizer.js`)

**Optimized Processing:**
```javascript
import { VoicePipelineOptimizer } from './voice-pipeline-optimizer.js';

const optimizer = new VoicePipelineOptimizer({
    voiceEngine: voiceInputEngine,
    nlpProcessor: nlpProcessor,
    timeout: 3000 // 3 second timeout
});

// Preload models for faster first inference
await optimizer.preloadModels();

// Process with optimizations
const result = await optimizer.processVoiceCommand(audioBuffer);
// Returns: { transcript, nlp, emotion, latency, optimized }
```

**Streaming Mode:**
```javascript
optimizer.setStreaming(true);
// Processes audio as it arrives, starts NLP before audio completes
```

**Parallel Processing:**
```javascript
optimizer.setParallel(true);
// Decodes audio and transcribes simultaneously
```

---

## 🔧 Configuration

### Redis Configuration
```env
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your-password
```

### Database Configuration
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/sofiya
DATABASE_POOL_SIZE=20
DATABASE_MAX_CONNECTIONS=100
```

### Performance Tuning
```env
CACHE_DEFAULT_TTL=3600
CACHE_ENABLED=true
VOICE_TIMEOUT=5000
VOICE_STREAMING_ENABLED=true
VOICE_PARALLEL_ENABLED=true
```

---

## 📈 Monitoring & Metrics

### Cache Metrics
- Hit rate (target: >80%)
- Memory cache size
- Redis connection status
- Cache operations (hits, misses, sets, deletes)

### Database Metrics
- Query execution time (p50, p95, p99)
- Slow queries (>100ms)
- Connection pool usage
- Index usage statistics

### Voice Pipeline Metrics
- Processing latency (target: <1s p95)
- Timeout rate
- Fallback usage
- Streaming vs batch ratio

### Scaling Metrics
- Active server count
- Task queue depth
- Lock contention
- Server health scores

---

## 🚀 Best Practices

1. **Always use caching** for frequently accessed data
2. **Use pagination** for all list queries (max 1000 results)
3. **Create indexes** on frequently filtered columns
4. **Archive old data** (>1 year) to separate tables
5. **Use materialized views** for complex aggregations
6. **Enable streaming** for voice processing when possible
7. **Preload models** on server startup
8. **Monitor slow queries** weekly and optimize
9. **Use async tasks** for non-critical operations (emails, notifications)
10. **Keep sessions stateless** for horizontal scaling

---

## 🐛 Troubleshooting

### High Latency
1. Check cache hit rate (should be >80%)
2. Analyze slow queries
3. Verify indexes exist
4. Check Redis connection
5. Review voice pipeline timeout settings

### High Memory Usage
1. Reduce cache TTLs
2. Clean up memory cache periodically
3. Archive old data
4. Limit pagination page size

### Database Connection Issues
1. Check connection pool size
2. Monitor active connections
3. Optimize slow queries
4. Consider read replicas for read-heavy workloads

---

## 📚 Further Reading

- `cache-strategy.js` - Full caching implementation
- `database-optimizer.js` - Database optimization utilities
- `scaling-architecture.js` - Horizontal scaling patterns
- `voice-pipeline-optimizer.js` - Voice processing optimization
