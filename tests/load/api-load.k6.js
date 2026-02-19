/**
 * Phase 13.4: k6 load test for SOFIYA API
 * Run with: k6 run tests/load/api-load.k6.js
 * Install k6: https://k6.io/docs/getting-started/installation/
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = __ENV.API_URL || 'http://localhost:3001';

export const options = {
  stages: [
    { duration: '10s', target: 5 },
    { duration: '30s', target: 10 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const healthRes = http.get(`${BASE}/health`);
  check(healthRes, { 'health status 200': (r) => r.status === 200 });

  const apiRes = http.get(`${BASE}/api/dashboard/summary`);
  check(apiRes, { 'api status 200': (r) => r.status === 200 });

  sleep(0.5);
}
