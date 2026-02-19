/**
 * SOFIYA Support API
 * Phase 16.4: Report issue, support tickets
 */

import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { logUserAction } from '../logger.js';

const router = express.Router();

router.use(authMiddleware({ required: false }));

const supportStore = [];

// POST /api/support/report-issue
router.post('/report-issue', async (req, res) => {
  try {
    const { subject, description, category } = req.body;
    const userId = req.user?.id || 'anonymous';

    if (!subject?.trim() || !description?.trim()) {
      return res.status(400).json({ error: 'Subject and description are required' });
    }

    const ticket = {
      id: `tkt_${Date.now()}`,
      userId,
      subject: String(subject).slice(0, 255),
      description: String(description).slice(0, 5000),
      category: category || 'general',
      status: 'open',
      createdAt: new Date().toISOString()
    };

    supportStore.push(ticket);
    logUserAction(userId, 'support_ticket_created', { ticketId: ticket.id, category: ticket.category });

    // TODO: Persist to support_tickets, integrate Zendesk/Intercom
    res.json({ status: 'success', ticketId: ticket.id, message: 'Issue reported. We aim to respond within 24 hours.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
