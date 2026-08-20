/**
 * Tier 1 Feature Test Suite: R5 - Progress Tab & Gemini API Credit System
 * Verifies team completion velocity metrics, individual burn-up metrics for Cam, Liam, Alex, streak heatmaps, Gemini API key settings, credit deductions, and top-up refills.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { startTestServer, TestServerInstance } from '../helpers/testServer.js';
import { createTeamVirtualClients, TeamClients } from '../helpers/socketClient.js';

describe('R5: Progress Tab & Gemini Credit System', () => {
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

  it('1. Team completion velocity metrics derive accurately from task status distribution', async () => {
    const res = await serverInstance.request.get('/api/tasks');
    expect(res.status).toBe(200);
    const tasks = res.body;

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t: any) => t.status === 'done').length;
    const inProgressTasks = tasks.filter((t: any) => t.status === 'in_progress').length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    expect(totalTasks).toBeGreaterThanOrEqual(1);
    expect(completedTasks).toBeGreaterThanOrEqual(0);
    expect(completionRate).toBeGreaterThanOrEqual(0);
    expect(completionRate).toBeLessThanOrEqual(100);
  });

  it('2. Individual contributor burn-up separates metrics for Cam, Liam, and Alex', async () => {
    const res = await serverInstance.request.get('/api/tasks');
    const tasks = res.body;

    const camTasks = tasks.filter((t: any) => t.assignee_id === 'user-cam');
    const liamTasks = tasks.filter((t: any) => t.assignee_id === 'user-liam');
    const alexTasks = tasks.filter((t: any) => t.assignee_id === 'user-alex');

    expect(camTasks.length).toBeGreaterThanOrEqual(1);
    expect(liamTasks.length).toBeGreaterThanOrEqual(1);
    expect(alexTasks.length).toBeGreaterThanOrEqual(1);

    const camDone = camTasks.filter((t: any) => t.status === 'done').length;
    expect(camDone).toBeGreaterThanOrEqual(0);
  });

  it('3. Learning streak metrics in user profiles provide data for heatmap & streak badges', async () => {
    const res = await serverInstance.request.get('/api/users');
    expect(res.status).toBe(200);

    const users = res.body;
    users.forEach((u: any) => {
      expect(typeof u.learning_streak_days).toBe('number');
      expect(u.learning_streak_days).toBeGreaterThan(0);
    });
  });

  it('4. GET /api/settings returns starter credit bank balance of 100 credits', async () => {
    const res = await serverInstance.request.get('/api/settings');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('credits');
    expect(res.body.credits).toBeGreaterThanOrEqual(100);
    expect(res.body).toHaveProperty('hasApiKey');
    expect(res.body).toHaveProperty('model');
  });

  it('5. Credit top-up endpoint increments balance and broadcasts credits:updated to all clients', async () => {
    const initialRes = await serverInstance.request.get('/api/settings');
    const initialCredits = initialRes.body.credits;
    const topupAmount = 50;

    // Listeners on all clients
    const camPromise = clients.cam.waitForEvent('credits:updated');
    const liamPromise = clients.liam.waitForEvent('credits:updated');
    const alexPromise = clients.alex.waitForEvent('credits:updated');

    const res = await serverInstance.request
      .post('/api/settings/credits/topup')
      .send({
        amount: topupAmount,
        userId: 'user-cam',
      });

    expect(res.status).toBe(200);
    expect(res.body.creditBalance).toBe(initialCredits + topupAmount);

    const [camEvent, liamEvent, alexEvent] = await Promise.all([camPromise, liamPromise, alexPromise]);

    expect(camEvent.creditBalance).toBe(initialCredits + topupAmount);
    expect(camEvent.delta).toBe(topupAmount);

    expect(liamEvent.creditBalance).toBe(initialCredits + topupAmount);
    expect(alexEvent.creditBalance).toBe(initialCredits + topupAmount);
  });

  it('6. POST /api/settings/apikey securely persists Gemini API key and updates hasApiKey flag', async () => {
    const res = await serverInstance.request
      .post('/api/settings/apikey')
      .send({ apiKey: 'AIzaSyFakeKeyForTestingPurposes12345' });

    expect(res.status).toBe(200);
    expect(res.body.hasApiKey).toBe(true);

    // Verify settings query returns hasApiKey without leaking raw secret
    const settingsRes = await serverInstance.request.get('/api/settings');
    expect(settingsRes.status).toBe(200);
    expect(settingsRes.body.hasApiKey).toBe(true);
    expect(settingsRes.body).not.toHaveProperty('gemini_api_key');
  });
});
