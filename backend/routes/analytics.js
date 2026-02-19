/**
 * SOFIYA Analytics API
 * Phase 15.3: Analytics summary for dashboard
 */

import express from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { getAnalyticsService } from '../analytics-service.js';

const router = express.Router();

// Require auth for analytics (admin or authenticated user)
router.use(authMiddleware({ required: true }));
router.use(requireRole('admin', 'user'));

// GET /api/analytics/summary
router.get('/summary', async (req, res) => {
  try {
    const days = Math.min(Number(req.query.days) || 7, 90);
    const analytics = getAnalyticsService();
    const summary = await analytics.getSummary(days);

    res.json({
      status: 'success',
      ...summary
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
