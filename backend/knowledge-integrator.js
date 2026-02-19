/**
 * SOFIYA Knowledge Integrator
 * Phase 7.2: Knowledge Integration Module
 * 
 * Links related information across different sources.
 * Surfaces related maps, documentaries, Wikipedia articles, and historical context.
 */

import 'dotenv/config';
import { createClient } from 'pg';
import https from 'https';

export class KnowledgeIntegrator {
    constructor(options = {}) {
        this.db = options.db || null;
        this.wikipediaApiBase = 'https://en.wikipedia.org/api/rest_v1';
        this.userReadingHistory = new Map();
    }

    /**
     * Initializes knowledge integrator
     */
    async initialize() {
        if (this.db) {
            await this.loadReadingHistory();
        }
        console.log('[KnowledgeIntegrator] Initialized');
    }

    /**
     * Finds related information for a topic
     * @param {string} topic - Topic or article title
     * @param {Object} options - Options
     * @param {Array} options.types - Types to include (wikipedia, maps, videos, documents)
     * @returns {Promise<Object>} Related information
     */
    async findRelatedInformation(topic, options = {}) {
        const {
            types = ['wikipedia', 'maps', 'videos', 'documents']
        } = options;

        const related = {
            topic,
            wikipedia: null,
            maps: [],
            videos: [],
            documents: [],
            historicalContext: null,
            relatedTopics: []
        };

        // Get Wikipedia article
        if (types.includes('wikipedia')) {
            related.wikipedia = await this.getWikipediaArticle(topic);
        }

        // Get related maps (if location-related)
        if (types.includes('maps')) {
            related.maps = await this.findMaps(topic);
        }

        // Get related videos/documentaries
        if (types.includes('videos')) {
            related.videos = await this.findVideos(topic);
        }

        // Get related documents/articles
        if (types.includes('documents')) {
            related.documents = await this.findDocuments(topic);
        }

        // Get historical context
        related.historicalContext = await this.getHistoricalContext(topic);

        // Get related topics
        if (related.wikipedia) {
            related.relatedTopics = await this.getRelatedTopics(topic);
        }

        return related;
    }

    /**
     * Gets Wikipedia article
     * @param {string} topic - Topic
     * @returns {Promise<Object|null>} Wikipedia article
     */
    async getWikipediaArticle(topic) {
        return new Promise((resolve) => {
            const searchUrl = `${this.wikipediaApiBase}/page/summary/${encodeURIComponent(topic)}`;

            https.get(searchUrl, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        if (res.statusCode === 200) {
                            const article = JSON.parse(data);
                            resolve({
                                title: article.title,
                                extract: article.extract,
                                url: article.content_urls?.desktop?.page || '',
                                thumbnail: article.thumbnail?.source || null,
                                coordinates: article.coordinates || null
                            });
                        } else {
                            resolve(null);
                        }
                    } catch (error) {
                        resolve(null);
                    }
                });
            }).on('error', () => resolve(null));
        });
    }

    /**
     * Finds maps related to topic
     * @private
     */
    async findMaps(topic) {
        // In production, use Google Maps API or similar
        // For now, check if topic contains location keywords
        const locationKeywords = ['city', 'country', 'place', 'location', 'map'];
        const hasLocation = locationKeywords.some(keyword => 
            topic.toLowerCase().includes(keyword)
        );

        if (hasLocation) {
            return [{
                type: 'map',
                title: `Map of ${topic}`,
                url: `https://www.google.com/maps/search/${encodeURIComponent(topic)}`,
                description: `Interactive map showing ${topic}`
            }];
        }

        return [];
    }

    /**
     * Finds videos/documentaries related to topic
     * @private
     */
    async findVideos(topic) {
        // In production, use YouTube API or similar
        // For now, return placeholder structure
        return [
            {
                type: 'documentary',
                title: `Documentary: ${topic}`,
                source: 'YouTube',
                url: `https://www.youtube.com/results?search_query=${encodeURIComponent(topic + ' documentary')}`,
                description: `Documentaries about ${topic}`
            },
            {
                type: 'video',
                title: `Educational Video: ${topic}`,
                source: 'YouTube',
                url: `https://www.youtube.com/results?search_query=${encodeURIComponent(topic)}`,
                description: `Educational videos about ${topic}`
            }
        ];
    }

    /**
     * Finds related documents/articles
     * @private
     */
    async findDocuments(topic) {
        // In production, use semantic search or knowledge graph
        // For now, return placeholder
        return [
            {
                type: 'article',
                title: `Related Article: ${topic}`,
                source: 'Academic',
                url: `https://scholar.google.com/scholar?q=${encodeURIComponent(topic)}`,
                description: `Academic articles about ${topic}`
            }
        ];
    }

    /**
     * Gets historical context for topic
     * @private
     */
    async getHistoricalContext(topic) {
        // In production, use historical data APIs or knowledge graphs
        // For now, return placeholder
        return {
            timeline: [],
            events: [],
            significance: `Historical context for ${topic} would be displayed here`
        };
    }

    /**
     * Gets related topics
     * @private
     */
    async getRelatedTopics(topic) {
        // In production, use Wikipedia links or knowledge graph
        // For now, return placeholder
        return [
            `${topic} history`,
            `${topic} overview`,
            `About ${topic}`
        ];
    }

    /**
     * Logs user reading activity
     * @param {string} userId - User ID
     * @param {string} topic - Topic/article read
     * @param {string} source - Source (news, wikipedia, etc.)
     */
    async logReadingActivity(userId, topic, source) {
        if (!this.db) {
            return;
        }

        try {
            const query = `
                INSERT INTO reading_history (user_id, topic, source, read_at)
                VALUES ($1, $2, $3, NOW())
            `;

            await this.db.query(query, [userId, topic, source]);

            // Update in-memory cache
            if (!this.userReadingHistory.has(userId)) {
                this.userReadingHistory.set(userId, []);
            }
            this.userReadingHistory.get(userId).push({ topic, source, readAt: new Date() });
        } catch (error) {
            console.error('[KnowledgeIntegrator] Error logging activity:', error);
        }
    }

    /**
     * Surfaces related information when user reads article
     * @param {string} userId - User ID
     * @param {string} topic - Topic/article title
     * @param {string} source - Source
     * @returns {Promise<Object>} Related information
     */
    async surfaceRelatedInfo(userId, topic, source) {
        // Log reading activity
        await this.logReadingActivity(userId, topic, source);

        // Find related information
        const related = await this.findRelatedInformation(topic);

        // Get user's reading history for context
        const history = await this.getUserReadingHistory(userId);
        
        // Find connections to previously read topics
        const connections = this.findTopicConnections(topic, history);

        return {
            ...related,
            connections,
            suggestions: this.generateSuggestions(related, history)
        };
    }

    /**
     * Gets user reading history
     * @private
     */
    async getUserReadingHistory(userId) {
        if (this.userReadingHistory.has(userId)) {
            return this.userReadingHistory.get(userId);
        }

        if (!this.db) {
            return [];
        }

        try {
            const query = `
                SELECT topic, source, read_at
                FROM reading_history
                WHERE user_id = $1
                ORDER BY read_at DESC
                LIMIT 50
            `;

            const result = await this.db.query(query, [userId]);
            const history = result.rows.map(row => ({
                topic: row.topic,
                source: row.source,
                readAt: row.read_at
            }));

            this.userReadingHistory.set(userId, history);
            return history;
        } catch (error) {
            console.error('[KnowledgeIntegrator] Error getting history:', error);
            return [];
        }
    }

    /**
     * Finds connections between topics
     * @private
     */
    findTopicConnections(currentTopic, history) {
        const connections = [];

        history.forEach(entry => {
            // Simple keyword matching (in production, use semantic similarity)
            const currentWords = currentTopic.toLowerCase().split(/\s+/);
            const historyWords = entry.topic.toLowerCase().split(/\s+/);
            
            const commonWords = currentWords.filter(word => 
                historyWords.includes(word) && word.length > 3
            );

            if (commonWords.length > 0) {
                connections.push({
                    relatedTopic: entry.topic,
                    source: entry.source,
                    readAt: entry.readAt,
                    connection: `Both topics mention: ${commonWords.join(', ')}`
                });
            }
        });

        return connections.slice(0, 5); // Top 5 connections
    }

    /**
     * Generates suggestions based on related info and history
     * @private
     */
    generateSuggestions(related, history) {
        const suggestions = [];

        if (related.wikipedia) {
            suggestions.push({
                type: 'wikipedia',
                title: `Read more about ${related.topic}`,
                url: related.wikipedia.url,
                description: 'Get comprehensive information from Wikipedia'
            });
        }

        if (related.maps.length > 0) {
            suggestions.push({
                type: 'map',
                title: `View map of ${related.topic}`,
                url: related.maps[0].url,
                description: 'See location on interactive map'
            });
        }

        if (related.videos.length > 0) {
            suggestions.push({
                type: 'video',
                title: `Watch documentary about ${related.topic}`,
                url: related.videos[0].url,
                description: 'Learn more through video content'
            });
        }

        return suggestions;
    }

    /**
     * Loads reading history from database
     * @private
     */
    async loadReadingHistory() {
        if (!this.db) {
            return;
        }

        try {
            const query = `
                SELECT user_id, topic, source, read_at
                FROM reading_history
                ORDER BY read_at DESC
                LIMIT 1000
            `;

            const result = await this.db.query(query);
            result.rows.forEach(row => {
                if (!this.userReadingHistory.has(row.user_id)) {
                    this.userReadingHistory.set(row.user_id, []);
                }
                this.userReadingHistory.get(row.user_id).push({
                    topic: row.topic,
                    source: row.source,
                    readAt: row.read_at
                });
            });
        } catch (error) {
            console.error('[KnowledgeIntegrator] Error loading history:', error);
        }
    }
}

// Example usage:
// const integrator = new KnowledgeIntegrator({ db });
// await integrator.initialize();
// const related = await integrator.surfaceRelatedInfo('user123', 'Artificial Intelligence', 'news');
// const info = await integrator.findRelatedInformation('Machine Learning', { types: ['wikipedia', 'videos'] });
