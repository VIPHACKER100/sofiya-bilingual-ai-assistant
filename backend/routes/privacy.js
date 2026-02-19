/**
 * Privacy API - Settings, export, delete
 */

import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { PrivacyController } from '../privacy-controller.js';

const router = express.Router();
const privacyController = new PrivacyController({ db: null });

router.use(authMiddleware({ required: false }));

// GET /api/privacy/settings
router.get('/settings', async (req, res) => {
  try {
    const userId = req.user?.id || 'anonymous';
    const settings = await privacyController.getPrivacySettings(userId);
    res.json({ settings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/privacy/settings
router.put('/settings', async (req, res) => {
  try {
    const userId = req.user?.id || 'anonymous';
    const updated = await privacyController.updatePrivacySettings(userId, req.body);
    res.json({ settings: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/privacy/export
router.get('/export', async (req, res) => {
  try {
    const userId = req.user?.id || 'anonymous';
    const data = await privacyController.exportUserData(userId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/privacy/delete/:type
router.delete('/delete/:type', async (req, res) => {
  try {
    const userId = req.user?.id || 'anonymous';
    const result = await privacyController.deleteUserData(userId, req.params.type);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
