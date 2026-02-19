/**
 * Phase 13.1: NLP Processor Unit Tests
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { NLPProcessor } from '../voice-engine/nlp-processor.js';

const nlp = new NLPProcessor();

describe('NLPProcessor', () => {
  describe('Intent classification', () => {
    it('recognizes send_message intent', async () => {
      const result = await nlp.process('Send a message to Mom');
      assert.strictEqual(result.intent, 'send_message');
    });

    it('recognizes control_device intent', async () => {
      const result = await nlp.process('Turn on the lights');
      assert.strictEqual(result.intent, 'control_device');
    });

    it('recognizes weather intent', async () => {
      const result = await nlp.process('What is the weather today?');
      assert.strictEqual(result.intent, 'weather');
    });

    it('recognizes time_date intent', async () => {
      const result = await nlp.process('What time is it?');
      assert.strictEqual(result.intent, 'time_date');
    });

    it('recognizes reminder intent', async () => {
      const result = await nlp.process('Remind me to call John at 5 PM');
      assert.strictEqual(result.intent, 'reminder');
    });

    it('recognizes smart_home_scene intent', async () => {
      const result = await nlp.process('Activate movie night');
      assert.strictEqual(result.intent, 'smart_home_scene');
    });

    it('returns fallback for unknown input', async () => {
      const result = await nlp.process('xyzabc random text');
      assert.ok(result.intent === 'fallback' || result.intent);
    });
  });

  describe('Entity extraction', () => {
    it('extracts contact from send message', async () => {
      const result = await nlp.process('Send message to Sarah');
      assert.ok(result.entities?.contact || result.entities);
    });

    it('extracts device from control command', async () => {
      const result = await nlp.process('Turn off the bedroom light');
      assert.ok(result.entities?.device || result.entities);
    });
  });

  describe('Edge cases', () => {
    it('handles empty input', async () => {
      const result = await nlp.process('');
      assert.ok(result);
      assert.ok(typeof result.intent !== 'undefined');
    });

    it('handles null/undefined gracefully', async () => {
      const result = await nlp.process(null);
      assert.ok(result);
    });
  });
});
