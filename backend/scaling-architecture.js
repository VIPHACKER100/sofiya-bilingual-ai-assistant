/**
 * SOFIYA Scaling Architecture
 * Phase 24.3: Horizontal Scaling Design
 * 
 * Provides utilities and patterns for stateless, horizontally scalable architecture.
 * Includes session management, load balancing helpers, and async task queues.
 */

import 'dotenv/config';
import { createClient } from 'redis';

export class ScalingArchitecture {
    constructor(options = {}) {
        this.redis = options.redis || null;
        this.sessionTTL = options.sessionTTL || 86400; // 24 hours
        this.taskQueueName = options.taskQueueName || 'sofiya:tasks';
    }

    /**
     * Initializes scaling infrastructure
     */
    async initialize() {
        if (!this.redis) {
            const { createClient } = await import('redis');
            this.redis = createClient({
                url: process.env.REDIS_URL || 'redis://localhost:6379'
            });
            await this.redis.connect();
        }

        console.log('[ScalingArchitecture] Initialized');
    }

    /**
     * Stores session data in Redis (stateless sessions)
     * @param {string} sessionId - Session ID
     * @param {Object} data - Session data
     * @param {number} ttl - TTL in seconds
     */
    async setSession(sessionId, data, ttl = this.sessionTTL) {
        if (!this.redis) {
            throw new Error('Redis not initialized');
        }

        const key = `session:${sessionId}`;
        await this.redis.setEx(key, ttl, JSON.stringify(data));
    }

    /**
     * Gets session data from Redis
     * @param {string} sessionId - Session ID
     * @returns {Promise<Object|null>} Session data or null
     */
    async getSession(sessionId) {
        if (!this.redis) {
            return null;
        }

        const key = `session:${sessionId}`;
        const data = await this.redis.get(key);
        return data ? JSON.parse(data) : null;
    }

    /**
     * Deletes session
     * @param {string} sessionId - Session ID
     */
    async deleteSession(sessionId) {
        if (!this.redis) {
            return;
        }

        const key = `session:${sessionId}`;
        await this.redis.del(key);
    }

    /**
     * Enqueues async task for background processing
     * @param {string} taskType - Task type identifier
     * @param {Object} taskData - Task data
     * @param {Object} options - Task options (priority, delay, etc.)
     * @returns {Promise<string>} Task ID
     */
    async enqueueTask(taskType, taskData, options = {}) {
        if (!this.redis) {
            throw new Error('Redis not initialized');
        }

        const taskId = `task:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
        const task = {
            id: taskId,
            type: taskType,
            data: taskData,
            priority: options.priority || 5, // 1-10, higher = more priority
            delay: options.delay || 0, // Delay in seconds
            createdAt: new Date().toISOString(),
            retries: 0,
            maxRetries: options.maxRetries || 3
        };

        // Use sorted set for priority queue
        const score = Date.now() + (task.delay * 1000) + (task.priority * 1000000);
        await this.redis.zAdd(this.taskQueueName, {
            score,
            value: JSON.stringify(task)
        });

        console.log(`[ScalingArchitecture] Enqueued task: ${taskType} (${taskId})`);
        return taskId;
    }

    /**
     * Processes tasks from queue
     * @param {Function} taskHandler - Handler function (taskType, taskData) => Promise
     * @param {number} batchSize - Number of tasks to process at once
     */
    async processTasks(taskHandler, batchSize = 10) {
        if (!this.redis) {
            throw new Error('Redis not initialized');
        }

        while (true) {
            try {
                // Get tasks ready to process (score <= now)
                const now = Date.now();
                const tasks = await this.redis.zRangeByScore(
                    this.taskQueueName,
                    0,
                    now,
                    { LIMIT: { offset: 0, count: batchSize } }
                );

                if (tasks.length === 0) {
                    // No tasks, wait a bit
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    continue;
                }

                // Process tasks in parallel
                const promises = tasks.map(async (taskJson) => {
                    const task = JSON.parse(taskJson);
                    
                    try {
                        await taskHandler(task.type, task.data);
                        
                        // Remove from queue on success
                        await this.redis.zRem(this.taskQueueName, taskJson);
                    } catch (error) {
                        console.error(`[ScalingArchitecture] Task ${task.id} failed:`, error);
                        
                        // Retry logic
                        task.retries++;
                        if (task.retries < task.maxRetries) {
                            // Re-queue with exponential backoff
                            const delay = Math.pow(2, task.retries) * 60; // 1min, 2min, 4min
                            const newScore = Date.now() + (delay * 1000) + (task.priority * 1000000);
                            await this.redis.zAdd(this.taskQueueName, {
                                score: newScore,
                                value: JSON.stringify(task)
                            });
                            await this.redis.zRem(this.taskQueueName, taskJson);
                        } else {
                            // Max retries exceeded, move to dead letter queue
                            await this.redis.lPush(`${this.taskQueueName}:dead`, taskJson);
                            await this.redis.zRem(this.taskQueueName, taskJson);
                        }
                    }
                });

                await Promise.all(promises);
            } catch (error) {
                console.error('[ScalingArchitecture] Error processing tasks:', error);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }

    /**
     * Gets server health metrics for load balancer
     * @returns {Promise<Object>} Health metrics
     */
    async getHealthMetrics() {
        const memoryUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();

        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            memory: {
                heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
                heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
                rss: Math.round(memoryUsage.rss / 1024 / 1024) // MB
            },
            cpu: {
                user: cpuUsage.user,
                system: cpuUsage.system
            },
            uptime: process.uptime()
        };
    }

    /**
     * Registers server instance for service discovery
     * @param {string} serverId - Unique server identifier
     * @param {Object} metadata - Server metadata (host, port, capabilities)
     */
    async registerServer(serverId, metadata) {
        if (!this.redis) {
            return;
        }

        const key = `servers:${serverId}`;
        const data = {
            ...metadata,
            registeredAt: new Date().toISOString(),
            lastHeartbeat: new Date().toISOString()
        };

        await this.redis.setEx(key, 60, JSON.stringify(data)); // 60s TTL, refresh with heartbeat
    }

    /**
     * Sends heartbeat to keep server registration alive
     * @param {string} serverId - Server identifier
     */
    async sendHeartbeat(serverId) {
        if (!this.redis) {
            return;
        }

        const key = `servers:${serverId}`;
        const existing = await this.redis.get(key);
        
        if (existing) {
            const data = JSON.parse(existing);
            data.lastHeartbeat = new Date().toISOString();
            await this.redis.setEx(key, 60, JSON.stringify(data));
        }
    }

    /**
     * Gets list of active servers
     * @returns {Promise<Array>} Active server list
     */
    async getActiveServers() {
        if (!this.redis) {
            return [];
        }

        const keys = await this.redis.keys('servers:*');
        const servers = [];

        for (const key of keys) {
            const data = await this.redis.get(key);
            if (data) {
                servers.push(JSON.parse(data));
            }
        }

        return servers;
    }

    /**
     * Distributes load across servers using consistent hashing
     * @param {string} key - Key to hash (e.g., user ID)
     * @param {Array} servers - List of available servers
     * @returns {string} Selected server ID
     */
    hashToServer(key, servers) {
        if (servers.length === 0) {
            return null;
        }

        // Simple hash function
        let hash = 0;
        for (let i = 0; i < key.length; i++) {
            hash = ((hash << 5) - hash) + key.charCodeAt(i);
            hash = hash & hash; // Convert to 32-bit integer
        }

        const index = Math.abs(hash) % servers.length;
        return servers[index].id;
    }

    /**
     * Creates distributed lock for critical sections
     * @param {string} lockKey - Lock key
     * @param {number} ttl - Lock TTL in seconds
     * @returns {Promise<Object>} Lock object with release method
     */
    async acquireLock(lockKey, ttl = 10) {
        if (!this.redis) {
            return { acquired: false, release: () => {} };
        }

        const lockId = `lock:${lockKey}`;
        const lockValue = `${Date.now()}:${Math.random()}`;
        
        const acquired = await this.redis.setNX(lockKey, lockValue);
        
        if (acquired) {
            await this.redis.expire(lockKey, ttl);
            
            return {
                acquired: true,
                release: async () => {
                    const current = await this.redis.get(lockKey);
                    if (current === lockValue) {
                        await this.redis.del(lockKey);
                    }
                }
            };
        }

        return { acquired: false, release: () => {} };
    }

    /**
     * Closes connections
     */
    async close() {
        if (this.redis && this.redis.isOpen) {
            await this.redis.quit();
        }
        console.log('[ScalingArchitecture] Closed');
    }
}

// Example usage:
// const scaling = new ScalingArchitecture({ redis: redisClient });
// await scaling.initialize();
// await scaling.setSession('session123', { userId: 'user123' });
// await scaling.enqueueTask('send_email', { to: 'user@example.com' }, { priority: 8 });
