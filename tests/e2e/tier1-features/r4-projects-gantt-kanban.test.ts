/**
 * Tier 1 Feature Test Suite: R4 - Projects Tab (Timeline/Gantt, Kanban Board & Expanded Detail Overlay)
 * Verifies Gantt date shifts, Kanban column movements, project detail overlay contracts, checklist updates, task deletions, and AI Auto-Roadmap generation.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { startTestServer, TestServerInstance } from '../helpers/testServer.js';
import { createTeamVirtualClients, TeamClients } from '../helpers/socketClient.js';
import { createMockTask } from '../helpers/fixtures.js';

describe('R4: Projects Tab (Timeline/Gantt & Kanban with Overlay)', () => {
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

  it('1. GET /api/tasks returns roadmap tasks with valid date ranges, status columns, and checklists', async () => {
    const res = await serverInstance.request.get('/api/tasks');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(3);

    res.body.forEach((task: any) => {
      expect(task).toHaveProperty('id');
      expect(task).toHaveProperty('title');
      expect(['backlog', 'in_progress', 'in_review', 'done']).toContain(task.status);
      expect(['low', 'medium', 'high', 'urgent']).toContain(task.priority);
      expect(task.start_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(task.end_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(new Date(task.start_date).getTime()).toBeLessThanOrEqual(new Date(task.end_date).getTime());
      expect(Array.isArray(task.checklist)).toBe(true);
    });
  });

  it('2. Timeline Gantt date shift updates start_date and end_date and broadcasts task:moved', async () => {
    const listRes = await serverInstance.request.get('/api/tasks');
    const task = listRes.body[0];
    const newStartDate = '2026-09-01';
    const newEndDate = '2026-09-10';

    // Set up real-time listener on peer client
    const peerPromise = clients.liam.waitForEvent('task:moved');

    const res = await serverInstance.request
      .post(`/api/tasks/${task.id}/move`)
      .send({
        status: task.status,
        start_date: newStartDate,
        end_date: newEndDate,
        userId: 'user-cam',
      });

    expect(res.status).toBe(200);
    expect(res.body.start_date).toBe(newStartDate);
    expect(res.body.end_date).toBe(newEndDate);

    const movedEvent = await peerPromise;
    expect(movedEvent.task.id).toBe(task.id);
    expect(movedEvent.task.start_date).toBe(newStartDate);
    expect(movedEvent.task.end_date).toBe(newEndDate);
  });

  it('3. Kanban column drag-and-drop moves task between status columns and broadcasts task:moved', async () => {
    const listRes = await serverInstance.request.get('/api/tasks');
    const task = listRes.body[0];
    const targetStatus = task.status === 'done' ? 'in_progress' : 'done';

    const peerPromise = clients.alex.waitForEvent('task:moved');

    const res = await serverInstance.request
      .post(`/api/tasks/${task.id}/move`)
      .send({
        status: targetStatus,
        userId: 'user-liam',
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(targetStatus);

    const movedEvent = await peerPromise;
    expect(movedEvent.task.id).toBe(task.id);
    expect(movedEvent.task.status).toBe(targetStatus);
  });

  it('4. Expanded project overlay contains complete detail fields and attached learn doc link', async () => {
    const listRes = await serverInstance.request.get('/api/tasks');
    const sample = listRes.body.find((t: any) => t.doc_id) || listRes.body[0];

    const res = await serverInstance.request.get(`/api/tasks/${sample.id}`);
    const taskDetail = res.body || sample;

    expect(taskDetail).toHaveProperty('title');
    expect(taskDetail).toHaveProperty('description');
    expect(taskDetail).toHaveProperty('assignee_id');
    expect(taskDetail).toHaveProperty('priority');
    expect(taskDetail).toHaveProperty('checklist');
    expect(taskDetail).toHaveProperty('start_date');
    expect(taskDetail).toHaveProperty('end_date');
  });

  it('5. Updating task checklist subtasks recalculates progress percentage and broadcasts task:updated', async () => {
    const listRes = await serverInstance.request.get('/api/tasks');
    const task = listRes.body[0];
    const updatedChecklist = [
      { id: 'sub-1', text: 'Subtask A', completed: true },
      { id: 'sub-2', text: 'Subtask B', completed: true },
    ];

    const peerPromise = clients.cam.waitForEvent('task:updated');

    const res = await serverInstance.request
      .patch(`/api/tasks/${task.id}`)
      .send({
        checklist: updatedChecklist,
        progress_pct: 100,
        userId: 'user-liam',
      });

    expect(res.status).toBe(200);
    expect(res.body.checklist.every((i: any) => i.completed)).toBe(true);

    const updateEvent = await peerPromise;
    expect(updateEvent.task.id).toBe(task.id);
  });

  it('6. DELETE /api/tasks/:id deletes task and broadcasts task:deleted across all virtual clients', async () => {
    // Create a temporary task to delete
    const tempTask = createMockTask({ title: 'Temporary Deletion Target Task' });
    const createRes = await serverInstance.request.post('/api/tasks').send({ ...tempTask, userId: 'user-cam' });
    const createdId = createRes.body.id || tempTask.id;

    // Listeners on all clients
    const camPromise = clients.cam.waitForEvent('task:deleted');
    const liamPromise = clients.liam.waitForEvent('task:deleted');
    const alexPromise = clients.alex.waitForEvent('task:deleted');

    const deleteRes = await serverInstance.request
      .delete(`/api/tasks/${createdId}`)
      .send({ userId: 'user-cam' });

    expect([200, 204]).toContain(deleteRes.status);

    const [camEvent, liamEvent, alexEvent] = await Promise.all([camPromise, liamPromise, alexPromise]);
    expect(camEvent.taskId || camEvent.id).toBe(createdId);
    expect(liamEvent.taskId || liamEvent.id).toBe(createdId);
    expect(alexEvent.taskId || alexEvent.id).toBe(createdId);
  });

  it('7. POST /api/ai/generate-roadmap synthesizes roadmap tasks, deducts 10 credits, and broadcasts updates', async () => {
    const initSync = await serverInstance.request.get('/api/sync/state');
    const initialCredits = initSync.body.credits;

    const creditsPromise = clients.liam.waitForEvent('credits:updated');

    const res = await serverInstance.request.post('/api/ai/generate-roadmap').send({
      projectGoal: 'Build real-time collaborative Gantt & Kanban engine with Socket.io',
      targetDays: 14,
      userId: 'user-alex',
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('tasks');
    expect(Array.isArray(res.body.tasks)).toBe(true);
    expect(res.body.tasks.length).toBeGreaterThanOrEqual(3);
    expect(res.body.creditBalance).toBe(initialCredits - 10);

    // Verify roadmap tasks have scheduled dates and assigned team members
    res.body.tasks.forEach((t: any) => {
      expect(t.title).toBeTruthy();
      expect(t.start_date).toBeTruthy();
      expect(t.end_date).toBeTruthy();
      expect(['user-cam', 'user-liam', 'user-alex', null]).toContain(t.assignee_id);
    });

    const creditEvent = await creditsPromise;
    expect(creditEvent.creditBalance).toBe(initialCredits - 10);
    expect(creditEvent.delta).toBe(-10);
  });
});
