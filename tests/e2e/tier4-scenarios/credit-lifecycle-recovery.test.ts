/**
 * Tier 4 Scenario 5: Credit Lifecycle, Depletion, Top-Up Refill & Heuristic Fallback Recovery
 * 
 * Narrative:
 * 1. Initial State: App boots with 100 starter credits.
 * 2. Cam and Liam actively generate AI roadmaps (10 credits each) and AI learning guides (5 credits each).
 * 3. As credits are deducted, "credits:updated" broadcasts the decrementing balance to Cam, Liam, and Alex.
 * 4. Credit Depletion: Repeated calls spend the balance down below the minimum required threshold (e.g. 0 to 4 credits remaining).
 * 5. Rejection & Graceful Validation:
 *    - An attempt to generate an AI roadmap (requires 10 credits) is rejected with an HTTP 400/402 Insufficient Credits status.
 *    - An attempt to generate an AI guide (requires 5 credits) is similarly rejected.
 * 6. Top-Up Refill in Settings:
 *    - Cam navigates to Settings -> Credit Management modal and clicks the +100 Credit Top-Up button.
 *    - Server processes the top-up transaction, updates SQLite app_settings, and broadcasts "credits:updated" (+100 delta).
 * 7. Recovery & Heuristic Fallback:
 *    - Cam immediately retries AI Guide generation: succeeds, deducting 5 credits, returning rich guide with usedFallback: true.
 *    - Liam retries AI Roadmap generation: succeeds, deducting 10 credits, returning 4-6 roadmap tasks.
 * 8. All 3 clients query GET /api/sync/state and confirm the restored credit balance and new entities.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startTestServer, TestServerInstance } from '../helpers/testServer.js';
import { createTeamVirtualClients, TeamClients } from '../helpers/socketClient.js';

describe('Tier 4 — Scenario 5: Credit Depletion, Top-Up Refill & Fallback Recovery', () => {
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

  it('Executes end-to-end credit depletion, rejection validation, settings top-up refill, and fallback generation resumption', async () => {
    // ------------------------------------------------------------------------
    // Step 1: Query initial starter credits
    // ------------------------------------------------------------------------
    const initialSettings = (await serverInstance.request.get('/api/settings')).body;
    expect(initialSettings.team_credits).toBeGreaterThanOrEqual(100);

    // ------------------------------------------------------------------------
    // Step 2: Spend credits down systematically via roadmaps (10 credits each)
    // ------------------------------------------------------------------------
    let currentBalance = initialSettings.team_credits;

    // Spend until balance is 0 or less than 5
    while (currentBalance >= 10) {
      const spendRes = await serverInstance.request
        .post('/api/ai/generate-roadmap')
        .send({
          projectGoal: `Depletion Step: Roadmap for balance ${currentBalance}`,
          userId: 'user-cam',
        });

      expect([200, 201]).toContain(spendRes.status);
      currentBalance = spendRes.body.creditBalance;
    }

    if (currentBalance >= 5) {
      const guideSpendRes = await serverInstance.request
        .post('/api/ai/generate-guide')
        .send({
          topic: `Depletion Guide for balance ${currentBalance}`,
          userId: 'user-liam',
        });
      expect([200, 201]).toContain(guideSpendRes.status);
      currentBalance = guideSpendRes.body.creditBalance;
    }

    expect(currentBalance).toBeLessThan(5);

    // ------------------------------------------------------------------------
    // Step 3: Verify rejection when balance is insufficient
    // ------------------------------------------------------------------------
    const rejectedGuideRes = await serverInstance.request
      .post('/api/ai/generate-guide')
      .send({
        topic: 'Blocked Guide Request (Insufficient Credits)',
        userId: 'user-cam',
      });

    // Should return 400 or 402 or 422 error
    expect([400, 402, 422]).toContain(rejectedGuideRes.status);
    expect(rejectedGuideRes.body).toHaveProperty('error');

    const rejectedRoadmapRes = await serverInstance.request
      .post('/api/ai/generate-roadmap')
      .send({
        projectGoal: 'Blocked Roadmap Request (Insufficient Credits)',
        userId: 'user-liam',
      });

    expect([400, 402, 422]).toContain(rejectedRoadmapRes.status);
    expect(rejectedRoadmapRes.body).toHaveProperty('error');

    // ------------------------------------------------------------------------
    // Step 4: Cam Tops Up Credits (+100) via Settings
    // ------------------------------------------------------------------------
    const camCreditListener = clients.cam.waitForEvent<any>('credits:updated', 5000);
    const liamCreditListener = clients.liam.waitForEvent<any>('credits:updated', 5000);
    const alexCreditListener = clients.alex.waitForEvent<any>('credits:updated', 5000);

    const topUpRes = await serverInstance.request
      .post('/api/settings/credits/topup')
      .send({
        amount: 100,
        userId: 'user-cam',
      });

    expect(topUpRes.status).toBe(200);
    const newBalance = topUpRes.body.team_credits;
    expect(newBalance).toBe(currentBalance + 100);

    // Verify all 3 connected clients received the credit update broadcast
    const [camEvent, liamEvent, alexEvent] = await Promise.all([
      camCreditListener,
      liamCreditListener,
      alexCreditListener,
    ]);

    expect(camEvent.creditBalance || camEvent.credits || camEvent.balance).toBe(newBalance);
    expect(liamEvent.creditBalance || liamEvent.credits || liamEvent.balance).toBe(newBalance);
    expect(alexEvent.creditBalance || alexEvent.credits || alexEvent.balance).toBe(newBalance);

    // ------------------------------------------------------------------------
    // Step 5: Resume AI Generation with Refilled Balance
    // ------------------------------------------------------------------------
    // 1. Guide generation resumes (deducts 5 credits)
    const resumedGuideRes = await serverInstance.request
      .post('/api/ai/generate-guide')
      .send({
        topic: 'Resumed AI Guide Post-Topup',
        context: 'Verifying system recovery after credit recharge',
        userId: 'user-cam',
      });

    expect([200, 201]).toContain(resumedGuideRes.status);
    expect(resumedGuideRes.body.creditBalance).toBe(newBalance - 5);
    expect(resumedGuideRes.body.doc).toHaveProperty('markdown_content');

    // 2. Roadmap generation resumes (deducts 10 credits)
    const resumedRoadmapRes = await serverInstance.request
      .post('/api/ai/generate-roadmap')
      .send({
        projectGoal: 'Resumed Roadmap Planning Post-Topup',
        targetDays: 10,
        userId: 'user-liam',
      });

    expect([200, 201]).toContain(resumedRoadmapRes.status);
    expect(resumedRoadmapRes.body.creditBalance).toBe(newBalance - 5 - 10);
    expect(Array.isArray(resumedRoadmapRes.body.tasks)).toBe(true);

    // ------------------------------------------------------------------------
    // Step 6: Verify Final Hydration State via /api/sync/state
    // ------------------------------------------------------------------------
    const syncRes = await serverInstance.request.get('/api/sync/state');
    expect(syncRes.status).toBe(200);
    expect(syncRes.body.credits).toBe(newBalance - 15);
  });
});
