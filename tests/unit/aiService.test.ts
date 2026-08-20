import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { database, initDatabase, closeDatabase } from '../../server/db/database.js';
import { seedDatabase } from '../../server/db/seed.js';
import { aiService } from '../../server/services/aiService.js';
import { heuristicAIEngine } from '../../server/services/heuristicAIEngine.js';
import { settingsRepository } from '../../server/db/repositories/settingsRepository.js';

describe('AI Subsystem & Fallback Engine', () => {
  beforeEach(() => {
    initDatabase(':memory:');
    seedDatabase(true);
  });

  afterEach(() => {
    closeDatabase();
  });

  it('heuristic engine generates rich structured markdown guide with code blocks and checklist', () => {
    const guide = heuristicAIEngine.generateGuide('WebSocket Concurrency & Broadcast', undefined, undefined, 'user-cam');

    expect(guide.title).toContain('WebSocket');
    expect(guide.category).toBe('Architecture');
    expect(guide.ai_relevance_score).toBeGreaterThanOrEqual(90);
    expect(guide.ai_relevance_summary).toContain('Cam');
    expect(guide.markdown_content).toContain('# Real-Time WebSocket');
    expect(guide.markdown_content).toContain('```');
    expect(guide.steps.length).toBeGreaterThanOrEqual(4);
  });

  it('heuristic engine generates multi-user scheduled roadmap tasks across Cam, Liam, and Alex', () => {
    const tasks = heuristicAIEngine.generateRoadmap('Build Real-Time Notification System', 10);

    expect(tasks.length).toBeGreaterThanOrEqual(3);
    const assignees = tasks.map((t) => t.assignee_id);
    expect(assignees.some((a) => a.includes('cam'))).toBe(true);
    expect(assignees.some((a) => a.includes('liam'))).toBe(true);
    expect(assignees.some((a) => a.includes('alex'))).toBe(true);

    for (const t of tasks) {
      expect(t.title).toBeTruthy();
      expect(t.checklist.length).toBeGreaterThanOrEqual(1);
      expect(t.duration_days).toBeGreaterThan(0);
    }
  });

  it('aiService automatically falls back to heuristic engine when API key is not configured', async () => {
    settingsRepository.setSetting('gemini_api_key', '');

    const result = await aiService.generateGuide({
      topic: 'High-Performance SQLite WAL Mode',
      userId: 'user-cam',
    });

    expect(result.usedFallback).toBe(true);
    expect(result.doc.title).toContain('SQLite');
    expect(result.creditBalance).toBe(95); // 100 - 5
    expect(result.doc.markdown_content).toContain('PRAGMA journal_mode = WAL');
  });

  it('records prompt history in database upon AI execution', async () => {
    await aiService.generateGuide({
      topic: 'Interactive Gantt Drag Engine',
      userId: 'user-liam',
    });

    const db = database.getDb();
    const history = db.prepare("SELECT * FROM ai_prompt_history WHERE prompt_type = 'GUIDE'").all();
    expect(history.length).toBeGreaterThanOrEqual(1);
    expect((history[0] as any).credits_used).toBe(5);
  });
});
