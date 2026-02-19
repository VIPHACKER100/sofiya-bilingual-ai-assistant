/**
 * SOFIYA News Service
 * Phase 7.1: News Curation Engine
 * 
 * Personalizes news based on user interests and preferences.
 * Supports filtering by topic, perspective layering, and daily curation.
 */

import 'dotenv/config';
import https from 'https';
import { createClient } from 'pg';

export class NewsService {
    constructor(options = {}) {
        this.db = options.db || null;
        this.apiKey = options.apiKey || process.env.NEWS_API_KEY || process.env.GUARDIAN_API_KEY;
        this.apiBase = options.apiBase || 'https://newsapi.org/v2';
        this.userInterests = new Map();
    }

    /**
     * Initializes news service
     */
    async initialize() {
        if (this.db) {
            await this.loadUserInterests();
        }
        console.log('[NewsService] Initialized');
    }

    /**
     * Sets user interests/preferences
     * @param {string} userId - User ID
     * @param {Array} interests - List of interests (e.g., ['tech', 'sports', 'politics'])
     */
    async setUserInterests(userId, interests) {
        this.userInterests.set(userId, interests);

        if (this.db) {
            try {
                const query = `
                    INSERT INTO user_preferences (user_id, category, value, updated_at)
                    VALUES ($1, 'news_interests', $2, NOW())
                    ON CONFLICT (user_id, category) DO UPDATE
                    SET value = $2, updated_at = NOW()
                `;

                await this.db.query(query, [userId, JSON.stringify(interests)]);
            } catch (error) {
                console.error('[NewsService] Error saving interests:', error);
            }
        }
    }

    /**
     * Gets user interests
     * @private
     */
    async getUserInterests(userId) {
        if (this.userInterests.has(userId)) {
            return this.userInterests.get(userId);
        }

        if (this.db) {
            try {
                const query = `
                    SELECT value FROM user_preferences
                    WHERE user_id = $1 AND category = 'news_interests'
                `;

                const result = await this.db.query(query, [userId]);
                if (result.rows.length > 0) {
                    const interests = JSON.parse(result.rows[0].value || '[]');
                    this.userInterests.set(userId, interests);
                    return interests;
                }
            } catch (error) {
                console.error('[NewsService] Error loading interests:', error);
            }
        }

        return ['general']; // Default
    }

    /**
     * Loads user interests from database
     * @private
     */
    async loadUserInterests() {
        if (!this.db) {
            return;
        }

        try {
            const query = `
                SELECT user_id, value FROM user_preferences
                WHERE category = 'news_interests'
            `;

            const result = await this.db.query(query);
            result.rows.forEach(row => {
                this.userInterests.set(row.user_id, JSON.parse(row.value || '[]'));
            });
        } catch (error) {
            console.error('[NewsService] Error loading interests:', error);
        }
    }

    /**
     * Fetches news articles
     * @param {Object} options - Query options
     * @param {string} options.category - Category (tech, sports, business, etc.)
     * @param {string} options.country - Country code (us, gb, etc.)
     * @param {string} options.language - Language code (en, etc.)
     * @param {number} options.pageSize - Number of articles (default: 20)
     * @param {number} options.page - Page number (default: 1)
     * @returns {Promise<Array>} List of articles
     */
    async fetchNews(options = {}) {
        const {
            category = 'general',
            country = 'us',
            language = 'en',
            pageSize = 20,
            page = 1
        } = options;

        return new Promise((resolve, reject) => {
            const params = new URLSearchParams({
                category,
                country,
                language,
                pageSize: pageSize.toString(),
                page: page.toString(),
                apiKey: this.apiKey
            });

            const url = `${this.apiBase}/top-headlines?${params.toString()}`;

            https.get(url, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        if (response.status === 'ok') {
                            resolve(response.articles.map(article => this.formatArticle(article)));
                        } else {
                            reject(new Error(response.message || 'Failed to fetch news'));
                        }
                    } catch (error) {
                        reject(error);
                    }
                });
            }).on('error', reject);
        });
    }

    /**
     * Gets personalized news for user
     * @param {string} userId - User ID
     * @param {Object} options - Options
     * @returns {Promise<Array>} Personalized articles
     */
    async getPersonalizedNews(userId, options = {}) {
        const interests = await this.getUserInterests(userId);
        const { maxArticles = 20, perspective = null } = options;

        // Fetch news for each interest
        const allArticles = [];
        for (const interest of interests) {
            try {
                const articles = await this.fetchNews({
                    category: this.mapInterestToCategory(interest),
                    pageSize: Math.ceil(maxArticles / interests.length)
                });
                allArticles.push(...articles);
            } catch (error) {
                console.error(`[NewsService] Error fetching ${interest} news:`, error);
            }
        }

        // Remove duplicates and sort by relevance
        const uniqueArticles = this.deduplicateArticles(allArticles);
        const sortedArticles = this.sortByRelevance(uniqueArticles, interests);

        // Apply perspective layering if requested
        if (perspective) {
            return this.applyPerspectiveLayering(sortedArticles.slice(0, maxArticles), perspective);
        }

        return sortedArticles.slice(0, maxArticles);
    }

    /**
     * Maps user interest to news API category
     * @private
     */
    mapInterestToCategory(interest) {
        const mapping = {
            'tech': 'technology',
            'technology': 'technology',
            'sports': 'sports',
            'business': 'business',
            'politics': 'general', // NewsAPI doesn't have politics category
            'health': 'health',
            'science': 'science',
            'entertainment': 'entertainment',
            'general': 'general'
        };

        return mapping[interest.toLowerCase()] || 'general';
    }

    /**
     * Removes duplicate articles
     * @private
     */
    deduplicateArticles(articles) {
        const seen = new Set();
        return articles.filter(article => {
            const key = article.url || article.title;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }

    /**
     * Sorts articles by relevance to user interests
     * @private
     */
    sortByRelevance(articles, interests) {
        return articles.sort((a, b) => {
            const aScore = this.calculateRelevanceScore(a, interests);
            const bScore = this.calculateRelevanceScore(b, interests);
            return bScore - aScore;
        });
    }

    /**
     * Calculates relevance score for article
     * @private
     */
    calculateRelevanceScore(article, interests) {
        let score = 0;
        const text = `${article.title} ${article.description}`.toLowerCase();

        interests.forEach(interest => {
            if (text.includes(interest.toLowerCase())) {
                score += 10;
            }
        });

        // Boost score for recent articles
        if (article.publishedAt) {
            const hoursAgo = (Date.now() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60);
            score += Math.max(0, 10 - hoursAgo);
        }

        return score;
    }

    /**
     * Applies perspective layering to articles
     * @param {Array} articles - Articles
     * @param {string} perspective - Perspective (conservative, liberal, factual)
     * @returns {Array} Articles with perspective context
     */
    applyPerspectiveLayering(articles, perspective) {
        return articles.map(article => ({
            ...article,
            perspective: this.getPerspectiveContext(article, perspective),
            perspectiveNote: this.generatePerspectiveNote(article, perspective)
        }));
    }

    /**
     * Gets perspective context for article
     * @private
     */
    getPerspectiveContext(article, perspective) {
        // In production, use NLP to analyze article sentiment/bias
        // For now, return perspective tag
        return perspective;
    }

    /**
     * Generates perspective note
     * @private
     */
    generatePerspectiveNote(article, perspective) {
        const notes = {
            conservative: 'This article may present a conservative viewpoint. Consider reading alternative perspectives.',
            liberal: 'This article may present a liberal viewpoint. Consider reading alternative perspectives.',
            factual: 'This article focuses on factual reporting. Cross-reference with other sources for comprehensive understanding.'
        };

        return notes[perspective] || '';
    }

    /**
     * Formats article for consistent output
     * @private
     */
    formatArticle(article) {
        return {
            title: article.title || 'Untitled',
            description: article.description || '',
            url: article.url || '',
            imageUrl: article.urlToImage || '',
            source: article.source?.name || 'Unknown',
            publishedAt: article.publishedAt || new Date().toISOString(),
            author: article.author || null,
            content: article.content || null
        };
    }

    /**
     * Searches news by query
     * @param {string} query - Search query
     * @param {Object} options - Search options
     * @returns {Promise<Array>} Search results
     */
    async searchNews(query, options = {}) {
        const { pageSize = 20, sortBy = 'relevancy' } = options;

        return new Promise((resolve, reject) => {
            const params = new URLSearchParams({
                q: query,
                pageSize: pageSize.toString(),
                sortBy,
                apiKey: this.apiKey
            });

            const url = `${this.apiBase}/everything?${params.toString()}`;

            https.get(url, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        if (response.status === 'ok') {
                            resolve(response.articles.map(article => this.formatArticle(article)));
                        } else {
                            reject(new Error(response.message || 'Search failed'));
                        }
                    } catch (error) {
                        reject(error);
                    }
                });
            }).on('error', reject);
        });
    }

    /**
     * Gets daily curated news digest
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Daily digest
     */
    async getDailyDigest(userId) {
        const articles = await this.getPersonalizedNews(userId, { maxArticles: 10 });

        return {
            userId,
            date: new Date().toISOString().split('T')[0],
            articles,
            summary: this.generateDigestSummary(articles),
            topics: this.extractTopics(articles)
        };
    }

    /**
     * Generates digest summary
     * @private
     */
    generateDigestSummary(articles) {
        const topics = this.extractTopics(articles);
        return `Today's news covers ${topics.length} main topics: ${topics.join(', ')}. ${articles.length} articles selected based on your interests.`;
    }

    /**
     * Extracts main topics from articles
     * @private
     */
    extractTopics(articles) {
        const topicCounts = {};

        articles.forEach(article => {
            const words = article.title.toLowerCase().split(/\s+/);
            words.forEach(word => {
                if (word.length > 4) { // Filter short words
                    topicCounts[word] = (topicCounts[word] || 0) + 1;
                }
            });
        });

        return Object.entries(topicCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([topic]) => topic);
    }
}

// Example usage:
// const news = new NewsService({ db, apiKey: process.env.NEWS_API_KEY });
// await news.initialize();
// await news.setUserInterests('user123', ['tech', 'sports', 'business']);
// const articles = await news.getPersonalizedNews('user123', { maxArticles: 10 });
// const digest = await news.getDailyDigest('user123');
