## 2026-08-20T16:41:34Z
<USER_REQUEST>
You are explorer_m1_3 (AI Subsystem & Test Harness Planner) for Milestone 1.
Your working directory: /Users/admin/Documents/Apps n stuff/Welcome Back Atlas/.agents/sub_orch_m1/explorer_3

Scope & Objective:
Read:
1. /Users/admin/Documents/Apps n stuff/Welcome Back Atlas/ORIGINAL_REQUEST.md
2. /Users/admin/Documents/Apps n stuff/Welcome Back Atlas/PROJECT.md
3. /Users/admin/Documents/Apps n stuff/Welcome Back Atlas/.agents/sub_orch_m1/SCOPE.md
4. /Users/admin/Documents/Apps n stuff/Welcome Back Atlas/.agents/explorer_survey_3/handoff.md

Design the AI subsystem, fallback engine, atomic credit service, and test harness specifications:
- `server/services/aiService.ts`: orchestrator checking API key in settings or env, calling Google Gemini API or falling back to `heuristicAIEngine.ts`.
- `server/services/heuristicAIEngine.ts`: deterministic, high-fidelity offline generation for learning guides (markdown, AI relevance reasoning, step-by-step checklist) and project roadmaps (scheduled task breakdown across Cam, Liam, Alex with start/end dates).
- `server/services/creditService.ts`: atomic credit deduction (Guide: 5, Roadmap: 10), checking balance, rejecting with HTTP 402 if insufficient, and top-up (+50, +100).
- Root package & build configs: `package.json`, `tsconfig.json`, `vite.config.ts`, `tailwind.config.js`.
- Test harness with Vitest and Supertest in `tests/unit/`:
  - `db.test.ts`: table creation, indexes, seed data verification
  - `repositories.test.ts`: CRUD operations on users, tasks, docs, activity, settings
  - `aiService.test.ts`: heuristic engine guide & roadmap generation, API fallback
  - `creditService.test.ts`: atomic credit deductions, insufficient balance rejection, topup
  - `apiRoutes.test.ts`: Supertest API tests for /api/sync/state, /api/users, /api/tasks, /api/docs, /api/settings, /api/ai
  - `sockets.test.ts`: Socket.io connection, room broadcasting, event emission

Write your detailed design and implementation recommendations to handoff.md in your working directory and notify the parent.
</USER_REQUEST>
