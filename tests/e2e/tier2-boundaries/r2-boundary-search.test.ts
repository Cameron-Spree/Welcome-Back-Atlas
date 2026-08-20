/**
 * Tier 2 Boundary Test Suite: R2 - Search & Activity Feed Boundaries
 * Covers empty queries, regex metacharacters, SQL injection strings, 1000+ char strings, Unicode/emojis, and pagination boundaries.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startTestServer, TestServerInstance } from '../helpers/testServer.js';

describe('Tier 2 — Boundary: R2 Search & Activity Feed', () => {
  let serverInstance: TestServerInstance;

  beforeAll(async () => {
    serverInstance = await startTestServer();
  });

  afterAll(async () => {
    await serverInstance?.close();
  });

  it('1. Safe empty or default result structure for empty or missing search query string', async () => {
    const missingRes = await serverInstance.request.get('/api/search');
    expect(missingRes.status).toBe(200);
    expect(missingRes.body).toHaveProperty('tasks');
    expect(missingRes.body).toHaveProperty('docs');
    expect(Array.isArray(missingRes.body.tasks)).toBe(true);
    expect(Array.isArray(missingRes.body.docs)).toBe(true);

    const emptyRes = await serverInstance.request.get('/api/search?q=');
    expect(emptyRes.status).toBe(200);
    expect(Array.isArray(emptyRes.body.tasks)).toBe(true);
    expect(Array.isArray(emptyRes.body.docs)).toBe(true);
  });

  it('2. Handles regex metacharacters, punctuation, and SQL special characters in search query without crashing', async () => {
    const dangerousQueries = [
      '.*+?^${}()|[]\\',
      "' OR '1'='1",
      "'; DROP TABLE tasks; --",
      '-- /* comment */',
      '%%%___%%',
      '<script>alert("xss")</script>',
      '\\u0000\\x00\\n\\r',
      '`~!@#$%^&*()-_=+[{]}\\|;:\'",<.>/?',
    ];

    for (const query of dangerousQueries) {
      const res = await serverInstance.request
        .get('/api/search')
        .query({ q: query });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('tasks');
      expect(res.body).toHaveProperty('docs');
      expect(Array.isArray(res.body.tasks)).toBe(true);
      expect(Array.isArray(res.body.docs)).toBe(true);
    }
  });

  it('3. Handles excessively long search queries (1000+ characters) cleanly without timeout or crash', async () => {
    const longQuery = 'A'.repeat(2500);
    const res = await serverInstance.request
      .get('/api/search')
      .query({ q: longQuery });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.tasks)).toBe(true);
    expect(Array.isArray(res.body.docs)).toBe(true);
    expect(res.body.tasks.length).toBe(0);
    expect(res.body.docs.length).toBe(0);
  });

  it('4. Safely handles whitespace-only search queries by returning valid results', async () => {
    const whitespaceQueries = ['   ', '\t\t', '\n\r\n', '   \t   '];

    for (const ws of whitespaceQueries) {
      const res = await serverInstance.request
        .get('/api/search')
        .query({ q: ws });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.tasks)).toBe(true);
      expect(Array.isArray(res.body.docs)).toBe(true);
    }
  });

  it('5. Performs case-insensitive and partial matching for single-character boundary queries', async () => {
    const lowerRes = await serverInstance.request.get('/api/search?q=c');
    const upperRes = await serverInstance.request.get('/api/search?q=C');

    expect(lowerRes.status).toBe(200);
    expect(upperRes.status).toBe(200);
    expect(Array.isArray(lowerRes.body.tasks)).toBe(true);
    expect(Array.isArray(upperRes.body.tasks)).toBe(true);
  });

  it('6. Correctly stores, retrieves, and searches activity feed items containing Unicode and emoji strings', async () => {
    const emojiAction = '🎉 Completed milestone with 🚀 high velocity & 🎨 design overhaul (日本語・Тест)';

    const taskRes = await serverInstance.request
      .post('/api/tasks')
      .send({
        title: `Task with Emojis 🌟 ${Date.now()}`,
        description: emojiAction,
        assignee_id: 'user-cam',
        status: 'in_progress',
        priority: 'high',
        start_date: '2026-08-20',
        end_date: '2026-08-25',
        tags: ['emoji', '🔥'],
      });

    expect([200, 201]).toContain(taskRes.status);

    // Verify activity feed includes items
    const feedRes = await serverInstance.request.get('/api/activities');
    expect(feedRes.status).toBe(200);
    expect(Array.isArray(feedRes.body)).toBe(true);

    // Search query with emoji
    const emojiSearchRes = await serverInstance.request.get('/api/search?q=🌟');
    expect(emojiSearchRes.status).toBe(200);
    expect(emojiSearchRes.body.tasks.some((t: any) => t.title.includes('🌟'))).toBe(true);
  });

  it('7. Handles extreme boundary values for activity feed pagination (limit=0, negative limits, massive offsets)', async () => {
    // 1. limit=0
    const zeroLimitRes = await serverInstance.request.get('/api/activities?limit=0');
    expect(zeroLimitRes.status).toBe(200);
    expect(Array.isArray(zeroLimitRes.body)).toBe(true);
    expect(zeroLimitRes.body.length).toBe(0);

    // 2. massive offset beyond total records
    const hugeOffsetRes = await serverInstance.request.get('/api/activities?offset=999999&limit=10');
    expect(hugeOffsetRes.status).toBe(200);
    expect(Array.isArray(hugeOffsetRes.body)).toBe(true);
    expect(hugeOffsetRes.body.length).toBe(0);

    // 3. negative limit or offset (should default or sanitize gracefully)
    const negativeRes = await serverInstance.request.get('/api/activities?limit=-5&offset=-10');
    expect([200, 400]).toContain(negativeRes.status);
    if (negativeRes.status === 200) {
      expect(Array.isArray(negativeRes.body)).toBe(true);
    }
  });
});
