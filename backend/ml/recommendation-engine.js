/**
 * SOFIYA Recommendation Engine
 * Phase 17.2: Personalized Suggestions for Users
 * 
 * Generates personalized recommendations using collaborative filtering
 * and content-based filtering approaches.
 */

import 'dotenv/config';
import { createClient } from 'redis';

export class RecommendationEngine {
    constructor(options = {}) {
        this.db = options.db || null;
        this.redis = options.redis || null;
        this.cacheTTL = options.cacheTTL || 86400; // 24 hours
    }

    /**
     * Gets personalized recommendations for a user
     * @param {string} userId - User ID
     * @param {string} category - Recommendation category (news, music, features, etc.)
     * @param {number} limit - Number of recommendations
     * @returns {Promise<Array>} Ranked recommendations with confidence scores
     */
    async getRecommendations(userId, category = 'general', limit = 10) {
        // Check cache first
        const cacheKey = `recommendations:${userId}:${category}`;
        if (this.redis) {
            const cached = await this.redis.get(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }
        }

        // Get recommendations using hybrid approach
        const collaborative = await this.getCollaborativeRecommendations(userId, category, limit);
        const contentBased = await this.getContentBasedRecommendations(userId, category, limit);
        
        // Combine recommendations
        const recommendations = this.combineRecommendations(
            collaborative,
            contentBased,
            limit
        );

        // Cache results
        if (this.redis) {
            await this.redis.setEx(cacheKey, this.cacheTTL, JSON.stringify(recommendations));
        }

        return recommendations;
    }

    /**
     * Collaborative filtering: find similar users, recommend what they liked
     * @private
     */
    async getCollaborativeRecommendations(userId, category, limit) {
        if (!this.db) {
            return [];
        }

        try {
            // Find similar users based on action history
            const similarUsers = await this.findSimilarUsers(userId, category);
            
            if (similarUsers.length === 0) {
                return [];
            }

            // Get items liked by similar users but not yet tried by this user
            const userActions = await this.getUserActions(userId);
            const userActionIds = new Set(userActions.map(a => a.item_id));

            const recommendations = [];
            for (const similarUser of similarUsers.slice(0, 10)) {
                const theirActions = await this.getUserActions(similarUser.user_id);
                
                for (const action of theirActions) {
                    if (!userActionIds.has(action.item_id) && action.rating >= 4) {
                        recommendations.push({
                            item_id: action.item_id,
                            item_type: action.item_type,
                            score: similarUser.similarity * (action.rating / 5),
                            source: 'collaborative',
                            reason: `Users similar to you liked this`
                        });
                    }
                }
            }

            // Sort by score and return top N
            return recommendations
                .sort((a, b) => b.score - a.score)
                .slice(0, limit);
        } catch (error) {
            console.error('[RecommendationEngine] Error in collaborative filtering:', error);
            return [];
        }
    }

    /**
     * Content-based filtering: recommend content similar to past preferences
     * @private
     */
    async getContentBasedRecommendations(userId, category, limit) {
        if (!this.db) {
            return [];
        }

        try {
            // Get user's past preferences
            const userPreferences = await this.getUserPreferences(userId, category);
            
            if (userPreferences.length === 0) {
                return [];
            }

            // Find items similar to preferred items
            const recommendations = [];
            for (const preference of userPreferences.slice(0, 5)) {
                const similarItems = await this.findSimilarItems(
                    preference.item_id,
                    preference.item_type,
                    category
                );

                for (const item of similarItems) {
                    recommendations.push({
                        item_id: item.item_id,
                        item_type: item.item_type,
                        score: preference.rating * item.similarity,
                        source: 'content-based',
                        reason: `Similar to ${preference.item_name || preference.item_id}`
                    });
                }
            }

            // Deduplicate and sort
            const unique = this.deduplicateRecommendations(recommendations);
            return unique
                .sort((a, b) => b.score - a.score)
                .slice(0, limit);
        } catch (error) {
            console.error('[RecommendationEngine] Error in content-based filtering:', error);
            return [];
        }
    }

    /**
     * Finds users similar to the given user
     * @private
     */
    async findSimilarUsers(userId, category) {
        const query = `
            WITH user_actions AS (
                SELECT item_id, rating, item_type
                FROM user_preferences
                WHERE user_id = $1 AND category = $2
            ),
            other_users AS (
                SELECT DISTINCT user_id
                FROM user_preferences
                WHERE user_id != $1 AND category = $2
            )
            SELECT 
                ou.user_id,
                COUNT(DISTINCT ua.item_id) as common_items,
                AVG(ABS(ua.rating - up.rating)) as rating_diff
            FROM other_users ou
            JOIN user_preferences up ON up.user_id = ou.user_id
            JOIN user_actions ua ON ua.item_id = up.item_id AND ua.item_type = up.item_type
            GROUP BY ou.user_id
            HAVING COUNT(DISTINCT ua.item_id) >= 3
            ORDER BY common_items DESC, rating_diff ASC
            LIMIT 20
        `;

        const result = await this.db.query(query, [userId, category]);
        
        // Calculate cosine similarity (simplified)
        return result.rows.map(row => ({
            user_id: row.user_id,
            similarity: Math.max(0, 1 - (row.rating_diff / 5)) // Normalize to 0-1
        }));
    }

    /**
     * Gets user's action history
     * @private
     */
    async getUserActions(userId) {
        const query = `
            SELECT item_id, item_type, rating, category
            FROM user_preferences
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT 100
        `;

        const result = await this.db.query(query, [userId]);
        return result.rows;
    }

    /**
     * Gets user preferences for a category
     * @private
     */
    async getUserPreferences(userId, category) {
        const query = `
            SELECT item_id, item_type, item_name, rating, category
            FROM user_preferences
            WHERE user_id = $1 AND category = $2 AND rating >= 4
            ORDER BY rating DESC, created_at DESC
            LIMIT 20
        `;

        const result = await this.db.query(query, [userId, category]);
        return result.rows;
    }

    /**
     * Finds items similar to a given item
     * @private
     */
    async findSimilarItems(itemId, itemType, category) {
        // In production, use item features/embeddings for similarity
        // For now, use simple tag-based similarity
        const query = `
            SELECT 
                item_id,
                item_type,
                COUNT(DISTINCT tag) as common_tags,
                COUNT(DISTINCT up.user_id) as popularity
            FROM items i
            LEFT JOIN item_tags it ON it.item_id = i.id
            LEFT JOIN user_preferences up ON up.item_id = i.id
            WHERE i.id != $1 
            AND i.type = $2 
            AND i.category = $3
            AND EXISTS (
                SELECT 1 FROM item_tags it2 
                WHERE it2.item_id = $1 
                AND it2.tag = it.tag
            )
            GROUP BY i.id, i.type
            ORDER BY common_tags DESC, popularity DESC
            LIMIT 10
        `;

        const result = await this.db.query(query, [itemId, itemType, category]);
        
        return result.rows.map(row => ({
            item_id: row.item_id,
            item_type: row.item_type,
            similarity: Math.min(1.0, row.common_tags / 5) // Normalize
        }));
    }

    /**
     * Combines recommendations from multiple sources
     * @private
     */
    combineRecommendations(collaborative, contentBased, limit) {
        // Weighted combination (collaborative 60%, content-based 40%)
        const weights = { collaborative: 0.6, contentBased: 0.4 };
        
        const combined = new Map();

        // Add collaborative recommendations
        collaborative.forEach(rec => {
            const key = `${rec.item_id}_${rec.item_type}`;
            combined.set(key, {
                ...rec,
                finalScore: rec.score * weights.collaborative
            });
        });

        // Add content-based recommendations
        contentBased.forEach(rec => {
            const key = `${rec.item_id}_${rec.item_type}`;
            const existing = combined.get(key);
            
            if (existing) {
                existing.finalScore += rec.score * weights.contentBased;
                existing.sources = [existing.source, rec.source];
            } else {
                combined.set(key, {
                    ...rec,
                    finalScore: rec.score * weights.contentBased
                });
            }
        });

        // Convert to array, sort, and return top N
        return Array.from(combined.values())
            .sort((a, b) => b.finalScore - a.finalScore)
            .slice(0, limit)
            .map(rec => ({
                item_id: rec.item_id,
                item_type: rec.item_type,
                confidence: Math.min(1.0, rec.finalScore),
                reason: rec.reason,
                sources: rec.sources || [rec.source]
            }));
    }

    /**
     * Deduplicates recommendations
     * @private
     */
    deduplicateRecommendations(recommendations) {
        const seen = new Map();
        
        recommendations.forEach(rec => {
            const key = `${rec.item_id}_${rec.item_type}`;
            const existing = seen.get(key);
            
            if (!existing || rec.score > existing.score) {
                seen.set(key, rec);
            }
        });

        return Array.from(seen.values());
    }

    /**
     * Records user feedback on recommendations
     * @param {string} userId - User ID
     * @param {string} itemId - Recommended item ID
     * @param {number} rating - Rating (1-5) or -1 for dismiss
     */
    async recordFeedback(userId, itemId, rating) {
        if (!this.db) {
            return;
        }

        try {
            const query = `
                INSERT INTO recommendation_feedback (user_id, item_id, rating, created_at)
                VALUES ($1, $2, $3, NOW())
                ON CONFLICT (user_id, item_id) 
                DO UPDATE SET rating = $3, updated_at = NOW()
            `;

            await this.db.query(query, [userId, itemId, rating]);
            
            // Invalidate cache
            if (this.redis) {
                const keys = await this.redis.keys(`recommendations:${userId}:*`);
                if (keys.length > 0) {
                    await this.redis.del(keys);
                }
            }
        } catch (error) {
            console.error('[RecommendationEngine] Error recording feedback:', error);
        }
    }
}

// Example usage:
// const engine = new RecommendationEngine({ db: dbConnection, redis: redisClient });
// const recommendations = await engine.getRecommendations('user123', 'news', 5);
// await engine.recordFeedback('user123', 'item456', 5);
