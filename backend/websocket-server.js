/**
 * SOFIYA WebSocket Server
 * Phase 12.4: Real-time voice streaming, device status, notifications
 */

import { WebSocketServer } from 'ws';

export function createWebSocketServer(httpServer) {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  const clients = new Map();

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const userId = url.searchParams.get('userId') || 'anonymous';

    if (!clients.has(userId)) {
      clients.set(userId, new Set());
    }
    clients.get(userId).add(ws);
    ws.userId = userId;

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());

        switch (msg.type) {
          case 'voice_chunk':
            broadcastToUser(userId, { type: 'voice_processed', ...msg });
            break;

          case 'ping':
            ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
            break;

          default:
            broadcastToUser(userId, { type: 'echo', ...msg });
        }
      } catch (error) {
        ws.send(JSON.stringify({ type: 'error', error: error.message }));
      }
    });

    ws.on('close', () => {
      const set = clients.get(userId);
      if (set) {
        set.delete(ws);
        if (set.size === 0) clients.delete(userId);
      }
    });
  });

  function broadcastToUser(userId, payload) {
    const set = clients.get(userId);
    if (set) {
      const msg = JSON.stringify(payload);
      set.forEach(client => {
        if (client.readyState === 1) client.send(msg);
      });
    }
  }

  function broadcastAll(payload) {
    const msg = JSON.stringify(payload);
    clients.forEach(set => {
      set.forEach(client => {
        if (client.readyState === 1) client.send(msg);
      });
    });
  }

  return {
    wss,
    broadcastToUser,
    broadcastAll
  };
}
