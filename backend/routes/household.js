/**
 * SOFIYA Household Routes
 * Phase 22.3: Shared Intelligence
 */

import express from 'express';
import pkg from 'pg';
const { Pool } = pkg;
import { authMiddleware } from '../middleware/auth.js';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const router = express.Router();

router.use(authMiddleware({ required: false })); // Allow some public household info? Or keep private.

/**
 * GET /api/household/knowledge
 * Shared household information
 */
router.get('/knowledge', async (req, res) => {
    try {
        const query = `
            SELECT item_name, location, room, last_seen 
            FROM item_locations 
            WHERE is_shared = true
            ORDER BY last_seen DESC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/household/knowledge
 * Store shared intelligence
 */
router.post('/knowledge', async (req, res) => {
    try {
        const { itemName, location, room } = req.body;
        const userId = req.user?.id || '00000000-0000-0000-0000-000000000000'; // Default system user

        const query = `
            INSERT INTO item_locations (user_id, item_name, location, room, is_shared, last_seen)
            VALUES ($1, $2, $3, $4, true, NOW())
            ON CONFLICT (user_id, item_name) 
            DO UPDATE SET location = $3, room = $4, last_seen = NOW()
            RETURNING *
        `;
        const result = await pool.query(query, [userId, itemName, location, room]);
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
