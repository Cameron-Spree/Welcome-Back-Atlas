import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from 'http';
import express from 'express';
import { Server } from 'socket.io';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { initDatabase, closeDatabase } from '../../server/db/database.js';
import { seedDatabase } from '../../server/db/seed.js';
import { socketHandler } from '../../server/sockets/socketHandler.js';

describe('Socket.io Real-Time Synchronization Server', () => {
  let ioServer: Server;
  let httpServer: any;
  let client1: ClientSocket;
  let client2: ClientSocket;
  let port: number;

  beforeAll(async () => {
    initDatabase(':memory:');
    seedDatabase(true);

    const app = express();
    httpServer = createServer(app);
    ioServer = new Server(httpServer, {
      cors: { origin: '*' },
    });
    socketHandler.init(ioServer as any);

    await new Promise<void>((resolve) => {
      httpServer.listen(0, '127.0.0.1', () => {
        port = httpServer.address().port;
        resolve();
      });
    });

    client1 = Client(`http://127.0.0.1:${port}`, {
      auth: { userId: 'user-cam' },
    });
    client2 = Client(`http://127.0.0.1:${port}`, {
      auth: { userId: 'user-liam' },
    });

    await Promise.all([
      new Promise<void>((resolve) => client1.on('connect', () => resolve())),
      new Promise<void>((resolve) => client2.on('connect', () => resolve())),
    ]);
  });

  afterAll(async () => {
    client1?.disconnect();
    client2?.disconnect();
    if (ioServer) ioServer.close();
    if (httpServer) httpServer.close();
    closeDatabase();
  });

  it('broadcasts user:status_changed to peers when status is updated', async () => {
    const statusPromise = new Promise<any>((resolve) => {
      client2.once('user:status_changed', (payload) => resolve(payload));
    });

    client1.emit('user:update_status', {
      userId: 'user-cam',
      status: 'Away',
      statusMessage: 'In a meeting',
    });

    const received = await statusPromise;
    expect(received.userId).toBe('user-cam');
    expect(received.status).toBe('Away');
  });

  it('broadcasts task:moved to peers when task position shifts', async () => {
    const movePromise = new Promise<any>((resolve) => {
      client1.once('task:moved', (payload) => resolve(payload));
    });

    client2.emit('task:move', {
      taskId: 'task-1',
      status: 'done',
      start_date: '2026-08-20',
      end_date: '2026-08-24',
      userId: 'user-liam',
    });

    const received = await movePromise;
    expect(received.task.id).toBe('task-1');
    expect(received.task.status).toBe('done');
  });

  it('broadcasts credits:updated when credits change', async () => {
    const creditsPromise = new Promise<any>((resolve) => {
      client2.once('credits:updated', (payload) => resolve(payload));
    });

    socketHandler.broadcast('credits:updated', {
      creditBalance: 150,
      delta: 50,
      reason: 'Topup',
      userId: 'user-cam',
    });

    const received = await creditsPromise;
    expect(received.creditBalance).toBe(150);
    expect(received.delta).toBe(50);
  });
});
