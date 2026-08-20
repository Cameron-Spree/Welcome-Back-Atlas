/**
 * Tier 1 Feature Test Suite: R3 - Individualized Learn Tab (2-Pane Wireframe Layout & AI Doc Engine)
 * Verifies left pane task checklist, right pane doc reader with preview banner, AI relevance reasoning, step checklist toggling, and AI guide generation with credit deduction.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { startTestServer, TestServerInstance } from '../helpers/testServer.js';
import { createTeamVirtualClients, TeamClients } from '../helpers/socketClient.js';

describe('R3: Individualized Learn Tab & AI Doc Engine', () => {
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

  it('1. GET /api/docs returns pre-populated curated learning guides with steps and AI relevance', async () => {
    const res = await serverInstance.request.get('/api/docs');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);

    const doc = res.body[0];
    expect(doc).toHaveProperty('id');
    expect(doc).toHaveProperty('title');
    expect(doc).toHaveProperty('category');
    expect(doc).toHaveProperty('preview_link_url');
    expect(doc).toHaveProperty('ai_relevance_summary');
    expect(typeof doc.ai_relevance_score).toBe('number');
    expect(Array.isArray(doc.steps)).toBe(true);
    expect(doc.steps.length).toBeGreaterThanOrEqual(1);
  });

  it('2. GET /api/docs/:id retrieves single document with rich Markdown content and AI relevance reasoning', async () => {
    const listRes = await serverInstance.request.get('/api/docs');
    const docId = listRes.body[0].id;

    const res = await serverInstance.request.get(`/api/docs/${docId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(docId);
    expect(res.body.markdown_content).toBeTruthy();
    expect(res.body.ai_relevance_summary).toBeTruthy();
    expect(res.body.ai_relevance_score).toBeGreaterThanOrEqual(0);
  });

  it('3. Left pane task list supports filtering by assignee and topic tags', async () => {
    const camRes = await serverInstance.request.get('/api/tasks?assignee=user-cam');
    expect(camRes.status).toBe(200);
    camRes.body.forEach((t: any) => {
      expect(t.assignee_id).toBe('user-cam');
    });

    const liamRes = await serverInstance.request.get('/api/tasks?assignee=user-liam');
    expect(liamRes.status).toBe(200);
    liamRes.body.forEach((t: any) => {
      expect(t.assignee_id).toBe('user-liam');
    });
  });

  it('4. PATCH /api/docs/:id/step toggles step completion and updates database state', async () => {
    const listRes = await serverInstance.request.get('/api/docs');
    const doc = listRes.body[0];
    const targetStep = doc.steps[0];
    const newCompleted = !targetStep.completed;

    const res = await serverInstance.request
      .patch(`/api/docs/${doc.id}/step`)
      .send({
        stepNumber: targetStep.stepNumber,
        completed: newCompleted,
        userId: 'user-cam',
      });

    expect(res.status).toBe(200);
    const updatedStep = res.body.steps.find((s: any) => s.stepNumber === targetStep.stepNumber);
    expect(updatedStep).toBeDefined();
    expect(updatedStep.completed).toBe(newCompleted);

    // Verify persistence via GET /api/docs/:id
    const verifyRes = await serverInstance.request.get(`/api/docs/${doc.id}`);
    const persistedStep = verifyRes.body.steps.find((s: any) => s.stepNumber === targetStep.stepNumber);
    expect(persistedStep.completed).toBe(newCompleted);
  });

  it('5. Toggling doc step checklist item broadcasts doc:step_toggled to peer clients in real time', async () => {
    const listRes = await serverInstance.request.get('/api/docs');
    const doc = listRes.body[0];
    const targetStep = doc.steps[0];

    // Setup listener on Liam and Alex
    const liamPromise = clients.liam.waitForEvent('doc:step_toggled');
    const alexPromise = clients.alex.waitForEvent('doc:step_toggled');

    await serverInstance.request
      .patch(`/api/docs/${doc.id}/step`)
      .send({
        stepNumber: targetStep.stepNumber,
        completed: true,
        userId: 'user-cam',
      });

    const [liamEvent, alexEvent] = await Promise.all([liamPromise, alexPromise]);

    expect(liamEvent.docId).toBe(doc.id);
    expect(liamEvent.stepNumber).toBe(targetStep.stepNumber);
    expect(liamEvent.completed).toBe(true);

    expect(alexEvent.docId).toBe(doc.id);
    expect(alexEvent.stepNumber).toBe(targetStep.stepNumber);
    expect(alexEvent.completed).toBe(true);
  });

  it('6. POST /api/ai/generate-guide generates rich Markdown guide, deducts 5 credits, and broadcasts doc:created & credits:updated', async () => {
    // Get initial credits
    const initSync = await serverInstance.request.get('/api/sync/state');
    const initialCredits = initSync.body.credits;

    // Listeners for broadcasts
    const docPromise = clients.liam.waitForEvent('doc:created');
    const creditsPromise = clients.alex.waitForEvent('credits:updated');

    const res = await serverInstance.request.post('/api/ai/generate-guide').send({
      topic: 'High-Concurrency WebSocket Synchronization with SQLite WAL Mode',
      context: 'Real-time collaborative SPA architecture for Cam, Liam, and Alex',
      userId: 'user-cam',
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('doc');
    expect(res.body).toHaveProperty('creditBalance');
    expect(res.body.creditBalance).toBe(initialCredits - 5);

    const createdDoc = res.body.doc;
    expect(createdDoc.title).toContain('WebSocket');
    expect(createdDoc.markdown_content).toBeTruthy();
    expect(createdDoc.ai_relevance_summary).toBeTruthy();
    expect(createdDoc.steps.length).toBeGreaterThanOrEqual(1);

    // Verify broadcasts
    const [docEvent, creditsEvent] = await Promise.all([docPromise, creditsPromise]);
    expect(docEvent.doc.id).toBe(createdDoc.id);
    expect(creditsEvent.creditBalance).toBe(initialCredits - 5);
    expect(creditsEvent.delta).toBe(-5);
  });
});
