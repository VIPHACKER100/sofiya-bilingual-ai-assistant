/**
 * SOFIYA Social & Gift Routes
 * Phase 22.5: Privacy-First Social Features
 */

import express from 'express';
import pkg from 'pg';
const { Pool } = pkg;
import { authMiddleware } from '../middleware/auth.js';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const router = express.Router();

router.use(authMiddleware({ required: true }));

/**
 * GET /api/social/gifts
 * Lists gift ideas (filtered by privacy)
 */
router.get('/gifts', async (req, res) => {
    try {
        const userId = req.user.id;

        const query = `
            SELECT * FROM shared_gifts 
            WHERE NOT ($1 = ANY(hidden_from))
            ORDER BY created_at DESC
        `;
        const result = await pool.query(query, [userId]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/social/gifts
 * Adds a new gift idea with privacy controls
 */
router.post('/gifts', async (req, res) => {
    try {
        const { targetContactId, giftIdea, priceEstimate, url, hiddenFrom } = req.body;
        const userId = req.user.id;

        const query = `
            INSERT INTO shared_gifts (user_id, target_contact_id, gift_idea, price_estimate, url, hidden_from)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        const result = await pool.query(query, [userId, targetContactId, giftIdea, priceEstimate, url, hiddenFrom || []]);
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
