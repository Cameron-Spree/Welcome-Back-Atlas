/**
 * Test Server Harness for Welcome Back Atlas
 * Dynamically spins up isolated Express + Socket.io servers with temporary SQLite databases
 */
import http from 'http';
import path from 'path';
import fs from 'fs';
import { AddressInfo } from 'net';
import request, { SuperTest, Test } from 'supertest';
import { Server as SocketIOServer } from 'socket.io';
import { Express } from 'express';

export interface TestServerInstance {
  app: Express;
  server: http.Server;
  io: SocketIOServer;
  url: string;
  port: number;
  dbPath: string;
  db: any;
  request: SuperTest<Test>;
  close: () => Promise<void>;
  resetDb: () => Promise<void>;
}

/**
 * Start an isolated test server instance with its own SQLite database
 */
export async function startTestServer(): Promise<TestServerInstance> {
  const tmpDir = path.resolve(process.cwd(), '.tmp-tests');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  const uniqueId = `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const dbPath = path.join(tmpDir, `${uniqueId}.sqlite`);
  process.env.DATABASE_PATH = dbPath;
  process.env.DB_PATH = dbPath;
  process.env.NODE_ENV = 'test';
  process.env.PORT = '0';

  let app: Express;
  let server: http.Server;
  let io: SocketIOServer;
  let db: any;
  let initDatabaseFn: any;
  let seedDatabaseFn: any;
  let closeDatabaseFn: any;

  try {
    // Dynamic import of server modules
    const dbModule = await import('../../../server/db/database.js');
    const seedModule = await import('../../../server/db/seed.js');
    const serverModule = await import('../../../server/index.js');

    initDatabaseFn = dbModule.initDatabase;
    seedDatabaseFn = seedModule.seedDatabaseIfEmpty;
    closeDatabaseFn = dbModule.closeDatabase;

    // Initialize isolated SQLite database
    db = initDatabaseFn(dbPath);
    seedDatabaseFn(db);

    if (typeof serverModule.createServerApp === 'function') {
      const created = serverModule.createServerApp();
      app = created.app;
      server = created.server;
      io = created.io;
    } else if (serverModule.default && typeof serverModule.default.createServerApp === 'function') {
      const created = serverModule.default.createServerApp();
      app = created.app;
      server = created.server;
      io = created.io;
    } else {
      throw new Error('Could not find createServerApp in server/index.js');
    }
  } catch (importErr: any) {
    // If TypeScript or direct path resolution requires fallback (e.g. tsx execution)
    try {
      const dbModule = await import('../../../server/db/database.ts');
      const seedModule = await import('../../../server/db/seed.ts');
      const serverModule = await import('../../../server/index.ts');

      initDatabaseFn = dbModule.initDatabase;
      seedDatabaseFn = seedModule.seedDatabaseIfEmpty;
      closeDatabaseFn = dbModule.closeDatabase;

      db = initDatabaseFn(dbPath);
      seedDatabaseFn(db);

      const created = (serverModule.createServerApp || serverModule.default?.createServerApp)();
      app = created.app;
      server = created.server;
      io = created.io;
    } catch (fallbackErr: any) {
      throw new Error(`Failed to load server modules: ${importErr.message} / ${fallbackErr.message}`);
    }
  }

  // Bind to ephemeral port
  await new Promise<void>((resolve, reject) => {
    server.listen(0, '127.0.0.1', () => {
      resolve();
    });
    server.on('error', (err) => {
      reject(err);
    });
  });

  const address = server.address() as AddressInfo;
  const port = address.port;
  const url = `http://127.0.0.1:${port}`;
  const supertestAgent = request(app);

  const resetDb = async () => {
    if (db) {
      try {
        const schemaPath = path.resolve(process.cwd(), 'server/db/schema.sql');
        if (fs.existsSync(schemaPath)) {
          const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
          db.exec(schemaSql);
          seedDatabaseFn(db);
        }
      } catch (err) {
        console.error('Error resetting database:', err);
      }
    }
  };

  const close = async () => {
    return new Promise<void>((resolve) => {
      // Close Socket.io
      if (io) {
        io.close();
      }

      // Close HTTP server
      if (server && server.listening) {
        server.close(() => {
          // Close Database
          if (closeDatabaseFn) {
            try {
              closeDatabaseFn();
            } catch {}
          }
          // Clean up temp database file
          try {
            if (fs.existsSync(dbPath)) {
              fs.unlinkSync(dbPath);
            }
            if (fs.existsSync(`${dbPath}-wal`)) {
              fs.unlinkSync(`${dbPath}-wal`);
            }
            if (fs.existsSync(`${dbPath}-shm`)) {
              fs.unlinkSync(`${dbPath}-shm`);
            }
          } catch {}
          resolve();
        });
      } else {
        if (closeDatabaseFn) {
          try {
            closeDatabaseFn();
          } catch {}
        }
        resolve();
      }
    });
  };

  return {
    app,
    server,
    io,
    url,
    port,
    dbPath,
    db,
    request: supertestAgent,
    close,
    resetDb,
  };
}
