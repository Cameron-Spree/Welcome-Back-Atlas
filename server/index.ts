import express, { Express, Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import cors from 'cors';
import { config } from './config.js';
import { initDatabase } from './db/database.js';
import { seedDatabaseIfEmpty } from './db/seed.js';
import { apiRouter } from './routes/index.js';
import { setupSocketHandlers } from './sockets/socketHandler.js';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from './sockets/socketEvents.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createServerApp() {
  const app: Express = express();
  const server = http.createServer(app);

  // 1. Initialize Socket.io with permissive CORS and fallback transports
  const io = new SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 20000,
    pingInterval: 25000,
  });

  // Make io accessible to route handlers via app.locals
  app.locals.io = io;

  // 2. CORS Middleware for Express HTTP endpoints
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  }));

  // 3. Body parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 4. Request logging middleware (dev only)
  if (config.nodeEnv === 'development') {
    app.use((req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
      });
      next();
    });
  }

  // 5. Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      clients: io.engine.clientsCount,
    });
  });

  // 6. Mount REST API Router
  app.use('/api', apiRouter);

  // 7. Production Static Files Serving & SPA Fallback
  const distPath = path.resolve(__dirname, '../../dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response, next: NextFunction) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
        return next();
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // 8. 404 Handler for API routes
  app.use('/api/*', (req: Request, res: Response) => {
    res.status(404).json({
      error: 'Not Found',
      message: `API endpoint ${req.method} ${req.originalUrl} does not exist.`,
    });
  });

  // 9. Centralized Error Handling Middleware
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (config.nodeEnv !== 'test') {
      console.error(`[Unhandled Error] ${req.method} ${req.originalUrl}:`, err);
    }
    const statusCode = err.status || err.statusCode || 500;
    res.status(statusCode).json({
      error: err.name || 'InternalServerError',
      message: err.message || 'An unexpected internal server error occurred.',
      ...(config.nodeEnv === 'development' ? { stack: err.stack } : {}),
    });
  });

  // 10. Attach Socket.io Event Handlers
  setupSocketHandlers(io);

  return { app, server, io };
}

// Start Server Routine
export async function startServer() {
  try {
    initDatabase();
    seedDatabaseIfEmpty();

    const { server } = createServerApp();

    server.listen(config.port, config.host, () => {
      console.log(`=======================================================`);
      console.log(`  Atlas Real-Time Server running on http://${config.host}:${config.port}`);
      console.log(`  Mode: ${config.nodeEnv}`);
      console.log(`  SQLite DB: ${config.dbPath}`);
      console.log(`=======================================================`);
    });

    const shutdown = (signal: string) => {
      console.log(`\nReceived ${signal}. Shutting down gracefully...`);
      server.close(() => {
        console.log('HTTP and WebSocket servers closed.');
        process.exit(0);
      });
      setTimeout(() => {
        console.error('Forcing shutdown after timeout.');
        process.exit(1);
      }, 5000);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    return server;
  } catch (error) {
    console.error('Fatal error during server startup:', error);
    process.exit(1);
  }
}

// Auto-run if executed directly in non-test mode
if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
  startServer();
}

export default { createServerApp, startServer };
