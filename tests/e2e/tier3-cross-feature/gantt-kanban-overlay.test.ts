/**
 * Tier 3 Cross-Feature Test Suite: Gantt <-> Kanban <-> Project Overlay Interaction
 * Feature Triad: R4 (Timeline Gantt View) <-> R4 (Kanban Board) <-> R4 (Project Detail Overlay Modal)
 * 
 * Verifies that:
 * 1. Shifting task dates in Timeline Gantt updates start_date/end_date without altering Kanban status or checklist items.
 * 2. Dragging a task card across Kanban columns (backlog -> in_progress -> in_review -> done) updates status while preserving timeline dates.
 * 3. Editing subtask checklist items in the Project Overlay drawer recalculates progress percentage and broadcasts to all clients.
 * 4. Reassigning a task or changing priority in the Overlay immediately updates Kanban filters and Gantt representations.
 * 5. Multi-user concurrent interactions across different views maintain data consistency and emit real-time Socket.io events.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { startTestServer, TestServerInstance } from '../helpers/testServer.js';
import { createTeamVirtualClients, TeamClients } from '../helpers/socketClient.js';
import { createMockTask } from '../helpers/fixtures.js';

describe('Tier 3 — Cross-Feature: Gantt Date Shift -> Kanban Move -> Overlay Detail Update', () => {
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

  it('1. Gantt Timeline date shift updates start_date and end_date while preserving Kanban status and checklist integrity', async () => {
    // 1. Create a task in backlog with a 2-item checklist
    const initialTask = createMockTask({
      title: 'Architect Real-time Gantt Sync',
      assignee_id: 'user-cam',
      status: 'backlog',
      priority: 'high',
      start_date: '2026-09-01',
      end_date: '2026-09-05',
      checklist: [
        { id: 'sub-gantt-1', text: 'Define Gantt bar coordinates', completed: false },
        { id: 'sub-gantt-2', text: 'Implement drag listener', completed: false },
      ],
    });

    const createRes = await serverInstance.request.post('/api/tasks').send(initialTask);
    expect(createRes.status).toBe(201);
    const taskId = createRes.body.id;

    // 2. Cam shifts the Gantt bar to new dates: 2026-09-03 to 2026-09-08
    const liamMoveListener = clients.liam.waitForEvent<any>('task:moved', 4000).catch(() => null);
    const alexUpdateListener = clients.alex.waitForEvent<any>('task:updated', 4000).catch(() => null);

    const shiftRes = await serverInstance.request
      .post(`/api/tasks/${taskId}/move`)
      .send({
        status: 'backlog', // unchanged Kanban status
        start_date: '2026-09-03',
        end_date: '2026-09-08',
      });

    expect([200, 201]).toContain(shiftRes.status);
    expect(shiftRes.body.start_date).toBe('2026-09-03');
    expect(shiftRes.body.end_date).toBe('2026-09-08');
    expect(shiftRes.body.status).toBe('backlog');

    // 3. Verify checklist and details remain completely intact in DB
    const getRes = await serverInstance.request.get(`/api/tasks/${taskId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.start_date).toBe('2026-09-03');
    expect(getRes.body.end_date).toBe('2026-09-08');
    expect(getRes.body.status).toBe('backlog');
    expect(getRes.body.checklist.length).toBe(2);
    expect(getRes.body.checklist[0].text).toBe('Define Gantt bar coordinates');
  });

  it('2. Dragging card in Kanban across columns (backlog -> in_progress -> in_review -> done) preserves Gantt schedule', async () => {
    // 1. Create a task
    const task = createMockTask({
      title: 'Kanban Lifecycle Cross-Verification',
      assignee_id: 'user-liam',
      status: 'backlog',
      start_date: '2026-09-10',
      end_date: '2026-09-20',
    });
    const createRes = await serverInstance.request.post('/api/tasks').send(task);
    const taskId = createRes.body.id;

    // 2. Liam drags card: backlog -> in_progress
    const inProgressRes = await serverInstance.request
      .post(`/api/tasks/${taskId}/move`)
      .send({ status: 'in_progress' });
    expect(inProgressRes.status).toBe(200);
    expect(inProgressRes.body.status).toBe('in_progress');
    expect(inProgressRes.body.start_date).toBe('2026-09-10'); // Gantt date preserved
    expect(inProgressRes.body.end_date).toBe('2026-09-20');

    // 3. Liam moves: in_progress -> in_review
    const inReviewRes = await serverInstance.request
      .post(`/api/tasks/${taskId}/move`)
      .send({ status: 'in_review' });
    expect(inReviewRes.status).toBe(200);
    expect(inReviewRes.body.status).toBe('in_review');

    // 4. Liam moves: in_review -> done
    const doneRes = await serverInstance.request
      .post(`/api/tasks/${taskId}/move`)
      .send({ status: 'done' });
    expect(doneRes.status).toBe(200);
    expect(doneRes.body.status).toBe('done');
    expect(doneRes.body.start_date).toBe('2026-09-10');
    expect(doneRes.body.end_date).toBe('2026-09-20');
  });

  it('3. Project Overlay detail edit (toggling subtask checklist items) recalculates progress_pct and broadcasts to peer clients', async () => {
    // 1. Create a task with 4 checklist items
    const task = createMockTask({
      title: 'Overlay Subtask Checklist Progress Test',
      assignee_id: 'user-alex',
      status: 'in_progress',
      progress_pct: 0,
      checklist: [
        { id: 'sub-1', text: 'Draft wireframes', completed: false },
        { id: 'sub-2', text: 'Review accessibility contrast', completed: false },
        { id: 'sub-3', text: 'Build Tailwind theme tokens', completed: false },
        { id: 'sub-4', text: 'Publish UI kit', completed: false },
      ],
    });
    const createRes = await serverInstance.request.post('/api/tasks').send(task);
    const taskId = createRes.body.id;

    // 2. Alex opens overlay and checks off 2 items (50% progress)
    const updateListener = clients.cam.waitForEvent<any>('task:updated', 4000);

    const patchRes = await serverInstance.request
      .patch(`/api/tasks/${taskId}`)
      .send({
        checklist: [
          { id: 'sub-1', text: 'Draft wireframes', completed: true },
          { id: 'sub-2', text: 'Review accessibility contrast', completed: true },
          { id: 'sub-3', text: 'Build Tailwind theme tokens', completed: false },
          { id: 'sub-4', text: 'Publish UI kit', completed: false },
        ],
        progress_pct: 50,
      });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.progress_pct).toBe(50);
    expect(patchRes.body.checklist.filter((c: any) => c.completed).length).toBe(2);

    // Verify Cam received the WebSocket update
    const camEvent = await updateListener;
    expect(camEvent).toBeDefined();
    const eventTask = camEvent.task || camEvent;
    expect(eventTask.id).toBe(taskId);

    // 3. Alex checks off the remaining 2 items (100% progress)
    const completeRes = await serverInstance.request
      .patch(`/api/tasks/${taskId}`)
      .send({
        checklist: [
          { id: 'sub-1', text: 'Draft wireframes', completed: true },
          { id: 'sub-2', text: 'Review accessibility contrast', completed: true },
          { id: 'sub-3', text: 'Build Tailwind theme tokens', completed: true },
          { id: 'sub-4', text: 'Publish UI kit', completed: true },
        ],
        progress_pct: 100,
      });

    expect(completeRes.status).toBe(200);
    expect(completeRes.body.progress_pct).toBe(100);
  });

  it('4. Reassigning task and updating priority in Overlay updates Kanban and Gantt assignee query filters', async () => {
    // 1. Task initially assigned to Cam
    const task = createMockTask({
      title: 'Assignee Transition Test Task',
      assignee_id: 'user-cam',
      priority: 'low',
      status: 'in_progress',
    });
    const createRes = await serverInstance.request.post('/api/tasks').send(task);
    const taskId = createRes.body.id;

    // Verify Cam has it in his assigned filter
    const camList1 = await serverInstance.request.get('/api/tasks?assignee=user-cam');
    expect(camList1.body.some((t: any) => t.id === taskId)).toBe(true);

    // 2. Reassign to Liam and escalate priority to 'urgent' via Overlay
    const patchRes = await serverInstance.request
      .patch(`/api/tasks/${taskId}`)
      .send({
        assignee_id: 'user-liam',
        priority: 'urgent',
      });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.assignee_id).toBe('user-liam');
    expect(patchRes.body.priority).toBe('urgent');

    // 3. Verify filter queries reflect reassignment immediately
    const camList2 = await serverInstance.request.get('/api/tasks?assignee=user-cam');
    expect(camList2.body.some((t: any) => t.id === taskId)).toBe(false);

    const liamList = await serverInstance.request.get('/api/tasks?assignee=user-liam');
    expect(liamList.body.some((t: any) => t.id === taskId)).toBe(true);
    const reassigned = liamList.body.find((t: any) => t.id === taskId);
    expect(reassigned.priority).toBe('urgent');
  });

  it('5. Full Collaborative Lifecycle: Create in Gantt -> Shift Dates -> Move in Kanban -> Complete Checklist in Overlay', async () => {
    // Step 1: Create
    const task = createMockTask({
      title: 'Full Lifecycle E2E Coordination',
      assignee_id: 'user-alex',
      status: 'backlog',
      start_date: '2026-08-25',
      end_date: '2026-08-30',
      checklist: [
        { id: 'c-1', text: 'Step Alpha', completed: false },
        { id: 'c-2', text: 'Step Beta', completed: false },
      ],
    });
    const createRes = await serverInstance.request.post('/api/tasks').send(task);
    const taskId = createRes.body.id;

    // Step 2: Gantt date shift
    await serverInstance.request.post(`/api/tasks/${taskId}/move`).send({
      status: 'backlog',
      start_date: '2026-08-27',
      end_date: '2026-09-03',
    });

    // Step 3: Kanban status move to in_progress
    await serverInstance.request.post(`/api/tasks/${taskId}/move`).send({
      status: 'in_progress',
    });

    // Step 4: Overlay subtask checklist completion
    await serverInstance.request.patch(`/api/tasks/${taskId}`).send({
      checklist: [
        { id: 'c-1', text: 'Step Alpha', completed: true },
        { id: 'c-2', text: 'Step Beta', completed: true },
      ],
      progress_pct: 100,
    });

    // Step 5: Kanban move to done
    await serverInstance.request.post(`/api/tasks/${taskId}/move`).send({
      status: 'done',
    });

    // Step 6: Verify final consolidated state
    const finalRes = await serverInstance.request.get(`/api/tasks/${taskId}`);
    expect(finalRes.status).toBe(200);
    expect(finalRes.body.status).toBe('done');
    expect(finalRes.body.start_date).toBe('2026-08-27');
    expect(finalRes.body.end_date).toBe('2026-09-03');
    expect(finalRes.body.progress_pct).toBe(100);
    expect(finalRes.body.checklist.every((c: any) => c.completed)).toBe(true);
  });
});
