/**
 * Tier 4 Scenario 3: AI Auto-Roadmap Planning & Delivery Execution Workflow
 * 
 * Narrative:
 * 1. Alex initiates an AI Auto-Roadmap generation session with project goal: "Full-Stack Responsive Mobile Overhaul & Offline PWA Sync".
 * 2. Alex configures a 14-day roadmap horizon. Server deducts 10 credits (e.g. 100 -> 90) and broadcasts "credits:updated".
 * 3. The system generates 4 to 6 scheduled roadmap tasks distributed across Cam (Backend), Liam (Frontend), and Alex (AI/QA).
 * 4. Cam inspects the backend task on Timeline Gantt and fine-tunes the start/end date range.
 * 5. Liam drags his responsive UI task from Backlog to In Progress on Kanban.
 * 6. Alex opens the Project Detail Overlay for the offline PWA task, attaches a curated learning doc link, and updates subtasks.
 * 7. Cam completes the backend task, moves it to 'done'.
 * 8. Alex marks the offline PWA task 'done'.
 * 9. All 3 team members verify the Progress Tab velocity analytics: completed tasks increase and team completion rate updates in real time.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startTestServer, TestServerInstance } from '../helpers/testServer.js';
import { createTeamVirtualClients, TeamClients } from '../helpers/socketClient.js';
import { createMockDoc } from '../helpers/fixtures.js';

describe('Tier 4 — Scenario 3: AI Roadmap Planning & Delivery Workflow', () => {
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

  it('Executes end-to-end AI Auto-Roadmap planning, date scheduling, Kanban tracking, and velocity analytics', async () => {
    // ------------------------------------------------------------------------
    // Step 1: Initial Credit Balance Check
    // ------------------------------------------------------------------------
    const initialSettings = (await serverInstance.request.get('/api/settings')).body;
    const initialCredits = initialSettings.team_credits;

    // ------------------------------------------------------------------------
    // Step 2: Alex Submits AI Auto-Roadmap Request (10 Credits)
    // ------------------------------------------------------------------------
    const creditListenerCam = clients.cam.waitForEvent<any>('credits:updated', 5000);
    const creditListenerLiam = clients.liam.waitForEvent<any>('credits:updated', 5000);

    const roadmapRes = await serverInstance.request
      .post('/api/ai/generate-roadmap')
      .send({
        projectGoal: 'Full-Stack Responsive Mobile Overhaul & Offline PWA Sync',
        targetDays: 14,
        userId: 'user-alex',
      });

    expect([200, 201]).toContain(roadmapRes.status);
    expect(roadmapRes.body).toHaveProperty('tasks');
    expect(roadmapRes.body.creditBalance).toBe(initialCredits - 10);

    const generatedTasks = roadmapRes.body.tasks;
    expect(Array.isArray(generatedTasks)).toBe(true);
    expect(generatedTasks.length).toBeGreaterThanOrEqual(3);

    // Verify peers received the credit broadcast
    const [creditCam, creditLiam] = await Promise.all([creditListenerCam, creditListenerLiam]);
    expect(creditCam.creditBalance || creditCam.credits || creditCam.balance).toBe(initialCredits - 10);
    expect(creditLiam.creditBalance || creditLiam.credits || creditLiam.balance).toBe(initialCredits - 10);

    // ------------------------------------------------------------------------
    // Step 3: Cam Fine-Tunes Dates on Timeline Gantt
    // ------------------------------------------------------------------------
    const backendTask = generatedTasks.find((t: any) => t.assignee_id === 'user-cam') || generatedTasks[0];
    const newStart = '2026-09-05';
    const newEnd = '2026-09-12';

    const moveRes = await serverInstance.request
      .post(`/api/tasks/${backendTask.id}/move`)
      .send({
        status: backendTask.status,
        start_date: newStart,
        end_date: newEnd,
      });

    expect([200, 201]).toContain(moveRes.status);
    expect(moveRes.body.start_date).toBe(newStart);
    expect(moveRes.body.end_date).toBe(newEnd);

    // ------------------------------------------------------------------------
    // Step 4: Liam Moves Frontend Task on Kanban to In Progress
    // ------------------------------------------------------------------------
    const frontendTask = generatedTasks.find((t: any) => t.assignee_id === 'user-liam') || generatedTasks[1];
    const kanbanRes = await serverInstance.request
      .post(`/api/tasks/${frontendTask.id}/move`)
      .send({ status: 'in_progress' });

    expect([200, 201]).toContain(kanbanRes.status);
    expect(kanbanRes.body.status).toBe('in_progress');

    // ------------------------------------------------------------------------
    // Step 5: Alex Attaches Learning Doc to AI Task in Overlay
    // ------------------------------------------------------------------------
    const aiTask = generatedTasks.find((t: any) => t.assignee_id === 'user-alex') || generatedTasks[2];
    
    // Create a learning doc to link
    const docFixture = createMockDoc({
      title: 'ServiceWorker Cache-First Offline Strategies',
      author_id: 'user-alex',
    });
    const docRes = await serverInstance.request.post('/api/docs').send(docFixture);
    const docId = docRes.body.id;

    // Attach to task
    const overlayRes = await serverInstance.request
      .patch(`/api/tasks/${aiTask.id}`)
      .send({
        doc_id: docId,
        priority: 'urgent',
      });

    expect(overlayRes.status).toBe(200);
    expect(overlayRes.body.doc_id).toBe(docId);
    expect(overlayRes.body.priority).toBe('urgent');

    // ------------------------------------------------------------------------
    // Step 6: Team Completes Roadmap Tasks
    // ------------------------------------------------------------------------
    // Cam finishes backend task
    await serverInstance.request.post(`/api/tasks/${backendTask.id}/move`).send({ status: 'done' });
    // Alex finishes AI task
    await serverInstance.request.post(`/api/tasks/${aiTask.id}/move`).send({ status: 'done' });

    // ------------------------------------------------------------------------
    // Step 7: Progress Velocity Verification
    // ------------------------------------------------------------------------
    const allTasksRes = await serverInstance.request.get('/api/tasks');
    const allTasks = allTasksRes.body;
    const doneTasks = allTasks.filter((t: any) => t.status === 'done');
    expect(doneTasks.length).toBeGreaterThanOrEqual(2);

    // Verify Cam and Alex have completed tasks
    const camDone = doneTasks.filter((t: any) => t.assignee_id === 'user-cam').length;
    const alexDone = doneTasks.filter((t: any) => t.assignee_id === 'user-alex').length;
    expect(camDone).toBeGreaterThanOrEqual(1);
    expect(alexDone).toBeGreaterThanOrEqual(1);
  });
});
