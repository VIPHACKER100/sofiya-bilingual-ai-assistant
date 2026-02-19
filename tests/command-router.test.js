/**
 * Phase 13.1: Command Router Unit Tests
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { CommandRouter } from '../backend/command-router.js';

describe('CommandRouter', () => {
  const router = new CommandRouter({});

  describe('route()', () => {
    it('routes send_message intent', async () => {
      const result = await router.route(
        { intent: 'send_message', entities: { contact: 'Mom' } },
        {}
      );
      assert.ok(result);
      assert.ok(result.service === 'whatsapp' || result.status);
    });

    it('routes control_device intent', async () => {
      const result = await router.route(
        { intent: 'control_device', entities: { device: 'lights', action: 'turn_on' } },
        {}
      );
      assert.ok(result);
    });

    it('routes weather intent', async () => {
      const result = await router.route(
        { intent: 'weather', entities: {} },
        {}
      );
      assert.ok(result);
    });

    it('routes system_status intent', async () => {
      const result = await router.route(
        { intent: 'system_status', entities: {} },
        {}
      );
      assert.ok(result);
    });

    it('handles unknown intent', async () => {
      const result = await router.route(
        { intent: 'unknown_intent', entities: {} },
        {}
      );
      assert.ok(result);
    });
  });
});
