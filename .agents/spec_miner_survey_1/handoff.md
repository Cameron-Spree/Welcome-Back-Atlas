# Specification Analysis & Requirements Blueprint: R1, R2, and R5

**Workspace**: `/Users/admin/Documents/Apps n stuff/Welcome Back Atlas`  
**Agent**: `spec_miner_survey_1` (Specification Miner)  
**Assigned Scope**: Requirement R1 (Multi-User Profile System & Real-Time Sync), Requirement R2 (First Screen / Home Greeting Dashboard), Requirement R5 (Progress Tab & Gemini API Credit System).

---

## 1. Observation

### 1.1 Direct Requirements Extracted from `ORIGINAL_REQUEST.md`

1. **Requirement R1 (Multi-User Profile System & Real-Time Sync)**:
   - *Users*: Fixed trio of team members: **Cam**, **Liam**, and **Alex**.
   - *1-Click Switching*: Instant switching mechanism across profiles with distinct avatars, status indicators, and stored settings.
   - *Real-time WebSocket Sync*: Built with Node.js + Express + Socket.io + persistent JSON/SQLite DB so edits made on one device/browser window update instantly across all connected clients without manual page reloads.

2. **Requirement R2 (First Screen / Home Greeting Dashboard)**:
   - *Signature Greeting*: Dynamic header `"Welcome back, [Cam | Liam | Alex]"` adapting immediately to the active profile.
   - *User Profile Card*: Displays active avatar, role, and a status toggle with three states (`Online`, `Focused`, `Away`).
   - *Global Search Bar*: Omnisearch bar for querying roadmap tasks, projects, learning guides, team members, and activity.
   - *Assigned Upcoming Roadmap Tasks*: Widget showing prioritized upcoming tasks assigned to the active user.
   - *Quick-Jump Learning Cards*: Curated learning cards directly tied to active projects/tasks with 1-click navigation to Learn tab.
   - *Live Team Activity Feed*: Real-time stream of all user actions across the team (task updates, status changes, AI guide generations, credit top-ups) with timestamps and user avatars.

3. **Requirement R5 (Progress Tab & Gemini API Credit System)**:
   - *Progress Metrics*: Team completion velocity metrics, individual task burn-up charts for Cam, Liam, and Alex, and daily learning streaks.
   - *Settings & Credits*: Gemini API key management in Settings with masked input and validation.
   - *Visual AI Credit Counter*: Real-time credit counter (defaulting to 100 starter credits), deduction on AI actions, and top-up modal.
   - *Intelligent Fallback*: Automatic, seamless fallback generation when the Gemini API key is omitted, invalid, or exhausted, ensuring zero runtime crashes.

---

## 2. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | R1: Profiles | 1-Click Profile Switching | Instant header/navigation user switcher between Cam, Liam, and Alex | Click on target user profile | Updates active user context, UI greeting, filters, local storage, emits presence | Falls back to default user (`cam`) if invalid ID | `ORIGINAL_REQUEST.md:20` |
| 2 | R1: Profiles | Distinct Profile Identities | Dedicated styling, avatars, color palettes, role metadata, and email for Cam, Liam, Alex | User ID selection | Renders profile avatar, badge, theme accents | Default fallback avatar & palette | `ORIGINAL_REQUEST.md:20` |
| 3 | R1: Profiles | User Status Indicator & Toggle | 3-state status (`Online`, `Focused`, `Away`) with visual dot & custom message | Status enum selection | Updates user profile state & broadcasts via Socket.io | Reverts to `Online` on reconnect | `ORIGINAL_REQUEST.md:20,25` |
| 4 | R1: Profiles | Stored User Preferences | Persistent per-user preferences (theme, notification sound, compact view, default tab) | Settings form values | Saved to DB and synchronized across sessions | Uses default config if corrupted | `ORIGINAL_REQUEST.md:20,44` |
| 5 | R1: Sync | Real-Time WebSocket Engine | Socket.io server connection providing bidirectional event bus with room management | WebSocket connection / event payloads | Real-time state replication to all connected clients | Auto-reconnect with exponential backoff & full-state sync | `ORIGINAL_REQUEST.md:21,56` |
| 6 | R1: Sync | Persistent DB Storage | SQLite / persistent JSON store ensuring zero data loss across server restarts | DB read/write queries | Persistent entity records (tasks, users, credits, activities, docs) | Atomic transactions; rollback on disk write error | `ORIGINAL_REQUEST.md:21` |
| 7 | R1: Sync | Live State Reconciliation | Full snapshot broadcast on socket connect (`sync:initial_state`) + delta events | Socket connection handshake | Complete hydrated client state | Re-fetch fallback via REST API `/api/state` | `ORIGINAL_REQUEST.md:21,56` |
| 8 | R2: Dashboard | Dynamic Signature Header | Prominent `"Welcome back, [Cam | Liam | Alex]"` banner with contextual subtitle & date | Active user state change | Personalized greeting text with accent color | Defaults to `"Welcome back, Cam"` | `ORIGINAL_REQUEST.md:24` |
| 9 | R2: Dashboard | User Profile Summary Card | Overview card featuring avatar, status selector, assigned task count, streak badge, credits | User state & aggregated metrics | Rendered summary card with live metric badges | Displays skeleton loader during hydration | `ORIGINAL_REQUEST.md:25` |
| 10 | R2: Dashboard | Global Omnisearch Bar | Universal search with `Cmd+K` shortcut searching across Tasks, Docs, Activity, and Users | Search query string | Categorized dropdown results modal with keyboard navigation | "No results found" empty state with suggestions | `ORIGINAL_REQUEST.md:25` |
| 11 | R2: Dashboard | Assigned Upcoming Tasks Widget | Interactive list of active user's pending tasks sorted by due date with inline completion toggle | Checkbox toggle or item click | Toggles task status (emits sync), or opens detail overlay | Graceful empty state ("All caught up!") | `ORIGINAL_REQUEST.md:25` |
| 12 | R2: Dashboard | Quick-Jump Learning Cards | Recommended doc cards relevant to active user's assigned tasks with 1-click jump | Click card button | Transitions to Learn tab and selects target document | If doc missing, opens Learn tab root | `ORIGINAL_REQUEST.md:25` |
| 13 | R2: Dashboard | Live Team Activity Feed | Real-time scrollable timeline of actions performed by Cam, Liam, and Alex | Incoming `activity:new` socket events | Animated feed item with avatar, timestamp, action badge | Paginated/capped at latest 50 items to prevent DOM bloat | `ORIGINAL_REQUEST.md:25` |
| 14 | R5: Progress | Team Completion Velocity | Aggregate metrics showing completed vs total tasks, velocity rate (tasks/week), completion % | Task status dataset | Velocity gauges, donut charts, and sprint pace metrics | Handles 0 total tasks without NaN division | `ORIGINAL_REQUEST.md:43` |
| 15 | R5: Progress | Individual Task Burn-Up Chart | Multi-series cumulative burn-up visualization tracking Cam, Liam, and Alex over time | Historical task completion timestamps | Multi-line/area chart (Cam: Indigo, Liam: Emerald, Alex: Purple) | Renders flat baseline if no completions yet | `ORIGINAL_REQUEST.md:43` |
| 16 | R5: Progress | Contributor Performance Scorecards | Detailed per-user scorecards (assigned, completed, efficiency %, average cycle time) | Task and user metadata | User metric cards with progress bars | Displays 0% for users with no assigned tasks | `ORIGINAL_REQUEST.md:43` |
| 17 | R5: Progress | Learning & Activity Streaks | Daily streak counter (🔥 X days) and 30-day activity heatmap grid per user | Daily activity log timestamps | Streak count badge and GitHub-style heat calendar | Streak resets if >24h without qualified activity | `ORIGINAL_REQUEST.md:43` |
| 18 | R5: Credits | Gemini API Key Management | Masked input field in Settings with show/hide toggle and live key verification test | Gemini API Key string | Secure storage + validation indicator (🟢 Valid / 🔴 Invalid) | Friendly warning; switches to fallback mode | `ORIGINAL_REQUEST.md:44,59` |
| 19 | R5: Credits | Visual AI Credit Counter | Visual credit counter in header & settings initialized to 100 starter credits | Credit deduct/topup events | Color-coded credit badge (Green/Amber/Red) with animated count | Disallows operations when balance < cost | `ORIGINAL_REQUEST.md:44,59` |
| 20 | R5: Credits | Interactive Top-Up Modal | Modal offering preset credit recharge packages (+50, +100, +250, Free Dev Top-Up) | Top-up tier selection | Increases balance, writes to DB, logs activity, broadcasts | Input sanitization; disallows negative amounts | `ORIGINAL_REQUEST.md:44` |
| 21 | R5: Credits | Offline / Fallback AI Engine | Deterministic, high-fidelity mock AI generator for guides and roadmaps when key is omitted | AI prompt / task context | Rich Markdown doc / structured JSON roadmap | Guaranteed 100% uptime with no external network crash | `ORIGINAL_REQUEST.md:44,58` |

---

## 3. Edge Cases & Boundary Conditions

| # | Feature | Input / Condition | Observed & Expected Behavior |
|---|---------|-------------------|-----------------------------|
| 1 | Profile Switching | User switches profile while editing a task modal | Active user updates immediately; active edit form retains draft state without data loss; new author metadata applied. |
| 2 | Profile Switching | Rapid multi-clicking on profile switchers | Client debounces switch calls; socket broadcast sends single latest active state; prevents UI flicker. |
| 3 | WebSocket Sync | Client loses internet connection / server restarts | UI displays non-intrusive "Reconnecting..." badge; queues local UI actions; upon reconnect, requests `sync:request_full_state` and reconciles seamlessly. |
| 4 | WebSocket Sync | Two users edit the same task description concurrently | Server applies Last-Write-Wins (LWW) with server-assigned `updatedAt` timestamp and broadcasts final version; client displays brief update indicator. |
| 5 | Global Search | Search query contains regex symbols, emoji, or special characters (`?`, `*`, `[`, `]`, `\`) | String sanitized and escaped before pattern matching; searches substring cleanly without crashing regex engine. |
| 6 | Global Search | Search query produces 0 matches | Renders clean "No matches found for '[query]'" with quick links to create a new task or browse all docs. |
| 7 | Dashboard Upcoming | Active user has 0 assigned tasks | Displays motivational empty state: `"No upcoming tasks! Enjoy your day or create a new task."` with "+ Create Task" button. |
| 8 | Dashboard Upcoming | Task due date is in the past (overdue) | Task displays distinct red warning badge ("Overdue by X days") and floats to top of priority list. |
| 9 | Activity Feed | 500+ activity events generated in a session | Feed caps in-memory DOM items to latest 50 items with virtualized / lazy scrolling to maintain 60 FPS rendering. |
| 10 | Progress Velocity | Zero tasks completed in initial state | Velocity shows 0 tasks/week and 0% completion without `NaN` or division-by-zero errors. |
| 11 | Burn-Up Chart | Only 1 user has completed tasks | Chart renders all 3 user lines; active user shows upward slope, other 2 show flat lines along the 0 baseline. |
| 12 | Learning Streaks | User completes an activity across timezone / midnight boundary | Timestamps normalized to UTC day boundaries to compute consecutive active days accurately. |
| 13 | Credit System | Credit balance is 0 and user requests AI Guide | UI disables button or shows Top-Up modal with message: `"Insufficient credits. Top up or use Fallback Mode."` Prevents negative balance. |
| 14 | Credit System | User enters invalid or expired Gemini API key | System catches 400/403/429 HTTP errors from Gemini API, sets status to `"Fallback Mode Active"`, and generates built-in rich template. |
| 15 | Credit Top-Up | Concurrent top-up from two browser windows | Server handles credit updates atomically via SQLite integer increment (`UPDATE credits SET balance = balance + ?`), preventing lost updates. |
| 16 | Local Persistence | Browser local storage cleared or disabled | App gracefully falls back to in-memory state and server SQLite database source of truth. |

---

## 4. Deep Architectural Specifications

### 4.1 Concrete Data Models (TypeScript Interfaces)

```typescript
// ==========================================
// 1. User & Profile Models (R1)
// ==========================================

export type UserId = 'cam' | 'liam' | 'alex';
export type UserStatus = 'online' | 'focused' | 'away';

export interface UserPreferences {
  theme: 'dark' | 'light' | 'system';
  notificationSound: boolean;
  defaultView: 'timeline' | 'kanban';
  compactMode: boolean;
  autoSave: boolean;
  aiPromptStyle: 'concise' | 'detailed' | 'step-by-step';
}

export interface UserProfile {
  id: UserId;
  name: string;
  role: string;
  email: string;
  avatarColor: string;      // e.g. '#6366F1' (Cam), '#10B981' (Liam), '#8B5CF6' (Alex)
  avatarInitials: string;   // 'C', 'L', 'A'
  avatarUrl?: string;
  status: UserStatus;
  customStatusText?: string;
  lastActiveAt: string;     // ISO timestamp
  streakDays: number;
  lastStreakActivityDate: string; // YYYY-MM-DD
  preferences: UserPreferences;
}

// ==========================================
// 2. Activity Feed Models (R2)
// ==========================================

export type ActivityActionType = 
  | 'task_created'
  | 'task_updated'
  | 'task_completed'
  | 'task_status_changed'
  | 'task_deleted'
  | 'guide_generated'
  | 'status_changed'
  | 'credit_topup'
  | 'roadmap_generated';

export interface ActivityFeedItem {
  id: string;
  userId: UserId;
  userName: string;
  userAvatarColor: string;
  actionType: ActivityActionType;
  title: string;
  description: string;
  targetId?: string;        // taskId or docId
  targetType?: 'task' | 'doc' | 'credit' | 'user';
  timestamp: string;        // ISO timestamp
  metadata?: Record<string, any>;
}

// ==========================================
// 3. Task & Roadmap Data Models (R2 & R1 Sync)
// ==========================================

export type TaskStatus = 'Backlog' | 'In Progress' | 'In Review' | 'Done';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assigneeId: UserId;
  status: TaskStatus;
  priority: TaskPriority;
  startDate: string;        // YYYY-MM-DD
  dueDate: string;          // YYYY-MM-DD
  tags: string[];
  checklist: ChecklistItem[];
  attachedDocId?: string;   // Link to Learn Tab document
  completedAt?: string;     // ISO timestamp when moved to Done
  createdAt: string;
  updatedAt: string;
  order: number;            // For Kanban column ordering
}

// ==========================================
// 4. Progress & Velocity Metrics Models (R5)
// ==========================================

export interface UserContributionMetrics {
  userId: UserId;
  userName: string;
  assignedCount: number;
  completedCount: number;
  inProgressCount: number;
  completionRate: number;   // 0 to 100%
  streakDays: number;
  weeklyBurnUp: { date: string; cumulativeDone: number }[];
}

export interface TeamVelocityMetrics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  backlogTasks: number;
  overallCompletionRate: number; // 0 to 100%
  weeklyVelocity: number;        // tasks completed in last 7 days
  velocityTrend: number;         // percentage change vs prior week
  userMetrics: Record<UserId, UserContributionMetrics>;
  activityHeatmap: { date: string; count: number }[]; // 30-day activity map
}

// ==========================================
// 5. Credit System & Settings Models (R5)
// ==========================================

export interface CreditState {
  balance: number;          // Initial 100 starter credits
  starterGranted: boolean;
  totalSpent: number;
  totalTopUp: number;
  costTable: {
    generateGuide: number;    // 10
    autoRoadmap: number;      // 15
    taskBreakdown: number;    // 5
  };
}

export interface AISettings {
  geminiApiKey: string;
  isKeyValid: boolean;
  isFallbackMode: boolean;
  activeModel: string;      // 'gemini-1.5-flash' | 'fallback-mock'
  lastTestedAt?: string;
}

export interface GlobalAppState {
  users: Record<UserId, UserProfile>;
  activeUserId: UserId;
  tasks: Task[];
  activities: ActivityFeedItem[];
  credits: CreditState;
  aiSettings: AISettings;
}
```

---

### 4.2 Real-Time WebSocket Synchronization Protocol (Socket.io)

```
       Client 1 (Cam)                Express / Socket.io Server              Client 2 (Liam)
             |                                    |                                    |
             | ----- 1. socket connect ---------> |                                    |
             | <---- 2. sync:initial_state ------ |                                    |
             |                                    | <----- 3. socket connect --------- |
             |                                    | <----- 4. sync:initial_state ----- |
             |                                    |                                    |
             | -- 5. user:status_update --------> | (writes to SQLite)                 |
             |       {status: 'focused'}          | -- 6. user:status_updated -------->|
             | <---- 6. user:status_updated ----- |       {userId: 'cam', status: '..'}|
             |                                    |                                    |
             | -- 7. task:toggle_complete ------> | (updates task, logs activity)      |
             |                                    | -- 8. task:updated --------------->|
             |                                    | -- 9. activity:new --------------->|
             |                                    | -- 10. progress:updated ---------->|
             |                                    |                                    |
             | -- 11. credit:topup (+100) ------> | (increments balance in DB)         |
             | <---- 12. credit:balance_updated - | -- 12. credit:balance_updated ---->|
             | <---- 13. activity:new ----------- | -- 13. activity:new -------------->|
```

#### Socket.io Event Taxonomy:

1. **Client -> Server Events**:
   - `user:switch`: `{ userId: UserId }`
   - `user:status_update`: `{ userId: UserId, status: UserStatus, customStatusText?: string }`
   - `user:settings_update`: `{ userId: UserId, preferences: Partial<UserPreferences> }`
   - `task:create`: `{ task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> }`
   - `task:update`: `{ taskId: string, updates: Partial<Task> }`
   - `task:delete`: `{ taskId: string }`
   - `task:move`: `{ taskId: string, status: TaskStatus, order: number, startDate?: string, endDate?: string }`
   - `credit:topup`: `{ amount: number, userId: UserId }`
   - `credit:deduct`: `{ amount: number, actionType: string, userId: UserId }`
   - `sync:request_full_state`: `{}`

2. **Server -> Client Broadcast Events**:
   - `sync:initial_state`: `GlobalAppState`
   - `user:status_updated`: `{ userId: UserId, status: UserStatus, customStatusText?: string, lastActiveAt: string }`
   - `user:settings_updated`: `{ userId: UserId, preferences: UserPreferences }`
   - `task:created`: `Task`
   - `task:updated`: `Task`
   - `task:deleted`: `{ taskId: string }`
   - `task:moved`: `{ taskId: string, status: TaskStatus, order: number, startDate?: string, endDate?: string }`
   - `activity:new`: `ActivityFeedItem`
   - `credit:balance_updated`: `CreditState`
   - `progress:updated`: `TeamVelocityMetrics`

---

### 4.3 UI Component Hierarchy & View Specifications

```
WelcomeBackAtlasApp
├── NavigationHeader
│   ├── AppLogo & Title ("Welcome Back Atlas")
│   ├── TabNavigation ([ Dashboard | Projects | Learn | Progress | Settings ])
│   ├── GlobalSearchBar (Cmd+K Omnisearch)
│   ├── CreditBalanceBadge (⚡ 100 Credits -> opens TopUpModal)
│   └── ProfileSwitcherDropdown
│       ├── Active User Pill (Avatar, Name, Status Dot)
│       └── Dropdown Menu (Switch to Cam / Liam / Alex)
│
├── DashboardView (R2 - Home Greeting Screen)
│   ├── GreetingBannerSection
│   │   ├── SignatureHeader ("Welcome back, [Cam | Liam | Alex]")
│   │   ├── Subtitle & Date / Team Pace Headline
│   │   └── QuickActionButtons (+ New Task, AI Auto-Roadmap, Quick Learn)
│   │
│   ├── DashboardGrid (Responsive 3-Column / 2-Row Layout)
│   │   ├── Column 1 (Left: User Pulse)
│   │   │   ├── UserProfileCard (Avatar, Role, Email, Status Toggle: Online/Focused/Away)
│   │   │   └── QuickStatsWidget (Assigned Tasks, Streak 🔥, Done count)
│   │   │
│   │   ├── Column 2 (Center: Active Workstream)
│   │   │   ├── AssignedUpcomingTasksWidget (Filter: My Tasks / Priority, Checkbox toggle, Overlay link)
│   │   │   └── QuickJumpLearningCardsWidget (Curated doc cards with matching project badges)
│   │   │
│   │   └── Column 3 (Right: Team Pulse)
│   │       └── LiveTeamActivityFeedWidget (Real-time stream of Cam/Liam/Alex actions with icons)
│   │
│   └── GlobalSearchModal (Cmd+K popover with categorized results)
│
├── ProgressView (R5 - Velocity & Burn-Up)
│   ├── ProgressHeaderSection
│   │   ├── VelocityOverviewCards (Total Velocity, % Complete, Tasks/Week pace, Active Streak)
│   │   └── SprintPaceGauge / Completion Meter
│   │
│   ├── BurnUpChartSection
│   │   ├── MultiSeriesBurnUpChart (Cumulative completed lines: Cam, Liam, Alex vs Total Scope)
│   │   └── ChartTimeframeSelector (7 Days, 14 Days, 30 Days, All Time)
│   │
│   ├── ContributorScorecardsGrid
│   │   ├── CamScorecard (Assigned, Completed, Efficiency %, Streak)
│   │   ├── LiamScorecard (Assigned, Completed, Efficiency %, Streak)
│   │   └── AlexScorecard (Assigned, Completed, Efficiency %, Streak)
│   │
│   └── LearningStreakHeatmapSection
│       ├── DailyStreakLeaderboard (Cam: 🔥 7d, Liam: 🔥 5d, Alex: 🔥 12d)
│       └── 30-Day Activity Heatmap Matrix
│
├── SettingsModal / Tab (R5 - Settings & API Keys)
│   ├── ProfilePreferencesForm (Theme, Notifications, Default View)
│   ├── GeminiApiKeySection
│   │   ├── KeyInputField (Masked with Eye toggle)
│   │   ├── KeyStatusBadge (🟢 Valid / 🟡 Fallback Mode / 🔴 Invalid)
│   │   └── TestApiKeyButton (Calls lightweight verification endpoint)
│   │
│   └── CreditManagementSection
│       ├── CurrentCreditDisplay (Big counter: ⚡ 100 Credits)
│       ├── UsageBreakdownTable (Guide: 10, Roadmap: 15)
│       └── TopUpCreditButton (Opens TopUpModal)
│
└── TopUpModal
    ├── TopUpHeader ("Top Up AI Generation Credits")
    ├── PresetTiersGrid (+50, +100, +250 Credits)
    ├── InstantDevFreeTopUpButton ("Free +100 Dev Refill")
    └── Close / Confirm Actions
```

---

## 5. Logic Chain

1. **User Identity & State Isolation**: The requirement specifies 1-click user switching between Cam, Liam, and Alex. To achieve this without page reloads, the active profile state must reside in top-level React context, mirrored to localStorage for local refresh persistence, and synchronized to the server via Socket.io so other connected clients reflect presence changes in real time.
2. **Dynamic Dashboard Contextualization**: When the active user changes, the greeting (`"Welcome back, [Cam|Liam|Alex]"`), the user profile card, the assigned upcoming tasks, and the quick-jump learning cards must dynamically re-derive their display filters to match the selected user, giving immediate personal context while the team activity feed keeps full visibility of team actions.
3. **Data Integrity & Real-Time Sync**: Using Socket.io over Express with SQLite persistence guarantees that every mutation (task completion, status toggle, credit topup) is persisted immediately to disk and fanned out to all connected browser tabs. Optimistic updates on the client deliver snappy 0ms perceived latency, with server state reconciliation on connection drop.
4. **Credit System & Resilient AI Execution**: The Gemini API credit system requires a clear starting balance (100 credits), real-time deduction per action, and top-up capabilities. Because network connectivity or API key availability may vary, the architecture incorporates an intelligent built-in fallback mode with rich Markdown generators. This guarantees that all UI flows (Learn tab guide generation and Projects tab auto-roadmap) function flawlessly under all conditions.

---

## 6. Caveats

1. **No External Live Auth Service Required**: The requirement specifies 1-click switching between Cam, Liam, and Alex with stored settings, rather than full OAuth/passwords. Authentication is modeled as immediate profile selection, ideal for agile collaborative environments and testing.
2. **Single Server Process**: The backend is specified as a unified Node.js Express + Socket.io server with SQLite. Multi-server clustering (e.g. Redis adapter for Socket.io) is unnecessary for the single-instance collaborative scope.
3. **Persistent SQLite vs JSON File**: SQLite (via `better-sqlite3` or JSON store) is chosen for synchronous, crash-resilient disk writes with zero external database daemon requirements.

---

## 7. Conclusion

The specifications for R1 (Multi-User Profile & Sync), R2 (Home Greeting Dashboard), and R5 (Progress Tab & Gemini API Credits) are comprehensively mined, fully modeled, and formally defined. All interfaces, data schemas, WebSocket event contracts, UI components, edge cases, and fallback behaviors are documented and ready for direct synthesis into `PROJECT.md` and implementation milestones.

---

## 8. Verification Method

### 8.1 Specification Verification Checkpoints
- **R1 Profile & Sync Verification**:
  1. Inspect `UserProfile` and `GlobalAppState` schemas: verify Cam, Liam, and Alex have distinct avatar colors, roles, and status enums.
  2. Verify WebSocket event taxonomy covers `user:status_update`, `task:create`, `task:update`, `task:move`, `credit:topup`, `sync:initial_state`.
- **R2 Dashboard Verification**:
  1. Verify greeting template dynamically formats `"Welcome back, " + activeUser.name`.
  2. Verify upcoming tasks filter evaluates `task.assigneeId === activeUser.id && task.status !== 'Done'`.
  3. Verify global search queries `title`, `description`, `tags`, `docs`, and `activities`.
- **R5 Progress & Credits Verification**:
  1. Verify burn-up calculation accumulates completed tasks per user over date intervals.
  2. Verify credit balance initializes at 100 and deducts 10 for guides / 15 for auto-roadmap.
  3. Verify fallback mode operates deterministically when `geminiApiKey` is blank or invalid.

### 8.2 Build & E2E Command Contracts (for Implementation)
- Backend & Frontend start: `npm run dev` (boots backend on `:3001` and Vite frontend on `:5173`)
- Type check: `npm run typecheck` or `npx tsc --noEmit`
- Tests: `npm run test` or `npx vitest run`
