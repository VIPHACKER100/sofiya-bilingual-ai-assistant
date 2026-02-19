/**
 * Phase 13.2: Integration test - Smart home scene execution
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { SceneManager } from '../../backend/scene-manager.js';

describe('Smart Home Scene integration', () => {
  const sceneManager = new SceneManager({ db: null });

  describe('executeScene', () => {
    it('executes pre-built movie_night scene', async () => {
      const result = await sceneManager.executeScene('movie_night', 'user1');
      assert.ok(result);
      assert.strictEqual(result.sceneId, 'movie_night');
      assert.ok(Array.isArray(result.results));
    });

    it('returns scene not found for invalid id', async () => {
      await assert.rejects(
        () => sceneManager.executeScene('nonexistent_scene', 'user1'),
        /Scene not found/
      );
    });
  });

  describe('getAllScenes', () => {
    it('returns pre-built scenes', async () => {
      const scenes = await sceneManager.getAllScenes('user1');
      assert.ok(Array.isArray(scenes));
      assert.ok(scenes.length >= 8);
      const movie = scenes.find(s => s.id === 'movie_night');
      assert.ok(movie);
      assert.strictEqual(movie.type, 'pre-built');
    });
  });
});
