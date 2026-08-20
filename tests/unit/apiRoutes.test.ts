import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import { database, initDatabase, closeDatabase } from '../../server/db/database.js';
import { seedDatabase } from '../../server/db/seed.js';
import { createApiRouter } from '../../server/routes/index.js';
import { settingsRepository } from '../../server/db/repositories/settingsRepository.js';

describe('Express REST API Endpoints', () => {
  let app: express.Express;

  beforeEach(() => {
    initDatabase(':memory:');
    seedDatabase(true);

    app = express();
    app.use(cors());
    app.use(express.json());
    app.use('/api', createApiRouter());
  });

  afterEach(() => {
    closeDatabase();
  });

  it('GET /api/sync/state returns complete initial hydration bundle', async () => {
    const res = await request(app).get('/api/sync/state');
    expect(res.status).toBe(200);
    expect(res.body.users).toHaveLength(3);
    expect(res.body.tasks.length).toBeGreaterThanOrEqual(6);
    expect(res.body.docs.length).toBeGreaterThanOrEqual(4);
    expect(res.body.credits).toBe(100);
  });

  it('GET /api/users returns team profiles', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
  });

  it('PATCH /api/users/:id/status updates user status', async () => {
    const res = await request(app)
      .patch('/api/users/user-cam/status')
      .send({ status: 'Focused', statusMessage: 'Deep code mode' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Focused');
    expect(res.body.status_message).toBe('Deep code mode');
  });

  it('POST /api/tasks creates new task', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({
        title: 'New API Endpoint',
        description: 'Creating REST endpoint',
        assignee_id: 'user-cam',
        status: 'in_progress',
        priority: 'high',
        start_date: '2026-08-21',
        end_date: '2026-08-23',
        userId: 'user-cam',
      });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('New API Endpoint');
  });

  it('POST /api/tasks/:id/move updates task status and dates', async () => {
    const res = await request(app)
      .post('/api/tasks/task-1/move')
      .send({
        status: 'done',
        start_date: '2026-08-20',
        end_date: '2026-08-22',
        userId: 'user-cam',
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('done');
  });

  it('POST /api/ai/generate-guide returns generated doc and decrements credits', async () => {
    const res = await request(app)
      .post('/api/ai/generate-guide')
      .send({
        topic: 'WebSocket Concurrency Architecture',
        userId: 'user-cam',
      });

    expect(res.status).toBe(200);
    expect(res.body.doc).toBeDefined();
    expect(res.body.creditBalance).toBe(95);
  });

  it('POST /api/ai/generate-guide returns 402 when credits are insufficient', async () => {
    settingsRepository.setCredits(2);

    const res = await request(app)
      .post('/api/ai/generate-guide')
      .send({
        topic: 'Another Guide',
        userId: 'user-cam',
      });

    expect(res.status).toBe(402);
    expect(res.body.error).toContain('Insufficient');
  });
});
