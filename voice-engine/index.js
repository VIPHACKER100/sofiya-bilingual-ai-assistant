/**
 * SOFIYA Voice Engine Entry
 *
 * This file exists so that `npm run dev` in `voice-engine/`
 * (which runs `node --watch index.js`) has a valid entry point.
 *
 * The real voice/NLP logic is used directly by other modules and tests
 * (e.g. `nlp-processor.js`, `context-manager.js`, `voice-input.js`),
 * so this script just performs a lightweight smoke check and exits.
 */

import 'dotenv/config';
import { NLPProcessor } from './nlp-processor.js';
import { ContextManager } from './context-manager.js';

async function main() {
  console.log('[SOFIYA Voice Engine] Starting smoke check...');

  // Instantiate core components to ensure dependencies load correctly
  const nlp = new NLPProcessor();
  const ctx = new ContextManager({ userId: 'dev-smoke' });

  // Simple NLP call to verify pipeline wiring (no external services required)
  const result = await nlp.process('Hello Sofiya, what is the weather today?');
  console.log('[SOFIYA Voice Engine] NLP intent:', result.intent);

  await ctx.close();

  console.log('[SOFIYA Voice Engine] Smoke check finished. Exiting.');
}

main().catch((err) => {
  console.error('[SOFIYA Voice Engine] Startup error:', err);
  process.exit(1);
});

