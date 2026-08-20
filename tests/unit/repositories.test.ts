import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initDatabase, closeDatabase } from '../../server/db/database.js';
import { seedDatabase } from '../../server/db/seed.js';
import { userRepository } from '../../server/db/repositories/userRepository.js';
import { taskRepository } from '../../server/db/repositories/taskRepository.js';
import { docRepository } from '../../server/db/repositories/docRepository.js';
import { settingsRepository } from '../../server/db/repositories/settingsRepository.js';
import { activityRepository } from '../../server/db/repositories/activityRepository.js';

describe('Data Repositories', () => {
  beforeEach(() => {
    initDatabase(':memory:');
    seedDatabase(true);
  });

  afterEach(() => {
    closeDatabase();
  });

  describe('userRepository', () => {
    it('fetches all users and updates status', () => {
      const users = userRepository.getAll();
      expect(users).toHaveLength(3);

      const updated = userRepository.updateStatus('user-cam', 'Away', 'In a design review');
      expect(updated?.status).toBe('Away');
      expect(updated?.status_message).toBe('In a design review');

      const cam = userRepository.getById('user-cam');
      expect(cam?.status).toBe('Away');
    });

    it('updates user learning streak days', () => {
      const updated = userRepository.updateStreak('user-alex', 16);
      expect(updated?.learning_streak_days).toBe(16);
      expect(updated?.streakDays).toBe(16);
    });
  });

  describe('taskRepository', () => {
    it('creates, updates, and deletes tasks', () => {
      const newTask = taskRepository.create({
        id: 'task-test-1',
        title: 'Unit Test Task',
        description: 'Testing task creation',
        assignee_id: 'user-liam',
        status: 'backlog',
        priority: 'high',
        start_date: '2026-08-21',
        end_date: '2026-08-25',
        progress_pct: 0,
        category: 'Testing',
        tags: ['QA'],
        checklist: [{ id: 'chk-1', text: 'Write tests', completed: false }],
        created_by: 'user-cam',
      });

      expect(newTask.id).toBe('task-test-1');
      expect(newTask.title).toBe('Unit Test Task');

      const updated = taskRepository.update('task-test-1', { progress_pct: 50, status: 'in_progress' });
      expect(updated?.progress_pct).toBe(50);
      expect(updated?.status).toBe('in_progress');

      const deleted = taskRepository.delete('task-test-1');
      expect(deleted).toBe(true);
      expect(taskRepository.getById('task-test-1')).toBeNull();
    });

    it('moves task status and updates dates', () => {
      const moved = taskRepository.moveTask('task-1', 'done', '2026-08-20', '2026-08-24');
      expect(moved?.status).toBe('done');
      expect(moved?.start_date).toBe('2026-08-20');
      expect(moved?.end_date).toBe('2026-08-24');
    });
  });

  describe('docRepository', () => {
    it('toggles doc steps accurately', () => {
      const doc = docRepository.getById('doc-1');
      expect(doc).not.toBeNull();

      const updated = docRepository.toggleStep('doc-1', 1, true);
      const step1 = updated?.steps.find((s) => s.stepNumber === 1);
      expect(step1?.completed).toBe(true);
    });
  });

  describe('settingsRepository', () => {
    it('manages settings and credit updates', () => {
      expect(settingsRepository.getCredits()).toBe(100);
      settingsRepository.updateCredits(85);
      expect(settingsRepository.getCredits()).toBe(85);

      settingsRepository.setSetting('gemini_api_key', 'test-key-123');
      expect(settingsRepository.getSetting('gemini_api_key')).toBe('test-key-123');
    });
  });

  describe('activityRepository', () => {
    it('logs and retrieves recent activity items', () => {
      const initial = activityRepository.getRecent(10);
      expect(initial.length).toBeGreaterThan(0);

      const logged = activityRepository.logActivity({
        user_id: 'user-cam',
        action_type: 'task_created',
        target_type: 'task',
        target_id: 'task-test',
        target_title: 'Test Activity Logging',
        details: { priority: 'high' },
      });

      expect(logged.target_title).toBe('Test Activity Logging');
      const recent = activityRepository.getRecent(1);
      expect(recent[0].id).toBe(logged.id);
    });
  });
});
