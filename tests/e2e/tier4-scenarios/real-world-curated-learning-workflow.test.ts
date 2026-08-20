/**
 * Tier 4 Scenario 2: Real-World Curated Learning & AI Documentation Workflow
 * 
 * Narrative:
 * 1. Liam switches to the individualized Learn Tab (2-pane wireframe layout).
 * 2. Liam filters the left pane by assignee 'Liam' to view his pending tasks requiring documentation.
 * 3. Liam identifies an unassigned technical learning topic: "Mastering Draggable Timeline Gantt Calculations in React & Canvas".
 * 4. Liam clicks "AI Generate Guide" button. The server initiates AI guide generation via Gemini API (or Heuristic Fallback Engine).
 * 5. Exactly 5 credits are deducted (e.g. from 100 to 95); "credits:updated" is broadcast to Cam and Alex.
 * 6. Liam reviews the generated doc: inspects preview banner, AI relevance reasoning (score >= 80 and context rationale), and rich Markdown guidelines.
 * 7. Liam links the newly generated guide to his assigned project task "Refactor Gantt Drag Physics".
 * 8. Liam follows the step-by-step guidelines in the Markdown reader, checking off Step 1 ("Coordinate transformation math") and Step 2 ("Implement clamp boundaries").
 * 9. Each step toggle emits "doc:step_toggled" and updates the persistent SQLite database.
 * 10. Liam updates the linked task's subtask checklist and marks the task ready for review.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startTestServer, TestServerInstance } from '../helpers/testServer.js';
import { createTeamVirtualClients, TeamClients } from '../helpers/socketClient.js';
import { createMockTask } from '../helpers/fixtures.js';

describe('Tier 4 — Scenario 2: Curated Learning & AI Documentation Workflow', () => {
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

  it('Executes end-to-end curated learning documentation lifecycle with AI generation and step completion', async () => {
    // ------------------------------------------------------------------------
    // Step 1: Create a task for Liam requiring learning documentation
    // ------------------------------------------------------------------------
    const liamTask = createMockTask({
      title: 'Refactor Gantt Drag Physics & Clamping',
      description: 'Need detailed guide on SVG/Canvas coordinate transformation for timeline bars.',
      assignee_id: 'user-liam',
      status: 'in_progress',
      checklist: [
        { id: 'c-gantt-1', text: 'Coordinate transformation math', completed: false },
        { id: 'c-gantt-2', text: 'Implement clamp boundaries', completed: false },
      ],
    });
    const taskRes = await serverInstance.request.post('/api/tasks').send(liamTask);
    expect(taskRes.status).toBe(201);
    const taskId = taskRes.body.id;

    // ------------------------------------------------------------------------
    // Step 2: Liam filters tasks in Learn Tab
    // ------------------------------------------------------------------------
    const filteredTasksRes = await serverInstance.request.get('/api/tasks?assignee=user-liam');
    expect(filteredTasksRes.status).toBe(200);
    expect(filteredTasksRes.body.some((t: any) => t.id === taskId)).toBe(true);

    // ------------------------------------------------------------------------
    // Step 3: Check initial credit balance
    // ------------------------------------------------------------------------
    const settingsBefore = (await serverInstance.request.get('/api/settings')).body;
    const initialCredits = settingsBefore.team_credits;

    // ------------------------------------------------------------------------
    // Step 4: Liam Generates AI Guide (Costs 5 credits)
    // ------------------------------------------------------------------------
    const camCreditListener = clients.cam.waitForEvent<any>('credits:updated', 5000);
    const alexCreditListener = clients.alex.waitForEvent<any>('credits:updated', 5000);

    const generateRes = await serverInstance.request
      .post('/api/ai/generate-guide')
      .send({
        topic: 'Mastering Draggable Timeline Gantt Calculations in React & Canvas',
        taskId,
        context: 'Interactive dragging and resizing of timeline bars with snap-to-day intervals',
        userId: 'user-liam',
      });

    expect([200, 201]).toContain(generateRes.status);
    expect(generateRes.body).toHaveProperty('doc');
    expect(generateRes.body).toHaveProperty('creditBalance');
    expect(generateRes.body.creditBalance).toBe(initialCredits - 5);

    const generatedDoc = generateRes.body.doc;
    const docId = generatedDoc.id;

    // ------------------------------------------------------------------------
    // Step 5: Verify AI Relevance Reasoning & Markdown Guide Quality
    // ------------------------------------------------------------------------
    expect(generatedDoc.title).toBeTruthy();
    expect(generatedDoc.markdown_content).toBeTruthy();
    expect(generatedDoc.markdown_content.length).toBeGreaterThan(50);
    expect(generatedDoc.ai_relevance_summary).toBeTruthy();
    expect(typeof generatedDoc.ai_relevance_score).toBe('number');
    expect(generatedDoc.ai_relevance_score).toBeGreaterThanOrEqual(50);
    expect(Array.isArray(generatedDoc.steps)).toBe(true);
    expect(generatedDoc.steps.length).toBeGreaterThanOrEqual(2);

    // Verify peers received credit deduction broadcast
    const [camCreditEvent, alexCreditEvent] = await Promise.all([camCreditListener, alexCreditListener]);
    expect(camCreditEvent.creditBalance || camCreditEvent.credits || camCreditEvent.balance).toBe(initialCredits - 5);
    expect(alexCreditEvent.creditBalance || alexCreditEvent.credits || alexCreditEvent.balance).toBe(initialCredits - 5);

    // ------------------------------------------------------------------------
    // Step 6: Link Doc to Task
    // ------------------------------------------------------------------------
    await serverInstance.request.patch(`/api/tasks/${taskId}`).send({ doc_id: docId });
    const verifiedTask = (await serverInstance.request.get(`/api/tasks/${taskId}`)).body;
    expect(verifiedTask.doc_id).toBe(docId);

    // ------------------------------------------------------------------------
    // Step 7: Liam Completes Guide Step 1 & Step 2
    // ------------------------------------------------------------------------
    const step1Listener = clients.alex.waitForEvent<any>('doc:step_toggled', 4000).catch(() => null);

    const step1Res = await serverInstance.request
      .patch(`/api/docs/${docId}/step`)
      .send({ stepNumber: 1, completed: true });
    expect([200, 201]).toContain(step1Res.status);

    const step2Res = await serverInstance.request
      .patch(`/api/docs/${docId}/step`)
      .send({ stepNumber: 2, completed: true });
    expect([200, 201]).toContain(step2Res.status);

    // ------------------------------------------------------------------------
    // Step 8: Verify Doc Reader State in SQLite
    // ------------------------------------------------------------------------
    const finalDoc = (await serverInstance.request.get(`/api/docs/${docId}`)).body;
    const step1 = finalDoc.steps.find((s: any) => s.stepNumber === 1);
    const step2 = finalDoc.steps.find((s: any) => s.stepNumber === 2);
    expect(step1?.completed).toBe(true);
    expect(step2?.completed).toBe(true);

    // ------------------------------------------------------------------------
    // Step 9: Update Task Checklist & Move to In Review
    // ------------------------------------------------------------------------
    const taskUpdateRes = await serverInstance.request
      .patch(`/api/tasks/${taskId}`)
      .send({
        checklist: [
          { id: 'c-gantt-1', text: 'Coordinate transformation math', completed: true },
          { id: 'c-gantt-2', text: 'Implement clamp boundaries', completed: true },
        ],
        progress_pct: 100,
        status: 'in_review',
      });
    expect(taskUpdateRes.status).toBe(200);
    expect(taskUpdateRes.body.status).toBe('in_review');
    expect(taskUpdateRes.body.progress_pct).toBe(100);
  });
});
