/**
 * SOFIYA Backend Server
 * Phase 12: Core REST API + WebSocket
 * Phase 15: Logging, analytics, error tracking
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import http from 'http';

import apiRouter from './routes/api.js';
import privacyRouter from './routes/privacy.js';
import analyticsRouter from './routes/analytics.js';
import feedbackRouter from './routes/feedback.js';
import supportRouter from './routes/support.js';
import webhooksRouter from './routes/webhooks.js';
import identityRouter from './routes/identity.js';
import tasksRouter from './routes/tasks.js';
import householdRouter from './routes/household.js';
import calendarRouter from './routes/calendar.js';
import socialRouter from './routes/social.js';
import { createWebSocketServer } from './websocket-server.js';
import { logRequest } from './logger.js';
import { initErrorTracker, captureException } from './error-tracker.js';
import { getIdentityManager } from './identity-service.js';

const app = express();
const server = http.createServer(app);

// Phase 15: Request timing + structured logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logRequest(req, res, Date.now() - start);
  });
  next();
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// API routes
app.use('/api', apiRouter);
app.use('/api/privacy', privacyRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/support', supportRouter);
app.use('/api/identity', identityRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/household', householdRouter);
app.use('/api/calendar', calendarRouter);
app.use('/api/social', socialRouter);
app.use('/webhooks', webhooksRouter);

// Health
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Phase 15: Global error handler (must be last)
app.use((err, req, res, next) => {
  captureException(err, { path: req.path, method: req.method });
  res.status(500).json({ error: err?.message || 'Internal server error' });
});

// WebSocket
createWebSocketServer(server);

const PORT = process.env.PORT || 3001;

async function start() {
  await initErrorTracker();
  await getIdentityManager().initialize();
  process.on('unhandledRejection', (reason, promise) => {
    captureException(reason instanceof Error ? reason : new Error(String(reason)), { unhandledRejection: true });
  });
  server.listen(PORT, () => {
    console.log(`SOFIYA backend running on http://localhost:${PORT}`);
    console.log(`WebSocket: ws://localhost:${PORT}/ws`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
