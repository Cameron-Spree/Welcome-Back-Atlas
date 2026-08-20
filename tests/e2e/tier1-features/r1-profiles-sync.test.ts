/**
 * Tier 1 Feature Test Suite: R1 - Multi-User Profile System & Real-Time Sync
 * Verifies profile retrieval, status updates, 1-click switching data, and multi-client real-time synchronization.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { startTestServer, TestServerInstance } from '../helpers/testServer.js';
import { createTeamVirtualClients, TeamClients, VirtualSocketClient } from '../helpers/socketClient.js';
import { SEED_USERS } from '../helpers/fixtures.js';

describe('R1: Multi-User Profile System & Real-Time Sync', () => {
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

  it('1. GET /api/users returns profiles for Cam, Liam, and Alex with distinct themes & roles', async () => {
    const res = await serverInstance.request.get('/api/users');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(3);

    const cam = res.body.find((u: any) => u.name === 'Cam');
    const liam = res.body.find((u: any) => u.name === 'Liam');
    const alex = res.body.find((u: any) => u.name === 'Alex');

    expect(cam).toBeDefined();
    expect(cam.color_theme).toBe('emerald');
    expect(cam.role_title).toContain('Architect');

    expect(liam).toBeDefined();
    expect(liam.color_theme).toBe('indigo');
    expect(liam.role_title).toContain('Product');

    expect(alex).toBeDefined();
    expect(alex.color_theme).toBe('amber');
    expect(alex.role_title).toContain('AI');
  });

  it('2. GET /api/sync/state returns complete initial hydration bundle', async () => {
    const res = await serverInstance.request.get('/api/sync/state');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('users');
    expect(res.body).toHaveProperty('tasks');
    expect(res.body).toHaveProperty('docs');
    expect(res.body).toHaveProperty('activities');
    expect(res.body).toHaveProperty('credits');

    expect(Array.isArray(res.body.users)).toBe(true);
    expect(res.body.users.length).toBeGreaterThanOrEqual(3);
    expect(typeof res.body.credits).toBe('number');
    expect(res.body.credits).toBeGreaterThanOrEqual(100);
  });

  it('3. PATCH /api/users/:id/status updates status to "Focused" and persists in SQLite', async () => {
    const userId = 'user-cam';
    const newStatus = 'Focused';
    const statusMessage = 'Deep work on Socket sync engine';

    const res = await serverInstance.request
      .patch(`/api/users/${userId}/status`)
      .send({ status: newStatus, statusMessage });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(newStatus);
    expect(res.body.status_message).toBe(statusMessage);

    // Verify persistence via subsequent GET
    const getRes = await serverInstance.request.get('/api/users');
    const updatedCam = getRes.body.find((u: any) => u.id === userId);
    expect(updatedCam.status).toBe(newStatus);
    expect(updatedCam.status_message).toBe(statusMessage);
  });

  it('4. Status update via REST broadcasts user:status_changed to all connected virtual clients', async () => {
    const userId = 'user-liam';
    const newStatus = 'Away';
    const statusMessage = 'Stepped out for coffee';

    // Set up listeners on peer clients (Cam and Alex)
    const camPromise = clients.cam.waitForEvent('user:status_changed');
    const alexPromise = clients.alex.waitForEvent('user:status_changed');

    // Trigger REST update
    const res = await serverInstance.request
      .patch(`/api/users/${userId}/status`)
      .send({ status: newStatus, statusMessage });

    expect(res.status).toBe(200);

    // Await real-time broadcast reception
    const [camEvent, alexEvent] = await Promise.all([camPromise, alexPromise]);

    expect(camEvent.userId).toBe(userId);
    expect(camEvent.status).toBe(newStatus);
    expect(camEvent.statusMessage).toBe(statusMessage);

    expect(alexEvent.userId).toBe(userId);
    expect(alexEvent.status).toBe(newStatus);
  });

  it('5. Socket client emits user:update_status and all peers receive real-time broadcast', async () => {
    const userId = 'user-alex';
    const newStatus = 'Online';
    const statusMessage = 'Testing multi-socket sync';

    // Setup promises on Cam and Liam
    const camPromise = clients.cam.waitForEvent('user:status_changed');
    const liamPromise = clients.liam.waitForEvent('user:status_changed');

    // Alex emits status update over WebSocket
    clients.alex.emit('user:update_status', {
      userId,
      status: newStatus,
      statusMessage,
    });

    const [camEvent, liamEvent] = await Promise.all([camPromise, liamPromise]);

    expect(camEvent.userId).toBe(userId);
    expect(camEvent.status).toBe(newStatus);
    expect(camEvent.statusMessage).toBe(statusMessage);

    expect(liamEvent.userId).toBe(userId);
    expect(liamEvent.status).toBe(newStatus);
  });

  it('6. Dynamic 1-click user switching profile metadata maintains independent streak counts', async () => {
    const res = await serverInstance.request.get('/api/users');
    expect(res.status).toBe(200);

    res.body.forEach((user: any) => {
      expect(typeof user.learning_streak_days).toBe('number');
      expect(user.learning_streak_days).toBeGreaterThanOrEqual(0);
      expect(['Online', 'Focused', 'Away']).toContain(user.status);
      expect(['emerald', 'indigo', 'amber', 'purple', 'blue']).toContain(user.color_theme);
    });
  });
});
