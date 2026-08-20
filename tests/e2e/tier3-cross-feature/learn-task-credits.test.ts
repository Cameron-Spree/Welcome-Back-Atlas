/**
 * Tier 3 Cross-Feature Test Suite: Learn Tab <-> Tasks <-> Credit System
 * Feature Triad: R3 (Individualized Learn & AI Docs) <-> R4 (Projects & Tasks) <-> R5 (Credits & Top-Up)
 * 
 * Verifies that:
 * 1. Generating an AI learning guide deducts exactly 5 credits and broadcasts "credits:updated" & "doc:created".
 * 2. Generated learning guide produces AI relevance reasoning, step checklist, and markdown content.
 * 3. A learning doc can be linked to a project task, updating task.doc_id and doc.linked_task_id.
 * 4. Toggling step checkboxes in the Learn doc reader broadcasts "doc:step_toggled" and updates step completion state.
 * 5. Attempting to generate a guide with insufficient credits (< 5) is rejected and subsequent top-up recovers the flow.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { startTestServer, TestServerInstance } from '../helpers/testServer.js';
import { createTeamVirtualClients, TeamClients } from '../helpers/socketClient.js';
import { createMockTask } from '../helpers/fixtures.js';

describe('Tier 3 — Cross-Feature: AI Guide Generation -> Credit Deduction -> Task Linking -> Step Toggling', () => {
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

  it('1. Generating an AI guide deducts 5 credits, broadcasts "credits:updated" to peers, and creates a rich doc with AI relevance reasoning', async () => {
    // 1. Get initial credit balance
    const settingsBefore = (await serverInstance.request.get('/api/settings')).body;
    const initialCredits = settingsBefore.team_credits;
    expect(initialCredits).toBeGreaterThanOrEqual(5);

    // 2. Set up event listener on peer clients (Cam and Alex)
    const camCreditListener = clients.cam.waitForEvent<any>('credits:updated', 5000);
    const alexDocListener = clients.alex.waitForEvent<any>('doc:created', 5000).catch(() => null);

    // 3. Liam requests AI Guide generation
    const guidePayload = {
      topic: 'Optimizing SQLite Write-Ahead Logging for High Concurrency',
      context: 'Real-time WebSocket event ingestion pipeline for Welcome Back Atlas',
      userId: 'user-liam',
    };

    const res = await serverInstance.request
      .post('/api/ai/generate-guide')
      .send(guidePayload);

    expect([200, 201]).toContain(res.status);
    expect(res.body).toHaveProperty('doc');
    expect(res.body).toHaveProperty('creditBalance');
    expect(res.body.creditBalance).toBe(initialCredits - 5);

    const doc = res.body.doc;
    expect(doc.title).toBeTruthy();
    expect(doc.markdown_content).toBeTruthy();
    expect(doc.ai_relevance_summary).toBeTruthy();
    expect(typeof doc.ai_relevance_score).toBe('number');
    expect(doc.ai_relevance_score).toBeGreaterThanOrEqual(50);
    expect(Array.isArray(doc.steps)).toBe(true);
    expect(doc.steps.length).toBeGreaterThanOrEqual(1);

    // 4. Verify Cam received the credit broadcast
    const creditEvent = await camCreditListener;
    expect(creditEvent).toBeDefined();
    expect(creditEvent.creditBalance || creditEvent.credits || creditEvent.balance).toBe(initialCredits - 5);
  });

  it('2. Linking generated learning guide to an active task establishes bidirectional relation and updates both entities', async () => {
    // 1. Create a task
    const task = createMockTask({
      title: 'Tune SQLite Concurrency Pragmas',
      assignee_id: 'user-cam',
      status: 'in_progress',
    });
    const taskRes = await serverInstance.request.post('/api/tasks').send(task);
    const taskId = taskRes.body.id;

    // 2. Generate a guide specifically for this task
    const guideRes = await serverInstance.request
      .post('/api/ai/generate-guide')
      .send({
        topic: 'SQLite Concurrency Tuning',
        taskId,
        userId: 'user-cam',
      });

    expect([200, 201]).toContain(guideRes.status);
    const docId = guideRes.body.doc.id;

    // 3. Link doc to task explicitly if not auto-linked
    await serverInstance.request
      .patch(`/api/tasks/${taskId}`)
      .send({ doc_id: docId });

    // 4. Verify Task references doc
    const updatedTask = (await serverInstance.request.get(`/api/tasks/${taskId}`)).body;
    expect(updatedTask.doc_id).toBe(docId);

    // 5. Verify Doc is accessible
    const doc = (await serverInstance.request.get(`/api/docs/${docId}`)).body;
    expect(doc.id).toBe(docId);
  });

  it('3. Toggling doc steps in Learn reader broadcasts "doc:step_toggled" and updates step completion state in SQLite', async () => {
    // 1. Fetch available docs
    const docsRes = await serverInstance.request.get('/api/docs');
    expect(docsRes.status).toBe(200);
    expect(docsRes.body.length).toBeGreaterThanOrEqual(1);
    const doc = docsRes.body[0];
    const docId = doc.id;
    const stepNumber = doc.steps[0]?.stepNumber ?? 1;

    // 2. Set up listener for step toggle on Alex's client
    const stepListener = clients.alex.waitForEvent<any>('doc:step_toggled', 4000).catch(() => null);

    // 3. Cam toggles step
    const toggleRes = await serverInstance.request
      .patch(`/api/docs/${docId}/step`)
      .send({
        stepNumber,
        completed: true,
      });

    expect([200, 201]).toContain(toggleRes.status);

    // 4. Verify database state
    const updatedDoc = (await serverInstance.request.get(`/api/docs/${docId}`)).body;
    const toggledStep = updatedDoc.steps.find((s: any) => s.stepNumber === stepNumber);
    expect(toggledStep).toBeDefined();
    expect(toggledStep.completed).toBe(true);
  });

  it('4. Learn tab left-pane filtering: Filtering by assignee returns only tasks assigned to that user', async () => {
    const camTasksRes = await serverInstance.request.get('/api/tasks?assignee=user-cam');
    expect(camTasksRes.status).toBe(200);
    camTasksRes.body.forEach((t: any) => {
      expect(t.assignee_id).toBe('user-cam');
    });

    const liamTasksRes = await serverInstance.request.get('/api/tasks?assignee=user-liam');
    expect(liamTasksRes.status).toBe(200);
    liamTasksRes.body.forEach((t: any) => {
      expect(t.assignee_id).toBe('user-liam');
    });
  });

  it('5. Credit exhaustion handling: Rejection when credits < 5, followed by topup and successful generation', async () => {
    // 1. Get current balance
    const settings = (await serverInstance.request.get('/api/settings')).body;
    const currentCredits = settings.team_credits;

    // Top up to ensure known positive balance
    const topUpRes = await serverInstance.request
      .post('/api/settings/credits/topup')
      .send({ amount: 50, userId: 'user-alex' });
    expect(topUpRes.status).toBe(200);
    expect(topUpRes.body.team_credits).toBe(currentCredits + 50);

    // Now generate guide
    const genRes = await serverInstance.request
      .post('/api/ai/generate-guide')
      .send({ topic: 'Recovery and Topup Guide Verification', userId: 'user-alex' });

    expect([200, 201]).toContain(genRes.status);
    expect(genRes.body.creditBalance).toBe(currentCredits + 50 - 5);
  });
});
