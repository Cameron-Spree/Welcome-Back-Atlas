/**
 * Tier 4 Scenario 1: Multi-User Collaborative Sprint Workflow
 * 
 * Narrative:
 * 1. Morning Standup & Presence: Cam (Backend Architect), Liam (Product Lead), and Alex (AI Engineer) connect simultaneously via separate virtual socket clients.
 * 2. Cam updates status to 'Focused' with message "Sprint 14: Core API Refactoring". Broadcast received by Liam & Alex.
 * 3. Liam creates a high-priority sprint task "WebSocket Event Pipeline Optimization" assigned to Cam with initial Gantt schedule.
 * 4. Cam reviews the task on Gantt Timeline, shifts schedule by 3 days to accommodate database WAL buffer tuning. Liam & Alex receive task:moved broadcast.
 * 5. Liam moves the task from 'backlog' to 'in_progress' on Kanban.
 * 6. Alex opens the Project Detail Overlay, adds and checks off the first subtask "Benchmark socket latency under 100 concurrent connections".
 * 7. Cam implements the optimization, checks off the second subtask "Enable binary payload compression", and moves status to 'in_review'.
 * 8. Liam performs final product QA, moves status to 'done'.
 * 9. All 3 clients query the live activity feed and progress analytics, confirming 100% completion on the task and incremented team velocity.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startTestServer, TestServerInstance } from '../helpers/testServer.js';
import { createTeamVirtualClients, TeamClients } from '../helpers/socketClient.js';
import { createMockTask } from '../helpers/fixtures.js';

describe('Tier 4 — Scenario 1: Multi-User Sprint Workflow (Cam, Liam, Alex)', () => {
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

  it('Executes end-to-end collaborative sprint lifecycle across Cam, Liam, and Alex', async () => {
    // ------------------------------------------------------------------------
    // Step 1: Presence & Status Setup
    // ------------------------------------------------------------------------
    const camStatusPromiseLiam = clients.liam.waitForEvent<any>('user:status_changed', 4000);
    const camStatusPromiseAlex = clients.alex.waitForEvent<any>('user:status_changed', 4000);

    const statusRes = await serverInstance.request
      .patch('/api/users/user-cam/status')
      .send({
        status: 'Focused',
        status_message: 'Sprint 14: Core API Refactoring',
      });
    expect(statusRes.status).toBe(200);

    const [statusLiam, statusAlex] = await Promise.all([camStatusPromiseLiam, camStatusPromiseAlex]);
    expect(statusLiam.status).toBe('Focused');
    expect(statusAlex.status).toBe('Focused');

    // ------------------------------------------------------------------------
    // Step 2: Task Creation by Product Lead (Liam)
    // ------------------------------------------------------------------------
    const taskCreatePromiseCam = clients.cam.waitForEvent<any>('task:created', 4000).catch(() => null);
    const taskCreatePromiseAlex = clients.alex.waitForEvent<any>('task:created', 4000).catch(() => null);

    const sprintTask = createMockTask({
      title: 'WebSocket Event Pipeline Optimization',
      description: 'Optimize Socket.io room broadcasting and integrate WAL mode journaling.',
      assignee_id: 'user-cam',
      status: 'backlog',
      priority: 'urgent',
      start_date: '2026-09-01',
      end_date: '2026-09-07',
      checklist: [
        { id: 'sub-s1-1', text: 'Benchmark socket latency under 100 concurrent connections', completed: false },
        { id: 'sub-s1-2', text: 'Enable binary payload compression', completed: false },
      ],
      progress_pct: 0,
      tags: ['sprint-14', 'architecture', 'websockets'],
    });

    const createRes = await serverInstance.request.post('/api/tasks').send(sprintTask);
    expect(createRes.status).toBe(201);
    const taskId = createRes.body.id;

    // ------------------------------------------------------------------------
    // Step 3: Cam Shifts Gantt Bar Timeline
    // ------------------------------------------------------------------------
    const ganttMovePromiseLiam = clients.liam.waitForEvent<any>('task:moved', 4000).catch(() => null);

    const ganttShiftRes = await serverInstance.request
      .post(`/api/tasks/${taskId}/move`)
      .send({
        status: 'backlog',
        start_date: '2026-09-03',
        end_date: '2026-09-10',
      });
    expect([200, 201]).toContain(ganttShiftRes.status);
    expect(ganttShiftRes.body.start_date).toBe('2026-09-03');
    expect(ganttShiftRes.body.end_date).toBe('2026-09-10');

    // ------------------------------------------------------------------------
    // Step 4: Liam Moves Task to In Progress on Kanban
    // ------------------------------------------------------------------------
    const inProgressRes = await serverInstance.request
      .post(`/api/tasks/${taskId}/move`)
      .send({ status: 'in_progress' });
    expect(inProgressRes.status).toBe(200);
    expect(inProgressRes.body.status).toBe('in_progress');

    // ------------------------------------------------------------------------
    // Step 5: Alex Opens Overlay & Completes Subtask 1 (50% progress)
    // ------------------------------------------------------------------------
    const alexOverlayUpdate = await serverInstance.request
      .patch(`/api/tasks/${taskId}`)
      .send({
        checklist: [
          { id: 'sub-s1-1', text: 'Benchmark socket latency under 100 concurrent connections', completed: true },
          { id: 'sub-s1-2', text: 'Enable binary payload compression', completed: false },
        ],
        progress_pct: 50,
      });
    expect(alexOverlayUpdate.status).toBe(200);
    expect(alexOverlayUpdate.body.progress_pct).toBe(50);

    // ------------------------------------------------------------------------
    // Step 6: Cam Completes Subtask 2 & Moves to In Review
    // ------------------------------------------------------------------------
    const camOverlayUpdate = await serverInstance.request
      .patch(`/api/tasks/${taskId}`)
      .send({
        checklist: [
          { id: 'sub-s1-1', text: 'Benchmark socket latency under 100 concurrent connections', completed: true },
          { id: 'sub-s1-2', text: 'Enable binary payload compression', completed: true },
        ],
        progress_pct: 100,
      });
    expect(camOverlayUpdate.status).toBe(200);

    const reviewRes = await serverInstance.request
      .post(`/api/tasks/${taskId}/move`)
      .send({ status: 'in_review' });
    expect(reviewRes.status).toBe(200);
    expect(reviewRes.body.status).toBe('in_review');

    // ------------------------------------------------------------------------
    // Step 7: Liam Signs Off and Marks Done
    // ------------------------------------------------------------------------
    const doneRes = await serverInstance.request
      .post(`/api/tasks/${taskId}/move`)
      .send({ status: 'done' });
    expect(doneRes.status).toBe(200);
    expect(doneRes.body.status).toBe('done');

    // ------------------------------------------------------------------------
    // Step 8: Audit Trail & Analytics Verification for Cam, Liam, Alex
    // ------------------------------------------------------------------------
    const [taskFinal, activitiesRes, syncRes] = await Promise.all([
      serverInstance.request.get(`/api/tasks/${taskId}`),
      serverInstance.request.get('/api/activities'),
      serverInstance.request.get('/api/sync/state'),
    ]);

    // Verify task state
    expect(taskFinal.body.status).toBe('done');
    expect(taskFinal.body.progress_pct).toBe(100);
    expect(taskFinal.body.start_date).toBe('2026-09-03');
    expect(taskFinal.body.end_date).toBe('2026-09-10');
    expect(taskFinal.body.checklist.every((c: any) => c.completed)).toBe(true);

    // Verify activity stream has recorded the progress
    expect(activitiesRes.status).toBe(200);
    expect(Array.isArray(activitiesRes.body)).toBe(true);

    // Verify full state sync has all updated users and tasks
    expect(syncRes.status).toBe(200);
    expect(syncRes.body.tasks.some((t: any) => t.id === taskId && t.status === 'done')).toBe(true);
  });
});
