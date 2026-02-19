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
import { createWebSocketServer } from './websocket-server.js';
import { logRequest } from './logger.js';
import { initErrorTracker, captureException } from './error-tracker.js';

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
