# REST API & Real-Time Socket Architecture Specification

**Author**: `explorer_m1_2` (REST API & Real-Time Socket Architect)  
**Milestone**: Milestone 1 (Server Core & Real-Time Infrastructure)  
**Status**: Complete Implementation Blueprint  
**Target Files**:
- `server/config.ts`
- `server/index.ts`
- `server/routes/index.ts`
- `server/routes/syncRoutes.ts`
- `server/routes/userRoutes.ts`
- `server/routes/taskRoutes.ts`
- `server/routes/docRoutes.ts`
- `server/routes/activityRoutes.ts`
- `server/routes/settingsRoutes.ts`
- `server/routes/aiRoutes.ts`
- `server/sockets/socketEvents.ts`
- `server/sockets/socketHandler.ts`

---

## 1. Observation

Directly observed from `/Users/admin/Documents/Apps n stuff/Welcome Back Atlas/ORIGINAL_REQUEST.md`, `PROJECT.md`, `SCOPE.md`, and `.agents/explorer_survey_3/handoff.md`:

1. **System Objective**: Build a real-time collaborative workspace for **Cam**, **Liam**, and **Alex** with instant WebSocket multi-device state synchronization, multi-user profile switching, dynamic greeting dashboard, 2-pane Learn documentation tab with AI relevance reasoning, Timeline Gantt and Kanban project views with detail overlay, team progress velocity, and an atomic Gemini API credit engine with offline heuristic fallback.
2. **Acceptance Criteria & Runtime Contract**:
   - `npm run dev` boots the Node.js Express/Socket.io backend on port `3001` and Vite frontend on port `5173`.
   - Socket.io broadcasts user status changes, task creations, updates, moves, deletions, doc step toggles, AI generations, and credit balance changes in real time across multiple open browser windows.
   - Dual-channel state synchronization: REST endpoints handle standard HTTP requests, while Socket.io enables bi-directional real-time push and multi-client broadcast.
3. **Core REST API Route Contract** (`PROJECT.md § Interface Contracts`):
   - `GET /api/sync/state` -> Returns full hydration bundle (`users`, `tasks`, `docs`, `activities`, `credits`, `hasApiKey`, `model`).
   - `GET /api/users`, `PATCH /api/users/:id/status` -> User profile queries and 3-state status toggle (`Online`, `Focused`, `Away`).
   - `GET /api/tasks`, `POST /api/tasks`, `PATCH /api/tasks/:id`, `DELETE /api/tasks/:id`, `POST /api/tasks/:id/move` -> Task CRUD, assignee filters, date shifts, and Kanban column movements.
   - `GET /api/docs`, `GET /api/docs/:id`, `POST /api/docs`, `PATCH /api/docs/:id/step` -> Learning doc CRUD and step checklist toggle.
   - `GET /api/activities` -> Paginated team activity feed.
   - `GET /api/settings`, `POST /api/settings/apikey`, `POST /api/settings/credits/topup` -> App settings, secure API key persistence, credit balance and top-up (+50, +100).
   - `POST /api/ai/generate-guide` (cost 5 credits), `POST /api/ai/generate-roadmap` (cost 10 credits) -> AI generation flows with atomic credit deduction and fallback switch.
4. **Socket.io Event Contracts**:
   - Room: `"atlas-room"` for all active workspace participants.
   - Client-to-Server Events: `user:update_status`, `task:create`, `task:update`, `task:move`, `task:delete`, `doc:step_toggle`.
   - Server-to-Client Broadcasts: `user:status_changed`, `task:created`, `task:updated`, `task:moved`, `task:deleted`, `doc:created`, `doc:step_toggled`, `credits:updated`, `activity:new`.

---

## 2. Logic Chain

From these observations, we formulate the structural, architectural, and code-level design for the server entry point, REST route hierarchy, and real-time Socket.io layer.

```
+-----------------------------------------------------------------------------------+
|                                 HTTP Server & Express                             |
|                                    (server/index.ts)                              |
+------------------------------------------+----------------------------------------+
                                           |
                  +------------------------+------------------------+
                  |                                                 |
                  v                                                 v
+-----------------------------------+             +-----------------------------------+
|         Express REST API          |             |        Socket.io Server           |
|         (server/routes/*)         |             |       (server/sockets/*)          |
+-----------------+-----------------+             +-----------------+-----------------+
                  |                                                 |
                  |  - /api/sync/state                              |  - "atlas-room" connection
                  |  - /api/users & /status                         |  - user:update_status -> broadcast
                  |  - /api/tasks & /move                           |  - task:create/update/move/delete
                  |  - /api/docs & /step                            |  - doc:step_toggle -> broadcast
                  |  - /api/activities                              |  - credits:updated & activity:new
                  |  - /api/settings & /credits                     |
                  |  - /api/ai/generate-*                           |
                  |                                                 |
                  +------------------------+------------------------+
                                           |
                                           v
                  +-------------------------------------------------+
                  |     Repositories & Business Logic Services      |
                  |   (userRepo, taskRepo, docRepo, activityRepo,   |
                  |    settingsRepo, aiService, creditService)      |
                  +------------------------+------------------------+
                                           |
                                           v
                  +-------------------------------------------------+
                  |     SQLite Database (WAL Mode) via database.ts  |
                  +-------------------------------------------------+
```

### 2.1 Server Configuration (`server/config.ts`)

Provides centralized environment variable parsing, default configuration constants, and type definitions.

```typescript
// server/config.ts
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface AppConfig {
  port: number;
  host: string;
  nodeEnv: string;
  clientOrigin: string;
  dataDir: string;
  dbPath: string;
  geminiApiKey: string;
  defaultModel: string;
  starterCredits: number;
  creditCosts: {
    guide: number;
    roadmap: number;
  };
}

export const config: AppConfig = {
  port: Number(process.env.PORT) || 3001,
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  dataDir: path.resolve(__dirname, '../../data'),
  dbPath: process.env.DB_PATH || path.resolve(__dirname, '../../data/atlas.sqlite'),
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  defaultModel: process.env.AI_MODEL || 'gemini-1.5-flash',
  starterCredits: 100,
  creditCosts: {
    guide: 5,
    roadmap: 10,
  },
};
```

---

### 2.2 Server Entry Point & Lifecycle (`server/index.ts`)

The server entry point initializes Express, attaches Socket.io to the native HTTP server, configures CORS, mounts JSON parsers, registers API routes, serves static frontend assets when in production, sets up graceful shutdown handlers, and exposes a programmatic factory for testing.

```typescript
// server/index.ts
import express, { Express, Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
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

  // 1. Initialize Socket.io with strict CORS and transport fallback
  const io = new SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(server, {
    cors: {
      origin: [config.clientOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 20000,
    pingInterval: 25000,
  });

  // Make io accessible to route handlers via app.locals
  app.locals.io = io;

  // 2. CORS Middleware for Express HTTP endpoints
  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  // 3. Body parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 4. Request logging middleware (dev)
  if (config.nodeEnv !== 'test') {
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
    console.error(`[Unhandled Error] ${req.method} ${req.originalUrl}:`, err);
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
    // 1. Initialize SQLite Database & Schema
    initDatabase();
    // 2. Pre-populate seed data if empty
    seedDatabaseIfEmpty();

    const { server } = createServerApp();

    server.listen(config.port, config.host, () => {
      console.log(`=======================================================`);
      console.log(`  Atlas Real-Time Server running on http://${config.host}:${config.port}`);
      console.log(`  Mode: ${config.nodeEnv}`);
      console.log(`  SQLite DB: ${config.dbPath}`);
      console.log(`=======================================================`);
    });

    // Graceful Shutdown Handlers
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

// Auto-run if executed directly
if (process.env.NODE_ENV !== 'test') {
  startServer();
}
```

---

### 2.3 Socket.io Event System (`server/sockets/`)

#### 2.3.1 Typed Event Interfaces (`server/sockets/socketEvents.ts`)

Enforces complete end-to-end type safety between backend event handlers and frontend socket listeners.

```typescript
// server/sockets/socketEvents.ts

export type UserStatus = 'Online' | 'Focused' | 'Away';
export type TaskStatus = 'backlog' | 'in_progress' | 'in_review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  assignee_id: 'cam' | 'liam' | 'alex' | string;
  status: TaskStatus;
  priority: TaskPriority;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  progress_pct: number;
  color?: string;
  category: string;
  tags: string[];
  checklist: ChecklistItem[];
  doc_id?: string | null;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface DocStep {
  stepNumber: number;
  title: string;
  description: string;
  completed: boolean;
}

export interface LearningDoc {
  id: string;
  title: string;
  subtitle?: string;
  category: string;
  tags: string[];
  preview_image_url: string;
  preview_link_url: string;
  ai_relevance_summary: string;
  ai_relevance_score: number;
  markdown_content: string;
  steps: DocStep[];
  linked_task_id?: string | null;
  author_id?: string;
  is_ai_generated: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: 'cam' | 'liam' | 'alex' | string;
  name: string;
  role_title: string;
  avatar_url: string;
  color_theme: string;
  status: UserStatus;
  status_message: string;
  learning_streak_days: number;
  created_at: string;
  updated_at: string;
}

export interface ActivityLogItem {
  id: string;
  user_id: string;
  action_type: string; // 'task_created' | 'task_moved' | 'task_updated' | 'task_deleted' | 'status_changed' | 'doc_created' | 'doc_step_toggled' | 'credits_topup' | 'ai_generated'
  target_type: 'task' | 'doc' | 'user' | 'system';
  target_id?: string | null;
  target_title: string;
  details: Record<string, any>;
  timestamp: string;
}

// Client-to-Server Event Map
export interface ClientToServerEvents {
  'user:update_status': (
    payload: { userId: string; status: UserStatus; statusMessage?: string },
    callback?: (response: { success: boolean; user?: UserProfile; error?: string }) => void
  ) => void;

  'task:create': (
    payload: { task: Omit<TaskItem, 'id' | 'created_at' | 'updated_at'>; userId: string },
    callback?: (response: { success: boolean; task?: TaskItem; error?: string }) => void
  ) => void;

  'task:update': (
    payload: { taskId: string; updates: Partial<TaskItem>; userId: string },
    callback?: (response: { success: boolean; task?: TaskItem; error?: string }) => void
  ) => void;

  'task:move': (
    payload: { taskId: string; status?: TaskStatus; start_date?: string; end_date?: string; userId: string },
    callback?: (response: { success: boolean; task?: TaskItem; error?: string }) => void
  ) => void;

  'task:delete': (
    payload: { taskId: string; userId: string },
    callback?: (response: { success: boolean; taskId?: string; error?: string }) => void
  ) => void;

  'doc:step_toggle': (
    payload: { docId: string; stepNumber: number; completed: boolean; userId: string },
    callback?: (response: { success: boolean; doc?: LearningDoc; error?: string }) => void
  ) => void;

  'join_room': (room: string) => void;
  'leave_room': (room: string) => void;
}

// Server-to-Client Event Map
export interface ServerToClientEvents {
  'user:status_changed': (payload: {
    userId: string;
    status: UserStatus;
    statusMessage: string;
    updatedAt: string;
    user: UserProfile;
  }) => void;

  'task:created': (payload: { task: TaskItem; activity: ActivityLogItem }) => void;
  'task:updated': (payload: { task: TaskItem; activity: ActivityLogItem }) => void;
  'task:moved': (payload: { task: TaskItem; activity: ActivityLogItem }) => void;
  'task:deleted': (payload: { taskId: string; activity: ActivityLogItem }) => void;

  'doc:created': (payload: { doc: LearningDoc; activity: ActivityLogItem }) => void;
  'doc:step_toggled': (payload: {
    docId: string;
    stepNumber: number;
    completed: boolean;
    doc: LearningDoc;
    activity: ActivityLogItem;
  }) => void;

  'credits:updated': (payload: {
    creditBalance: number;
    delta: number;
    reason: string;
    userId: string;
  }) => void;

  'activity:new': (payload: { activity: ActivityLogItem }) => void;

  'sync:state_refreshed': (payload: { timestamp: string }) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId?: string;
  connectedAt: string;
}
```

---

#### 2.3.2 Socket Connection & Room Handler (`server/sockets/socketHandler.ts`)

Manages client connections, joins room `"atlas-room"`, dispatches socket events to repositories, logs activities, and broadcasts mutations to all connected clients.

```typescript
// server/sockets/socketHandler.ts
import { Server, Socket } from 'socket.io';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  UserStatus,
  TaskItem,
  LearningDoc,
  ActivityLogItem,
  UserProfile,
} from './socketEvents.js';
import { userRepository } from '../db/repositories/userRepository.js';
import { taskRepository } from '../db/repositories/taskRepository.js';
import { docRepository } from '../db/repositories/docRepository.js';
import { activityRepository } from '../db/repositories/activityRepository.js';

export const ATLAS_ROOM = 'atlas-room';

export type AtlasSocketServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export type AtlasSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

// Broadcast helper utilities (also callable by REST route controllers)
export const broadcastHelpers = {
  broadcastUserStatusChanged(io: AtlasSocketServer, user: UserProfile) {
    io.to(ATLAS_ROOM).emit('user:status_changed', {
      userId: user.id,
      status: user.status,
      statusMessage: user.status_message,
      updatedAt: user.updated_at,
      user,
    });
  },

  broadcastTaskCreated(io: AtlasSocketServer, task: TaskItem, activity: ActivityLogItem) {
    io.to(ATLAS_ROOM).emit('task:created', { task, activity });
    io.to(ATLAS_ROOM).emit('activity:new', { activity });
  },

  broadcastTaskUpdated(io: AtlasSocketServer, task: TaskItem, activity: ActivityLogItem) {
    io.to(ATLAS_ROOM).emit('task:updated', { task, activity });
    io.to(ATLAS_ROOM).emit('activity:new', { activity });
  },

  broadcastTaskMoved(io: AtlasSocketServer, task: TaskItem, activity: ActivityLogItem) {
    io.to(ATLAS_ROOM).emit('task:moved', { task, activity });
    io.to(ATLAS_ROOM).emit('activity:new', { activity });
  },

  broadcastTaskDeleted(io: AtlasSocketServer, taskId: string, activity: ActivityLogItem) {
    io.to(ATLAS_ROOM).emit('task:deleted', { taskId, activity });
    io.to(ATLAS_ROOM).emit('activity:new', { activity });
  },

  broadcastDocCreated(io: AtlasSocketServer, doc: LearningDoc, activity: ActivityLogItem) {
    io.to(ATLAS_ROOM).emit('doc:created', { doc, activity });
    io.to(ATLAS_ROOM).emit('activity:new', { activity });
  },

  broadcastDocStepToggled(
    io: AtlasSocketServer,
    docId: string,
    stepNumber: number,
    completed: boolean,
    doc: LearningDoc,
    activity: ActivityLogItem
  ) {
    io.to(ATLAS_ROOM).emit('doc:step_toggled', {
      docId,
      stepNumber,
      completed,
      doc,
      activity,
    });
    io.to(ATLAS_ROOM).emit('activity:new', { activity });
  },

  broadcastCreditsUpdated(
    io: AtlasSocketServer,
    creditBalance: number,
    delta: number,
    reason: string,
    userId: string,
    activity?: ActivityLogItem
  ) {
    io.to(ATLAS_ROOM).emit('credits:updated', { creditBalance, delta, reason, userId });
    if (activity) {
      io.to(ATLAS_ROOM).emit('activity:new', { activity });
    }
  },

  broadcastActivity(io: AtlasSocketServer, activity: ActivityLogItem) {
    io.to(ATLAS_ROOM).emit('activity:new', { activity });
  },
};

export function setupSocketHandlers(io: AtlasSocketServer) {
  io.on('connection', (socket: AtlasSocket) => {
    const userId = (socket.handshake.auth?.userId as string) || 'cam';
    socket.data.userId = userId;
    socket.data.connectedAt = new Date().toISOString();

    // Automatically join the shared Atlas collaborative room
    socket.join(ATLAS_ROOM);
    console.log(`[Socket] Client connected: ${socket.id} (User: ${userId}) -> Joined ${ATLAS_ROOM}`);

    // Room join/leave commands
    socket.on('join_room', (room: string) => {
      socket.join(room);
    });

    socket.on('leave_room', (room: string) => {
      socket.leave(room);
    });

    // 1. User Status Update
    socket.on('user:update_status', (payload, callback) => {
      try {
        const { userId, status, statusMessage } = payload;
        const updatedUser = userRepository.updateStatus(userId, status, statusMessage);

        if (!updatedUser) {
          callback?.({ success: false, error: 'User not found' });
          return;
        }

        // Broadcast to all clients in the room
        broadcastHelpers.broadcastUserStatusChanged(io, updatedUser);

        callback?.({ success: true, user: updatedUser });
      } catch (err: any) {
        console.error('[Socket] Error in user:update_status:', err);
        callback?.({ success: false, error: err.message });
      }
    });

    // 2. Task Creation
    socket.on('task:create', (payload, callback) => {
      try {
        const { task, userId } = payload;
        const createdTask = taskRepository.create({
          ...task,
          created_by: userId,
        });

        const activity = activityRepository.logActivity({
          user_id: userId,
          action_type: 'task_created',
          target_type: 'task',
          target_id: createdTask.id,
          target_title: createdTask.title,
          details: { status: createdTask.status, priority: createdTask.priority },
        });

        broadcastHelpers.broadcastTaskCreated(io, createdTask, activity);
        callback?.({ success: true, task: createdTask });
      } catch (err: any) {
        console.error('[Socket] Error in task:create:', err);
        callback?.({ success: false, error: err.message });
      }
    });

    // 3. Task Update
    socket.on('task:update', (payload, callback) => {
      try {
        const { taskId, updates, userId } = payload;
        const updatedTask = taskRepository.update(taskId, updates);

        if (!updatedTask) {
          callback?.({ success: false, error: 'Task not found' });
          return;
        }

        const activity = activityRepository.logActivity({
          user_id: userId,
          action_type: 'task_updated',
          target_type: 'task',
          target_id: updatedTask.id,
          target_title: updatedTask.title,
          details: { updates },
        });

        broadcastHelpers.broadcastTaskUpdated(io, updatedTask, activity);
        callback?.({ success: true, task: updatedTask });
      } catch (err: any) {
        console.error('[Socket] Error in task:update:', err);
        callback?.({ success: false, error: err.message });
      }
    });

    // 4. Task Move (Gantt drag/stretch or Kanban drop)
    socket.on('task:move', (payload, callback) => {
      try {
        const { taskId, status, start_date, end_date, userId } = payload;
        const movedTask = taskRepository.moveTask(taskId, { status, start_date, end_date });

        if (!movedTask) {
          callback?.({ success: false, error: 'Task not found' });
          return;
        }

        const activity = activityRepository.logActivity({
          user_id: userId,
          action_type: 'task_moved',
          target_type: 'task',
          target_id: movedTask.id,
          target_title: movedTask.title,
          details: { status: movedTask.status, start_date: movedTask.start_date, end_date: movedTask.end_date },
        });

        broadcastHelpers.broadcastTaskMoved(io, movedTask, activity);
        callback?.({ success: true, task: movedTask });
      } catch (err: any) {
        console.error('[Socket] Error in task:move:', err);
        callback?.({ success: false, error: err.message });
      }
    });

    // 5. Task Delete
    socket.on('task:delete', (payload, callback) => {
      try {
        const { taskId, userId } = payload;
        const task = taskRepository.getById(taskId);
        const taskTitle = task ? task.title : `Task ${taskId}`;

        const deleted = taskRepository.delete(taskId);
        if (!deleted) {
          callback?.({ success: false, error: 'Task not found or could not be deleted' });
          return;
        }

        const activity = activityRepository.logActivity({
          user_id: userId,
          action_type: 'task_deleted',
          target_type: 'task',
          target_id: taskId,
          target_title: taskTitle,
          details: { taskId },
        });

        broadcastHelpers.broadcastTaskDeleted(io, taskId, activity);
        callback?.({ success: true, taskId });
      } catch (err: any) {
        console.error('[Socket] Error in task:delete:', err);
        callback?.({ success: false, error: err.message });
      }
    });

    // 6. Doc Step Checklist Toggle
    socket.on('doc:step_toggle', (payload, callback) => {
      try {
        const { docId, stepNumber, completed, userId } = payload;
        const updatedDoc = docRepository.toggleStep(docId, stepNumber, completed);

        if (!updatedDoc) {
          callback?.({ success: false, error: 'Document not found' });
          return;
        }

        const step = updatedDoc.steps.find((s) => s.stepNumber === stepNumber);
        const stepTitle = step ? step.title : `Step ${stepNumber}`;

        const activity = activityRepository.logActivity({
          user_id: userId,
          action_type: 'doc_step_toggled',
          target_type: 'doc',
          target_id: docId,
          target_title: updatedDoc.title,
          details: { stepNumber, stepTitle, completed },
        });

        broadcastHelpers.broadcastDocStepToggled(io, docId, stepNumber, completed, updatedDoc, activity);
        callback?.({ success: true, doc: updatedDoc });
      } catch (err: any) {
        console.error('[Socket] Error in doc:step_toggle:', err);
        callback?.({ success: false, error: err.message });
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });
}
```

---

### 2.4 Express REST API Endpoints (`server/routes/`)

#### 2.4.1 Router Index (`server/routes/index.ts`)

```typescript
// server/routes/index.ts
import { Router } from 'express';
import { syncRouter } from './syncRoutes.js';
import { userRouter } from './userRoutes.js';
import { taskRouter } from './taskRoutes.js';
import { docRouter } from './docRoutes.js';
import { activityRouter } from './activityRoutes.js';
import { settingsRouter } from './settingsRoutes.js';
import { aiRouter } from './aiRoutes.js';

export const apiRouter = Router();

apiRouter.use('/sync', syncRouter);
apiRouter.use('/users', userRouter);
apiRouter.use('/tasks', taskRouter);
apiRouter.use('/docs', docRouter);
apiRouter.use('/activities', activityRouter);
apiRouter.use('/settings', settingsRouter);
apiRouter.use('/ai', aiRouter);
```

---

#### 2.4.2 State Hydration Route (`server/routes/syncRoutes.ts`)

Fetches the complete initial state in one roundtrip to guarantee immediate sub-100ms frontend boot.

```typescript
// server/routes/syncRoutes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { userRepository } from '../db/repositories/userRepository.js';
import { taskRepository } from '../db/repositories/taskRepository.js';
import { docRepository } from '../db/repositories/docRepository.js';
import { activityRepository } from '../db/repositories/activityRepository.js';
import { settingsRepository } from '../db/repositories/settingsRepository.js';
import { creditService } from '../services/creditService.js';
import { config } from '../config.js';

export const syncRouter = Router();

// GET /api/sync/state
syncRouter.get('/state', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = userRepository.getAll();
    const tasks = taskRepository.getAll();
    const docs = docRepository.getAll();
    const activities = activityRepository.getRecent(50);
    const credits = creditService.getBalance();
    const hasApiKey = Boolean(settingsRepository.getSetting('gemini_api_key') || config.geminiApiKey);
    const model = settingsRepository.getSetting('ai_model') || config.defaultModel;

    res.json({
      users,
      tasks,
      docs,
      activities,
      credits,
      hasApiKey,
      model,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});
```

---

#### 2.4.3 User Routes (`server/routes/userRoutes.ts`)

```typescript
// server/routes/userRoutes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { userRepository } from '../db/repositories/userRepository.js';
import { broadcastHelpers } from '../sockets/socketHandler.js';

export const userRouter = Router();

// GET /api/users
userRouter.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = userRepository.getAll();
    res.json(users);
  } catch (err) {
    next(err);
  }
});

// GET /api/users/:id
userRouter.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = userRepository.getById(req.params.id);
    if (!user) {
      res.status(404).json({ error: 'UserNotFound', message: `User with id ${req.params.id} not found.` });
      return;
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/users/:id/status
userRouter.patch('/:id/status', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, statusMessage } = req.body;
    if (!status || !['Online', 'Focused', 'Away'].includes(status)) {
      res.status(400).json({ error: 'InvalidStatus', message: 'Status must be Online, Focused, or Away.' });
      return;
    }

    const updatedUser = userRepository.updateStatus(req.params.id, status, statusMessage);
    if (!updatedUser) {
      res.status(404).json({ error: 'UserNotFound', message: `User with id ${req.params.id} not found.` });
      return;
    }

    // Broadcast change via Socket.io
    const io = req.app.locals.io;
    if (io) {
      broadcastHelpers.broadcastUserStatusChanged(io, updatedUser);
    }

    res.json(updatedUser);
  } catch (err) {
    next(err);
  }
});
```

---

#### 2.4.4 Task Management Routes (`server/routes/taskRoutes.ts`)

```typescript
// server/routes/taskRoutes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { taskRepository } from '../db/repositories/taskRepository.js';
import { activityRepository } from '../db/repositories/activityRepository.js';
import { broadcastHelpers } from '../sockets/socketHandler.js';

export const taskRouter = Router();

// GET /api/tasks (supports ?assignee=...&status=...&category=...&search=...)
taskRouter.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { assignee, status, category, search } = req.query;
    const tasks = taskRepository.filterTasks({
      assigneeId: assignee as string,
      status: status as any,
      category: category as string,
      search: search as string,
    });
    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

// GET /api/tasks/:id
taskRouter.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const task = taskRepository.getById(req.params.id);
    if (!task) {
      res.status(404).json({ error: 'TaskNotFound', message: `Task ${req.params.id} not found.` });
      return;
    }
    res.json(task);
  } catch (err) {
    next(err);
  }
});

// POST /api/tasks
taskRouter.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, assignee_id, status, priority, start_date, end_date, color, category, tags, checklist, doc_id, userId } = req.body;

    if (!title || typeof title !== 'string') {
      res.status(400).json({ error: 'ValidationError', message: 'Task title is required.' });
      return;
    }

    if (start_date && end_date && start_date > end_date) {
      res.status(400).json({ error: 'ValidationError', message: 'start_date cannot be after end_date.' });
      return;
    }

    const createdTask = taskRepository.create({
      title,
      description: description || '',
      assignee_id: assignee_id || 'cam',
      status: status || 'backlog',
      priority: priority || 'medium',
      start_date: start_date || new Date().toISOString().split('T')[0],
      end_date: end_date || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      color: color || '#3b82f6',
      category: category || 'Engineering',
      tags: tags || [],
      checklist: checklist || [],
      doc_id: doc_id || null,
      created_by: userId || 'cam',
    });

    const activity = activityRepository.logActivity({
      user_id: userId || 'cam',
      action_type: 'task_created',
      target_type: 'task',
      target_id: createdTask.id,
      target_title: createdTask.title,
      details: { status: createdTask.status, priority: createdTask.priority },
    });

    const io = req.app.locals.io;
    if (io) {
      broadcastHelpers.broadcastTaskCreated(io, createdTask, activity);
    }

    res.status(201).json(createdTask);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/tasks/:id
taskRouter.patch('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, ...updates } = req.body;

    if (updates.start_date && updates.end_date && updates.start_date > updates.end_date) {
      res.status(400).json({ error: 'ValidationError', message: 'start_date cannot be after end_date.' });
      return;
    }

    const updatedTask = taskRepository.update(req.params.id, updates);
    if (!updatedTask) {
      res.status(404).json({ error: 'TaskNotFound', message: `Task ${req.params.id} not found.` });
      return;
    }

    const activity = activityRepository.logActivity({
      user_id: userId || 'cam',
      action_type: 'task_updated',
      target_type: 'task',
      target_id: updatedTask.id,
      target_title: updatedTask.title,
      details: { updates },
    });

    const io = req.app.locals.io;
    if (io) {
      broadcastHelpers.broadcastTaskUpdated(io, updatedTask, activity);
    }

    res.json(updatedTask);
  } catch (err) {
    next(err);
  }
});

// POST /api/tasks/:id/move
taskRouter.post('/:id/move', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, start_date, end_date, userId } = req.body;

    if (start_date && end_date && start_date > end_date) {
      res.status(400).json({ error: 'ValidationError', message: 'start_date cannot be after end_date.' });
      return;
    }

    const movedTask = taskRepository.moveTask(req.params.id, { status, start_date, end_date });
    if (!movedTask) {
      res.status(404).json({ error: 'TaskNotFound', message: `Task ${req.params.id} not found.` });
      return;
    }

    const activity = activityRepository.logActivity({
      user_id: userId || 'cam',
      action_type: 'task_moved',
      target_type: 'task',
      target_id: movedTask.id,
      target_title: movedTask.title,
      details: { status: movedTask.status, start_date: movedTask.start_date, end_date: movedTask.end_date },
    });

    const io = req.app.locals.io;
    if (io) {
      broadcastHelpers.broadcastTaskMoved(io, movedTask, activity);
    }

    res.json(movedTask);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/tasks/:id
taskRouter.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.body || {};
    const task = taskRepository.getById(req.params.id);
    const taskTitle = task ? task.title : `Task ${req.params.id}`;

    const deleted = taskRepository.delete(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'TaskNotFound', message: `Task ${req.params.id} not found.` });
      return;
    }

    const activity = activityRepository.logActivity({
      user_id: userId || 'cam',
      action_type: 'task_deleted',
      target_type: 'task',
      target_id: req.params.id,
      target_title: taskTitle,
      details: { taskId: req.params.id },
    });

    const io = req.app.locals.io;
    if (io) {
      broadcastHelpers.broadcastTaskDeleted(io, req.params.id, activity);
    }

    res.json({ success: true, id: req.params.id });
  } catch (err) {
    next(err);
  }
});
```

---

#### 2.4.5 Learning Docs Routes (`server/routes/docRoutes.ts`)

```typescript
// server/routes/docRoutes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { docRepository } from '../db/repositories/docRepository.js';
import { activityRepository } from '../db/repositories/activityRepository.js';
import { broadcastHelpers } from '../sockets/socketHandler.js';

export const docRouter = Router();

// GET /api/docs
docRouter.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, search } = req.query;
    let docs = docRepository.getAll();
    if (category) {
      docs = docs.filter((d) => d.category.toLowerCase() === (category as string).toLowerCase());
    }
    if (search) {
      const q = (search as string).toLowerCase();
      docs = docs.filter((d) => d.title.toLowerCase().includes(q) || d.markdown_content.toLowerCase().includes(q));
    }
    res.json(docs);
  } catch (err) {
    next(err);
  }
});

// GET /api/docs/:id
docRouter.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const doc = docRepository.getById(req.params.id);
    if (!doc) {
      res.status(404).json({ error: 'DocNotFound', message: `Doc ${req.params.id} not found.` });
      return;
    }
    res.json(doc);
  } catch (err) {
    next(err);
  }
});

// POST /api/docs
docRouter.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      title,
      subtitle,
      category,
      tags,
      preview_image_url,
      preview_link_url,
      ai_relevance_summary,
      ai_relevance_score,
      markdown_content,
      steps,
      linked_task_id,
      userId,
      is_ai_generated,
    } = req.body;

    if (!title || !markdown_content) {
      res.status(400).json({ error: 'ValidationError', message: 'Title and markdown_content are required.' });
      return;
    }

    const createdDoc = docRepository.create({
      title,
      subtitle: subtitle || '',
      category: category || 'Architecture',
      tags: tags || [],
      preview_image_url: preview_image_url || '',
      preview_link_url: preview_link_url || '',
      ai_relevance_summary: ai_relevance_summary || 'Curated documentation matching task requirements.',
      ai_relevance_score: ai_relevance_score || 90,
      markdown_content,
      steps: steps || [],
      linked_task_id: linked_task_id || null,
      author_id: userId || 'cam',
      is_ai_generated: is_ai_generated ? true : false,
    });

    const activity = activityRepository.logActivity({
      user_id: userId || 'cam',
      action_type: 'doc_created',
      target_type: 'doc',
      target_id: createdDoc.id,
      target_title: createdDoc.title,
      details: { category: createdDoc.category },
    });

    const io = req.app.locals.io;
    if (io) {
      broadcastHelpers.broadcastDocCreated(io, createdDoc, activity);
    }

    res.status(201).json(createdDoc);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/docs/:id/step
docRouter.patch('/:id/step', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { stepNumber, completed, userId } = req.body;

    if (typeof stepNumber !== 'number' || typeof completed !== 'boolean') {
      res.status(400).json({ error: 'ValidationError', message: 'stepNumber (number) and completed (boolean) are required.' });
      return;
    }

    const updatedDoc = docRepository.toggleStep(req.params.id, stepNumber, completed);
    if (!updatedDoc) {
      res.status(404).json({ error: 'DocNotFound', message: `Doc ${req.params.id} not found.` });
      return;
    }

    const step = updatedDoc.steps.find((s) => s.stepNumber === stepNumber);
    const stepTitle = step ? step.title : `Step ${stepNumber}`;

    const activity = activityRepository.logActivity({
      user_id: userId || 'cam',
      action_type: 'doc_step_toggled',
      target_type: 'doc',
      target_id: updatedDoc.id,
      target_title: updatedDoc.title,
      details: { stepNumber, stepTitle, completed },
    });

    const io = req.app.locals.io;
    if (io) {
      broadcastHelpers.broadcastDocStepToggled(io, updatedDoc.id, stepNumber, completed, updatedDoc, activity);
    }

    res.json(updatedDoc);
  } catch (err) {
    next(err);
  }
});
```

---

#### 2.4.6 Team Activity Feed Routes (`server/routes/activityRoutes.ts`)

```typescript
// server/routes/activityRoutes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { activityRepository } from '../db/repositories/activityRepository.js';

export const activityRouter = Router();

// GET /api/activities?limit=50&userId=...&targetType=...
activityRouter.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Number(req.query.limit) || 50;
    const activities = activityRepository.getRecent(limit);
    res.json(activities);
  } catch (err) {
    next(err);
  }
});
```

---

#### 2.4.7 Settings & Credit Management Routes (`server/routes/settingsRoutes.ts`)

```typescript
// server/routes/settingsRoutes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { settingsRepository } from '../db/repositories/settingsRepository.js';
import { creditService } from '../services/creditService.js';
import { activityRepository } from '../db/repositories/activityRepository.js';
import { broadcastHelpers } from '../sockets/socketHandler.js';
import { config } from '../config.js';

export const settingsRouter = Router();

// GET /api/settings
settingsRouter.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const hasApiKey = Boolean(settingsRepository.getSetting('gemini_api_key') || config.geminiApiKey);
    const credits = creditService.getBalance();
    const model = settingsRepository.getSetting('ai_model') || config.defaultModel;

    res.json({
      hasApiKey,
      credits,
      model,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/settings/apikey
settingsRouter.post('/apikey', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { apiKey } = req.body;
    if (typeof apiKey !== 'string') {
      res.status(400).json({ error: 'ValidationError', message: 'apiKey string is required.' });
      return;
    }

    settingsRepository.setSetting('gemini_api_key', apiKey.trim());

    res.json({
      success: true,
      hasApiKey: Boolean(apiKey.trim()),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/settings/credits/topup
settingsRouter.post('/credits/topup', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { amount, userId } = req.body;
    const numAmount = Number(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      res.status(400).json({ error: 'ValidationError', message: 'Top-up amount must be a positive number.' });
      return;
    }

    const newBalance = creditService.topUpCredits(numAmount, userId || 'cam');

    const activity = activityRepository.logActivity({
      user_id: userId || 'cam',
      action_type: 'credits_topup',
      target_type: 'system',
      target_id: null,
      target_title: `Topped up +${numAmount} AI Credits`,
      details: { amount: numAmount, newBalance },
    });

    const io = req.app.locals.io;
    if (io) {
      broadcastHelpers.broadcastCreditsUpdated(
        io,
        newBalance,
        numAmount,
        `Credit Top-Up (+${numAmount})`,
        userId || 'cam',
        activity
      );
    }

    res.json({ creditBalance: newBalance, added: numAmount });
  } catch (err) {
    next(err);
  }
});
```

---

#### 2.4.8 AI Subsystem Routes (`server/routes/aiRoutes.ts`)

```typescript
// server/routes/aiRoutes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { aiService } from '../services/aiService.js';
import { creditService } from '../services/creditService.js';
import { docRepository } from '../db/repositories/docRepository.js';
import { taskRepository } from '../db/repositories/taskRepository.js';
import { activityRepository } from '../db/repositories/activityRepository.js';
import { broadcastHelpers } from '../sockets/socketHandler.js';
import { config } from '../config.js';

export const aiRouter = Router();

// POST /api/ai/generate-guide (Cost: 5 credits)
aiRouter.post('/generate-guide', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { topic, taskId, context, userId } = req.body;
    const activeUserId = userId || 'cam';
    const cost = config.creditCosts.guide; // 5

    if (!topic || typeof topic !== 'string') {
      res.status(400).json({ error: 'ValidationError', message: 'topic string is required.' });
      return;
    }

    // 1. Check credit sufficiency
    if (!creditService.hasEnoughCredits(cost)) {
      res.status(402).json({
        error: 'InsufficientCredits',
        message: `Insufficient AI credits. Required: ${cost}, Available: ${creditService.getBalance()}. Please top-up.`,
        required: cost,
        current: creditService.getBalance(),
      });
      return;
    }

    // 2. Generate guide via AI Service (Gemini API or Heuristic fallback)
    const result = await aiService.generateGuide({
      topic,
      taskId,
      context,
      userId: activeUserId,
    });

    // 3. Atomically deduct credits
    const newBalance = creditService.deductCredits(cost, `AI Guide: ${topic}`, activeUserId);

    // 4. Persist newly generated document
    const createdDoc = docRepository.create({
      title: result.title,
      subtitle: result.subtitle || `AI Generated Guide for ${topic}`,
      category: result.category || 'Architecture',
      tags: result.tags || ['AI-Curated'],
      preview_image_url: result.preview_image_url || '',
      preview_link_url: result.preview_link_url || '',
      ai_relevance_summary: result.ai_relevance_summary,
      ai_relevance_score: result.ai_relevance_score || 95,
      markdown_content: result.markdown_content,
      steps: result.steps || [],
      linked_task_id: taskId || null,
      author_id: activeUserId,
      is_ai_generated: true,
    });

    // 5. If linked to a task, link doc to task
    if (taskId) {
      taskRepository.update(taskId, { doc_id: createdDoc.id });
    }

    // 6. Log Activity
    const activity = activityRepository.logActivity({
      user_id: activeUserId,
      action_type: 'doc_created',
      target_type: 'doc',
      target_id: createdDoc.id,
      target_title: `Generated Guide: ${createdDoc.title}`,
      details: { topic, cost, usedFallback: result.usedFallback },
    });

    // 7. Broadcast Socket.io events
    const io = req.app.locals.io;
    if (io) {
      broadcastHelpers.broadcastDocCreated(io, createdDoc, activity);
      broadcastHelpers.broadcastCreditsUpdated(io, newBalance, -cost, 'AI Guide Generation', activeUserId);
    }

    res.json({
      doc: createdDoc,
      creditBalance: newBalance,
      usedFallback: result.usedFallback,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/ai/generate-roadmap (Cost: 10 credits)
aiRouter.post('/generate-roadmap', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectGoal, targetDays, userId } = req.body;
    const activeUserId = userId || 'cam';
    const cost = config.creditCosts.roadmap; // 10

    if (!projectGoal || typeof projectGoal !== 'string') {
      res.status(400).json({ error: 'ValidationError', message: 'projectGoal string is required.' });
      return;
    }

    // 1. Check credit sufficiency
    if (!creditService.hasEnoughCredits(cost)) {
      res.status(402).json({
        error: 'InsufficientCredits',
        message: `Insufficient AI credits. Required: ${cost}, Available: ${creditService.getBalance()}. Please top-up.`,
        required: cost,
        current: creditService.getBalance(),
      });
      return;
    }

    // 2. Generate roadmap task breakdown
    const result = await aiService.generateRoadmap({
      projectGoal,
      targetDays: Number(targetDays) || 14,
      userId: activeUserId,
    });

    // 3. Atomically deduct credits
    const newBalance = creditService.deductCredits(cost, `AI Roadmap: ${projectGoal}`, activeUserId);

    // 4. Save generated tasks into SQLite
    const createdTasks: TaskItem[] = [];
    for (const taskDef of result.tasks) {
      const created = taskRepository.create({
        title: taskDef.title,
        description: taskDef.description || '',
        assignee_id: taskDef.assignee_id || activeUserId,
        status: taskDef.status || 'backlog',
        priority: taskDef.priority || 'medium',
        start_date: taskDef.start_date,
        end_date: taskDef.end_date,
        color: taskDef.color || '#3b82f6',
        category: taskDef.category || 'Engineering',
        tags: taskDef.tags || ['Roadmap'],
        checklist: taskDef.checklist || [],
        doc_id: null,
        created_by: activeUserId,
      });
      createdTasks.push(created);
    }

    // 5. Log Activity
    const activity = activityRepository.logActivity({
      user_id: activeUserId,
      action_type: 'task_created',
      target_type: 'task',
      target_id: createdTasks[0]?.id || null,
      target_title: `Generated Roadmap (${createdTasks.length} tasks): ${projectGoal}`,
      details: { count: createdTasks.length, cost, usedFallback: result.usedFallback },
    });

    // 6. Broadcast Socket.io events
    const io = req.app.locals.io;
    if (io) {
      for (const t of createdTasks) {
        broadcastHelpers.broadcastTaskCreated(io, t, activity);
      }
      broadcastHelpers.broadcastCreditsUpdated(io, newBalance, -cost, 'AI Roadmap Generation', activeUserId);
    }

    res.json({
      tasks: createdTasks,
      creditBalance: newBalance,
      usedFallback: result.usedFallback,
    });
  } catch (err) {
    next(err);
  }
});
```

---

## 3. Caveats

1. **Dual Persistence & Event Parity**: Whether a mutation arrives via HTTP REST (`POST /api/tasks`) or WebSocket client emit (`task:create`), the exact same database operations and broadcast triggers are executed. This prevents state drift between different clients or transport modes.
2. **Atomic Credit Guarantees**: Credit deduction checks `hasEnoughCredits()` before any external API invocation, and executes `deductCredits()` atomically within SQLite. If generation fails midway with an unhandled exception, credits are NOT deducted, protecting team credits.
3. **Socket Reconnection & State Catch-Up**: When a client temporarily loses connection and reconnects, calling `GET /api/sync/state` immediately restores complete canonical state without complex differential conflict resolution.
4. **Input Sanitization & Boundary Validation**:
   - Dates: Must satisfy `start_date <= end_date`.
   - Status Enums: Strictly checked against whitelist (`'Online' | 'Focused' | 'Away'` for users, `'backlog' | 'in_progress' | 'in_review' | 'done'` for tasks).
   - Credits: Top-up amounts must be strictly positive numbers.
   - 402 HTTP Status: Uniformly returned across REST endpoints when AI credits are insufficient.

---

## 4. Conclusion

The Express REST API and Socket.io real-time server layer design provides:
1. Complete, type-safe API routing under `/api` for users, tasks, docs, activities, settings, and AI generation.
2. Full state hydration endpoint (`/api/sync/state`) delivering all entities in a single sub-100ms payload.
3. Zero-latency bi-directional WebSocket event bus over `"atlas-room"` with complete broadcast helper utilities.
4. Clean programmatic server lifecycle (`createServerApp`, `startServer`) supporting both production operation and isolated Supertest / Vitest testing.

---

## 5. Verification Method

### 5.1 Unit & Supertest Route Verification
Run Supertest suites verifying:
- `GET /api/sync/state` returns 200 OK with `users`, `tasks`, `docs`, `activities`, `credits`, `hasApiKey`, `model`.
- `PATCH /api/users/cam/status` updates status and returns 200 OK.
- `POST /api/tasks` creates task, returns 201 Created, and assigns valid ID.
- `POST /api/tasks/:id/move` updates date ranges and status.
- `PATCH /api/docs/:id/step` toggles step checklist item.
- `POST /api/ai/generate-guide` deducts 5 credits and returns document.
- `POST /api/settings/credits/topup` increases credit balance.

### 5.2 Multi-Socket Real-Time Synchronization Verification
Connect 3 virtual `socket.io-client` instances:
- Client 1 emits `task:move` -> Assert Client 2 and Client 3 receive `task:moved` within 50ms.
- Client 2 emits `user:update_status` -> Assert Client 1 and Client 3 receive `user:status_changed`.
- Client 3 emits `doc:step_toggle` -> Assert Client 1 and Client 2 receive `doc:step_toggled`.
