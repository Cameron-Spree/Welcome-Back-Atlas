/**
 * Tier 2 Boundary Test Suite: R4 - Gantt Timeline & Kanban Dates Boundaries
 * Covers date inversions, year boundaries, leap years, milestone tasks, invalid status/priority, and checklist scale.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startTestServer, TestServerInstance } from '../helpers/testServer.js';

describe('Tier 2 — Boundary: R4 Gantt Timeline & Kanban Dates', () => {
  let serverInstance: TestServerInstance;

  beforeAll(async () => {
    serverInstance = await startTestServer();
  });

  afterAll(async () => {
    await serverInstance?.close();
  });

  it('1. Rejects or normalizes inverted date ranges where start_date is later than end_date', async () => {
    const invertedPayload = {
      title: 'Inverted Date Task',
      description: 'Start is after end date',
      assignee_id: 'user-cam',
      status: 'in_progress',
      priority: 'medium',
      start_date: '2026-08-30',
      end_date: '2026-08-10', // 20 days prior to start_date
      tags: ['bug', 'edge-case'],
    };

    const res = await serverInstance.request
      .post('/api/tasks')
      .send(invertedPayload);

    if (res.status === 400 || res.status === 422) {
      expect(res.body).toHaveProperty('error');
    } else {
      expect([200, 201]).toContain(res.status);
      const created = res.body;
      const start = new Date(created.start_date).getTime();
      const end = new Date(created.end_date).getTime();
      expect(start).toBeLessThanOrEqual(end);
    }
  });

  it('2. Correctly schedules and queries tasks spanning across year boundaries (Dec 2026 to Jan 2027)', async () => {
    const crossYearTask = {
      title: 'Year-End Multi-Phase Migration',
      description: 'Crosses December into January',
      assignee_id: 'user-liam',
      status: 'backlog',
      priority: 'high',
      start_date: '2026-12-15',
      end_date: '2027-01-20',
      tags: ['roadmap', 'year-end'],
    };

    const createRes = await serverInstance.request
      .post('/api/tasks')
      .send(crossYearTask);

    expect([200, 201]).toContain(createRes.status);
    expect(createRes.body.start_date).toBe('2026-12-15');
    expect(createRes.body.end_date).toBe('2027-01-20');

    // Fetch all tasks and verify presence
    const listRes = await serverInstance.request.get('/api/tasks');
    expect(listRes.status).toBe(200);
    const found = listRes.body.find((t: any) => t.id === createRes.body.id);
    expect(found).toBeDefined();
    expect(found.start_date).toBe('2026-12-15');
    expect(found.end_date).toBe('2027-01-20');
  });

  it('3. Accurately handles leap year and month-end date boundaries (Feb 28/29, Dec 31)', async () => {
    const leapYearTask = {
      title: 'Leap Day Release 2028',
      description: 'Testing leap day boundary',
      assignee_id: 'user-alex',
      status: 'in_review',
      priority: 'medium',
      start_date: '2028-02-28',
      end_date: '2028-02-29',
      tags: ['leap-year'],
    };

    const res = await serverInstance.request
      .post('/api/tasks')
      .send(leapYearTask);

    expect([200, 201]).toContain(res.status);
    expect(res.body.start_date).toBe('2028-02-28');
    expect(res.body.end_date).toBe('2028-02-29');
  });

  it('4. Handles same-day single-point milestone tasks where start_date equals end_date', async () => {
    const milestoneTask = {
      title: 'V1.0 Launch Milestone Day',
      description: 'Single-day zero duration launch milestone',
      assignee_id: 'user-cam',
      status: 'backlog',
      priority: 'urgent',
      start_date: '2026-08-20',
      end_date: '2026-08-20',
      tags: ['milestone'],
    };

    const res = await serverInstance.request
      .post('/api/tasks')
      .send(milestoneTask);

    expect([200, 201]).toContain(res.status);
    expect(res.body.start_date).toBe('2026-08-20');
    expect(res.body.end_date).toBe('2026-08-20');
  });

  it('5. Rejects invalid status column values outside the Kanban enum', async () => {
    // 1. Get an existing task
    const listRes = await serverInstance.request.get('/api/tasks');
    expect(listRes.status).toBe(200);
    expect(listRes.body.length).toBeGreaterThan(0);
    const taskId = listRes.body[0].id;

    const invalidStatuses = ['archived', 'deleted', 'random_status', '', 'DONE', 12345];

    for (const invalidStatus of invalidStatuses) {
      const res = await serverInstance.request
        .patch(`/api/tasks/${taskId}/move`)
        .send({ status: invalidStatus });

      expect([400, 422]).toContain(res.status);
    }
  });

  it('6. Rejects invalid priority values outside allowed enums', async () => {
    const listRes = await serverInstance.request.get('/api/tasks');
    expect(listRes.status).toBe(200);
    const taskId = listRes.body[0].id;

    const invalidPriorities = ['critical_blocker', 'super_high', 'p0', '', null];

    for (const invalidPriority of invalidPriorities) {
      const res = await serverInstance.request
        .put(`/api/tasks/${taskId}`)
        .send({ priority: invalidPriority });

      expect([400, 422]).toContain(res.status);
    }
  });

  it('7. Handles tasks with empty checklist arrays and large checklist item collections', async () => {
    // Task with 0 checklist items
    const emptyChecklistTask = {
      title: 'Empty Checklist Task',
      description: 'No subtasks',
      assignee_id: 'user-liam',
      status: 'backlog',
      priority: 'low',
      start_date: '2026-08-20',
      end_date: '2026-08-25',
      tags: [],
      checklist: [],
    };

    const emptyRes = await serverInstance.request
      .post('/api/tasks')
      .send(emptyChecklistTask);

    expect([200, 201]).toContain(emptyRes.status);
    expect(Array.isArray(emptyRes.body.checklist)).toBe(true);
    expect(emptyRes.body.checklist.length).toBe(0);

    // Task with 20 checklist items
    const largeChecklist = Array.from({ length: 20 }, (_, i) => ({
      id: `item-${i + 1}`,
      text: `Subtask item ${i + 1} validation requirement`,
      completed: i % 2 === 0,
    }));

    const largeTask = {
      title: 'Large Checklist Task',
      description: 'Many subtasks',
      assignee_id: 'user-alex',
      status: 'in_progress',
      priority: 'high',
      start_date: '2026-08-20',
      end_date: '2026-08-28',
      tags: ['subtasks', 'dense'],
      checklist: largeChecklist,
    };

    const largeRes = await serverInstance.request
      .post('/api/tasks')
      .send(largeTask);

    expect([200, 201]).toContain(largeRes.status);
    expect(largeRes.body.checklist.length).toBe(20);
    expect(largeRes.body.checklist[0].completed).toBe(true);
    expect(largeRes.body.checklist[1].completed).toBe(false);
  });

  it('8. Returns 404 when updating or deleting a non-existent task ID', async () => {
    const fakeTaskId = 'task_does_not_exist_9999';

    // Update non-existent
    const putRes = await serverInstance.request
      .put(`/api/tasks/${fakeTaskId}`)
      .send({ title: 'New title' });
    expect([404, 400]).toContain(putRes.status);

    // Move non-existent
    const moveRes = await serverInstance.request
      .patch(`/api/tasks/${fakeTaskId}/move`)
      .send({ status: 'done' });
    expect([404, 400]).toContain(moveRes.status);

    // Delete non-existent
    const deleteRes = await serverInstance.request
      .delete(`/api/tasks/${fakeTaskId}`);
    expect([404, 400]).toContain(deleteRes.status);
  });
});
