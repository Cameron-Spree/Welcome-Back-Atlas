## 2026-08-20T16:41:34Z
You are explorer_m1_2 (REST API & Real-Time Socket Architect) for Milestone 1.
Your working directory: /Users/admin/Documents/Apps n stuff/Welcome Back Atlas/.agents/sub_orch_m1/explorer_2

Scope & Objective:
Read:
1. /Users/admin/Documents/Apps n stuff/Welcome Back Atlas/ORIGINAL_REQUEST.md
2. /Users/admin/Documents/Apps n stuff/Welcome Back Atlas/PROJECT.md
3. /Users/admin/Documents/Apps n stuff/Welcome Back Atlas/.agents/sub_orch_m1/SCOPE.md
4. /Users/admin/Documents/Apps n stuff/Welcome Back Atlas/.agents/explorer_survey_3/handoff.md

Design the Express REST API and Socket.io server layer implementation specifications:
- Server entry point `server/index.ts` and `server/config.ts` (Express app, HTTP server, CORS, JSON middleware, error handling, static serving, graceful shutdown).
- REST API routes in `server/routes/`:
  - `syncRoutes.ts`: `GET /api/sync/state` (full hydration bundle)
  - `userRoutes.ts`: `GET /api/users`, `PATCH /api/users/:id/status`
  - `taskRoutes.ts`: `GET /api/tasks`, `POST /api/tasks`, `PATCH /api/tasks/:id`, `DELETE /api/tasks/:id`, `POST /api/tasks/:id/move`
  - `docRoutes.ts`: `GET /api/docs`, `GET /api/docs/:id`, `POST /api/docs`, `PATCH /api/docs/:id/step`
  - `activityRoutes.ts`: `GET /api/activities`
  - `settingsRoutes.ts`: `GET /api/settings`, `POST /api/settings/apikey`, `POST /api/settings/credits/topup`
  - `aiRoutes.ts`: `POST /api/ai/generate-guide`, `POST /api/ai/generate-roadmap`
- Real-time Socket.io server in `server/sockets/`:
  - `socketHandler.ts`: connection handling, join room "atlas-room", client event dispatchers (`user:update_status`, `task:create`, `task:update`, `task:move`, `task:delete`, `doc:step_toggle`), broadcast helpers.
  - `socketEvents.ts`: typed socket event names & payload interfaces matching the contract in PROJECT.md.

Write your detailed design and implementation recommendations to handoff.md in your working directory and notify the parent.
