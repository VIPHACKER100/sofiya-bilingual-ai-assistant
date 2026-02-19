/**
 * SOFIYA Database Optimizer
 * Phase 24.2: Database Query Optimization
 * 
 * Provides utilities for query optimization, indexing, pagination,
 * and denormalization strategies.
 */

import 'dotenv/config';
import { createClient } from 'pg';

export class DatabaseOptimizer {
    constructor(options = {}) {
        this.db = options.db || null;
        this.defaultPageSize = options.defaultPageSize || 100;
        this.maxPageSize = options.maxPageSize || 1000;
    }

    /**
     * Creates recommended indexes for common queries
     * @returns {Promise<Array>} Created indexes
     */
    async createIndexes() {
        if (!this.db) {
            throw new Error('Database connection not provided');
        }

        const indexes = [
            // Users table
            {
                name: 'idx_users_email',
                table: 'users',
                columns: ['email'],
                unique: true
            },
            {
                name: 'idx_users_created_at',
                table: 'users',
                columns: ['created_at']
            },

            // Voice commands table (most queried)
            {
                name: 'idx_voice_commands_user_timestamp',
                table: 'voice_commands',
                columns: ['user_id', 'timestamp']
            },
            {
                name: 'idx_voice_commands_action_type',
                table: 'voice_commands',
                columns: ['action_type']
            },
            {
                name: 'idx_voice_commands_user_action',
                table: 'voice_commands',
                columns: ['user_id', 'action_type']
            },

            // Contacts table
            {
                name: 'idx_contacts_user_name',
                table: 'contacts',
                columns: ['user_id', 'name']
            },
            {
                name: 'idx_contacts_user_phone',
                table: 'contacts',
                columns: ['user_id', 'phone']
            },

            // Reminders table
            {
                name: 'idx_reminders_user_due_time',
                table: 'reminders',
                columns: ['user_id', 'due_time']
            },
            {
                name: 'idx_reminders_status',
                table: 'reminders',
                columns: ['status']
            },

            // Calendar events
            {
                name: 'idx_calendar_events_user_time',
                table: 'calendar_events',
                columns: ['user_id', 'start_time', 'end_time']
            },

            // Health data
            {
                name: 'idx_health_data_user_metric_date',
                table: 'health_data',
                columns: ['user_id', 'metric_type', 'recorded_at']
            },

            // User preferences (for recommendations)
            {
                name: 'idx_user_preferences_user_category',
                table: 'user_preferences',
                columns: ['user_id', 'category']
            },
            {
                name: 'idx_user_preferences_item',
                table: 'user_preferences',
                columns: ['item_id', 'item_type']
            }
        ];

        const created = [];
        const skipped = [];

        for (const index of indexes) {
            try {
                const uniqueClause = index.unique ? 'UNIQUE' : '';
                const columns = index.columns.join(', ');
                
                const query = `
                    CREATE ${uniqueClause} INDEX IF NOT EXISTS ${index.name}
                    ON ${index.table} (${columns})
                `;

                await this.db.query(query);
                created.push(index.name);
            } catch (error) {
                if (error.message.includes('already exists')) {
                    skipped.push(index.name);
                } else {
                    console.error(`[DatabaseOptimizer] Error creating index ${index.name}:`, error);
                }
            }
        }

        return { created, skipped };
    }

    /**
     * Executes paginated query
     * @param {string} query - SQL query (without LIMIT/OFFSET)
     * @param {Array} params - Query parameters
     * @param {Object} options - Pagination options
     * @returns {Promise<Object>} Paginated results
     */
    async paginate(query, params = [], options = {}) {
        const page = Math.max(1, options.page || 1);
        const pageSize = Math.min(
            this.maxPageSize,
            Math.max(1, options.pageSize || this.defaultPageSize)
        );
        const offset = (page - 1) * pageSize;

        // Get total count (remove ORDER BY and SELECT columns for count)
        const countQuery = query
            .replace(/SELECT[\s\S]*?FROM/i, 'SELECT COUNT(*) as total FROM')
            .replace(/ORDER BY[\s\S]*$/i, '');

        let total = 0;
        try {
            const countResult = await this.db.query(countQuery, params);
            total = parseInt(countResult.rows[0]?.total || 0, 10);
        } catch (error) {
            console.error('[DatabaseOptimizer] Error getting count:', error);
        }

        // Get paginated results
        const paginatedQuery = `${query} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        const paginatedParams = [...params, pageSize, offset];

        const result = await this.db.query(paginatedQuery, paginatedParams);

        return {
            data: result.rows,
            pagination: {
                page,
                pageSize,
                total,
                totalPages: Math.ceil(total / pageSize),
                hasNext: page * pageSize < total,
                hasPrevious: page > 1
            }
        };
    }

    /**
     * Creates materialized view for denormalized data
     * @param {string} viewName - View name
     * @param {string} query - View definition query
     * @param {boolean} refresh - Whether to refresh immediately
     */
    async createMaterializedView(viewName, query, refresh = true) {
        const createQuery = `
            CREATE MATERIALIZED VIEW IF NOT EXISTS ${viewName} AS
            ${query}
        `;

        await this.db.query(createQuery);

        if (refresh) {
            await this.refreshMaterializedView(viewName);
        }

        console.log(`[DatabaseOptimizer] Created materialized view: ${viewName}`);
    }

    /**
     * Refreshes materialized view
     * @param {string} viewName - View name
     */
    async refreshMaterializedView(viewName) {
        const query = `REFRESH MATERIALIZED VIEW ${viewName}`;
        await this.db.query(query);
        console.log(`[DatabaseOptimizer] Refreshed materialized view: ${viewName}`);
    }

    /**
     * Creates denormalized user activity summary
     * Useful for quick dashboard queries
     */
    async createUserActivitySummary() {
        const query = `
            SELECT 
                user_id,
                COUNT(*) as total_commands,
                COUNT(DISTINCT DATE(timestamp)) as active_days,
                MAX(timestamp) as last_activity,
                COUNT(DISTINCT action_type) as unique_actions,
                AVG(CASE WHEN action_type = 'send_message' THEN 1 ELSE 0 END) as message_ratio
            FROM voice_commands
            WHERE timestamp > NOW() - INTERVAL '30 days'
            GROUP BY user_id
        `;

        await this.createMaterializedView('user_activity_summary', query);
    }

    /**
     * Analyzes slow queries
     * @param {number} thresholdMs - Minimum query time to report (default: 100ms)
     * @returns {Promise<Array>} Slow queries
     */
    async analyzeSlowQueries(thresholdMs = 100) {
        // Enable query logging if not already enabled
        await this.db.query(`
            SET log_min_duration_statement = ${thresholdMs};
        `);

        // Query pg_stat_statements for slow queries
        const query = `
            SELECT 
                query,
                calls,
                total_exec_time,
                mean_exec_time,
                max_exec_time,
                stddev_exec_time
            FROM pg_stat_statements
            WHERE mean_exec_time > $1
            ORDER BY mean_exec_time DESC
            LIMIT 20
        `;

        try {
            const result = await this.db.query(query, [thresholdMs]);
            return result.rows.map(row => ({
                query: row.query.substring(0, 200), // Truncate for readability
                calls: parseInt(row.calls, 10),
                avgTime: parseFloat(row.mean_exec_time),
                maxTime: parseFloat(row.max_exec_time),
                totalTime: parseFloat(row.total_exec_time)
            }));
        } catch (error) {
            // pg_stat_statements might not be enabled
            console.warn('[DatabaseOptimizer] pg_stat_statements not available:', error.message);
            return [];
        }
    }

    /**
     * Optimizes table by running VACUUM and ANALYZE
     * @param {string} tableName - Table name (optional, all tables if not provided)
     */
    async optimizeTable(tableName = null) {
        if (tableName) {
            await this.db.query(`VACUUM ANALYZE ${tableName}`);
            console.log(`[DatabaseOptimizer] Optimized table: ${tableName}`);
        } else {
            await this.db.query('VACUUM ANALYZE');
            console.log('[DatabaseOptimizer] Optimized all tables');
        }
    }

    /**
     * Archives old data to separate table
     * @param {string} sourceTable - Source table name
     * @param {string} archiveTable - Archive table name
     * @param {string} dateColumn - Date column name
     * @param {number} daysOld - Archive data older than N days
     */
    async archiveOldData(sourceTable, archiveTable, dateColumn, daysOld = 365) {
        // Create archive table if not exists (copy structure)
        const createArchiveQuery = `
            CREATE TABLE IF NOT EXISTS ${archiveTable} 
            (LIKE ${sourceTable} INCLUDING ALL)
        `;
        await this.db.query(createArchiveQuery);

        // Move old data
        const archiveQuery = `
            INSERT INTO ${archiveTable}
            SELECT * FROM ${sourceTable}
            WHERE ${dateColumn} < NOW() - INTERVAL '${daysOld} days'
        `;

        const result = await this.db.query(archiveQuery);
        const archived = result.rowCount || 0;

        // Delete archived data from source
        const deleteQuery = `
            DELETE FROM ${sourceTable}
            WHERE ${dateColumn} < NOW() - INTERVAL '${daysOld} days'
        `;

        await this.db.query(deleteQuery);

        console.log(`[DatabaseOptimizer] Archived ${archived} rows from ${sourceTable} to ${archiveTable}`);
        return archived;
    }

    /**
     * Gets table statistics
     * @param {string} tableName - Table name
     * @returns {Promise<Object>} Table statistics
     */
    async getTableStats(tableName) {
        const query = `
            SELECT 
                schemaname,
                tablename,
                attname,
                n_distinct,
                correlation,
                most_common_vals
            FROM pg_stats
            WHERE tablename = $1
        `;

        const result = await this.db.query(query, [tableName]);
        
        return {
            tableName,
            columns: result.rows,
            rowCount: await this.getRowCount(tableName)
        };
    }

    /**
     * Gets row count for table
     * @private
     */
    async getRowCount(tableName) {
        const result = await this.db.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        return parseInt(result.rows[0].count, 10);
    }

    /**
     * Explains query execution plan
     * @param {string} query - SQL query
     * @param {Array} params - Query parameters
     * @returns {Promise<Object>} Execution plan
     */
    async explainQuery(query, params = []) {
        const explainQuery = `EXPLAIN ANALYZE ${query}`;
        const result = await this.db.query(explainQuery, params);
        
        return {
            plan: result.rows.map(row => row['QUERY PLAN']).join('\n'),
            query
        };
    }
}

// Example usage:
// const optimizer = new DatabaseOptimizer({ db: dbConnection });
// await optimizer.createIndexes();
// const paginated = await optimizer.paginate('SELECT * FROM voice_commands WHERE user_id = $1', ['user123'], { page: 1, pageSize: 50 });
// const slowQueries = await optimizer.analyzeSlowQueries(100);
