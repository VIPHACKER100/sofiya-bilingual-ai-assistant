/**
 * SOFIYA Feedback & Support API
 * Phase 16.1, 16.4: Feature feedback, ratings, feature requests, support tickets
 */

import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { logUserAction } from '../logger.js';

const router = express.Router();

// Optional auth - attach user if present
router.use(authMiddleware({ required: false }));

// In-memory store when DB not connected (fallback)
const feedbackStore = [];
const supportStore = [];

// POST /api/feedback - Submit feature rating or feedback
router.post('/', async (req, res) => {
  try {
    const { feature, rating, feedback, isFeatureRequest } = req.body;
    const userId = req.user?.id || 'anonymous';

    if (!feature) {
      return res.status(400).json({ error: 'Feature is required' });
    }
    if (!feedback?.trim() && !rating) {
      return res.status(400).json({ error: 'Either rating or feedback text is required' });
    }

    const record = {
      id: `fb_${Date.now()}`,
      userId,
      feature: String(feature).slice(0, 100),
      rating: rating != null ? Math.min(5, Math.max(1, Number(rating))) : null,
      feedback: feedback?.trim() ? String(feedback).slice(0, 2000) : null,
      isFeatureRequest: Boolean(isFeatureRequest),
      createdAt: new Date().toISOString()
    };

    feedbackStore.push(record);
    logUserAction(userId, 'feedback_submitted', { feature, rating: record.rating });

    // TODO: Persist to feature_feedback table when pg available
    res.json({ status: 'success', id: record.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/feedback/rate - Quick 1-5 star rating
router.post('/rate', async (req, res) => {
  try {
    const { feature, rating } = req.body;
    const userId = req.user?.id || 'anonymous';

    if (!feature || rating == null) {
      return res.status(400).json({ error: 'Feature and rating (1-5) are required' });
    }

    const r = Math.min(5, Math.max(1, Number(rating)));
    const record = {
      id: `fb_${Date.now()}`,
      userId,
      feature: String(feature).slice(0, 100),
      rating: r,
      feedback: null,
      isFeatureRequest: false,
      createdAt: new Date().toISOString()
    };

    feedbackStore.push(record);
    logUserAction(userId, 'feature_rated', { feature, rating: r });

    res.json({ status: 'success', id: record.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
