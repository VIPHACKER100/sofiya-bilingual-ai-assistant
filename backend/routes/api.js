/**
 * SOFIYA Core REST API
 * Phase 12.2: Command execute, reminders, calendar, messages, scenes, health
 */

import express from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { getAnalyticsService } from '../analytics-service.js';
import { logUserAction } from '../logger.js';

const router = express.Router();

// Optional auth for most routes - attach user if token present
router.use(authMiddleware({ required: false }));

// POST /api/commands/execute
router.post('/commands/execute', async (req, res) => {
  try {
    const { command, context } = req.body;
    const userId = req.user?.id || 'anonymous';
    const intent = context?.intent || 'unknown';

    getAnalyticsService().trackVoiceCommand(userId, intent, true).catch(() => {});
    logUserAction(userId, 'voice_command', { intent, command: command?.substring(0, 80) });

    // In production, call command-router
    res.json({
      status: 'success',
      command,
      userId,
      response: `Command "${command}" processed (placeholder)`
    });
  } catch (error) {
    getAnalyticsService().trackVoiceCommand(req.user?.id || 'anonymous', 'unknown', false).catch(() => {});
    res.status(500).json({ error: error.message });
  }
});

// POST /api/reminders/create
router.post('/reminders/create', async (req, res) => {
  try {
    const { title, dueTime, description } = req.body;
    const userId = req.user?.id || 'anonymous';

    getAnalyticsService().trackFeatureUsed(userId, 'reminders').catch(() => {});

    res.json({
      status: 'success',
      reminder: { id: `rem_${Date.now()}`, title, dueTime, description, userId }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/calendar/events
router.get('/calendar/events', async (req, res) => {
  try {
    const { start, end } = req.query;

    res.json({
      status: 'success',
      events: []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/messages/send-whatsapp
router.post('/messages/send-whatsapp', async (req, res) => {
  try {
    const { to, message } = req.body;
    const userId = req.user?.id || 'anonymous';

    getAnalyticsService().trackWhatsAppMessage(userId).catch(() => {});

    res.json({
      status: 'success',
      message: 'Message sent (placeholder)'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/scenes/execute
router.post('/scenes/execute', async (req, res) => {
  try {
    const { sceneId } = req.body;
    const userId = req.user?.id || 'anonymous';

    getAnalyticsService().trackSceneExecuted(userId, sceneId || 'unknown').catch(() => {});

    res.json({
      status: 'success',
      sceneId,
      executed: true
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/health/summary
router.get('/health/summary', async (req, res) => {
  try {
    const userId = req.user?.id || 'anonymous';

    res.json({
      status: 'success',
      summary: { steps: 0, sleep: null, heartRate: null }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/dashboard/summary
router.get('/dashboard/summary', async (req, res) => {
  try {
    const userId = req.user?.id || 'anonymous';

    res.json({
      schedule: [],
      reminders: [],
      health: null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/integrations/connect
router.post('/integrations/connect', authMiddleware({ required: true }), async (req, res) => {
  try {
    const { provider, code } = req.body;

    res.json({
      status: 'success',
      provider,
      connected: true
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
