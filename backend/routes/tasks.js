/**
 * SOFIYA Task Routes
 * Phase 22.2: Collaborative Workspace
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
 * GET /api/tasks
 * Lists tasks for user (including shared)
 */
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const query = `
            SELECT * FROM tasks 
            WHERE user_id = $1 OR is_shared = true
            ORDER BY created_at DESC
        `;
        const result = await pool.query(query, [userId]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/tasks
 * Creates a new task
 */
router.post('/', async (req, res) => {
    try {
        const { title, description, isShared } = req.body;
        const userId = req.user.id;

        const query = `
            INSERT INTO tasks (user_id, title, description, is_shared)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const result = await pool.query(query, [userId, title, description, isShared || false]);
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * PATCH /api/tasks/:id
 * Updates task status
 */
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { completed } = req.body;

        const query = `
            UPDATE tasks 
            SET completed = $1, updated_at = NOW()
            WHERE id = $2
            RETURNING *
        `;
        const result = await pool.query(query, [completed, id]);
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
