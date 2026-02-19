/**
 * Phase 13.1: Reminder Engine Unit Tests
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ReminderEngine } from '../backend/reminder-engine.js';

describe('ReminderEngine', () => {
  const engine = new ReminderEngine({ db: null });

  describe('createReminder', () => {
    it('requires database', async () => {
      await assert.rejects(
        () => engine.createReminder({
          userId: 'u1',
          title: 'Test',
          dueTime: new Date()
        }),
        /Database not configured/
      );
    });
  });

  describe('getUserReminders', () => {
    it('returns empty array without db', async () => {
      const reminders = await engine.getUserReminders('u1');
      assert.deepStrictEqual(reminders, []);
    });
  });

  describe('completeReminder', () => {
    it('returns false without db', async () => {
      const ok = await engine.completeReminder('rem1');
      assert.strictEqual(ok, false);
    });
  });

  describe('snoozeReminder', () => {
    it('returns false without db', async () => {
      const ok = await engine.snoozeReminder('rem1', 15);
      assert.strictEqual(ok, false);
    });
  });
});
