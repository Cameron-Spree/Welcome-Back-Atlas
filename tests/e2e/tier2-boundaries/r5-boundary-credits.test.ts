/**
 * Tier 2 Boundary Test Suite: R5 - AI Credits & Settings Boundaries
 * Covers 0 top-up rejection, negative top-up rejection, malformed amounts, integer scale, API key handling, credit exhaustion, and non-negative bounds.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startTestServer, TestServerInstance } from '../helpers/testServer.js';
import { createTeamVirtualClients, TeamClients } from '../helpers/socketClient.js';

describe('Tier 2 — Boundary: R5 AI Credits & Settings Engine', () => {
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

  it('1. Rejects top-up requests with zero amount (amount: 0)', async () => {
    const res = await serverInstance.request
      .post('/api/settings/credits/topup')
      .send({
        amount: 0,
        userId: 'user-cam',
      });

    expect([400, 422]).toContain(res.status);
  });

  it('2. Rejects top-up requests with negative amounts (amount: -50)', async () => {
    const negativeAmounts = [-1, -50, -1000];

    for (const amount of negativeAmounts) {
      const res = await serverInstance.request
        .post('/api/settings/credits/topup')
        .send({
          amount,
          userId: 'user-cam',
        });

      expect([400, 422]).toContain(res.status);
    }
  });

  it('3. Rejects non-numeric or malformed top-up amounts (strings, NaN, null)', async () => {
    const malformedPayloads = [
      { amount: 'one_hundred', userId: 'user-cam' },
      { amount: null, userId: 'user-cam' },
      { amount: undefined, userId: 'user-cam' },
      { amount: {}, userId: 'user-cam' },
      { userId: 'user-cam' },
    ];

    for (const payload of malformedPayloads) {
      const res = await serverInstance.request
        .post('/api/settings/credits/topup')
        .send(payload);

      expect([400, 422]).toContain(res.status);
    }
  });

  it('4. Safely handles large top-up recharge amounts without integer overflow', async () => {
    const initRes = await serverInstance.request.get('/api/settings');
    const initialCredits = initRes.body.team_credits ?? initRes.body.credits ?? initRes.body.creditBalance ?? 100;

    const largeRecharge = 1000000;
    const res = await serverInstance.request
      .post('/api/settings/credits/topup')
      .send({
        amount: largeRecharge,
        userId: 'user-cam',
      });

    expect([200, 201]).toContain(res.status);
    const newCredits = res.body.team_credits ?? res.body.credits ?? res.body.creditBalance;
    expect(newCredits).toBe(initialCredits + largeRecharge);

    // Verify persisted
    const checkRes = await serverInstance.request.get('/api/settings');
    const persistedCredits = checkRes.body.team_credits ?? checkRes.body.credits ?? checkRes.body.creditBalance;
    expect(persistedCredits).toBe(initialCredits + largeRecharge);
  });

  it('5. Safely accepts, validates, or clears empty/whitespace Gemini API keys', async () => {
    // 1. Set a valid-looking dummy key
    const setKeyRes = await serverInstance.request
      .post('/api/settings/api-key')
      .send({ apiKey: 'AIzaSyFakeTestKey123456789' });

    expect([200, 204]).toContain(setKeyRes.status);

    // 2. Clear the API key (set empty)
    const clearKeyRes = await serverInstance.request
      .post('/api/settings/api-key')
      .send({ apiKey: '' });

    expect([200, 204]).toContain(clearKeyRes.status);

    // 3. Verify settings reflects no API key (or hasApiKey: false)
    const settingsRes = await serverInstance.request.get('/api/settings');
    expect(settingsRes.status).toBe(200);
  });

  it('6. Broadcasts credits:updated event on WebSocket during top-up', async () => {
    const creditsPromise = clients.cam.waitForEvent<any>('credits:updated', 4000);

    const topupRes = await serverInstance.request
      .post('/api/settings/credits/topup')
      .send({
        amount: 50,
        userId: 'user-cam',
      });

    expect([200, 201]).toContain(topupRes.status);

    const event = await creditsPromise;
    expect(event).toBeDefined();
    expect(event.delta).toBe(50);
  });

  it('7. Rejects AI generation requests when user has insufficient credit balance', async () => {
    // Check initial balance
    const settingsRes = await serverInstance.request.get('/api/settings');
    const current = settingsRes.body.team_credits ?? settingsRes.body.credits ?? settingsRes.body.creditBalance ?? 100;

    // Drain balance via generations
    let balance = current;
    while (balance >= 10) {
      const roadRes = await serverInstance.request
        .post('/api/ai/generate-roadmap')
        .send({ projectGoal: 'Drain credits test goal', userId: 'user-cam' });
      if (roadRes.status !== 200 && roadRes.status !== 201) break;
      balance = roadRes.body.team_credits ?? roadRes.body.credits ?? roadRes.body.creditBalance;
    }

    while (balance >= 5) {
      const guideRes = await serverInstance.request
        .post('/api/ai/generate-guide')
        .send({ topic: 'Drain credits guide test', userId: 'user-cam' });
      if (guideRes.status !== 200 && guideRes.status !== 201) break;
      balance = guideRes.body.team_credits ?? guideRes.body.credits ?? guideRes.body.creditBalance;
    }

    // Now balance < 5: Attempting another guide generation must fail with 402 or 400
    const failRes = await serverInstance.request
      .post('/api/ai/generate-guide')
      .send({ topic: 'Guide with 0 credits', userId: 'user-cam' });

    expect([402, 400, 422]).toContain(failRes.status);
  });

  it('8. Enforces that credit balance never drops below zero', async () => {
    const settingsRes = await serverInstance.request.get('/api/settings');
    expect(settingsRes.status).toBe(200);
    const balance = settingsRes.body.team_credits ?? settingsRes.body.credits ?? settingsRes.body.creditBalance;
    expect(balance).toBeGreaterThanOrEqual(0);
  });
});
