import { getDatabase } from './database.js';

export function seedDatabase(forceOrDb?: any, forceFlag?: boolean): void {
  const db = getDatabase();
  const force = typeof forceOrDb === 'boolean' ? forceOrDb : (typeof forceFlag === 'boolean' ? forceFlag : false);

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
    if (force || userCount > 0) {
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
        id: 'user-cam',
        name: 'Cam',
        role_title: 'Lead Architect & Backend',
        avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Cam',
        color_theme: 'emerald',
        status: 'Online',
        status_message: 'Architecting SQLite WAL & Event Bus',
        learning_streak_days: 12,
        created_at: isoNow,
        updated_at: isoNow,
      },
      {
        id: 'user-liam',
        name: 'Liam',
        role_title: 'Product Lead & Frontend',
        avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Liam',
        color_theme: 'indigo',
        status: 'Focused',
        status_message: 'Fine-tuning Gantt & Kanban Drag',
        learning_streak_days: 9,
        created_at: isoNow,
        updated_at: isoNow,
      },
      {
        id: 'user-alex',
        name: 'Alex',
        role_title: 'AI Engineer & Operations',
        avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Alex',
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
        author_id: 'user-cam',
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
        author_id: 'user-alex',
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
        author_id: 'user-liam',
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
        author_id: 'user-liam',
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
        assignee_id: 'user-cam',
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
        created_by: 'user-cam',
        created_at: isoNow,
        updated_at: isoNow,
      },
      {
        id: 'task-2',
        title: 'Implement Atomic Gemini Credit Counter & Fallbacks',
        description: 'Create database transactions for credit balance deduction with non-negative checks and offline fallback handling.',
        assignee_id: 'user-cam',
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
        created_by: 'user-cam',
        created_at: isoNow,
        updated_at: isoNow,
      },
      {
        id: 'task-3',
        title: 'Design Interactive Gantt Drag/Stretch Engine',
        description: 'Build the default Timeline view supporting horizontal bar dragging and handle resizing across date scales.',
        assignee_id: 'user-liam',
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
        created_by: 'user-liam',
        created_at: isoNow,
        updated_at: isoNow,
      },
      {
        id: 'task-4',
        title: 'Refine Glassmorphic Kanban Columns & Overlay Drawer',
        description: 'Implement 4-column drag-and-drop Kanban view with responsive slide-over overlay modal for task inspection.',
        assignee_id: 'user-liam',
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
        created_by: 'user-liam',
        created_at: isoNow,
        updated_at: isoNow,
      },
      {
        id: 'task-5',
        title: 'Integrate Gemini API with Heuristic Markdown Fallback',
        description: 'Wire Google Gemini 1.5 Flash client with intelligent offline markdown heuristics when API keys are absent.',
        assignee_id: 'user-alex',
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
        created_by: 'user-alex',
        created_at: isoNow,
        updated_at: isoNow,
      },
      {
        id: 'task-6',
        title: 'Automated Multi-User E2E Virtual Browser Test Runner',
        description: 'Construct multi-client Socket.io integration test suite validating real-time synchronization across Cam, Liam, and Alex.',
        assignee_id: 'user-alex',
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
        created_by: 'user-alex',
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
        user_id: 'user-cam',
        action_type: 'task_updated',
        target_type: 'task',
        target_id: 'task-2',
        target_title: 'Implement Atomic Gemini Credit Counter & Fallbacks',
        details: JSON.stringify({ status: 'done', progress: 100 }),
        timestamp: getRelativeTimestamp(1),
      },
      {
        id: 'act-2',
        user_id: 'user-liam',
        action_type: 'task_moved',
        target_type: 'task',
        target_id: 'task-4',
        target_title: 'Refine Glassmorphic Kanban Columns & Overlay Drawer',
        details: JSON.stringify({ status: 'in_review', previousStatus: 'in_progress' }),
        timestamp: getRelativeTimestamp(3),
      },
      {
        id: 'act-3',
        user_id: 'user-alex',
        action_type: 'task_updated',
        target_type: 'task',
        target_id: 'task-5',
        target_title: 'Integrate Gemini API with Heuristic Markdown Fallback',
        details: JSON.stringify({ status: 'done', progress: 100 }),
        timestamp: getRelativeTimestamp(5),
      },
      {
        id: 'act-4',
        user_id: 'user-cam',
        action_type: 'doc_step_toggled',
        target_type: 'doc',
        target_id: 'doc-1',
        target_title: 'WebSocket Concurrency & Real-Time Broadcast Optimization',
        details: JSON.stringify({ stepNumber: 2, completed: true }),
        timestamp: getRelativeTimestamp(24),
      },
      {
        id: 'act-5',
        user_id: 'user-liam',
        action_type: 'user_status_changed',
        target_type: 'user',
        target_id: 'user-liam',
        target_title: 'Liam',
        details: JSON.stringify({ status: 'Focused', message: 'Fine-tuning Gantt & Kanban Drag' }),
        timestamp: getRelativeTimestamp(48),
      },
      {
        id: 'act-6',
        user_id: 'user-alex',
        action_type: 'doc_created',
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

export function seedDatabaseIfEmpty(dbOrForce?: any): void {
  seedDatabase(dbOrForce, false);
}

export default seedDatabase;
