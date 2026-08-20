import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { database, initDatabase, closeDatabase } from '../../server/db/database.js';
import { seedDatabase } from '../../server/db/seed.js';

describe('Database & Schema Layer', () => {
  beforeEach(() => {
    initDatabase(':memory:');
    seedDatabase(true);
  });

  afterEach(() => {
    closeDatabase();
  });

  it('verifies SQLite pragmas (foreign keys ON)', () => {
    const db = database.getDb();
    const fkPragma = db.pragma('foreign_keys', { simple: true });
    expect(fkPragma).toBe(1);
  });

  it('verifies all required tables exist in schema', () => {
    const db = database.getDb();
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table'")
      .all()
      .map((r: any) => r.name);

    expect(tables).toContain('users');
    expect(tables).toContain('learning_docs');
    expect(tables).toContain('tasks');
    expect(tables).toContain('activity_logs');
    expect(tables).toContain('app_settings');
    expect(tables).toContain('ai_prompt_history');
  });

  it('verifies required indexes exist for query performance', () => {
    const db = database.getDb();
    const indexes = db
      .prepare("SELECT name FROM sqlite_master WHERE type='index'")
      .all()
      .map((r: any) => r.name);

    expect(indexes).toContain('idx_tasks_assignee');
    expect(indexes).toContain('idx_tasks_status');
    expect(indexes).toContain('idx_tasks_dates');
    expect(indexes).toContain('idx_docs_category');
    expect(indexes).toContain('idx_activity_timestamp');
  });

  it('verifies seed data for Cam, Liam, and Alex is accurately populated', () => {
    const db = database.getDb();
    const users = db.prepare('SELECT * FROM users').all();
    expect(users).toHaveLength(3);

    const names = users.map((u: any) => u.name);
    expect(names).toContain('Cam');
    expect(names).toContain('Liam');
    expect(names).toContain('Alex');

    const tasks = db.prepare('SELECT * FROM tasks').all();
    expect(tasks.length).toBeGreaterThanOrEqual(6);

    const docs = db.prepare('SELECT * FROM learning_docs').all();
    expect(docs.length).toBeGreaterThanOrEqual(4);

    const creditsSetting = db.prepare("SELECT value FROM app_settings WHERE key = 'team_credits'").get() as any;
    expect(JSON.parse(creditsSetting.value)).toBe(100);
  });
});
