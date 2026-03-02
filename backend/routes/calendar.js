/**
 * SOFIYA Calendar Routes
 * Phase 22.4: Household Coordination
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
 * GET /api/calendar/events
 * Lists calendar events (including shared)
 */
router.get('/events', async (req, res) => {
    try {
        const userId = req.user.id;
        const { start, end } = req.query;

        let query = `
            SELECT * FROM calendar_events 
            WHERE (user_id = $1 OR is_shared = true)
        `;
        const params = [userId];

        if (start && end) {
            query += ` AND start_time >= $2 AND end_time <= $3`;
            params.push(start, end);
        }

        query += ` ORDER BY start_time ASC`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/calendar/events
 * Creates a new event
 */
router.post('/events', async (req, res) => {
    try {
        const { title, description, startTime, start_time, endTime, end_time, location, isShared, is_shared } = req.body;
        const userId = req.user.id;

        const effectiveStartTime = startTime || start_time;
        const effectiveEndTime = endTime || end_time;
        const effectiveIsShared = isShared !== undefined ? isShared : (is_shared !== undefined ? is_shared : false);

        const query = `
                INSERT INTO calendar_events (user_id, title, description, start_time, end_time, location, is_shared)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            `;
        const result = await pool.query(query, [userId, title, description, effectiveStartTime, effectiveEndTime, location, effectiveIsShared]);
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


export default router;
