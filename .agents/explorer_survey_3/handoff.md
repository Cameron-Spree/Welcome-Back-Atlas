# Technical Architecture & Implementation Blueprint Handoff

**Author**: `explorer_survey_3` (Technical Architecture Explorer)  
**Date**: 2026-08-20T17:40:00+01:00  
**Target Milestone**: Survey / Architecture Specification  
**Status**: Complete & Ready for Synthesis into `PROJECT.md`

---

## 1. Observation

Directly observed from `/Users/admin/Documents/Apps n stuff/Welcome Back Atlas/ORIGINAL_REQUEST.md`:

1. **Goal & Core Identity**:
   - Application Name: **Welcome Back Atlas**
   - Core Users: **Cam** (Lead Architect & Backend), **Liam** (Product Lead & Frontend), and **Alex** (AI Engineer & Operations).
   - Core Requirements:
     - **R1: Multi-User Profile System & Real-Time Sync**: 1-click profile switcher, distinct avatars/statuses/settings, WebSocket multi-device sync (Node.js + Express + Socket.io + SQLite/better-sqlite3).
     - **R2: First Screen / Home Greeting Dashboard**: Dynamic greeting `"Welcome back, [Cam | Liam | Alex]"`, user status toggle (Online, Focused, Away), global search bar, assigned upcoming roadmap tasks, quick-jump learning cards, and live team activity feed.
     - **R3: Individualized Learn Tab (2-Pane Wireframe Layout)**: Left pane task checklist with assignee/topic filters; Right pane with preview banner, AI relevance section (reasoning why doc matches task), rich markdown documentation reader with step-by-step instructions, and Gemini AI guide generator (with fallback and credit cost).
     - **R4: Projects Tab (Timeline/Gantt & Kanban with Overlay)**: Default Timeline/Gantt roadmap with draggable/stretchable date range bars across days/weeks; Kanban toggle (`Backlog`, `In Progress`, `In Review`, `Done`); Assignee filters (`All | Cam | Liam | Alex`); Expanded Project Overlay modal/drawer on click; AI Auto-Roadmap generator.
     - **R5: Progress Tab & Gemini API Credit System**: Team completion velocity, individual task burn-up for Cam, Liam, and Alex, learning streaks; Settings with Gemini API key configuration, visual credit counter (100 starter credits), top-up modal, and automatic fallback when key is omitted.
2. **Acceptance Criteria & Tooling**:
   - `npm run dev` boots Node.js Express/Socket.io backend + React Vite frontend concurrently.
   - Zero TypeScript/JSX lint errors, clean browser load.
   - Socket.io broadcasts task updates, moves, and date changes in real time across multiple open browser windows.
   - Full overlay drawer/modal on project click.
   - 2-pane Learn layout with AI relevance explanations.
   - Settings API key management & credit balance tracking.

---

## 2. Logic Chain

From the observed requirements, we derive a robust, modular, and maintainable full-stack technical architecture.

### 2.1 Complete Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Backend Runtime** | Node.js (v18+) with TypeScript (`tsx` / `ts-node`) | High performance, unified language across client/server, native async I/O. |
| **HTTP Framework** | Express.js (`express`) | Minimalist, stable REST routing, easy middleware integration (CORS, body parser, error handling). |
| **Real-Time Engine** | Socket.io (`socket.io` server + `socket.io-client` client) | Native WebSocket support, automatic fallback to polling, rooms, broadcast channels, reconnection resilience. |
| **Database & Engine** | SQLite3 via `better-sqlite3` | Synchronous execution, zero latency overhead, file-based persistence (`data/atlas.sqlite`), native WAL mode for high concurrency. |
| **Frontend Framework** | React 18 / 19 + TypeScript | Component-driven UI, type safety, hooks, fast state updates. |
| **Build Tooling** | Vite (`@vitejs/plugin-react`) | Sub-millisecond HMR, optimized production rollup bundling, simple proxy configuration. |
| **Styling & Design System** | Tailwind CSS + `@tailwindcss/typography` | Utility-first CSS, responsive layouts, glassmorphism, prose styling for rich markdown, custom user themes (Emerald for Cam, Indigo for Liam, Amber for Alex). |
| **Icons & Visuals** | Lucide React (`lucide-react`) | Crisp, consistent SVG icons for UI navigation, badges, and action buttons. |
| **Date & Time Engine** | `date-fns` | Draggable timeline calculations, Gantt bar positioning, streak tracking, activity timestamps. |
| **Markdown Rendering** | `react-markdown` + `remark-gfm` | Renders tables, task lists, code blocks, and formatted technical documentation. |
| **AI Integration** | Google Gemini API + `HeuristicAIEngine` | Dual-mode AI generation: connects to Gemini when API key is provided, falls back to rich heuristic synthesis engine when omitted or offline. |
| **Dev Orchestration** | `concurrently` | Runs backend server and Vite frontend with a single command (`npm run dev`). |
| **Testing Harness** | `vitest` + `supertest` + Socket.io multi-client virtual test runner | Unit tests for DB and AI services, API integration tests, and multi-socket real-time synchronization tests. |

---

### 2.2 Directory Layout

```
Welcome Back Atlas/
├── package.json                   # Root package manifest with unified dev/build/test scripts
├── tsconfig.json                  # Root TypeScript configuration
├── tsconfig.node.json             # TypeScript config for Vite/tooling
├── vite.config.ts                 # Vite bundler config with API & WebSocket proxy
├── tailwind.config.js             # Tailwind CSS theme, user accent colors, typography plugins
├── postcss.config.js              # PostCSS autoprefixer config
├── index.html                     # HTML entry point with meta tags & Google fonts
├── server/
│   ├── index.ts                   # Express app + HTTP server + Socket.io attachment
│   ├── config.ts                  # Environment variables, defaults (PORT: 3001, DB_PATH)
│   ├── db/
│   │   ├── database.ts            # better-sqlite3 instance, WAL mode, pragmas, table init
│   │   ├── schema.sql             # SQL DDL schemas for all tables
│   │   ├── seed.ts                # Rich seed data for Cam, Liam, Alex + starter tasks & docs
│   │   └── repositories/          # Type-safe Data Access Objects
│   │       ├── userRepository.ts
│   │       ├── taskRepository.ts
│   │       ├── docRepository.ts
│   │       ├── activityRepository.ts
│   │       └── settingsRepository.ts
│   ├── routes/
│   │   ├── index.ts               # Express Router mounting all sub-routes
│   │   ├── userRoutes.ts          # /api/users, /api/users/:id/status
│   │   ├── taskRoutes.ts          # /api/tasks (CRUD, /move, /filter)
│   │   ├── docRoutes.ts           # /api/docs (CRUD, /steps)
│   │   ├── activityRoutes.ts      # /api/activities
│   │   ├── settingsRoutes.ts      # /api/settings (API key, credits, top-up)
│   │   ├── aiRoutes.ts            # /api/ai/generate-guide, /api/ai/generate-roadmap
│   │   └── syncRoutes.ts          # /api/sync/state (Initial hydration bundle)
│   ├── sockets/
│   │   ├── socketHandler.ts       # Socket connection, room joining, event listeners
│   │   └── socketEvents.ts        # Typed event names & payload interfaces
│   └── services/
│       ├── aiService.ts           # Gemini API orchestrator with automatic fallback switch
│       ├── heuristicAIEngine.ts   # Rule-based rich markdown & roadmap synthesis engine
│       ├── promptTemplates.ts     # System prompts for Guide & Roadmap generation
│       └── creditService.ts       # Atomic credit deduction, balance checks & top-up
├── src/
│   ├── main.tsx                   # React root entry point
│   ├── App.tsx                    # Top-level shell (Navbar, Tab Router, Active User context, Modals)
│   ├── index.css                  # Tailwind directives, custom scrollbars, animations
│   ├── types/
│   │   ├── user.ts                # UserProfile, UserStatus, Role
│   │   ├── task.ts                # TaskItem, TaskStatus, Priority, ChecklistItem
│   │   ├── doc.ts                 # LearningDoc, DocStep, AIRelevance
│   │   ├── activity.ts            # ActivityLogItem, ActionType
│   │   ├── settings.ts            # AppSettings, CreditTransaction
│   │   └── socket.ts              # Client-Server Socket Event maps
│   ├── context/
│   │   ├── AtlasContext.tsx       # Master App state (Users, Active User, Tasks, Docs, Activities, Credits)
│   │   └── ToastContext.tsx       # Real-time peer activity toast notifications
│   ├── hooks/
│   │   ├── useSocket.ts           # Socket.io connection, live broadcasting, event dispatch
│   │   ├── useTasks.ts            # Task manipulation, Gantt date resizing, Kanban column drops
│   │   ├── useDocs.ts             # Doc filtering, checklist ticking, AI generation trigger
│   │   └── useCredits.ts          # Credit balance watcher & top-up helper
│   ├── components/
│   │   ├── common/
│   │   │   ├── Navbar.tsx         # Brand logo, Nav tabs, Credit pill, User Switcher dropdown
│   │   │   ├── UserSwitcher.tsx   # 1-click Cam/Liam/Alex switcher with avatar & role badge
│   │   │   ├── Avatar.tsx         # User avatar with live status dot (green/purple/amber)
│   │   │   ├── Modal.tsx          # Accessible overlay backdrop & modal dialog container
│   │   │   ├── ToastContainer.tsx # Floating real-time peer action toast alerts
│   │   │   └── Badge.tsx          # Priority, category, and status pill badges
│   │   ├── dashboard/             # R2: Home Greeting Dashboard
│   │   │   ├── HomeDashboard.tsx  # Main dashboard layout
│   │   │   ├── GreetingHeader.tsx # "Welcome back, [Name]" dynamic header
│   │   │   ├── ProfileStatusCard.tsx # Active user status toggle (Online/Focused/Away)
│   │   │   ├── GlobalSearchBar.tsx # Real-time search across tasks, docs, team members
│   │   │   ├── AssignedTasksCard.tsx # Filtered list of active user's upcoming tasks
│   │   │   ├── QuickJumpLearn.tsx # Cards linking directly to user-relevant learn guides
│   │   │   └── LiveActivityFeed.tsx # Real-time stream of team activity events
│   │   ├── learn/                 # R3: 2-Pane Learn Tab
│   │   │   ├── LearnTab.tsx       # 2-Pane split container with responsive collapse
│   │   │   ├── LeftTaskList.tsx   # Filterable task checklist (Assignee / Topic tags)
│   │   │   ├── RightDocViewer.tsx # Right pane container
│   │   │   ├── DocPreviewBanner.tsx # Top media/resource link banner
│   │   │   ├── AIRelevanceBox.tsx # AI match explanation (client match / technical need)
│   │   │   ├── MarkdownDocReader.tsx # Rich Markdown renderer with code blocks & checklists
│   │   │   └── AIGuideModal.tsx   # Modal to generate custom guide with prompt & credit cost
│   │   ├── projects/              # R4: Projects Tab
│   │   │   ├── ProjectsTab.tsx    # Header with view toggle (Timeline vs Kanban) & filters
│   │   │   ├── TimelineGanttView.tsx # Draggable & stretchable date bar Gantt roadmap
│   │   │   ├── KanbanView.tsx     # 4-column drag & drop Kanban board
│   │   │   ├── KanbanColumn.tsx   # Backlog / In Progress / In Review / Done column
│   │   │   ├── TaskCard.tsx       # Interactive task card for Kanban and Timeline
│   │   │   ├── ProjectOverlayModal.tsx # Full detail drawer/modal layer above view
│   │   │   ├── TaskCreateModal.tsx # New task creation dialog
│   │   │   └── AIRoadmapModal.tsx # AI Auto-Roadmap generator dialog
│   │   ├── progress/              # R5: Progress Tab
│   │   │   ├── ProgressTab.tsx    # Team analytics & individual velocity dashboard
│   │   │   ├── VelocityChart.tsx  # Team completion velocity & burndown visualizer
│   │   │   ├── IndividualBurnup.tsx # Cam vs Liam vs Alex individual completion cards
│   │   │   └── LearningStreakCard.tsx # Daily active learning streak counters
│   │   └── settings/              # R5: Settings & Credits
│   │       ├── SettingsModal.tsx  # Settings modal with tabs (API Key, Credits, Preferences)
│   │       ├── APIKeyConfig.tsx   # Gemini API key input with validation & status check
│   │       └── CreditTopUpModal.tsx # Credit balance visualizer & +50/+100 top-up modal
│   └── utils/
│       ├── dateUtils.ts           # Date formatting, range calculations, Gantt column math
│       ├── markdownUtils.ts       # Code highlight helpers & checklist parser
│       └── constants.ts           # Default user profiles, status options, category colors
├── tests/
│   ├── unit/                      # Vitest unit test suites
│   │   ├── db.test.ts             # SQLite schema creation & seed data verification
│   │   ├── aiService.test.ts      # Heuristic generator & Gemini fallback logic
│   │   ├── creditService.test.ts  # Atomic credit deduction & balance guarantees
│   │   └── taskRepository.test.ts # Task filtering, date ranges, checklist updates
│   ├── e2e/                       # Multi-client WebSocket & REST E2E tests
│   │   ├── multiUserSync.spec.ts  # 3 concurrent virtual sockets verifying instant sync
│   │   ├── timelineKanban.spec.ts # Timeline stretch & Kanban move broadcast tests
│   │   ├── learnDocAi.spec.ts     # 2-pane checklist sync & AI guide generation
│   │   └── creditDeduction.spec.ts# Multi-user credit deduction & top-up verification
│   └── setup.ts                   # Vitest environment setup
└── data/
    └── atlas.sqlite               # Local persistent SQLite database file
```

---

### 2.3 Database Schema & Persistence Design (SQLite + better-sqlite3)

The SQLite database operates in **WAL (Write-Ahead Logging)** mode with `PRAGMA foreign_keys = ON;` and `PRAGMA journal_mode = WAL;` to support concurrent reads and serialized fast writes without blocking.

#### Table DDL Schemas:

```sql
-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  role_title TEXT NOT NULL,
  avatar_url TEXT NOT NULL,
  color_theme TEXT NOT NULL,
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
  tags TEXT NOT NULL DEFAULT '[]', -- JSON string array
  preview_image_url TEXT DEFAULT '',
  preview_link_url TEXT DEFAULT '',
  ai_relevance_summary TEXT NOT NULL,
  ai_relevance_score INTEGER NOT NULL DEFAULT 90,
  markdown_content TEXT NOT NULL,
  steps TEXT NOT NULL DEFAULT '[]', -- JSON string array of { stepNumber, title, description, completed }
  linked_task_id TEXT,
  author_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  is_ai_generated INTEGER NOT NULL DEFAULT 0,
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
  color TEXT DEFAULT '#3b82f6',
  category TEXT NOT NULL DEFAULT 'Engineering',
  tags TEXT NOT NULL DEFAULT '[]', -- JSON string array
  checklist TEXT NOT NULL DEFAULT '[]', -- JSON string array of { id, text, completed }
  doc_id TEXT REFERENCES learning_docs(id) ON DELETE SET NULL,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 4. Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  target_title TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '{}', -- JSON metadata
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
  prompt_type TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  response_text TEXT NOT NULL,
  credits_used INTEGER NOT NULL DEFAULT 0,
  used_fallback INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

-- Indexes for ultra-fast queries
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_dates ON tasks(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_docs_category ON learning_docs(category);
CREATE INDEX IF NOT EXISTS idx_activity_timestamp ON activity_logs(timestamp DESC);
```

#### Seed Data Specification:

When the server starts, if the `users` table is empty, `seed.ts` automatically inserts:
1. **Users**:
   - `user-cam`: Name: `'Cam'`, Role: `'Lead Architect & Backend'`, Theme: `'emerald'`, Status: `'Online'`, Status Message: `'Architecting SQLite WAL & Event Bus'`, Streak: 12.
   - `user-liam`: Name: `'Liam'`, Role: `'Product Lead & Frontend'`, Theme: `'indigo'`, Status: `'Focused'`, Status Message: `'Fine-tuning Gantt & Kanban Drag'`, Streak: 9.
   - `user-alex`: Name: `'Alex'`, Role: `'AI Engineer & Operations'`, Theme: `'amber'`, Status: `'Online'`, Status Message: `'Benchmarking Gemini AI Fallbacks'`, Streak: 15.
2. **Settings**:
   - `team_credits`: `100` (starter credit bank).
   - `gemini_api_key`: `""` (empty by default, triggering high-grade built-in fallback).
   - `ai_model`: `"gemini-1.5-flash"`.
3. **Tasks (6 rich pre-populated tasks across users)**:
   - `task-1`: Cam — "Architect SQLite WAL & Socket.io Event Bus" (Status: `in_progress`, Priority: `urgent`, Date: today to +3d, Doc: `doc-1`, Checklist: 4 items).
   - `task-2`: Cam — "Implement Atomic Gemini Credit Counter & Fallbacks" (Status: `done`, Priority: `high`, Date: -3d to today, Doc: `doc-2`).
   - `task-3`: Liam — "Design Interactive Gantt Drag/Stretch Engine" (Status: `in_progress`, Priority: `urgent`, Date: today to +5d, Doc: `doc-3`).
   - `task-4`: Liam — "Refine Glassmorphic Kanban Columns & Overlay Drawer" (Status: `in_review`, Priority: `medium`, Date: -2d to +2d, Doc: `doc-4`).
   - `task-5`: Alex — "Integrate Gemini API with Heuristic Markdown Fallback" (Status: `done`, Priority: `high`, Date: -4d to -1d, Doc: `doc-2`).
   - `task-6`: Alex — "Automated Multi-User E2E Virtual Browser Test Runner" (Status: `backlog`, Priority: `medium`, Date: +2d to +7d, Doc: `doc-1`).
4. **Learning Docs (4 detailed markdown guides with AI relevance reasoning)**:
   - `doc-1`: "WebSocket Concurrency & Real-Time Broadcast Optimization" (Category: `Architecture`, AI Relevance: *"Curated technical system design blueprint explaining event broadcasting, room management, and state reconciliation for Cam's low-latency sync engine.*", 4 step checklist).
   - `doc-2`: "LLM Prompt Orchestration & Resilient Heuristic Fallbacks" (Category: `AI / Data`, AI Relevance: *"Operational guide for Alex detailing prompt engineering, credit metering, and rule-based Markdown synthesis when API keys are absent.*", 4 step checklist).
   - `doc-3`: "High-Performance Timeline / Gantt Canvas & Drag Interactions" (Category: `Frontend`, AI Relevance: *"Frontend engineering playbook for Liam covering pointer event listeners, date delta math, and dynamic SVG grid alignment.*", 5 step checklist).
   - `doc-4`: "Modal & Drawer Overlay Architecture in Collaborative SPAs" (Category: `Design`, AI Relevance: *"UI design pattern guide for Liam focusing on accessible focus trapping, keyboard navigation, and zero-layout-shift drawer overlays.*", 3 step checklist).
5. **Activity Log**:
   - 6 recent activities logging task completions, moves, and doc generation.

---

### 2.4 WebSocket & REST API Protocols

#### REST API Specifications:

```typescript
// Base URL: /api

// 1. Initial State Hydration
GET /api/sync/state
Response: 200 OK
{
  users: UserProfile[];
  tasks: TaskItem[];
  docs: LearningDoc[];
  activities: ActivityLogItem[];
  credits: number;
  hasApiKey: boolean;
  model: string;
}

// 2. User Management
GET /api/users
Response: 200 OK -> UserProfile[]

PATCH /api/users/:id/status
Request: { status: 'Online' | 'Focused' | 'Away', statusMessage?: string }
Response: 200 OK -> UserProfile
(Emits Socket event: user:status_changed)

// 3. Task Management
GET /api/tasks?assignee=...&status=...&category=...
Response: 200 OK -> TaskItem[]

POST /api/tasks
Request: Omit<TaskItem, 'id' | 'created_at' | 'updated_at'> & { userId: string }
Response: 201 Created -> TaskItem
(Emits Socket event: task:created + activity:new)

PATCH /api/tasks/:id
Request: Partial<TaskItem> & { userId: string }
Response: 200 OK -> TaskItem
(Emits Socket event: task:updated + activity:new)

DELETE /api/tasks/:id
Request Body: { userId: string }
Response: 200 OK -> { success: true, id: string }
(Emits Socket event: task:deleted + activity:new)

POST /api/tasks/:id/move
Request: { status: TaskStatus; start_date?: string; end_date?: string; userId: string }
Response: 200 OK -> TaskItem
(Emits Socket event: task:moved + activity:new)

// 4. Learning Docs Management
GET /api/docs
Response: 200 OK -> LearningDoc[]

GET /api/docs/:id
Response: 200 OK -> LearningDoc

POST /api/docs
Request: Omit<LearningDoc, 'id' | 'created_at' | 'updated_at'> & { userId: string }
Response: 201 Created -> LearningDoc
(Emits Socket event: doc:created + activity:new)

PATCH /api/docs/:id/step
Request: { stepNumber: number; completed: boolean; userId: string }
Response: 200 OK -> LearningDoc
(Emits Socket event: doc:step_toggled + activity:new)

// 5. Settings & Credits
GET /api/settings
Response: 200 OK -> { hasApiKey: boolean, credits: number, model: string }

POST /api/settings/apikey
Request: { apiKey: string }
Response: 200 OK -> { success: true, hasApiKey: boolean }

POST /api/settings/credits/topup
Request: { amount: number; userId: string }
Response: 200 OK -> { creditBalance: number }
(Emits Socket event: credits:updated + activity:new)

// 6. AI Generation
POST /api/ai/generate-guide
Request: { topic: string; taskId?: string; context?: string; userId: string }
Response: 200 OK -> { doc: LearningDoc; creditBalance: number; usedFallback: boolean }
(Cost: 5 credits. Emits Socket event: doc:created + credits:updated + activity:new)

POST /api/ai/generate-roadmap
Request: { projectGoal: string; targetDays?: number; userId: string }
Response: 200 OK -> { tasks: TaskItem[]; creditBalance: number; usedFallback: boolean }
(Cost: 10 credits. Emits Socket event: tasks:created + credits:updated + activity:new)
```

#### Socket.io Bi-Directional Event Protocol:

| Event Name | Direction | Payload | Behavior |
|------------|-----------|---------|----------|
| `connection` | Client -> Server | `auth: { userId }` | Server adds socket to room `"atlas-room"` |
| `user:update_status` | Client -> Server | `{ userId, status, statusMessage }` | Server persists status in SQLite, broadcasts `user:status_changed` |
| `user:status_changed` | Server -> All | `{ userId, status, statusMessage, updatedAt }` | Clients update user indicator badge and toast |
| `task:create` | Client -> Server | `{ task, userId }` | Server creates task & activity in DB, broadcasts `task:created` |
| `task:created` | Server -> All | `{ task: TaskItem, activity: ActivityLogItem }` | Clients append task and activity feed entry |
| `task:update` | Client -> Server | `{ taskId, updates, userId }` | Server updates task in DB, broadcasts `task:updated` |
| `task:updated` | Server -> All | `{ task: TaskItem, activity: ActivityLogItem }` | Clients update local task in-place |
| `task:move` | Client -> Server | `{ taskId, status, start_date, end_date, userId }` | Server updates status/dates, broadcasts `task:moved` |
| `task:moved` | Server -> All | `{ task: TaskItem, activity: ActivityLogItem }` | Instant reposition in Timeline & Kanban across all browsers |
| `task:delete` | Client -> Server | `{ taskId, userId }` | Server deletes task, broadcasts `task:deleted` |
| `task:deleted` | Server -> All | `{ taskId, activity: ActivityLogItem }` | Clients remove task from state |
| `doc:created` | Server -> All | `{ doc: LearningDoc, activity: ActivityLogItem }` | Clients add doc to Learn tab |
| `doc:step_toggle`| Client -> Server | `{ docId, stepNumber, completed, userId }` | Server updates step checklist in DB, broadcasts `doc:step_toggled` |
| `doc:step_toggled` | Server -> All | `{ docId, stepNumber, completed, activity }` | Clients synchronize checklist checkbox |
| `credits:updated` | Server -> All | `{ creditBalance, delta, reason, userId }` | Clients update visual credit counter pill |
| `activity:new` | Server -> All | `{ activity: ActivityLogItem }` | Clients prepend to live activity stream & trigger subtle toast |

---

### 2.5 Gemini AI Integration & Heuristic Fallback Engine

The AI subsystem provides full autonomous capability regardless of external network or API key status:

```
                  +-----------------------------------+
                  |   Incoming AI Generation Request  |
                  | (Generate Guide / Auto-Roadmap)   |
                  +-----------------+-----------------+
                                    |
                                    v
                  +-----------------------------------+
                  |     Atomic Credit Check & Lock    |
                  |     (Guide: 5, Roadmap: 10)       |
                  +-----------------+-----------------+
                         /                     \
             [Sufficient]                       [Insufficient]
                  /                                   \
                 v                                     v
+-----------------------------------+     +-----------------------------------+
|  Check API Key in DB / Env Var    |     |  Return HTTP 402: Insufficient    |
+-----------------+-----------------+     |  Prompt Top-Up Modal (+50 / +100) |
       /                     \            +-----------------------------------+
  [Key Exists]             [No Key / Invalid]
      /                               \
     v                                 v
+------------------------+   +------------------------------------+
| Call Gemini 1.5 Flash  |   | Call HeuristicAIEngine.ts          |
| via Google GenAI SDK   |   | - Contextual keyword classification|
+-----------+------------+   | - Generates rich Markdown sections |
     |      | (on error)     | - Realistic task decomposition     |
     |      +--------------->| - AI relevance matching reasoning  |
     v                       +-----------------+------------------+
+------------------------+                     |
|  Parsed Structured     |<--------------------+
|  Markdown & Tasks      |
+-----------+------------+
            |
            v
+-----------------------------------+
| 1. Deduct Credits Atomically      |
| 2. Persist in SQLite DB           |
| 3. Create Activity Log Record     |
| 4. Broadcast Socket.io Events     |
| 5. Return Response to Client      |
+-----------------------------------+
```

#### Heuristic AI Generation Logic:
The fallback engine (`heuristicAIEngine.ts`) uses deterministic semantic expansion templates with tailored domain modules:
1. **Guide Synthesis Engine**:
   - Analyzes the input prompt against domain keywords (`websocket`, `sqlite`, `drag`, `canvas`, `kanban`, `gemini`, `react`, `tailwind`, `auth`, `deploy`).
   - Generates an executive summary, AI relevance explanation tied to the user profile, media preview links (e.g. curated technical diagrams/docs), 4-6 step actionable checklists, and comprehensive Markdown with code blocks.
2. **Auto-Roadmap Synthesis Engine**:
   - Breaks any project prompt (e.g. *"Build Real-time Notification System"*, *"Implement Search Indexing"*, *"Revamp UI Design System"*) into 3 to 5 sequentially scheduled tasks across the team members with:
     - Title, description, suggested assignee (matching user strengths: Cam -> Backend, Liam -> Frontend/UI, Alex -> AI/Ops).
     - Start and end dates distributed across a 7 to 14-day Gantt timeline.
     - Checklist items and category tags.

---

### 2.6 Build & Tooling Configuration

#### Root `package.json` Structure:

```json
{
  "name": "welcome-back-atlas",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "concurrently -n \"SERVER,CLIENT\" -c \"blue,green\" \"npm run dev:server\" \"npm run dev:client\"",
    "dev:server": "tsx watch server/index.ts",
    "dev:client": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "start": "NODE_ENV=production tsx server/index.ts",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "vitest run tests/e2e"
  },
  "dependencies": {
    "better-sqlite3": "^11.8.1",
    "clsx": "^2.1.1",
    "date-fns": "^4.1.0",
    "express": "^4.21.2",
    "lucide-react": "^0.475.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-markdown": "^9.0.3",
    "remark-gfm": "^4.0.0",
    "socket.io": "^4.8.1",
    "socket.io-client": "^4.8.1",
    "tailwind-merge": "^3.0.1"
  },
  "devDependencies": {
    "@tailwindcss/typography": "^0.5.16",
    "@types/better-sqlite3": "^7.6.12",
    "@types/express": "^5.0.0",
    "@types/node": "^22.13.4",
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "concurrently": "^9.1.2",
    "postcss": "^8.5.2",
    "supertest": "^7.0.0",
    "tailwindcss": "^3.4.17",
    "tsx": "^4.19.2",
    "typescript": "^5.7.3",
    "vite": "^6.1.0",
    "vitest": "^3.0.5"
  }
}
```

#### `vite.config.ts` Proxy Configuration:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
      },
    },
  },
});
```

---

### 2.7 Multi-User Real-Time E2E & Unit Testing Strategy

To guarantee strict compliance with Acceptance Criteria without requiring manual multi-browser clicking:

1. **Virtual Multi-Client Socket Harness (`tests/e2e/multiUserSync.spec.ts`)**:
   - Connects 3 independent `socket.io-client` instances simulating Cam, Liam, and Alex.
   - **Assertion 1 (Real-Time Task Move)**: `clientCam` emits `task:move` moving `task-1` from `in_progress` to `done`. Verifies both `clientLiam` and `clientAlex` receive `task:moved` within 50ms with matching payload.
   - **Assertion 2 (User Status Switch)**: `clientLiam` emits `user:update_status` to `'Away'`. Verifies all peers receive `user:status_changed`.
   - **Assertion 3 (Doc Step Toggle)**: `clientAlex` toggles step 2 in `doc-1`. Verifies `doc:step_toggled` is received by all clients.
   - **Assertion 4 (Credit & Activity Stream)**: When AI action executes, verifies `credits:updated` and `activity:new` are received across all sockets.
2. **Gantt & Kanban Date Logic Unit Tests (`tests/unit/taskRepository.test.ts`)**:
   - Tests date interval calculations, drag delta updates, and validation that `start_date <= end_date`.
3. **AI Fallback & Credit Boundary Tests (`tests/unit/aiService.test.ts`)**:
   - Validates that AI generator produces full rich Markdown and step items without an API key.
   - Validates that credit balance decrements by exactly 5 for guides and 10 for roadmaps.
   - Validates error when credits are 0 and successful replenishment on top-up.

---

## 3. Caveats

1. **Native SQLite Compiles**: `better-sqlite3` uses a native C++ addon. Node.js headers must compile smoothly (standard on macOS). If a pure JS fallback is ever needed, `sql.js` or synchronous JSON storage could serve as an emergency fallback, but `better-sqlite3` is optimal and standard for this environment.
2. **API Key Security**: Storing user-inputted Gemini API keys in SQLite `app_settings` is designed for local development / internal team usage. In production, keys should be protected behind environment variables and server-only endpoints (which our API contract enforces by never returning the raw key in `GET /api/settings`).
3. **Concurrent Edits on Same Task**: If two users edit the same task description simultaneously, the last write wins (LWW) via SQLite transactions. Socket updates immediately sync the latest state to all peers.

---

## 4. Conclusion

The technical architecture for **Welcome Back Atlas** is fully specified and ready for implementation. It provides:
1. A unified, lightweight TypeScript stack: Node.js + Express + Socket.io + SQLite (better-sqlite3) on the backend, and React + Vite + Tailwind CSS + Lucide Icons on the frontend.
2. Complete SQLite schemas with foreign keys, indexes, and comprehensive pre-seeded data for Cam, Liam, and Alex.
3. Robust real-time bi-directional event bus ensuring zero-latency updates across all connected browsers.
4. Seamless AI integration featuring Google Gemini API with a high-grade built-in heuristic fallback engine ensuring 100% uptime and offline generation.
5. Clean single-command developer workflow (`npm run dev`) and exhaustive multi-client socket synchronization test suite.

---

## 5. Verification Method

### How to Independently Verify the Architecture Blueprint:
1. **File Inspection**:
   - Check that this blueprint is saved at `/Users/admin/Documents/Apps n stuff/Welcome Back Atlas/.agents/explorer_survey_3/handoff.md`.
2. **Schema & Contract Validation**:
   - Inspect Section 2.3 for SQL DDL tables (`users`, `tasks`, `learning_docs`, `activity_logs`, `app_settings`, `ai_prompt_history`).
   - Inspect Section 2.4 for REST routes and Socket.io event taxonomies.
   - Inspect Section 2.5 for Gemini & Heuristic Fallback execution flow.
   - Inspect Section 2.6 for `package.json` scripts and dependency inventory.
3. **Execution Commands** (during implementation phase):
   - `npm install`
   - `npm run dev` (starts backend on :3001, Vite frontend on :5173)
   - `npm test` (runs Vitest unit and multi-client socket E2E tests)
