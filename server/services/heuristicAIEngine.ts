export interface HeuristicGuideOutput {
  title: string;
  subtitle: string;
  category: string;
  tags: string[];
  preview_image_url: string;
  preview_link_url: string;
  ai_relevance_summary: string;
  ai_relevance_score: number;
  markdown_content: string;
  steps: { stepNumber?: number; title: string; description: string; completed?: boolean }[];
}

export interface HeuristicRoadmapTask {
  title: string;
  description: string;
  assignee_id: 'user-cam' | 'user-liam' | 'user-alex' | 'cam' | 'liam' | 'alex';
  status: 'backlog' | 'in_progress' | 'in_review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  start_offset_days: number;
  duration_days: number;
  category: string;
  tags: string[];
  checklist: string[];
}

export class HeuristicAIEngine {
  public generateGuide(
    topic: string,
    taskId?: string,
    context?: string,
    userId: string = 'user-cam'
  ): HeuristicGuideOutput {
    const lower = (topic + ' ' + (context || '')).toLowerCase();

    let category = 'Architecture';
    let tags = ['Engineering', 'Architecture'];
    let roleFocus = 'Cam (Lead Architect & Backend)';
    if (userId.includes('liam')) roleFocus = 'Liam (Product Lead & Frontend)';
    if (userId.includes('alex')) roleFocus = 'Alex (AI Engineer & Operations)';

    if (lower.includes('socket') || lower.includes('real-time') || lower.includes('realtime') || lower.includes('sync') || lower.includes('websocket')) {
      category = 'Architecture';
      tags = ['WebSocket', 'Socket.io', 'Real-Time', 'Concurrency'];
      return {
        title: `Real-Time WebSocket Concurrency & Multi-Device State Replication`,
        subtitle: `Architectural blueprint for zero-latency multi-client state synchronization`,
        category,
        tags,
        preview_image_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=60',
        preview_link_url: 'https://socket.io/docs/v4/',
        ai_relevance_summary: `Directly matches ${roleFocus}'s real-time synchronization requirements. Explains room-based event broadcasting, reconnection resilience, and optimistic UI reconciliation for collaborative multi-client sessions.`,
        ai_relevance_score: 97,
        markdown_content: `# Real-Time WebSocket Concurrency & Multi-Device State Replication

## 1. Architectural Overview
Welcome Back Atlas employs a bi-directional WebSocket architecture using **Socket.io** over an Express HTTP server. All connected clients join the centralized \`atlas-room\` upon authentication, receiving immediate broadcast updates whenever entities change.

\`\`\`
+-------------+         +------------------+         +-------------+
|  Client A   | <-----> | Socket.io Server | <-----> |  Client B   |
| (Active Ed) |         |  ('atlas-room')  |         | (Live View) |
+-------------+         +--------+---------+         +-------------+
                                 |
                                 v
                        +------------------+
                        | SQLite (WAL DB)  |
                        +------------------+
\`\`\`

## 2. Event Propagation Pipeline
1. **Client Action**: Client performs mutation (e.g. \`task:move\`, \`user:update_status\`).
2. **Server Verification**: Express/Socket handler commits transaction to SQLite.
3. **Atomic Broadcast**: Server emits event with updated entity and newly logged activity item.
4. **Reconciliation**: Receiving clients update local React state in-place without page reload.

## 3. Best Practices & Edge Case Safeguards
- **Reconnection Handling**: Client socket automatically reconnects with exponential backoff.
- **Payload Idempotency**: Broadcast payloads carry complete target entity objects to eliminate race condition divergence.
- **Heartbeat & Liveness**: 25s ping/pong keepalive prevents idle connection drops.`,
        steps: [
          { stepNumber: 1, title: 'Initialize Socket.io server with CORS and room management', description: 'Attach Socket.io to Express HTTP listener with origin whitelisting.', completed: false },
          { stepNumber: 2, title: 'Configure client useSocket hook and reconnection logic', description: 'Setup React hook to manage connection lifecycle and event listener subscriptions.', completed: false },
          { stepNumber: 3, title: 'Implement broadcast-on-mutation across REST endpoints', description: 'Ensure task, doc, user status, and credit updates emit structured socket events.', completed: false },
          { stepNumber: 4, title: 'Verify multi-client event propagation under load', description: 'Run virtual socket test suite asserting sub-50ms message latency across peers.', completed: false },
        ],
      };
    }

    if (lower.includes('gantt') || lower.includes('timeline') || lower.includes('drag') || lower.includes('canvas')) {
      category = 'Frontend';
      tags = ['Gantt', 'Timeline', 'DateMath', 'Interactions'];
      return {
        title: `Interactive Gantt Timeline Engine with Draggable & Stretchable Date Bars`,
        subtitle: `Mathematical calculations, pointer event capture, and responsive SVG grid alignment`,
        category,
        tags,
        preview_image_url: 'https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?w=800&auto=format&fit=crop&q=60',
        preview_link_url: 'https://date-fns.org/',
        ai_relevance_summary: `Essential guide for ${roleFocus}. Details date coordinate projection math, horizontal drag delta calculations, and edge-handle resizing logic for the default Projects Timeline view.`,
        ai_relevance_score: 95,
        markdown_content: `# Interactive Gantt Timeline Engine with Draggable & Stretchable Date Bars

## 1. Timeline Coordinate Projection
The Gantt timeline maps discrete dates (\`YYYY-MM-DD\`) to horizontal pixel offsets along a dynamic 14-day calendar window.

\`\`\`typescript
// Calculate horizontal bar offset and width
const dayWidth = 48; // px per day
const offsetDays = differenceInDays(taskStartDate, timelineStart);
const totalDays = differenceInDays(taskEndDate, taskStartDate) + 1;

const barLeft = offsetDays * dayWidth;
const barWidth = Math.max(totalDays * dayWidth, dayWidth);
\`\`\`

## 2. Interaction Handlers
- **Body Drag**: Shifts \`start_date\` and \`end_date\` synchronously, preserving duration.
- **Left Handle Stretch**: Modifies \`start_date\`, clamped to \`start_date <= end_date\`.
- **Right Handle Stretch**: Modifies \`end_date\`, clamped to \`end_date >= start_date\`.

## 3. Optimistic UI & Socket Sync
When drag finishes (\`onPointerUp\`), optimistic UI state is locked and a \`task:move\` payload is dispatched over Socket.io to persist in SQLite and update all connected teammates.`,
        steps: [
          { stepNumber: 1, title: 'Define 14-day dynamic timeline window with date-fns', description: 'Construct day column headers, weekend highlights, and today-marker indicator.', completed: false },
          { stepNumber: 2, title: 'Implement pixel-to-date conversion math', description: 'Convert pointer delta coordinates into discrete day increments.', completed: false },
          { stepNumber: 3, title: 'Attach pointer drag and resize listeners to TaskBar component', description: 'Handle pointerdown, pointermove, pointerup with CSS cursor indicators.', completed: false },
          { stepNumber: 4, title: 'Add real-time date mutation broadcast on drop', description: 'Dispatch task:move event to server and persist updated dates in SQLite.', completed: false },
        ],
      };
    }

    if (lower.includes('sqlite') || lower.includes('db') || lower.includes('database') || lower.includes('wal')) {
      category = 'Architecture';
      tags = ['SQLite', 'better-sqlite3', 'WAL-Mode', 'ACID'];
      return {
        title: `High-Performance SQLite Persistence with WAL Mode and Atomic Operations`,
        subtitle: `Zero-latency synchronous embedded storage with concurrent read support`,
        category,
        tags,
        preview_image_url: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&auto=format&fit=crop&q=60',
        preview_link_url: 'https://www.sqlite.org/wal.html',
        ai_relevance_summary: `Tailored for ${roleFocus}. Details SQLite WAL pragma configuration, repository patterns, foreign key constraints, and atomic transaction safety.`,
        ai_relevance_score: 98,
        markdown_content: `# High-Performance SQLite Persistence with WAL Mode and Atomic Operations

## 1. SQLite Pragmas for Collaborative Workloads
By default, SQLite uses rollback journal mode which locks the entire database file during writes. Enabling **Write-Ahead Logging (WAL)** allows concurrent readers while a write proceeds in parallel.

\`\`\`sql
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 5000;
PRAGMA synchronous = NORMAL;
\`\`\`

## 2. Atomic Credit & State Transactions
All credit deductions and multi-entity modifications execute inside immediate transactions to prevent race conditions:

\`\`\`typescript
const deductTx = db.transaction((userId: string, cost: number) => {
  const current = getCredits();
  if (current < cost) throw new InsufficientCreditsError();
  setCredits(current - cost);
  logActivity({ action_type: 'CREDITS_DEDUCTED', details: { cost, remaining: current - cost } });
});
\`\`\`

## 3. Schema Indexing Strategy
Indexes are strategically placed on foreign keys and high-frequency filter columns (\`assignee_id\`, \`status\`, \`start_date\`, \`category\`, \`timestamp\`).`,
        steps: [
          { stepNumber: 1, title: 'Configure better-sqlite3 instance with WAL and foreign key pragmas', description: 'Initialize database connection in server/db/database.ts with automated directory creation.', completed: false },
          { stepNumber: 2, title: 'Execute schema DDL migration with all tables and indexes', description: 'Load schema.sql to ensure users, tasks, docs, activity, settings, and ai history exist.', completed: false },
          { stepNumber: 3, title: 'Implement type-safe repository DAOs', description: 'Build user, task, doc, activity, and settings repositories with prepared statements.', completed: false },
          { stepNumber: 4, title: 'Seed realistic team data for Cam, Liam, and Alex', description: 'Populate rich initial tasks, guides, and 100 starter credits if database is clean.', completed: false },
        ],
      };
    }

    // Default High-Fidelity Synthesizer for arbitrary technical topics
    const cleanTopic = topic.trim();
    return {
      title: `Technical Architecture Guide: ${cleanTopic}`,
      subtitle: `System design, implementation strategy, and verified workflows for ${cleanTopic}`,
      category,
      tags: [cleanTopic.split(' ')[0] || 'Engineering', 'Architecture', 'AI-Curated'],
      preview_image_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=60',
      preview_link_url: 'https://github.com',
      ai_relevance_summary: `Generated for ${roleFocus} to support "${cleanTopic}". Outlines architectural specifications, component interfaces, error boundaries, and integration steps.`,
      ai_relevance_score: 92,
      markdown_content: `# Technical Architecture Guide: ${cleanTopic}

## 1. System Requirements & Context
This guide outlines the technical implementation strategy for **${cleanTopic}** within the Welcome Back Atlas collaborative workspace.

### Core Objectives
- Ensure modularity, type safety, and real-time state synchronization across all connected clients.
- Provide clean component boundaries and fault-tolerant fallbacks.

## 2. Architectural Specification & Design Patterns
When building **${cleanTopic}**, adhere to the unified unidirectional data flow:
1. Client components dispatch typed requests to Express REST endpoints or Socket.io events.
2. Server validates payloads, performs atomic SQLite transactions, and creates activity logs.
3. Socket.io broadcasts updates to all active peers in \`atlas-room\`.

\`\`\`typescript
// Interface contract for ${cleanTopic.replace(/[^a-zA-Z0-9]/g, '') || 'Module'}
export interface ${cleanTopic.replace(/[^a-zA-Z0-9]/g, '') || 'Module'}Config {
  id: string;
  name: string;
  enabled: boolean;
  metadata: Record<string, unknown>;
}
\`\`\`

## 3. Verification & Observability
- Validate functionality using automated Vitest unit suites.
- Monitor real-time activity log feed to confirm peer notifications.`,
      steps: [
        { stepNumber: 1, title: `Analyze technical requirements for ${cleanTopic}`, description: 'Review system constraints and define interface contracts.', completed: false },
        { stepNumber: 2, title: `Implement core service logic and repository methods`, description: 'Build backend data access layer with SQLite transaction safety.', completed: false },
        { stepNumber: 3, title: `Integrate frontend UI components and real-time sync hooks`, description: 'Connect React components to AtlasContext and Socket.io event bus.', completed: false },
        { stepNumber: 4, title: `Verify with automated unit and integration test suites`, description: 'Execute Vitest suites to confirm zero regressions.', completed: false },
      ],
    };
  }

  public generateRoadmap(projectGoal: string, targetDays: number = 10): HeuristicRoadmapTask[] {
    const lower = projectGoal.toLowerCase();

    if (lower.includes('real-time') || lower.includes('socket') || lower.includes('chat') || lower.includes('notify') || lower.includes('notification')) {
      return [
        {
          title: 'Architect Socket.io Event Channels & Reconnect Buffer',
          description: 'Define typed socket event schemas, client room dispatchers, and reconnection backoff strategy.',
          assignee_id: 'user-cam',
          status: 'in_progress',
          priority: 'urgent',
          start_offset_days: 0,
          duration_days: 3,
          category: 'Architecture',
          tags: ['WebSocket', 'Backend', 'Socket.io'],
          checklist: ['Setup atlas-room broadcast handler', 'Add heartbeat ping/pong keepalive', 'Handle sudden disconnect grace period'],
        },
        {
          title: 'Implement Multi-User Status Toggle & Presence Indicators',
          description: 'Build 1-click status switcher (Online, Focused, Away) with immediate peer badge synchronization.',
          assignee_id: 'user-liam',
          status: 'backlog',
          priority: 'high',
          start_offset_days: 2,
          duration_days: 3,
          category: 'Frontend',
          tags: ['UI/UX', 'Profile', 'Presence'],
          checklist: ['Create StatusDropdown component', 'Bind useSocket user:update_status event', 'Add visual color ring to Avatars'],
        },
        {
          title: 'Automated Multi-Client Virtual Socket Test Harness',
          description: 'Construct Vitest suite running 3 concurrent socket clients simulating Cam, Liam, and Alex.',
          assignee_id: 'user-alex',
          status: 'backlog',
          priority: 'medium',
          start_offset_days: 4,
          duration_days: 4,
          category: 'QA / Infra',
          tags: ['Testing', 'Vitest', 'MultiClient'],
          checklist: ['Write multiUserSync.spec.ts', 'Assert sub-50ms event latency', 'Verify broadcast payload integrity'],
        },
        {
          title: 'Live Activity Feed Stream & Floating Toast Notifications',
          description: 'Render real-time team action stream with relative timestamps and subtle toast alerts.',
          assignee_id: 'user-liam',
          status: 'backlog',
          priority: 'medium',
          start_offset_days: 6,
          duration_days: 4,
          category: 'Frontend',
          tags: ['ActivityFeed', 'Toast', 'Tailwind'],
          checklist: ['Build LiveActivityFeed component', 'Integrate ToastContext provider', 'Add sound/visual cue on peer actions'],
        },
      ];
    }

    // Default Comprehensive Multi-User Engineering Roadmap
    const cleanGoal = projectGoal.trim();
    return [
      {
        title: `Backend System Architecture & Data Schema for ${cleanGoal.slice(0, 30)}`,
        description: `Design SQLite schema tables, indexes, and type-safe repository methods to support ${cleanGoal}.`,
        assignee_id: 'user-cam',
        status: 'in_progress',
        priority: 'urgent',
        start_offset_days: 0,
        duration_days: 2,
        category: 'Architecture',
        tags: ['Backend', 'SQLite', 'Schema'],
        checklist: ['Draft schema DDL migrations', 'Implement DAO repository layer', 'Write unit tests for CRUD operations'],
      },
      {
        title: `Interactive Frontend Components & UI Views for ${cleanGoal.slice(0, 30)}`,
        description: `Build responsive React components with Tailwind styling and glassmorphic aesthetics.`,
        assignee_id: 'user-liam',
        status: 'backlog',
        priority: 'high',
        start_offset_days: 2,
        duration_days: 4,
        category: 'Frontend',
        tags: ['React', 'Tailwind', 'UI/UX'],
        checklist: ['Create view shell and navigation tabs', 'Implement responsive layout with CSS Grid', 'Add keyboard navigation shortcuts'],
      },
      {
        title: `AI Prompt Orchestration & Heuristic Fallback Integration`,
        description: `Configure Gemini 1.5 Flash endpoint, token usage metering, and deterministic offline engine.`,
        assignee_id: 'user-alex',
        status: 'backlog',
        priority: 'high',
        start_offset_days: 3,
        duration_days: 3,
        category: 'AI / Data',
        tags: ['Gemini', 'PromptEngineering', 'Fallback'],
        checklist: ['Format structured JSON prompt templates', 'Implement heuristic fallback generator', 'Add credit deduction validation'],
      },
      {
        title: `Multi-Client Real-Time Synchronization & E2E Validation`,
        description: `Connect Socket.io real-time event bus and execute full test matrix across Cam, Liam, and Alex.`,
        assignee_id: 'user-alex',
        status: 'backlog',
        priority: 'medium',
        start_offset_days: 6,
        duration_days: 4,
        category: 'QA / Infra',
        tags: ['E2E', 'Socket.io', 'Integration'],
        checklist: ['Run Vitest unit and integration suites', 'Verify real-time event broadcasting', 'Profile frontend render performance'],
      },
    ];
  }
}

export const heuristicAIEngine = new HeuristicAIEngine();
export default heuristicAIEngine;
