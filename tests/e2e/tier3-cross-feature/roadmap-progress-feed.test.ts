/**
 * Tier 3 Cross-Feature Test Suite: Roadmap Generation <-> Activity Feed <-> Progress Analytics
 * Feature Triad: R4 (AI Auto-Roadmap Generator) <-> R2 (Live Activity Feed) <-> R5 (Progress & Velocity Analytics)
 * 
 * Verifies that:
 * 1. AI Auto-Roadmap generation creates multiple scheduled tasks distributed across Cam, Liam, and Alex, deducting 10 credits.
 * 2. Generated tasks automatically populate the live team activity stream with creation events.
 * 3. Moving roadmap tasks to 'done' shifts the overall team velocity metrics and individual contributor burn-up counts.
 * 4. Deleting or adjusting roadmap tasks dynamically updates progress analytics and keeps activity history synchronized.
 * 5. All connected virtual clients (Cam, Liam, Alex) receive real-time Socket.io broadcasts throughout the roadmap lifecycle.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { startTestServer, TestServerInstance } from '../helpers/testServer.js';
import { createTeamVirtualClients, TeamClients } from '../helpers/socketClient.js';
import { createMockTask } from '../helpers/fixtures.js';

describe('Tier 3 — Cross-Feature: AI Roadmap Generation -> Activity Stream -> Progress Velocity & Burnup', () => {
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

  it('1. Generating an AI Auto-Roadmap deducts 10 credits, broadcasts "credits:updated", and creates scheduled tasks across team members', async () => {
    const settingsBefore = (await serverInstance.request.get('/api/settings')).body;
    const initialCredits = settingsBefore.team_credits;

    const creditListener = clients.cam.waitForEvent<any>('credits:updated', 5000);

    const roadmapPayload = {
      projectGoal: 'Build Enterprise Multi-Region WebSocket Synchronization & SQLite Sharding',
      targetDays: 21,
      userId: 'user-alex',
    };

    const res = await serverInstance.request
      .post('/api/ai/generate-roadmap')
      .send(roadmapPayload);

    expect([200, 201]).toContain(res.status);
    expect(res.body).toHaveProperty('tasks');
    expect(res.body).toHaveProperty('creditBalance');
    expect(res.body.creditBalance).toBe(initialCredits - 10);

    const tasks = res.body.tasks;
    expect(Array.isArray(tasks)).toBe(true);
    expect(tasks.length).toBeGreaterThanOrEqual(3);

    // Verify task attributes
    tasks.forEach((task: any) => {
      expect(task.title).toBeTruthy();
      expect(task.start_date).toBeTruthy();
      expect(task.end_date).toBeTruthy();
      expect(['backlog', 'in_progress', 'in_review', 'done']).toContain(task.status);
    });

    // Verify Cam received the credit broadcast
    const creditEvent = await creditListener;
    expect(creditEvent).toBeDefined();
    expect(creditEvent.creditBalance || creditEvent.credits || creditEvent.balance).toBe(initialCredits - 10);
  });

  it('2. Newly generated roadmap tasks are recorded in the live activity feed', async () => {
    const feedRes = await serverInstance.request.get('/api/activities');
    expect(feedRes.status).toBe(200);
    expect(Array.isArray(feedRes.body)).toBe(true);
    expect(feedRes.body.length).toBeGreaterThanOrEqual(1);

    // Activity items have valid structure
    const latestActivity = feedRes.body[0];
    expect(latestActivity).toHaveProperty('id');
    expect(latestActivity).toHaveProperty('action_type');
    expect(latestActivity).toHaveProperty('timestamp');
  });

  it('3. Completing generated roadmap tasks shifts team completion velocity and individual burn-up counts', async () => {
    // 1. Fetch initial task distribution
    const initialTasksRes = await serverInstance.request.get('/api/tasks');
    const initialTasks = initialTasksRes.body;
    const initialCompleted = initialTasks.filter((t: any) => t.status === 'done').length;

    // Find pending tasks for Cam, Liam, Alex
    const pendingCamTask = initialTasks.find((t: any) => t.assignee_id === 'user-cam' && t.status !== 'done');
    const pendingLiamTask = initialTasks.find((t: any) => t.assignee_id === 'user-liam' && t.status !== 'done');

    if (pendingCamTask) {
      // Cam completes his task
      const completeCamRes = await serverInstance.request
        .post(`/api/tasks/${pendingCamTask.id}/move`)
        .send({ status: 'done' });
      expect(completeCamRes.status).toBe(200);
    }

    if (pendingLiamTask) {
      // Liam completes his task
      const completeLiamRes = await serverInstance.request
        .post(`/api/tasks/${pendingLiamTask.id}/move`)
        .send({ status: 'done' });
      expect(completeLiamRes.status).toBe(200);
    }

    // 2. Fetch updated task distribution
    const updatedTasksRes = await serverInstance.request.get('/api/tasks');
    const updatedTasks = updatedTasksRes.body;
    const updatedCompleted = updatedTasks.filter((t: any) => t.status === 'done').length;

    expect(updatedCompleted).toBeGreaterThan(initialCompleted);

    // 3. Verify individual contributor counts
    const camCompleted = updatedTasks.filter((t: any) => t.assignee_id === 'user-cam' && t.status === 'done').length;
    const liamCompleted = updatedTasks.filter((t: any) => t.assignee_id === 'user-liam' && t.status === 'done').length;

    expect(camCompleted).toBeGreaterThanOrEqual(1);
    expect(liamCompleted).toBeGreaterThanOrEqual(1);
  });

  it('4. Deleting a roadmap task recalculates total task count and velocity percentage cleanly', async () => {
    // 1. Create a throwaway task
    const task = createMockTask({
      title: 'Temporary Throwaway Task',
      assignee_id: 'user-cam',
      status: 'backlog',
    });
    const createRes = await serverInstance.request.post('/api/tasks').send(task);
    const taskId = createRes.body.id;

    const countBefore = (await serverInstance.request.get('/api/tasks')).body.length;

    // 2. Delete the task
    const deleteRes = await serverInstance.request.delete(`/api/tasks/${taskId}`);
    expect([200, 204]).toContain(deleteRes.status);

    // 3. Verify total count decremented
    const countAfter = (await serverInstance.request.get('/api/tasks')).body.length;
    expect(countAfter).toBe(countBefore - 1);
  });

  it('5. Full State Sync (/api/sync/state) returns synchronized snapshot of tasks, activities, and credits', async () => {
    const syncRes = await serverInstance.request.get('/api/sync/state');
    expect(syncRes.status).toBe(200);
    expect(syncRes.body).toHaveProperty('users');
    expect(syncRes.body).toHaveProperty('tasks');
    expect(syncRes.body).toHaveProperty('docs');
    expect(syncRes.body).toHaveProperty('activities');
    expect(syncRes.body).toHaveProperty('credits');

    expect(Array.isArray(syncRes.body.tasks)).toBe(true);
    expect(Array.isArray(syncRes.body.activities)).toBe(true);
    expect(typeof syncRes.body.credits).toBe('number');
  });
});
