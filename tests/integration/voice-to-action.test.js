/**
 * Phase 13.2: Integration test - Voice command to action
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { NLPProcessor } from '../../voice-engine/nlp-processor.js';
import { CommandRouter } from '../../backend/command-router.js';

const nlp = new NLPProcessor();
const router = new CommandRouter({});

describe('Voice-to-Action integration', () => {
  it('processes "turn on the lights" end-to-end', async () => {
    const nlpResult = await nlp.process('Turn on the lights');
    assert.ok(nlpResult.intent);

    const routeResult = await router.route(nlpResult, {});
    assert.ok(routeResult);
    assert.ok(routeResult.service || routeResult.status);
  });

  it('processes "what is the weather" end-to-end', async () => {
    const nlpResult = await nlp.process('What is the weather?');
    assert.strictEqual(nlpResult.intent, 'weather');

    const routeResult = await router.route(nlpResult, {});
    assert.ok(routeResult);
  });

  it('processes "movie night" scene end-to-end', async () => {
    const nlpResult = await nlp.process('Movie night');
    assert.strictEqual(nlpResult.intent, 'smart_home_scene');

    const routeResult = await router.route(nlpResult, {});
    assert.ok(routeResult);
  });
});
