# Project: Welcome Back Atlas

## Architecture
Welcome Back Atlas is a real-time collaborative web application designed for Cam, Liam, and Alex. It integrates multi-user profile switching, instant multi-client WebSocket state synchronization, a dynamic greeting dashboard, an individualized 2-pane Learn documentation tab with AI relevance reasoning, a Projects tab with default Gantt Timeline (draggable/stretchable bars) and Kanban board views with project overlay drawers, team progress velocity analytics, and a Gemini API integration with an atomic credit system and built-in heuristic fallback.

### Technology Stack
- **Backend**: Node.js, Express, Socket.io, TypeScript (`tsx`), `better-sqlite3` (SQLite with WAL mode).
- **Frontend**: React 18/19, TypeScript, Vite, Tailwind CSS, `@tailwindcss/typography`, Lucide React (`lucide-react`), `date-fns`, `react-markdown`, `remark-gfm`.
- **Tooling & Orchestration**: `concurrently` (`npm run dev` running server on :3001 and Vite client on :5173), `vitest`, `supertest`.
- **AI Subsystem**: Google Gemini API client + `HeuristicAIEngine` (deterministic high-fidelity offline fallback generator).

### Code Layout
```
Welcome Back Atlas/
├── package.json                   # Root dependencies, scripts (dev, build, test)
├── tsconfig.json                  # Root TypeScript configuration
├── vite.config.ts                 # Vite bundler configuration with /api & /socket.io proxy
├── tailwind.config.js             # Tailwind theme, colors, typography
├── index.html                     # Frontend entry HTML
├── server/
│   ├── index.ts                   # Express app + Socket.io server entry point
│   ├── config.ts                  # Configuration and environment constants
│   ├── db/
│   │   ├── database.ts            # SQLite database connection & pragmas (WAL mode)
│   │   ├── schema.sql             # SQL DDL schemas
│   │   ├── seed.ts                # Seed data for Cam, Liam, Alex, tasks, docs, activity
│   │   └── repositories/          # Type-safe repository layer (user, task, doc, activity, settings)
│   ├── routes/                    # Express REST endpoints (/api/sync, /api/users, /api/tasks, /api/docs, /api/settings, /api/ai)
│   ├── sockets/                   # Socket.io handlers and event dispatchers
│   └── services/                  # Business logic (aiService, heuristicAIEngine, creditService)
├── src/
│   ├── main.tsx                   # React DOM root
│   ├── App.tsx                    # Top-level shell with Navbar, Tabs, Profile Switcher, Modals
│   ├── index.css                  # Tailwind styles and custom utilities
│   ├── types/                     # Shared TypeScript interfaces (user, task, doc, activity, settings, socket)
│   ├── context/                   # AtlasContext (central state & sync) and ToastContext
│   ├── hooks/                     # Custom hooks (useSocket, useTasks, useDocs, useCredits)
│   └── components/
│       ├── common/                # Navbar, UserSwitcher, Avatar, Modal, ToastContainer, Badge
│       ├── dashboard/             # R2: Home Greeting Dashboard (GreetingHeader, ProfileStatusCard, GlobalSearchBar, AssignedTasksCard, QuickJumpLearn, LiveActivityFeed)
│       ├── learn/                 # R3: 2-Pane Learn Tab (LearnTab, LeftTaskList, RightDocViewer, DocPreviewBanner, AIRelevanceBox, MarkdownDocReader, AIGuideModal)
│       ├── projects/              # R4: Projects Tab (ProjectsTab, TimelineGanttView, KanbanView, TaskCard, ProjectOverlayModal, AIRoadmapModal)
│       ├── progress/              # R5: Progress Tab (ProgressTab, VelocityChart, IndividualBurnup, LearningStreakCard)
│       └── settings/              # R5: Settings & Credits (SettingsModal, APIKeyConfig, CreditTopUpModal)
├── tests/
│   ├── unit/                      # Vitest unit test suites
│   ├── e2e/                       # Multi-client WebSocket & REST integration tests
│   └── setup.ts                   # Test environment configuration
└── data/
    └── atlas.sqlite               # Local persistent SQLite database
```

---

## Feature Inventory
Every feature identified during the Survey phase is mapped to a designated milestone.

| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Persistent SQLite Storage & WAL Mode | better-sqlite3 database with WAL mode, foreign keys, indexes | M1 | Survey 1,3 |
| 2 | Seed Data for Cam, Liam, Alex | Pre-populated team members, tasks, docs, activity logs, starter credits | M1 | Survey 1,3 |
| 3 | Core Data Repositories & REST API | Full CRUD endpoints for Users, Tasks, Docs, Activities, Settings, AI | M1 | Survey 1,3 |
| 4 | Socket.io Real-Time Event Bus | Bi-directional WebSocket event replication and room broadcasting | M1 | Survey 1,3 |
| 5 | Atomic Credit Management Engine | Credit deduction, starter 100 credits, balance check, top-up API | M1 | Survey 1,3 |
| 6 | Built-in Heuristic AI Engine | Offline-capable semantic generator for Guides & Roadmaps | M1 | Survey 1,3 |
| 7 | Frontend App Shell & State Hydration | Vite + React + Tailwind shell with AtlasContext connected to Socket.io | M2 | Survey 1,3 |
| 8 | 1-Click Profile Switching (R1) | Instant switcher between Cam, Liam, and Alex with local persistence | M2 | Survey 1 |
| 9 | Distinct Profile Identities & Avatars (R1) | Dedicated colors, initials, roles, themes for Cam (Emerald), Liam (Indigo), Alex (Amber) | M2 | Survey 1 |
| 10 | 3-State Status Toggle (Online, Focused, Away) (R1, R2) | Profile status toggle broadcasting `user:status_changed` in real time | M2 | Survey 1 |
| 11 | Dynamic Signature Header (R2) | Dynamic `"Welcome back, [Cam | Liam | Alex]"` banner adapting to active user | M2 | Survey 1 |
| 12 | User Profile Summary Card (R2) | Profile card with avatar, role, status selector, task count, streak badge | M2 | Survey 1 |
| 13 | Global Omnisearch Bar (`Cmd+K`) (R2) | Global search querying tasks, docs, team members, and activity items | M2 | Survey 1 |
| 14 | Assigned Upcoming Tasks Widget (R2) | Interactive list of active user's pending tasks with inline completion toggle | M2 | Survey 1 |
| 15 | Quick-Jump Learning Cards (R2) | Contextual learning cards linking directly to user's assigned task guides | M2 | Survey 1 |
| 16 | Live Team Activity Feed Stream (R2) | Real-time stream of team actions with avatars, timestamps, and toasts | M2 | Survey 1 |
| 17 | 2-Pane Split Wireframe Layout (R3) | Split layout with left task list & right doc viewer (responsive collapse) | M3 | Survey 2 |
| 18 | Task Checklist & Topic Tag Filters (R3) | Filterable left task list by assignee (`All|Cam|Liam|Alex`) and topic tags | M3 | Survey 2 |
| 19 | Top Resource Preview Banner Card (R3) | Media card with thumbnail, link, duration/read time at top of doc reader | M3 | Survey 2 |
| 20 | AI Relevance Reasoning Section (R3) | Highlighted AI card explaining why doc matches project task & assignee role | M3 | Survey 2 |
| 21 | Rich Markdown Doc Reader with Steps (R3) | Markdown renderer with syntax highlighted code blocks and step checklists | M3 | Survey 2 |
| 22 | "AI Generate Guide" Flow with Credits (R3) | Generation modal calling Gemini (or fallback), deducting 5 credits | M3 | Survey 2 |
| 23 | Timeline / Gantt Roadmap View (Default) (R4) | Interactive horizontal time axis displaying draggable date range bars | M4 | Survey 2 |
| 24 | Draggable Date Range Bars (R4) | Dragging task bar shifts `startDate` and `endDate` preserving duration | M4 | Survey 2 |
| 25 | Stretchable Date Range Handles (R4) | Left/right handles resize `startDate` and `endDate` with boundary checks | M4 | Survey 2 |
| 26 | Kanban Board Toggle View (R4) | 4-column board (`Backlog`, `In Progress`, `In Review`, `Done`) | M4 | Survey 2 |
| 27 | Kanban Drag-and-Drop Card Movement (R4) | Dragging card across columns updates task status in real time | M4 | Survey 2 |
| 28 | Assignee Filter System (R4) | Top filter `All | Cam | Liam | Alex` for Timeline and Kanban | M4 | Survey 2 |
| 29 | Expanded Project Detail Overlay (R4) | Modal/drawer above view with description, dates, subtasks, doc link | M4 | Survey 2 |
| 30 | Attached Learning Doc Shortcut in Overlay (R4) | 1-click navigation from project overlay directly to Learn tab doc | M4 | Survey 2 |
| 31 | AI Auto-Roadmap Generator (R4) | Converts natural language prompt into 4-8 scheduled roadmap tasks | M4 | Survey 2 |
| 32 | Team Completion Velocity Metrics (R5) | Velocity gauges, tasks/week pace, overall completion percentage | M5 | Survey 1 |
| 33 | Individual Task Burn-Up Chart (R5) | Multi-series cumulative burn-up visualization for Cam, Liam, and Alex | M5 | Survey 1 |
| 34 | Contributor Performance Scorecards (R5) | Detailed per-user scorecards (assigned, completed, efficiency rate) | M5 | Survey 1 |
| 35 | Learning & Activity Streak Heatmaps (R5) | Active streak counters (🔥 X days) and 30-day activity heatmap grid | M5 | Survey 1 |
| 36 | Gemini API Key Management in Settings (R5) | Masked key input in Settings with live validation test endpoint | M5 | Survey 1 |
| 37 | Visual AI Credit Counter & Badge (R5) | Real-time credit counter (100 starter credits) in header and settings | M5 | Survey 1 |
| 38 | Interactive Top-Up Modal (R5) | Preset recharge tiers (+50, +100) and Free Dev Refill button | M5 | Survey 1 |
| 39 | Multi-Client Real-Time Sync Verification | Verified real-time broadcast across multiple virtual browser clients | M6 | Survey 1,2,3 |
| 40 | Full Acceptance & Adversarial Hardening | 100% E2E test pass (Tiers 1-4) + Tier 5 white-box coverage hardening | M6 | Survey 1,2,3 |

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| **M1** | Core Backend, SQLite DB, REST APIs & Real-Time Socket.io Server | Setup package.json, TypeScript, better-sqlite3 schemas, seed data, repositories, Express REST endpoints, Socket.io event bus, AI service & heuristic fallback, unit tests. | none | IN_PROGRESS |
| **M2** | Frontend Shell, Multi-User Profile Switcher & Home Greeting Dashboard | React Vite setup, Tailwind CSS, Lucide icons, AtlasContext, UserSwitcher, GreetingHeader, ProfileStatusCard, GlobalSearchBar, AssignedTasksCard, QuickJumpLearn, LiveActivityFeed. | M1 | PLANNED |
| **M3** | Individualized Learn Tab & AI Doc Engine | 2-Pane wireframe layout, LeftTaskList with filters, RightDocViewer with preview banner, AIRelevanceBox, MarkdownDocReader with interactive step checklists, AIGuideModal with credit deduction. | M1, M2 | PLANNED |
| **M4** | Projects Tab (Timeline/Gantt, Kanban Board & Expanded Detail Overlay) | TimelineGanttView with draggable & stretchable date bars, KanbanView with drag-and-drop column movement, Assignee filters, ProjectOverlayModal drawer/modal, AIRoadmapModal generator. | M1, M2, M3 | PLANNED |
| **M5** | Progress Analytics, Settings & Gemini Credit System | ProgressTab with team completion velocity, individual task burn-up charts for Cam, Liam, Alex, learning streak heatmap, SettingsModal with Gemini API key input and validation, CreditTopUpModal. | M1, M2, M3, M4 | PLANNED |
| **M6** | Final Milestone: 100% E2E Test Suite Pass & Adversarial Coverage Hardening | Phase 1: Pass 100% of E2E test suite (Tiers 1-4 published in TEST_READY.md). Phase 2: Adversarial Coverage Hardening (Tier 5 Challenger loop). | M1, M2, M3, M4, M5, TEST_READY.md | PLANNED |

---

## Interface Contracts

### 1. User & Presence (`/api/users`, `user:*`)
- `UserProfile`: `{ id: 'cam' | 'liam' | 'alex', name: string, role: string, avatarColor: string, avatarInitials: string, status: 'Online' | 'Focused' | 'Away', statusMessage: string, streakDays: number }`
- Event `user:update_status`: `{ userId: string, status: 'Online' | 'Focused' | 'Away', statusMessage?: string }`
- Event `user:status_changed`: `{ userId: string, status: 'Online' | 'Focused' | 'Away', statusMessage: string, updatedAt: string }`

### 2. Tasks & Projects (`/api/tasks`, `task:*`)
- `TaskItem`: `{ id: string, title: string, description: string, assignee_id: 'cam' | 'liam' | 'alex', status: 'backlog' | 'in_progress' | 'in_review' | 'done', priority: 'low' | 'medium' | 'high' | 'urgent', start_date: string, end_date: string, progress_pct: number, tags: string[], checklist: { id: string, text: string, completed: boolean }[], doc_id?: string, created_at: string, updated_at: string }`
- Event `task:create` / `task:created`: `{ task: TaskItem, activity: ActivityLogItem }`
- Event `task:update` / `task:updated`: `{ task: TaskItem, activity: ActivityLogItem }`
- Event `task:move` / `task:moved`: `{ task: TaskItem, activity: ActivityLogItem }`
- Event `task:delete` / `task:deleted`: `{ taskId: string, activity: ActivityLogItem }`

### 3. Learning Documentation (`/api/docs`, `doc:*`)
- `LearningDoc`: `{ id: string, title: string, subtitle: string, category: string, tags: string[], preview_image_url: string, preview_link_url: string, ai_relevance_summary: string, ai_relevance_score: number, markdown_content: string, steps: { stepNumber: number, title: string, description: string, completed: boolean }[], linked_task_id?: string, is_ai_generated: boolean }`
- Event `doc:created`: `{ doc: LearningDoc, activity: ActivityLogItem }`
- Event `doc:step_toggled`: `{ docId: string, stepNumber: number, completed: boolean, activity: ActivityLogItem }`

### 4. AI Services & Credits (`/api/ai`, `/api/settings`, `credits:*`)
- `POST /api/ai/generate-guide`: `{ topic: string, taskId?: string, context?: string, userId: string }` -> `{ doc: LearningDoc, creditBalance: number, usedFallback: boolean }` (cost: 5 credits)
- `POST /api/ai/generate-roadmap`: `{ projectGoal: string, targetDays?: number, userId: string }` -> `{ tasks: TaskItem[], creditBalance: number, usedFallback: boolean }` (cost: 10 credits)
- `POST /api/settings/credits/topup`: `{ amount: number, userId: string }` -> `{ creditBalance: number }`
- Event `credits:updated`: `{ creditBalance: number, delta: number, reason: string, userId: string }`
