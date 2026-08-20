/**
 * Tier 1 Feature Test Suite: R2 - First Screen / Home Greeting Dashboard
 * Verifies greeting header data, user profile card status, assigned upcoming tasks, quick-jump learn cards, search, and live activity feed.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { startTestServer, TestServerInstance } from '../helpers/testServer.js';
import { createTeamVirtualClients, TeamClients } from '../helpers/socketClient.js';
import { createMockTask } from '../helpers/fixtures.js';

describe('R2: Home Greeting Dashboard & Live Activity Feed', () => {
  let serverInstance: TestServerInstance;
  let clients: TeamClients;

  beforeAll(async () => {
    serverInstance = await startTestServer();
    clients = await createTeamVirtualClients(serverInstance.url);
  });

  afterAll(async () => {
    clients?.closeAll();
    await serverInstance?.close();
  });

  beforeEach(() => {
    clients.clearHistories();
  });

  it('1. Active user profile retrieval provides full metadata for dynamic "Welcome back, [User]" header', async () => {
    const res = await serverInstance.request.get('/api/users');
    expect(res.status).toBe(200);

    const cam = res.body.find((u: any) => u.name === 'Cam');
    expect(cam).toBeDefined();
    expect(cam.name).toBe('Cam');
    expect(cam.role_title).toBeTruthy();
    expect(cam.status).toBeTruthy();
    expect(cam.avatar_url).toBeTruthy();
    expect(typeof cam.learning_streak_days).toBe('number');
  });

  it('2. Assigned upcoming tasks endpoint filters accurately for active user Cam', async () => {
    const res = await serverInstance.request.get('/api/tasks?assignee=user-cam');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    // Verify all returned tasks belong to user-cam
    res.body.forEach((task: any) => {
      expect(task.assignee_id).toBe('user-cam');
      expect(task.title).toBeTruthy();
      expect(task.status).toBeTruthy();
      expect(task.start_date).toBeTruthy();
      expect(task.end_date).toBeTruthy();
    });
  });

  it('3. Assigned upcoming tasks endpoint filters accurately for active user Liam', async () => {
    const res = await serverInstance.request.get('/api/tasks?assignee=user-liam');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    res.body.forEach((task: any) => {
      expect(task.assignee_id).toBe('user-liam');
    });
  });

  it('4. GET /api/activities returns chronological team activity logs', async () => {
    const res = await serverInstance.request.get('/api/activities');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);

    const firstActivity = res.body[0];
    expect(firstActivity).toHaveProperty('id');
    expect(firstActivity).toHaveProperty('user_id');
    expect(firstActivity).toHaveProperty('action_type');
    expect(firstActivity).toHaveProperty('target_title');
    expect(firstActivity).toHaveProperty('timestamp');
  });

  it('5. Task creation broadcasts live activity:new event to all connected dashboard clients', async () => {
    const newTask = createMockTask({
      title: 'Dashboard Real-Time Activity Feed Integration',
      assignee_id: 'user-cam',
      status: 'in_progress',
    });

    // Set up listeners on all clients
    const camPromise = clients.cam.waitForEvent('activity:new');
    const liamPromise = clients.liam.waitForEvent('activity:new');
    const alexPromise = clients.alex.waitForEvent('activity:new');

    const res = await serverInstance.request
      .post('/api/tasks')
      .send({ ...newTask, userId: 'user-cam' });

    expect([200, 201]).toContain(res.status);

    const [camAct, liamAct, alexAct] = await Promise.all([camPromise, liamPromise, alexPromise]);

    expect(camAct.activity.target_title).toBe(newTask.title);
    expect(liamAct.activity.target_title).toBe(newTask.title);
    expect(alexAct.activity.target_title).toBe(newTask.title);
  });

  it('6. Global Search queries tasks and returns matches across titles, descriptions, and tags', async () => {
    const res = await serverInstance.request.get('/api/tasks?search=SQLite');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);

    const matched = res.body[0];
    const matchContent = `${matched.title} ${matched.description} ${JSON.stringify(matched.tags)}`.toLowerCase();
    expect(matchContent).toContain('sqlite');
  });

  it('7. Quick-jump learn cards resolve associated doc_id for immediate navigation to documentation', async () => {
    const res = await serverInstance.request.get('/api/tasks');
    expect(res.status).toBe(200);

    const tasksWithDoc = res.body.filter((t: any) => t.doc_id);
    expect(tasksWithDoc.length).toBeGreaterThanOrEqual(1);

    const sample = tasksWithDoc[0];
    const docRes = await serverInstance.request.get(`/api/docs/${sample.doc_id}`);
    expect(docRes.status).toBe(200);
    expect(docRes.body.id).toBe(sample.doc_id);
    expect(docRes.body.title).toBeTruthy();
  });
});
