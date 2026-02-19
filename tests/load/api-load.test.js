/**
 * Phase 13.4: Simple API load test
 * Run with: node tests/load/api-load.test.js
 * For full load testing, use k6: k6 run tests/load/api-load.k6.js
 *
 * This script simulates concurrent requests to key endpoints.
 */

const BASE = process.env.API_URL || 'http://localhost:3001';

async function fetchJson(url, options = {}) {
  const res = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...options.headers } });
  return res.json().catch(() => ({}));
}

async function runConcurrent(concurrency, durationMs, fn) {
  const start = Date.now();
  const results = { ok: 0, err: 0, latencies: [] };
  const workers = Array(concurrency)
    .fill()
    .map(async () => {
      while (Date.now() - start < durationMs) {
        const t0 = Date.now();
        try {
          await fn();
          results.ok++;
        } catch {
          results.err++;
        }
        results.latencies.push(Date.now() - t0);
      }
    });
  await Promise.all(workers);
  return results;
}

async function main() {
  console.log('SOFIYA API Load Test');
  console.log('Target:', BASE);
  console.log('');

  // Health check
  try {
    const health = await fetchJson(`${BASE}/health`);
    console.log('Health:', health.status === 'ok' ? 'OK' : health);
  } catch (e) {
    console.error('Backend not reachable. Start with: cd backend && npm run dev');
    process.exit(1);
  }

  // Light load: 5 concurrent, 5 seconds
  const concurrency = 5;
  const duration = 5000;

  console.log(`Running ${concurrency} concurrent requests for ${duration / 1000}s...`);

  const healthResults = await runConcurrent(concurrency, duration, () =>
    fetch(`${BASE}/health`).then((r) => {
      if (!r.ok) throw new Error(r.status);
    })
  );

  const apiResults = await runConcurrent(concurrency, duration, () =>
    fetchJson(`${BASE}/api/dashboard/summary`, { method: 'GET' }).then((d) => {
      if (d.error) throw new Error(d.error);
    })
  );

  const latencies = [...healthResults.latencies, ...apiResults.latencies].sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length * 0.5)] ?? 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] ?? 0;

  console.log('');
  console.log('Results:');
  console.log('  Health requests:', healthResults.ok, 'ok', healthResults.err, 'err');
  console.log('  API requests:', apiResults.ok, 'ok', apiResults.err, 'err');
  console.log('  Latency p50:', p50, 'ms');
  console.log('  Latency p95:', p95, 'ms');
  console.log('  Target: p95 < 500ms');

  if (p95 > 500) {
    console.warn('  WARNING: p95 exceeds 500ms target');
  } else {
    console.log('  PASS');
  }
}

main().catch(console.error);
