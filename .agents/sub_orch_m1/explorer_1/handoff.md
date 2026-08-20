# Database & Schema Layer Architecture Specification (Milestone 1)

**Author**: `explorer_m1_1` (Database & Schema Specialist)  
**Date**: 2026-08-20T16:45:00Z  
**Working Directory**: `/Users/admin/Documents/Apps n stuff/Welcome Back Atlas/.agents/sub_orch_m1/explorer_1`  
**Target Milestone**: M1 (Foundation & Core Architecture)  
**Status**: Ready for Worker Implementation

---

## 1. Observation

Direct observations from `/Users/admin/Documents/Apps n stuff/Welcome Back Atlas/ORIGINAL_REQUEST.md`, `PROJECT.md`, and `.agents/sub_orch_m1/SCOPE.md`:

1. **System & Persistence Requirements**:
   - Application: **Welcome Back Atlas** for **Cam**, **Liam**, and **Alex**.
   - Storage: SQLite database with `better-sqlite3` in WAL mode with foreign key enforcement and persistent storage at `data/atlas.sqlite`.
   - Real-time Multi-Device Sync: Changes must immediately be persisted in SQLite and propagated via Socket.io.
   - Profile System: 1-click user switching between Cam, Liam, and Alex with distinct avatars, status indicators (`Online`, `Focused`, `Away`), and stored settings.
   - Credit System: 100 starter credits stored in database with atomic balance deduction and top-up support.
   - Learn System: 2-Pane layout with rich markdown docs, AI relevance summaries/scores, and step checklists.
   - Projects System: Gantt Timeline and Kanban views with tasks, priorities, date spans, progress percentages, checklist subtasks, and attached doc links.
   - Activity Stream: Team activity log capturing task updates, moves, doc generation, and status changes.

2. **Required Database Files**:
   - `server/db/database.ts`: SQLite connection, WAL mode pragma configuration, table schema execution, and directory auto-creation.
   - `server/db/schema.sql`: SQL DDL schema for 6 tables (`users`, `learning_docs`, `tasks`, `activity_logs`, `app_settings`, `ai_prompt_history`) and all query indexes.
   - `server/db/seed.ts`: Rich seed data generator for Cam, Liam, Alex, 6 tasks across users, 4 rich learning guides with steps, 6 activity logs, and default app settings.
   - `server/db/repositories/`:
     - `userRepository.ts`: User retrieval, status toggle, streak tracking.
     - `taskRepository.ts`: CRUD, filtering, date adjustments, status moves, checklist toggles.
     - `docRepository.ts`: CRUD, category/tag filtering, step checklist updates.
     - `activityRepository.ts`: Logging activities, chronological feed queries.
     - `settingsRepository.ts`: Key-value storage, atomic credit balance updates, API key management.

---

## 2. Logic Chain

From the observed requirements, we derive the exact technical specifications and complete implementation code for all database modules.

### 2.1 SQLite Connection & Pragmas (`server/db/database.ts`)

#### Architectural Decisions:
1. **Storage Location**: Default path `data/atlas.sqlite` relative to project root, configurable via `process.env.DATABASE_PATH`.
2. **Auto-Directory Creation**: `fs.mkdirSync(path.dirname(dbPath), { recursive: true })` ensures seamless zero-config startup.
3. **Pragmas**:
   - `journal_mode = WAL`: Write-Ahead Logging allows concurrent readers and high-throughput non-blocking writes.
   - `foreign_keys = ON`: Enforces relational integrity across tasks, users, docs, and logs.
   - `synchronous = NORMAL`: Optimal balance between transaction safety and write throughput.
   - `temp_store = MEMORY`: Memory-based temp storage for complex index scans.
   - `cache_size = -64000`: 64MB memory page cache.
4. **Schema Initialization**: Reads `schema.sql` and executes `db.exec(schemaSql)` on initialization.
5. **Singleton Pattern**: Maintains a single database connection instance with safe cleanup on process exit.

#### Proposed Implementation (`server/db/database.ts`):
```typescript
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let dbInstance: Database.Database | null = null;

export function getDatabasePath(): string {
  if (process.env.DATABASE_PATH) {
    return path.resolve(process.env.DATABASE_PATH);
  }
  return path.resolve(process.cwd(), 'data', 'atlas.sqlite');
}

export function initDatabase(customPath?: string): Database.Database {
  if (dbInstance) {
    return dbInstance;
  }

  const dbPath = customPath || getDatabasePath();
  const dbDir = path.dirname(dbPath);

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const db = new Database(dbPath);

  // Enable WAL mode & foreign key constraints
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('synchronous = NORMAL');
  db.pragma('temp_store = MEMORY');
  db.pragma('cache_size = -64000');

  // Load and execute schema.sql
  const schemaPath = path.resolve(__dirname, 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    db.exec(schemaSql);
  } else {
    throw new Error(`Schema file not found at ${schemaPath}`);
  }

  dbInstance = db;
  return dbInstance;
}

export function getDatabase(): Database.Database {
  if (!dbInstance) {
    return initDatabase();
  }
  return dbInstance;
}

export function closeDatabase(): void {
  if (dbInstance) {
    try {
      dbInstance.close();
    } finally {
      dbInstance = null;
    }
  }
}

export function runInTransaction<T>(fn: () => T): T {
  const db = getDatabase();
  const tx = db.transaction(fn);
  return tx();
}
```

---

### 2.2 Complete SQL DDL Schema (`server/db/schema.sql`)

#### Proposed Implementation (`server/db/schema.sql`):
```sql
-- Welcome Back Atlas - SQLite Database Schema DDL

PRAGMA foreign_keys = ON;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  role_title TEXT NOT NULL,
  avatar_url TEXT NOT NULL DEFAULT '',
  color_theme TEXT NOT NULL DEFAULT 'emerald' CHECK(color_theme IN ('emerald', 'indigo', 'amber', 'purple', 'blue')),
  status TEXT NOT NULL DEFAULT 'Online' CHECK(status IN ('Online', 'Focused', 'Away')),
  status_message TEXT DEFAULT '',
  learning_streak_days INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 2. Learning Docs Table (must exist before tasks foreign key)
CREATE TABLE IF NOT EXISTS learning_docs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Architecture',
  tags TEXT NOT NULL DEFAULT '[]', -- JSON string array of tags
  preview_image_url TEXT DEFAULT '',
  preview_link_url TEXT DEFAULT '',
  ai_relevance_summary TEXT NOT NULL DEFAULT '',
  ai_relevance_score INTEGER NOT NULL DEFAULT 90,
  markdown_content TEXT NOT NULL,
  steps TEXT NOT NULL DEFAULT '[]', -- JSON string array of { stepNumber: number, title: string, description: string, completed: boolean }
  linked_task_id TEXT,
  author_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  is_ai_generated INTEGER NOT NULL DEFAULT 0, -- 0 = false, 1 = true
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 3. Tasks / Projects Table
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  assignee_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'backlog' CHECK(status IN ('backlog', 'in_progress', 'in_review', 'done')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
  start_date TEXT NOT NULL, -- YYYY-MM-DD
  end_date TEXT NOT NULL,   -- YYYY-MM-DD
  progress_pct INTEGER NOT NULL DEFAULT 0 CHECK(progress_pct >= 0 AND progress_pct <= 100),
  color TEXT DEFAULT '#10b981',
  category TEXT NOT NULL DEFAULT 'Engineering',
  tags TEXT NOT NULL DEFAULT '[]', -- JSON string array of tags
  checklist TEXT NOT NULL DEFAULT '[]', -- JSON string array of { id: string, text: string, completed: boolean }
  doc_id TEXT REFERENCES learning_docs(id) ON DELETE SET NULL,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 4. Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'task:create', 'task:update', 'task:move', 'task:complete', 'doc:create', 'doc:step_toggle', 'user:status_update', 'ai:generate'
  target_type TEXT NOT NULL, -- 'task', 'doc', 'user', 'settings', 'ai'
  target_id TEXT,
  target_title TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '{}', -- JSON serialized metadata object
  timestamp TEXT NOT NULL
);

-- 5. App Settings & Credits Table
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL, -- JSON serialized string
  updated_at TEXT NOT NULL
);

-- 6. AI Prompt History Table
CREATE TABLE IF NOT EXISTS ai_prompt_history (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  prompt_type TEXT NOT NULL, -- 'guide_generation', 'roadmap_generation'
  prompt_text TEXT NOT NULL,
  response_text TEXT NOT NULL,
  credits_used INTEGER NOT NULL DEFAULT 0,
  used_fallback INTEGER NOT NULL DEFAULT 0, -- 0 = false (Gemini API), 1 = true (Heuristic Engine)
  created_at TEXT NOT NULL
);

-- Query Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_dates ON tasks(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_tasks_doc ON tasks(doc_id);
CREATE INDEX IF NOT EXISTS idx_docs_category ON learning_docs(category);
CREATE INDEX IF NOT EXISTS idx_docs_linked_task ON learning_docs(linked_task_id);
CREATE INDEX IF NOT EXISTS idx_activity_timestamp ON activity_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_history_user ON ai_prompt_history(user_id);
```

---

### 2.3 Rich Seed Generator (`server/db/seed.ts`)

#### Seed Data Specifications:
1. **Users**:
   - `cam`: Name: `'Cam'`, Role: `'Lead Architect & Backend'`, Theme: `'emerald'`, Status: `'Online'`, Status Message: `'Architecting SQLite WAL & Event Bus'`, Streak: 12 days.
   - `liam`: Name: `'Liam'`, Role: `'Product Lead & Frontend'`, Theme: `'indigo'`, Status: `'Focused'`, Status Message: `'Fine-tuning Gantt & Kanban Drag'`, Streak: 9 days.
   - `alex`: Name: `'Alex'`, Role: `'AI Engineer & Operations'`, Theme: `'amber'`, Status: `'Online'`, Status Message: `'Benchmarking Gemini AI Fallbacks'`, Streak: 15 days.
2. **Learning Docs (4 Comprehensive Guides)**:
   - `doc-1`: "WebSocket Concurrency & Real-Time Broadcast Optimization" (Category: Architecture, 4 steps, AI relevance for Cam).
   - `doc-2`: "LLM Prompt Orchestration & Resilient Heuristic Fallbacks" (Category: AI / Data, 4 steps, AI relevance for Alex).
   - `doc-3`: "High-Performance Timeline / Gantt Canvas & Drag Interactions" (Category: Frontend, 5 steps, AI relevance for Liam).
   - `doc-4`: "Modal & Drawer Overlay Architecture in Collaborative SPAs" (Category: Design, 3 steps, AI relevance for Liam).
3. **Tasks (6 rich tasks mapped to users and dates relative to today)**:
   - `task-1` (Cam): "Architect SQLite WAL & Socket.io Event Bus" (urgent, in_progress, doc-1)
   - `task-2` (Cam): "Implement Atomic Gemini Credit Counter & Fallbacks" (high, done, doc-2)
   - `task-3` (Liam): "Design Interactive Gantt Drag/Stretch Engine" (urgent, in_progress, doc-3)
   - `task-4` (Liam): "Refine Glassmorphic Kanban Columns & Overlay Drawer" (medium, in_review, doc-4)
   - `task-5` (Alex): "Integrate Gemini API with Heuristic Markdown Fallback" (high, done, doc-2)
   - `task-6` (Alex): "Automated Multi-User E2E Virtual Browser Test Runner" (medium, backlog, doc-1)
4. **Activity Logs (6 rich initial activities)**.
5. **App Settings (100 starter credits, empty API key, default Gemini 1.5 Flash model)**.

#### Proposed Implementation (`server/db/seed.ts`):
```typescript
import { getDatabase, initDatabase } from './database';

export function seedDatabase(force = false): void {
  const db = getDatabase();

  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count;
  if (userCount > 0 && !force) {
    return; // Already seeded
  }

  const now = new Date();
  const isoNow = now.toISOString();

  // Helper to generate ISO relative date string (YYYY-MM-DD)
  const getRelativeDate = (offsetDays: number): string => {
    const d = new Date(now.getTime() + offsetDays * 24 * 60 * 60 * 1000);
    return d.toISOString().split('T')[0];
  };

  // Helper to generate ISO relative timestamp
  const getRelativeTimestamp = (offsetHours: number): string => {
    const d = new Date(now.getTime() - offsetHours * 60 * 60 * 1000);
    return d.toISOString();
  };

  const seedTransaction = db.transaction(() => {
    // Clear existing data if forced
    if (force) {
      db.prepare('DELETE FROM ai_prompt_history').run();
      db.prepare('DELETE FROM activity_logs').run();
      db.prepare('DELETE FROM tasks').run();
      db.prepare('DELETE FROM learning_docs').run();
      db.prepare('DELETE FROM users').run();
      db.prepare('DELETE FROM app_settings').run();
    }

    // 1. Seed Users
    const insertUser = db.prepare(`
      INSERT INTO users (id, name, role_title, avatar_url, color_theme, status, status_message, learning_streak_days, created_at, updated_at)
      VALUES (@id, @name, @role_title, @avatar_url, @color_theme, @status, @status_message, @learning_streak_days, @created_at, @updated_at)
    `);

    const users = [
      {
        id: 'cam',
        name: 'Cam',
        role_title: 'Lead Architect & Backend',
        avatar_url: '/avatars/cam.png',
        color_theme: 'emerald',
        status: 'Online',
        status_message: 'Architecting SQLite WAL & Event Bus',
        learning_streak_days: 12,
        created_at: isoNow,
        updated_at: isoNow,
      },
      {
        id: 'liam',
        name: 'Liam',
        role_title: 'Product Lead & Frontend',
        avatar_url: '/avatars/liam.png',
        color_theme: 'indigo',
        status: 'Focused',
        status_message: 'Fine-tuning Gantt & Kanban Drag',
        learning_streak_days: 9,
        created_at: isoNow,
        updated_at: isoNow,
      },
      {
        id: 'alex',
        name: 'Alex',
        role_title: 'AI Engineer & Operations',
        avatar_url: '/avatars/alex.png',
        color_theme: 'amber',
        status: 'Online',
        status_message: 'Benchmarking Gemini AI Fallbacks',
        learning_streak_days: 15,
        created_at: isoNow,
        updated_at: isoNow,
      },
    ];

    for (const user of users) {
      insertUser.run(user);
    }

    // 2. Seed Learning Docs
    const insertDoc = db.prepare(`
      INSERT INTO learning_docs (id, title, subtitle, category, tags, preview_image_url, preview_link_url, ai_relevance_summary, ai_relevance_score, markdown_content, steps, linked_task_id, author_id, is_ai_generated, created_at, updated_at)
      VALUES (@id, @title, @subtitle, @category, @tags, @preview_image_url, @preview_link_url, @ai_relevance_summary, @ai_relevance_score, @markdown_content, @steps, @linked_task_id, @author_id, @is_ai_generated, @created_at, @updated_at)
    `);

    const docs = [
      {
        id: 'doc-1',
        title: 'WebSocket Concurrency & Real-Time Broadcast Optimization',
        subtitle: 'Architectural guide for ultra-low latency multi-client synchronization',
        category: 'Architecture',
        tags: JSON.stringify(['websocket', 'realtime', 'socket.io', 'performance']),
        preview_image_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
        preview_link_url: 'https://socket.io/docs/v4/rooms/',
        ai_relevance_summary: 'Curated technical system design blueprint explaining event broadcasting, room management, and state reconciliation for Cam\'s low-latency sync engine.',
        ai_relevance_score: 98,
        markdown_content: `# WebSocket Concurrency & Real-Time Broadcast Optimization

## Overview
When multiple users (Cam, Liam, Alex) collaborate on the same workspace, state synchronization must happen in sub-50ms intervals. This document outlines the event routing, room isolation, and heartbeat management patterns.

### Core Principles
1. **Single Source of Truth**: All mutations are written to SQLite first, then emitted via Socket.io.
2. **Room Scoping**: Broadcast events to \`atlas-room\` to isolate workspace traffic.
3. **Payload Normalization**: Always include the acting \`userId\` and timestamp in broadcast payloads.

\`\`\`typescript
// Broadcast helper pattern
io.to('atlas-room').emit('task:moved', {
  task: updatedTask,
  activity: logEntry
});
\`\`\`

## Architecture Diagram
- **Client 1 (Cam)** -> \`task:move\` -> **Express/Socket.io** -> **SQLite WAL**
- **Express/Socket.io** -> \`task:moved\` -> **Client 2 (Liam)** & **Client 3 (Alex)**
`,
        steps: JSON.stringify([
          { stepNumber: 1, title: 'Configure Socket.io CORS and Atlas room join', description: 'Ensure all clients join atlas-room on connection handshake.', completed: true },
          { stepNumber: 2, title: 'Establish typed event payload contracts', description: 'Define TypeScript interfaces for task, doc, user, and credit events.', completed: true },
          { stepNumber: 3, title: 'Implement broadcast-on-write middleware', description: 'Wrap repository mutations to trigger instant socket event broadcast.', completed: false },
          { stepNumber: 4, title: 'Simulate 3-client latency & verify event convergence', description: 'Run automated virtual socket test harness with concurrent mutations.', completed: false },
        ]),
        linked_task_id: 'task-1',
        author_id: 'cam',
        is_ai_generated: 0,
        created_at: isoNow,
        updated_at: isoNow,
      },
      {
        id: 'doc-2',
        title: 'LLM Prompt Orchestration & Resilient Heuristic Fallbacks',
        subtitle: 'Engineering fault-tolerant AI features with zero external downtime',
        category: 'AI / Data',
        tags: JSON.stringify(['gemini', 'prompts', 'fallback', 'credits']),
        preview_image_url: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=800&q=80',
        preview_link_url: 'https://ai.google.dev/docs',
        ai_relevance_summary: 'Operational guide for Alex detailing prompt engineering, credit metering, and rule-based Markdown synthesis when API keys are absent.',
        ai_relevance_score: 95,
        markdown_content: `# LLM Prompt Orchestration & Resilient Heuristic Fallbacks

## Overview
Atlas provides on-demand guide generation (5 credits) and auto-roadmap synthesis (10 credits). If no Gemini API key is configured, the system automatically falls back to deterministic heuristic generation.

### Heuristic Generation Pipeline
1. **Keyword Analysis**: Tokenize input prompt and match against architectural domain templates.
2. **Dynamic Section Assembly**: Construct customized Markdown sections, code snippets, and checklists.
3. **Credit Metering**: Atomically deduct credits regardless of generation mode (Gemini vs Heuristic).

\`\`\`typescript
export async function generateGuide(topic: string, userId: string) {
  const hasKey = settingsRepo.hasApiKey();
  if (hasKey) {
    return callGemini(topic);
  }
  return heuristicAIEngine.generateGuide(topic, userId);
}
\`\`\`
`,
        steps: JSON.stringify([
          { stepNumber: 1, title: 'Set up Google GenAI SDK client wrapper', description: 'Initialize GoogleGenerativeAI with fallback detection.', completed: true },
          { stepNumber: 2, title: 'Build HeuristicAIEngine with domain templates', description: 'Create semantic generator for Guide and Roadmap prompts.', completed: true },
          { stepNumber: 3, title: 'Enforce atomic credit deduction transactions', description: 'Deduct 5 credits for guides, 10 for roadmaps with balance validation.', completed: true },
          { stepNumber: 4, title: 'Validate zero-key offline generation end-to-end', description: 'Verify test suite passes without any external network dependency.', completed: true },
        ]),
        linked_task_id: 'task-5',
        author_id: 'alex',
        is_ai_generated: 0,
        created_at: isoNow,
        updated_at: isoNow,
      },
      {
        id: 'doc-3',
        title: 'High-Performance Timeline / Gantt Canvas & Drag Interactions',
        subtitle: 'Building fluid 60fps Gantt charts with draggable date ranges',
        category: 'Frontend',
        tags: JSON.stringify(['gantt', 'canvas', 'drag-and-drop', 'react']),
        preview_image_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80',
        preview_link_url: 'https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events',
        ai_relevance_summary: 'Frontend engineering playbook for Liam covering pointer event listeners, date delta math, and dynamic SVG grid alignment.',
        ai_relevance_score: 94,
        markdown_content: `# High-Performance Timeline / Gantt Canvas & Drag Interactions

## Overview
The default Projects view is an interactive horizontal Gantt chart. Tasks are represented as draggable bars with resize handles on both ends.

### Drag & Stretch Calculation
- **Day Width**: \`pxPerDay = totalWidth / totalDays\` (e.g. 48px/day).
- **Bar Left**: \`differenceInDays(task.start_date, viewStartDate) * pxPerDay\`
- **Bar Width**: \`(differenceInDays(task.end_date, task.start_date) + 1) * pxPerDay\`
- **Dragging**: Moving the entire bar shifts both \`start_date\` and \`end_date\` by \`deltaDays\`.
- **Stretching**: Left handle changes \`start_date\`; right handle changes \`end_date\`.

\`\`\`typescript
const deltaDays = Math.round(dx / pxPerDay);
const newStart = addDays(parseISO(task.start_date), deltaDays);
const newEnd = addDays(parseISO(task.end_date), deltaDays);
\`\`\`
`,
        steps: JSON.stringify([
          { stepNumber: 1, title: 'Compute day grid headers and column boundaries', description: 'Render day/week horizontal axis with current day indicator.', completed: true },
          { stepNumber: 2, title: 'Attach pointer event handlers for task bar dragging', description: 'Implement onPointerDown, onPointerMove, and onPointerUp listeners.', completed: true },
          { stepNumber: 3, title: 'Implement left and right resize handles', description: 'Allow stretching task duration while enforcing start <= end.', completed: false },
          { stepNumber: 4, title: 'Connect drag/stretch commit to Socket.io task:move', description: 'Broadcast updated date range across all connected clients.', completed: false },
          { stepNumber: 5, title: 'Add smooth CSS transitions and hover tooltips', description: 'Render task details and assignee badges on hover.', completed: false },
        ]),
        linked_task_id: 'task-3',
        author_id: 'liam',
        is_ai_generated: 0,
        created_at: isoNow,
        updated_at: isoNow,
      },
      {
        id: 'doc-4',
        title: 'Modal & Drawer Overlay Architecture in Collaborative SPAs',
        subtitle: 'Zero-layout-shift drawer systems with accessible keyboard focus',
        category: 'Design',
        tags: JSON.stringify(['ui', 'accessibility', 'modal', 'drawer']),
        preview_image_url: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=800&q=80',
        preview_link_url: 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/',
        ai_relevance_summary: 'UI design pattern guide for Liam focusing on accessible focus trapping, keyboard navigation, and zero-layout-shift drawer overlays.',
        ai_relevance_score: 91,
        markdown_content: `# Modal & Drawer Overlay Architecture in Collaborative SPAs

## Overview
Clicking any task in either Timeline/Gantt or Kanban opens an expanded detail overlay drawer over the view.

### Key Features
1. **Focus Trap & ESC Key**: Pressing Escape or clicking backdrop dismisses overlay.
2. **Direct Learn Navigation**: "View Learning Guide" button jumps straight to the attached doc in the Learn tab.
3. **Inline Checklist Manipulation**: Users can tick subtasks directly inside the overlay.
`,
        steps: JSON.stringify([
          { stepNumber: 1, title: 'Build reusable Modal and Drawer backdrop components', description: 'Create accessible portal container with smooth backdrop-blur.', completed: true },
          { stepNumber: 2, title: 'Implement ProjectOverlayModal with editable fields', description: 'Render full task description, dates, checklist, and doc shortcut.', completed: true },
          { stepNumber: 3, title: 'Wire live Socket sync for checklist updates', description: 'Broadcast checklist state changes in real time.', completed: false },
        ]),
        linked_task_id: 'task-4',
        author_id: 'liam',
        is_ai_generated: 0,
        created_at: isoNow,
        updated_at: isoNow,
      },
    ];

    for (const doc of docs) {
      insertDoc.run(doc);
    }

    // 3. Seed Tasks
    const insertTask = db.prepare(`
      INSERT INTO tasks (id, title, description, assignee_id, status, priority, start_date, end_date, progress_pct, color, category, tags, checklist, doc_id, created_by, created_at, updated_at)
      VALUES (@id, @title, @description, @assignee_id, @status, @priority, @start_date, @end_date, @progress_pct, @color, @category, @tags, @checklist, @doc_id, @created_by, @created_at, @updated_at)
    `);

    const tasks = [
      {
        id: 'task-1',
        title: 'Architect SQLite WAL & Socket.io Event Bus',
        description: 'Configure SQLite in WAL mode with foreign key enforcement and establish typed Socket.io room broadcasting.',
        assignee_id: 'cam',
        status: 'in_progress',
        priority: 'urgent',
        start_date: getRelativeDate(-1),
        end_date: getRelativeDate(3),
        progress_pct: 65,
        color: '#10b981',
        category: 'Architecture',
        tags: JSON.stringify(['backend', 'sqlite', 'websocket']),
        checklist: JSON.stringify([
          { id: 'sub-1', text: 'Initialize better-sqlite3 database connection with WAL pragma', completed: true },
          { id: 'sub-2', text: 'Create schema.sql DDL tables with foreign keys and indexes', completed: true },
          { id: 'sub-3', text: 'Attach Socket.io event listeners for task, doc, user mutations', completed: true },
          { id: 'sub-4', text: 'Verify multi-client synchronization test suite', completed: false },
        ]),
        doc_id: 'doc-1',
        created_by: 'cam',
        created_at: isoNow,
        updated_at: isoNow,
      },
      {
        id: 'task-2',
        title: 'Implement Atomic Gemini Credit Counter & Fallbacks',
        description: 'Create database transactions for credit balance deduction with non-negative checks and offline fallback handling.',
        assignee_id: 'cam',
        status: 'done',
        priority: 'high',
        start_date: getRelativeDate(-4),
        end_date: getRelativeDate(-1),
        progress_pct: 100,
        color: '#10b981',
        category: 'Backend',
        tags: JSON.stringify(['database', 'credits', 'transactions']),
        checklist: JSON.stringify([
          { id: 'sub-5', text: 'Create app_settings key-value store with team_credits', completed: true },
          { id: 'sub-6', text: 'Implement atomic credit deduction repository method', completed: true },
          { id: 'sub-7', text: 'Add top-up REST endpoint and Socket broadcast event', completed: true },
        ]),
        doc_id: 'doc-2',
        created_by: 'cam',
        created_at: isoNow,
        updated_at: isoNow,
      },
      {
        id: 'task-3',
        title: 'Design Interactive Gantt Drag/Stretch Engine',
        description: 'Build the default Timeline view supporting horizontal bar dragging and handle resizing across date scales.',
        assignee_id: 'liam',
        status: 'in_progress',
        priority: 'urgent',
        start_date: getRelativeDate(0),
        end_date: getRelativeDate(5),
        progress_pct: 45,
        color: '#6366f1',
        category: 'Frontend',
        tags: JSON.stringify(['gantt', 'timeline', 'interactions']),
        checklist: JSON.stringify([
          { id: 'sub-8', text: 'Implement day/week grid calculations with date-fns', completed: true },
          { id: 'sub-9', text: 'Build pointer drag handler for bar translation', completed: true },
          { id: 'sub-10', text: 'Build left and right resize handles for duration stretch', completed: false },
          { id: 'sub-11', text: 'Connect date updates to Socket.io task:move', completed: false },
        ]),
        doc_id: 'doc-3',
        created_by: 'liam',
        created_at: isoNow,
        updated_at: isoNow,
      },
      {
        id: 'task-4',
        title: 'Refine Glassmorphic Kanban Columns & Overlay Drawer',
        description: 'Implement 4-column drag-and-drop Kanban view with responsive slide-over overlay modal for task inspection.',
        assignee_id: 'liam',
        status: 'in_review',
        priority: 'medium',
        start_date: getRelativeDate(-2),
        end_date: getRelativeDate(2),
        progress_pct: 80,
        color: '#6366f1',
        category: 'Design',
        tags: JSON.stringify(['kanban', 'ui', 'drawer']),
        checklist: JSON.stringify([
          { id: 'sub-12', text: 'Construct 4 columns: Backlog, In Progress, In Review, Done', completed: true },
          { id: 'sub-13', text: 'Add drag & drop card column transfer', completed: true },
          { id: 'sub-14', text: 'Build ProjectOverlayModal with direct Learn doc navigation', completed: true },
        ]),
        doc_id: 'doc-4',
        created_by: 'liam',
        created_at: isoNow,
        updated_at: isoNow,
      },
      {
        id: 'task-5',
        title: 'Integrate Gemini API with Heuristic Markdown Fallback',
        description: 'Wire Google Gemini 1.5 Flash client with intelligent offline markdown heuristics when API keys are absent.',
        assignee_id: 'alex',
        status: 'done',
        priority: 'high',
        start_date: getRelativeDate(-5),
        end_date: getRelativeDate(-2),
        progress_pct: 100,
        color: '#f59e0b',
        category: 'AI / Data',
        tags: JSON.stringify(['gemini', 'heuristic', 'markdown']),
        checklist: JSON.stringify([
          { id: 'sub-15', text: 'Implement Google Gemini 1.5 client with prompt templates', completed: true },
          { id: 'sub-16', text: 'Build deterministic HeuristicAIEngine with domain templates', completed: true },
          { id: 'sub-17', text: 'Test seamless fallback transition without API key', completed: true },
        ]),
        doc_id: 'doc-2',
        created_by: 'alex',
        created_at: isoNow,
        updated_at: isoNow,
      },
      {
        id: 'task-6',
        title: 'Automated Multi-User E2E Virtual Browser Test Runner',
        description: 'Construct multi-client Socket.io integration test suite validating real-time synchronization across Cam, Liam, and Alex.',
        assignee_id: 'alex',
        status: 'backlog',
        priority: 'medium',
        start_date: getRelativeDate(2),
        end_date: getRelativeDate(7),
        progress_pct: 10,
        color: '#f59e0b',
        category: 'Testing',
        tags: JSON.stringify(['testing', 'vitest', 'e2e', 'sync']),
        checklist: JSON.stringify([
          { id: 'sub-18', text: 'Set up Vitest multi-client socket connection harness', completed: true },
          { id: 'sub-19', text: 'Test real-time task drag and status change broadcast', completed: false },
          { id: 'sub-20', text: 'Test doc checklist step toggle across 3 clients', completed: false },
          { id: 'sub-21', text: 'Test credit deduction event synchronization', completed: false },
        ]),
        doc_id: 'doc-1',
        created_by: 'alex',
        created_at: isoNow,
        updated_at: isoNow,
      },
    ];

    for (const task of tasks) {
      insertTask.run(task);
    }

    // 4. Seed Activity Logs
    const insertActivity = db.prepare(`
      INSERT INTO activity_logs (id, user_id, action_type, target_type, target_id, target_title, details, timestamp)
      VALUES (@id, @user_id, @action_type, @target_type, @target_id, @target_title, @details, @timestamp)
    `);

    const activities = [
      {
        id: 'act-1',
        user_id: 'cam',
        action_type: 'task:complete',
        target_type: 'task',
        target_id: 'task-2',
        target_title: 'Implement Atomic Gemini Credit Counter & Fallbacks',
        details: JSON.stringify({ status: 'done', progress: 100 }),
        timestamp: getRelativeTimestamp(1),
      },
      {
        id: 'act-2',
        user_id: 'liam',
        action_type: 'task:move',
        target_type: 'task',
        target_id: 'task-4',
        target_title: 'Refine Glassmorphic Kanban Columns & Overlay Drawer',
        details: JSON.stringify({ status: 'in_review', previousStatus: 'in_progress' }),
        timestamp: getRelativeTimestamp(3),
      },
      {
        id: 'act-3',
        user_id: 'alex',
        action_type: 'task:complete',
        target_type: 'task',
        target_id: 'task-5',
        target_title: 'Integrate Gemini API with Heuristic Markdown Fallback',
        details: JSON.stringify({ status: 'done', progress: 100 }),
        timestamp: getRelativeTimestamp(5),
      },
      {
        id: 'act-4',
        user_id: 'cam',
        action_type: 'doc:step_toggle',
        target_type: 'doc',
        target_id: 'doc-1',
        target_title: 'WebSocket Concurrency & Real-Time Broadcast Optimization',
        details: JSON.stringify({ stepNumber: 2, completed: true }),
        timestamp: getRelativeTimestamp(24),
      },
      {
        id: 'act-5',
        user_id: 'liam',
        action_type: 'user:status_update',
        target_type: 'user',
        target_id: 'liam',
        target_title: 'Liam',
        details: JSON.stringify({ status: 'Focused', message: 'Fine-tuning Gantt & Kanban Drag' }),
        timestamp: getRelativeTimestamp(48),
      },
      {
        id: 'act-6',
        user_id: 'alex',
        action_type: 'ai:generate',
        target_type: 'doc',
        target_id: 'doc-2',
        target_title: 'LLM Prompt Orchestration & Resilient Heuristic Fallbacks',
        details: JSON.stringify({ promptType: 'guide', creditsUsed: 5 }),
        timestamp: getRelativeTimestamp(72),
      },
    ];

    for (const act of activities) {
      insertActivity.run(act);
    }

    // 5. Seed App Settings
    const insertSetting = db.prepare(`
      INSERT INTO app_settings (key, value, updated_at)
      VALUES (@key, @value, @updated_at)
    `);

    const settings = [
      { key: 'team_credits', value: JSON.stringify(100), updated_at: isoNow },
      { key: 'gemini_api_key', value: JSON.stringify(''), updated_at: isoNow },
      { key: 'ai_model', value: JSON.stringify('gemini-1.5-flash'), updated_at: isoNow },
    ];

    for (const setting of settings) {
      insertSetting.run(setting);
    }
  });

  seedTransaction();
}
```

---

### 2.4 Type-Safe Repositories Implementation Specs

We provide exact code implementations for the 5 repositories in `server/db/repositories/`.

#### 2.4.1 `server/db/repositories/userRepository.ts`
```typescript
import { getDatabase } from '../database';

export interface UserProfile {
  id: string;
  name: string;
  role: string;
  role_title?: string;
  avatarColor: string;
  color_theme?: string;
  avatarUrl: string;
  avatar_url?: string;
  status: 'Online' | 'Focused' | 'Away';
  statusMessage: string;
  status_message?: string;
  streakDays: number;
  learning_streak_days?: number;
  created_at: string;
  updated_at: string;
}

interface UserDbRow {
  id: string;
  name: string;
  role_title: string;
  avatar_url: string;
  color_theme: string;
  status: 'Online' | 'Focused' | 'Away';
  status_message: string;
  learning_streak_days: number;
  created_at: string;
  updated_at: string;
}

function mapUserRow(row: UserDbRow): UserProfile {
  return {
    id: row.id,
    name: row.name,
    role: row.role_title,
    role_title: row.role_title,
    avatarColor: row.color_theme,
    color_theme: row.color_theme,
    avatarUrl: row.avatar_url,
    avatar_url: row.avatar_url,
    status: row.status,
    statusMessage: row.status_message || '',
    status_message: row.status_message || '',
    streakDays: row.learning_streak_days,
    learning_streak_days: row.learning_streak_days,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export const userRepository = {
  getAll(): UserProfile[] {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM users ORDER BY name ASC').all() as UserDbRow[];
    return rows.map(mapUserRow);
  },

  getById(id: string): UserProfile | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserDbRow | undefined;
    return row ? mapUserRow(row) : null;
  },

  updateStatus(id: string, status: 'Online' | 'Focused' | 'Away', statusMessage?: string): UserProfile | null {
    const db = getDatabase();
    const now = new Date().toISOString();
    
    if (statusMessage !== undefined) {
      db.prepare(`
        UPDATE users 
        SET status = ?, status_message = ?, updated_at = ? 
        WHERE id = ?
      `).run(status, statusMessage, now, id);
    } else {
      db.prepare(`
        UPDATE users 
        SET status = ?, updated_at = ? 
        WHERE id = ?
      `).run(status, now, id);
    }

    return userRepository.getById(id);
  },

  updateStreak(id: string, streakDays: number): UserProfile | null {
    const db = getDatabase();
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE users 
      SET learning_streak_days = ?, updated_at = ? 
      WHERE id = ?
    `).run(streakDays, now, id);

    return userRepository.getById(id);
  },

  create(user: {
    id: string;
    name: string;
    role_title: string;
    avatar_url?: string;
    color_theme?: string;
    status?: 'Online' | 'Focused' | 'Away';
    status_message?: string;
    learning_streak_days?: number;
  }): UserProfile {
    const db = getDatabase();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO users (id, name, role_title, avatar_url, color_theme, status, status_message, learning_streak_days, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      user.id,
      user.name,
      user.role_title,
      user.avatar_url || '',
      user.color_theme || 'emerald',
      user.status || 'Online',
      user.status_message || '',
      user.learning_streak_days || 0,
      now,
      now
    );

    return userRepository.getById(user.id)!;
  },
};
```

---

#### 2.4.2 `server/db/repositories/taskRepository.ts`
```typescript
import { getDatabase } from '../database';

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export type TaskStatus = 'backlog' | 'in_progress' | 'in_review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  assignee_id: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  start_date: string;
  end_date: string;
  progress_pct: number;
  color?: string;
  category: string;
  tags: string[];
  checklist: ChecklistItem[];
  doc_id?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

interface TaskDbRow {
  id: string;
  title: string;
  description: string;
  assignee_id: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  start_date: string;
  end_date: string;
  progress_pct: number;
  color: string | null;
  category: string;
  tags: string;
  checklist: string;
  doc_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskFilters {
  assignee_id?: string;
  status?: TaskStatus;
  category?: string;
  priority?: TaskPriority;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface CreateTaskInput {
  id?: string;
  title: string;
  description?: string;
  assignee_id?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  start_date: string;
  end_date: string;
  progress_pct?: number;
  color?: string;
  category?: string;
  tags?: string[];
  checklist?: ChecklistItem[];
  doc_id?: string | null;
  created_by?: string | null;
}

function mapTaskRow(row: TaskDbRow): TaskItem {
  let parsedTags: string[] = [];
  try {
    parsedTags = JSON.parse(row.tags || '[]');
  } catch {
    parsedTags = [];
  }

  let parsedChecklist: ChecklistItem[] = [];
  try {
    parsedChecklist = JSON.parse(row.checklist || '[]');
  } catch {
    parsedChecklist = [];
  }

  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    assignee_id: row.assignee_id,
    status: row.status,
    priority: row.priority,
    start_date: row.start_date,
    end_date: row.end_date,
    progress_pct: row.progress_pct,
    color: row.color || '#10b981',
    category: row.category || 'Engineering',
    tags: parsedTags,
    checklist: parsedChecklist,
    doc_id: row.doc_id,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export const taskRepository = {
  getAll(filters?: TaskFilters): TaskItem[] {
    const db = getDatabase();
    let query = 'SELECT * FROM tasks WHERE 1=1';
    const params: any[] = [];

    if (filters?.assignee_id) {
      query += ' AND assignee_id = ?';
      params.push(filters.assignee_id);
    }
    if (filters?.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters?.category) {
      query += ' AND category = ?';
      params.push(filters.category);
    }
    if (filters?.priority) {
      query += ' AND priority = ?';
      params.push(filters.priority);
    }
    if (filters?.startDate && filters?.endDate) {
      query += ' AND start_date <= ? AND end_date >= ?';
      params.push(filters.endDate, filters.startDate);
    }
    if (filters?.search) {
      query += ' AND (title LIKE ? OR description LIKE ?)';
      const searchPattern = `%${filters.search}%`;
      params.push(searchPattern, searchPattern);
    }

    query += ' ORDER BY start_date ASC, priority DESC';

    const rows = db.prepare(query).all(...params) as TaskDbRow[];
    return rows.map(mapTaskRow);
  },

  getById(id: string): TaskItem | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as TaskDbRow | undefined;
    return row ? mapTaskRow(row) : null;
  },

  create(input: CreateTaskInput): TaskItem {
    const db = getDatabase();
    const id = input.id || `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const tagsJson = JSON.stringify(input.tags || []);
    const checklistJson = JSON.stringify(input.checklist || []);

    db.prepare(`
      INSERT INTO tasks (
        id, title, description, assignee_id, status, priority, start_date, end_date,
        progress_pct, color, category, tags, checklist, doc_id, created_by, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      input.title,
      input.description || '',
      input.assignee_id || null,
      input.status || 'backlog',
      input.priority || 'medium',
      input.start_date,
      input.end_date,
      input.progress_pct ?? 0,
      input.color || '#10b981',
      input.category || 'Engineering',
      tagsJson,
      checklistJson,
      input.doc_id || null,
      input.created_by || null,
      now,
      now
    );

    return taskRepository.getById(id)!;
  },

  update(id: string, updates: Partial<TaskItem>): TaskItem | null {
    const db = getDatabase();
    const existing = taskRepository.getById(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.title !== undefined) {
      fields.push('title = ?');
      values.push(updates.title);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.assignee_id !== undefined) {
      fields.push('assignee_id = ?');
      values.push(updates.assignee_id);
    }
    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.priority !== undefined) {
      fields.push('priority = ?');
      values.push(updates.priority);
    }
    if (updates.start_date !== undefined) {
      fields.push('start_date = ?');
      values.push(updates.start_date);
    }
    if (updates.end_date !== undefined) {
      fields.push('end_date = ?');
      values.push(updates.end_date);
    }
    if (updates.progress_pct !== undefined) {
      fields.push('progress_pct = ?');
      values.push(updates.progress_pct);
    }
    if (updates.color !== undefined) {
      fields.push('color = ?');
      values.push(updates.color);
    }
    if (updates.category !== undefined) {
      fields.push('category = ?');
      values.push(updates.category);
    }
    if (updates.tags !== undefined) {
      fields.push('tags = ?');
      values.push(JSON.stringify(updates.tags));
    }
    if (updates.checklist !== undefined) {
      fields.push('checklist = ?');
      values.push(JSON.stringify(updates.checklist));
    }
    if (updates.doc_id !== undefined) {
      fields.push('doc_id = ?');
      values.push(updates.doc_id);
    }

    if (fields.length === 0) return existing;

    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);

    db.prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return taskRepository.getById(id);
  },

  delete(id: string): boolean {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    return result.changes > 0;
  },

  moveTask(id: string, status: TaskStatus, startDate?: string, endDate?: string): TaskItem | null {
    const updates: Partial<TaskItem> = { status };
    if (startDate) updates.start_date = startDate;
    if (endDate) updates.end_date = endDate;
    if (status === 'done') updates.progress_pct = 100;
    return taskRepository.update(id, updates);
  },

  filterTasks(filters: TaskFilters): TaskItem[] {
    return taskRepository.getAll(filters);
  },

  updateChecklist(taskId: string, checklist: ChecklistItem[]): TaskItem | null {
    const total = checklist.length;
    const completed = checklist.filter((item) => item.completed).length;
    const progress_pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    const status: TaskStatus = progress_pct === 100 ? 'done' : progress_pct > 0 ? 'in_progress' : 'backlog';

    return taskRepository.update(taskId, {
      checklist,
      progress_pct,
      status,
    });
  },

  toggleChecklistItem(taskId: string, checklistItemId: string, completed: boolean): TaskItem | null {
    const task = taskRepository.getById(taskId);
    if (!task) return null;

    const updatedChecklist = task.checklist.map((item) =>
      item.id === checklistItemId ? { ...item, completed } : item
    );

    return taskRepository.updateChecklist(taskId, updatedChecklist);
  },
};
```

---

#### 2.4.3 `server/db/repositories/docRepository.ts`
```typescript
import { getDatabase } from '../database';

export interface DocStep {
  stepNumber: number;
  title: string;
  description: string;
  completed: boolean;
}

export interface LearningDoc {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  tags: string[];
  preview_image_url: string;
  preview_link_url: string;
  ai_relevance_summary: string;
  ai_relevance_score: number;
  markdown_content: string;
  steps: DocStep[];
  linked_task_id?: string | null;
  author_id?: string | null;
  is_ai_generated: boolean;
  created_at: string;
  updated_at: string;
}

interface DocDbRow {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  tags: string;
  preview_image_url: string;
  preview_link_url: string;
  ai_relevance_summary: string;
  ai_relevance_score: number;
  markdown_content: string;
  steps: string;
  linked_task_id: string | null;
  author_id: string | null;
  is_ai_generated: number;
  created_at: string;
  updated_at: string;
}

export interface CreateDocInput {
  id?: string;
  title: string;
  subtitle?: string;
  category?: string;
  tags?: string[];
  preview_image_url?: string;
  preview_link_url?: string;
  ai_relevance_summary: string;
  ai_relevance_score?: number;
  markdown_content: string;
  steps?: DocStep[];
  linked_task_id?: string | null;
  author_id?: string | null;
  is_ai_generated?: boolean;
}

function mapDocRow(row: DocDbRow): LearningDoc {
  let parsedTags: string[] = [];
  try {
    parsedTags = JSON.parse(row.tags || '[]');
  } catch {
    parsedTags = [];
  }

  let parsedSteps: DocStep[] = [];
  try {
    parsedSteps = JSON.parse(row.steps || '[]');
  } catch {
    parsedSteps = [];
  }

  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle || '',
    category: row.category,
    tags: parsedTags,
    preview_image_url: row.preview_image_url || '',
    preview_link_url: row.preview_link_url || '',
    ai_relevance_summary: row.ai_relevance_summary,
    ai_relevance_score: row.ai_relevance_score,
    markdown_content: row.markdown_content,
    steps: parsedSteps,
    linked_task_id: row.linked_task_id,
    author_id: row.author_id,
    is_ai_generated: row.is_ai_generated === 1,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export const docRepository = {
  getAll(category?: string, tag?: string): LearningDoc[] {
    const db = getDatabase();
    let query = 'SELECT * FROM learning_docs WHERE 1=1';
    const params: any[] = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    if (tag) {
      query += ' AND tags LIKE ?';
      params.push(`%"${tag}"%`);
    }

    query += ' ORDER BY created_at DESC';

    const rows = db.prepare(query).all(...params) as DocDbRow[];
    return rows.map(mapDocRow);
  },

  getById(id: string): LearningDoc | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM learning_docs WHERE id = ?').get(id) as DocDbRow | undefined;
    return row ? mapDocRow(row) : null;
  },

  create(input: CreateDocInput): LearningDoc {
    const db = getDatabase();
    const id = input.id || `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const tagsJson = JSON.stringify(input.tags || []);
    const stepsJson = JSON.stringify(input.steps || []);

    db.prepare(`
      INSERT INTO learning_docs (
        id, title, subtitle, category, tags, preview_image_url, preview_link_url,
        ai_relevance_summary, ai_relevance_score, markdown_content, steps, linked_task_id,
        author_id, is_ai_generated, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      input.title,
      input.subtitle || '',
      input.category || 'Architecture',
      tagsJson,
      input.preview_image_url || '',
      input.preview_link_url || '',
      input.ai_relevance_summary || '',
      input.ai_relevance_score ?? 90,
      input.markdown_content,
      stepsJson,
      input.linked_task_id || null,
      input.author_id || null,
      input.is_ai_generated ? 1 : 0,
      now,
      now
    );

    return docRepository.getById(id)!;
  },

  update(id: string, updates: Partial<LearningDoc>): LearningDoc | null {
    const db = getDatabase();
    const existing = docRepository.getById(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.title !== undefined) {
      fields.push('title = ?');
      values.push(updates.title);
    }
    if (updates.subtitle !== undefined) {
      fields.push('subtitle = ?');
      values.push(updates.subtitle);
    }
    if (updates.category !== undefined) {
      fields.push('category = ?');
      values.push(updates.category);
    }
    if (updates.tags !== undefined) {
      fields.push('tags = ?');
      values.push(JSON.stringify(updates.tags));
    }
    if (updates.preview_image_url !== undefined) {
      fields.push('preview_image_url = ?');
      values.push(updates.preview_image_url);
    }
    if (updates.preview_link_url !== undefined) {
      fields.push('preview_link_url = ?');
      values.push(updates.preview_link_url);
    }
    if (updates.ai_relevance_summary !== undefined) {
      fields.push('ai_relevance_summary = ?');
      values.push(updates.ai_relevance_summary);
    }
    if (updates.ai_relevance_score !== undefined) {
      fields.push('ai_relevance_score = ?');
      values.push(updates.ai_relevance_score);
    }
    if (updates.markdown_content !== undefined) {
      fields.push('markdown_content = ?');
      values.push(updates.markdown_content);
    }
    if (updates.steps !== undefined) {
      fields.push('steps = ?');
      values.push(JSON.stringify(updates.steps));
    }
    if (updates.linked_task_id !== undefined) {
      fields.push('linked_task_id = ?');
      values.push(updates.linked_task_id);
    }
    if (updates.is_ai_generated !== undefined) {
      fields.push('is_ai_generated = ?');
      values.push(updates.is_ai_generated ? 1 : 0);
    }

    if (fields.length === 0) return existing;

    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);

    db.prepare(`UPDATE learning_docs SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return docRepository.getById(id);
  },

  toggleStep(docId: string, stepNumber: number, completed: boolean): LearningDoc | null {
    const doc = docRepository.getById(docId);
    if (!doc) return null;

    const updatedSteps = doc.steps.map((step) =>
      step.stepNumber === stepNumber ? { ...step, completed } : step
    );

    return docRepository.update(docId, { steps: updatedSteps });
  },

  delete(id: string): boolean {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM learning_docs WHERE id = ?').run(id);
    return result.changes > 0;
  },
};
```

---

#### 2.4.4 `server/db/repositories/activityRepository.ts`
```typescript
import { getDatabase } from '../database';

export interface ActivityLogItem {
  id: string;
  user_id: string;
  action_type: string;
  target_type: string;
  target_id?: string | null;
  target_title: string;
  details: Record<string, any>;
  timestamp: string;
}

interface ActivityDbRow {
  id: string;
  user_id: string;
  action_type: string;
  target_type: string;
  target_id: string | null;
  target_title: string;
  details: string;
  timestamp: string;
}

export interface CreateActivityInput {
  id?: string;
  user_id: string;
  action_type: string;
  target_type: string;
  target_id?: string | null;
  target_title: string;
  details?: Record<string, any>;
  timestamp?: string;
}

function mapActivityRow(row: ActivityDbRow): ActivityLogItem {
  let parsedDetails: Record<string, any> = {};
  try {
    parsedDetails = JSON.parse(row.details || '{}');
  } catch {
    parsedDetails = {};
  }

  return {
    id: row.id,
    user_id: row.user_id,
    action_type: row.action_type,
    target_type: row.target_type,
    target_id: row.target_id,
    target_title: row.target_title,
    details: parsedDetails,
    timestamp: row.timestamp,
  };
}

export const activityRepository = {
  getRecent(limit = 20, userId?: string): ActivityLogItem[] {
    const db = getDatabase();
    let query = 'SELECT * FROM activity_logs';
    const params: any[] = [];

    if (userId) {
      query += ' WHERE user_id = ?';
      params.push(userId);
    }

    query += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(limit);

    const rows = db.prepare(query).all(...params) as ActivityDbRow[];
    return rows.map(mapActivityRow);
  },

  logActivity(input: CreateActivityInput): ActivityLogItem {
    const db = getDatabase();
    const id = input.id || `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const timestamp = input.timestamp || new Date().toISOString();
    const detailsJson = JSON.stringify(input.details || {});

    db.prepare(`
      INSERT INTO activity_logs (id, user_id, action_type, target_type, target_id, target_title, details, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      input.user_id,
      input.action_type,
      input.target_type,
      input.target_id || null,
      input.target_title,
      detailsJson,
      timestamp
    );

    return {
      id,
      user_id: input.user_id,
      action_type: input.action_type,
      target_type: input.target_type,
      target_id: input.target_id || null,
      target_title: input.target_title,
      details: input.details || {},
      timestamp,
    };
  },
};
```

---

#### 2.4.5 `server/db/repositories/settingsRepository.ts`
```typescript
import { getDatabase } from '../database';

interface SettingDbRow {
  key: string;
  value: string;
  updated_at: string;
}

export const settingsRepository = {
  getSetting<T>(key: string, defaultValue?: T): T | null {
    const db = getDatabase();
    const row = db.prepare('SELECT value FROM app_settings WHERE key = ?').get(key) as SettingDbRow | undefined;
    if (!row) return defaultValue ?? null;

    try {
      return JSON.parse(row.value) as T;
    } catch {
      return (row.value as unknown) as T;
    }
  },

  setSetting<T>(key: string, value: T): void {
    const db = getDatabase();
    const now = new Date().toISOString();
    const serialized = JSON.stringify(value);

    db.prepare(`
      INSERT INTO app_settings (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `).run(key, serialized, now);
  },

  getAllSettings(): Record<string, any> {
    const db = getDatabase();
    const rows = db.prepare('SELECT key, value FROM app_settings').all() as SettingDbRow[];
    const result: Record<string, any> = {};

    for (const row of rows) {
      try {
        result[row.key] = JSON.parse(row.value);
      } catch {
        result[row.key] = row.value;
      }
    }

    return result;
  },

  getCredits(): number {
    return settingsRepository.getSetting<number>('team_credits', 100) ?? 100;
  },

  updateCredits(delta: number): number {
    const db = getDatabase();
    const now = new Date().toISOString();

    const tx = db.transaction(() => {
      const current = settingsRepository.getCredits();
      const next = current + delta;
      if (next < 0) {
        throw new Error(`Insufficient credits: current balance is ${current}, attempted deduction is ${Math.abs(delta)}`);
      }

      db.prepare(`
        INSERT INTO app_settings (key, value, updated_at)
        VALUES ('team_credits', ?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
      `).run(JSON.stringify(next), now);

      return next;
    });

    return tx();
  },

  setApiKey(apiKey: string): void {
    settingsRepository.setSetting<string>('gemini_api_key', apiKey.trim());
  },

  getApiKey(): string {
    const dbKey = settingsRepository.getSetting<string>('gemini_api_key', '') || '';
    if (dbKey) return dbKey;
    return process.env.GEMINI_API_KEY || '';
  },

  hasApiKey(): boolean {
    const key = settingsRepository.getApiKey();
    return typeof key === 'string' && key.trim().length > 0;
  },
};
```

---

## 3. Caveats

1. **Synchronous vs Asynchronous better-sqlite3 Calls**: `better-sqlite3` runs synchronously, which prevents event-loop starvation for fast in-memory/WAL queries. All repository methods are synchronous and return typed objects immediately, allowing clean integration in Express handlers without nested callback hell.
2. **Atomic Credit Updates**: The `updateCredits` method uses SQLite transactions (`db.transaction()`) with a strict non-negative check (`next < 0`), throwing an error on insufficient balance. The AI controller should catch this and return HTTP 402.
3. **JSON Array Parsing Safety**: In `taskRepository` and `docRepository`, all JSON columns (`tags`, `checklist`, `steps`, `details`) are safely parsed within `try...catch` blocks to protect against corrupted or malformed database rows.
4. **Relational Constraints**: Tasks and Learning Docs link to Users and to each other (`doc_id`, `linked_task_id`). When deleting or updating entities, `ON DELETE SET NULL` prevents cascading orphaned records while preserving foreign key integrity.

---

## 4. Conclusion

The SQLite database and repository specifications are complete, production-ready, and fully align with `PROJECT.md` contracts. The Worker can directly implement:
- `server/db/database.ts` (connection + WAL pragma + schema loader)
- `server/db/schema.sql` (6 tables + 9 query indexes)
- `server/db/seed.ts` (users, tasks, docs, activity logs, settings)
- `server/db/repositories/userRepository.ts`
- `server/db/repositories/taskRepository.ts`
- `server/db/repositories/docRepository.ts`
- `server/db/repositories/activityRepository.ts`
- `server/db/repositories/settingsRepository.ts`

---

## 5. Verification Method

### How to Verify Implementation:
1. **Schema & DB Boot Test**:
   ```typescript
   import { initDatabase, closeDatabase, getDatabase } from './database';
   import { seedDatabase } from './seed';
   import { userRepository } from './repositories/userRepository';
   import { taskRepository } from './repositories/taskRepository';
   import { docRepository } from './repositories/docRepository';
   import { settingsRepository } from './repositories/settingsRepository';

   const db = initDatabase(':memory:');
   seedDatabase(true);

   // Verify Users
   const users = userRepository.getAll();
   expect(users.length).toBe(3);
   expect(users.map(u => u.name)).toContain('Cam');

   // Verify Tasks
   const tasks = taskRepository.getAll();
   expect(tasks.length).toBe(6);

   // Verify Docs
   const docs = docRepository.getAll();
   expect(docs.length).toBe(4);

   // Verify Credits
   expect(settingsRepository.getCredits()).toBe(100);
   expect(settingsRepository.updateCredits(-5)).toBe(95);
   expect(() => settingsRepository.updateCredits(-200)).toThrow();

   closeDatabase();
   ```
2. **Vitest Unit Test Command**:
   `npx vitest run tests/unit/db.test.ts`
