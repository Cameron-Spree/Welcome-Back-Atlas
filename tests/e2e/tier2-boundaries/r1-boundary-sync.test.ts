/**
 * Tier 2 Boundary Test Suite: R1 - Profile Switching & Real-Time Sync Boundaries
 * Covers rapid user switches, socket reconnects, malformed events, concurrent status updates, and edge payloads.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { startTestServer, TestServerInstance } from '../helpers/testServer.js';
import { createTeamVirtualClients, TeamClients, VirtualSocketClient } from '../helpers/socketClient.js';

describe('Tier 2 — Boundary: R1 Profile Switching & Real-Time Sync', () => {
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

  it('1. Rapid consecutive user status updates without corrupting state or race conditions', async () => {
    const userId = 'user-cam';
    const statuses: Array<'Online' | 'Focused' | 'Away'> = ['Online', 'Focused', 'Away', 'Focused', 'Online'];

    for (const status of statuses) {
      const statusPromise = clients.liam.waitForEvent<any>('user:status_changed', 3000);
      clients.cam.emit('user:update_status', {
        userId,
        status,
        statusMessage: `Status is now ${status}`,
      });
      const received = await statusPromise;
      expect(received).toBeDefined();
      expect(received.userId).toBe(userId);
      expect(received.status).toBe(status);
    }

    // Verify final state in database via REST API
    const res = await serverInstance.request.get('/api/users');
    expect(res.status).toBe(200);
    const cam = res.body.find((u: any) => u.id === userId || u.name === 'Cam');
    expect(cam?.status).toBe('Online');
  });

  it('2. Concurrent status updates from multiple connected clients (Cam, Liam, Alex) broadcast cleanly', async () => {
    const camPromise = clients.alex.waitForEvent<any>('user:status_changed', 4000);
    const liamPromise = clients.cam.waitForEvent<any>('user:status_changed', 4000);
    const alexPromise = clients.liam.waitForEvent<any>('user:status_changed', 4000);

    // Concurrently trigger status updates from all three users via REST
    await Promise.all([
      serverInstance.request
        .patch('/api/users/user-cam/status')
        .send({ status: 'Focused', statusMessage: 'Cam in deep focus mode' }),
      serverInstance.request
        .patch('/api/users/user-liam/status')
        .send({ status: 'Away', statusMessage: 'Liam stepped out for coffee' }),
      serverInstance.request
        .patch('/api/users/user-alex/status')
        .send({ status: 'Online', statusMessage: 'Alex ready for reviews' }),
    ]);

    // Verify all clients are updated in the DB
    const resUsers = await serverInstance.request.get('/api/users');
    expect(resUsers.status).toBe(200);
    const users = resUsers.body;
    const cam = users.find((u: any) => u.id === 'user-cam' || u.name === 'Cam');
    const liam = users.find((u: any) => u.id === 'user-liam' || u.name === 'Liam');
    const alex = users.find((u: any) => u.id === 'user-alex' || u.name === 'Alex');

    expect(cam?.status).toBe('Focused');
    expect(liam?.status).toBe('Away');
    expect(alex?.status).toBe('Online');
  });

  it('3. Rejects or gracefully handles invalid status values in user status update requests', async () => {
    const invalidStatuses = ['Invisible', 'Busy', 'idle', 'UNKNOWN_STATUS', '', null, 12345];

    for (const invalidStatus of invalidStatuses) {
      const res = await serverInstance.request
        .patch('/api/users/user-cam/status')
        .send({ status: invalidStatus, statusMessage: 'Testing invalid' });

      // Must be rejected with 400 Bad Request or 422 Unprocessable Entity
      expect([400, 422]).toContain(res.status);
    }

    // Cam status must remain one of the valid enum values
    const resUser = await serverInstance.request.get('/api/users');
    const cam = resUser.body.find((u: any) => u.id === 'user-cam' || u.name === 'Cam');
    expect(['Online', 'Focused', 'Away']).toContain(cam?.status);
  });

  it('4. Rejects or returns 404 for status updates targeting non-existent user IDs', async () => {
    const nonExistentUsers = ['ghost_user', 'anonymous_999', 'admin', 'root', 'user-unknown-999'];

    for (const fakeId of nonExistentUsers) {
      const res = await serverInstance.request
        .patch(`/api/users/${fakeId}/status`)
        .send({ status: 'Online', statusMessage: 'Should fail' });

      expect([404, 400]).toContain(res.status);
    }
  });

  it('5. Socket disconnection, reconnect, and full state re-synchronization without dropping events', async () => {
    // 1. Liam disconnects
    clients.liam.disconnect();

    // 2. Cam updates status while Liam is offline
    await serverInstance.request
      .patch('/api/users/user-cam/status')
      .send({ status: 'Focused', statusMessage: 'Updated while peer offline' });

    // 3. Liam reconnects
    const reconnectedLiam = new VirtualSocketClient(serverInstance.url, { userId: 'user-liam' });
    await reconnectedLiam.connect();

    // 4. Liam fetches full sync state upon reconnect
    const syncRes = await serverInstance.request.get('/api/sync/state');
    expect(syncRes.status).toBe(200);
    expect(syncRes.body).toHaveProperty('users');
    const syncedCam = syncRes.body.users.find((u: any) => u.id === 'user-cam' || u.name === 'Cam');
    expect(syncedCam.status).toBe('Focused');

    // 5. Reconnected socket should now receive live broadcasts normally
    const liveUpdatePromise = reconnectedLiam.waitForEvent<any>('user:status_changed', 3000);
    clients.cam.emit('user:update_status', {
      userId: 'user-cam',
      status: 'Online',
      statusMessage: 'Back online!',
    });
    const broadcastEvent = await liveUpdatePromise;
    expect(broadcastEvent.status).toBe('Online');

    reconnectedLiam.disconnect();
  });

  it('6. Preserves status messages containing unicode emojis, multiline text, and special HTML characters', async () => {
    const complexMessage = '🚀 Launching v2.0! <script>alert("test")</script> & "quotes" 日本語 🔥 100%';

    const statusPromise = clients.liam.waitForEvent<any>('user:status_changed', 3000);
    const res = await serverInstance.request
      .patch('/api/users/user-alex/status')
      .send({ status: 'Focused', statusMessage: complexMessage });

    expect(res.status).toBe(200);
    expect(res.body.status_message || res.body.statusMessage).toBe(complexMessage);

    const receivedEvent = await statusPromise;
    expect(receivedEvent.statusMessage || receivedEvent.status_message).toBe(complexMessage);

    const checkRes = await serverInstance.request.get('/api/users');
    const alex = checkRes.body.find((u: any) => u.id === 'user-alex' || u.name === 'Alex');
    expect(alex?.status_message || alex?.statusMessage).toBe(complexMessage);
  });

  it('7. Handles malformed non-object or empty payload in socket events without crashing the server', async () => {
    // Send various malformed payloads via socket
    clients.cam.emit('user:update_status', null);
    clients.cam.emit('user:update_status', 'invalid-string-payload');
    clients.cam.emit('user:update_status', 12345);
    clients.cam.emit('user:update_status', {});
    clients.cam.emit('user:update_status', { userId: '' });

    // Ensure server is still alive and responsive
    const pingRes = await serverInstance.request.get('/api/users');
    expect(pingRes.status).toBe(200);
    expect(Array.isArray(pingRes.body)).toBe(true);
    expect(pingRes.body.length).toBeGreaterThanOrEqual(3);
  });
});
