/**
 * SOFIYA Identity Routes
 * Phase 22.1: Multi-profile switching
 */

import express from 'express';
import { getIdentityManager } from '../identity-service.js';
import { authMiddleware, generateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/identity/current
 * Gets active profile
 */
router.get('/current', async (req, res) => {
    const manager = getIdentityManager();
    const activeUserId = manager.getActiveUser();

    if (!activeUserId) {
        return res.json({ status: 'anonymous' });
    }

    res.json({
        status: 'authenticated',
        userId: activeUserId
    });
});

/**
 * POST /api/identity/switch
 * Manually switch profile
 */
router.post('/switch', async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
        return res.status(400).json({ error: 'userId required' });
    }

    const manager = getIdentityManager();
    const result = await manager.switchProfile(userId);

    // Generate token for the new profile
    const token = generateToken(userId);

    res.json({
        ...result,
        token
    });
});

/**
 * POST /api/identity/recognize-face
 * Trigger facial recognition from image
 */
router.post('/recognize-face', async (req, res) => {
    const { image } = req.body; // Base64 or URL
    if (!image) {
        return res.status(400).json({ error: 'image required' });
    }

    const manager = getIdentityManager();
    // In production, decode base64 buffer
    const buffer = Buffer.from(image, 'base64');
    const userId = await manager.identifyFromFace(buffer);

    if (userId) {
        const result = await manager.switchProfile(userId);
        const token = generateToken(userId);
        return res.json({
            recognized: true,
            userId,
            token,
            ...result
        });
    }

    res.json({ recognized: false });
});

export default router;
