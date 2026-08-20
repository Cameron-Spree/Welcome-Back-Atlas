# Scope: Milestone 1 — Core Backend, SQLite DB, REST APIs & Real-Time Socket.io Server

## Architecture
- Backend Node.js / Express / TypeScript server with `better-sqlite3` and Socket.io.
- Database: WAL-mode SQLite database (`server/db/database.ts`), schema DDL with all 10 tables (`server/db/schema.sql`), repositories (`server/db/repositories/*`), and realistic seed data (`server/db/seed.ts`).
- REST API: Express application with comprehensive endpoints under `/api`:
  - `/api/sync/state` (Full state sync for app startup)
  - `/api/users` (CRUD, status toggle, switch active user)
  - `/api/tasks` (CRUD, status, priority, assignees, subtasks, tags, reordering)
  - `/api/docs` (CRUD, content, categories, tags, pinning)
  - `/api/activities` (Feed query, pagination, filters)
  - `/api/settings` (App configuration, AI toggles, credit balance)
  - `/api/ai` (Task breakdown, subtask gen, doc summary, action items, smart chat)
- Socket.io: Real-time event bus with connection management, rooms (`task:<id>`, `doc:<id>`, `global`), live broadcast on entity mutation, cursor/presence tracking, typing indicators.
- AI & Credit Engine: `aiService.ts` calling OpenAI API if key provided, fallback to deterministic & rich `heuristicAIEngine.ts`. Atomic credit deduction via `creditService.ts`.
- Unit & Integration Tests: Comprehensive backend tests under `tests/unit/` using Vitest / Jest / Supertest.

## Features Assigned
| # | Feature | Description | Milestone |
|---|---------|-------------|-----------|
| 1 | SQLite Database & Schema Layer | better-sqlite3 engine, WAL mode, schema DDL with 10 tables, migrations, repositories | M1 |
| 2 | Seed Data Generator | Comprehensive seed data for Cam, Liam, Alex, tasks, docs, activity logs, starter credits | M1 |
| 3 | Express REST API Server | Full REST endpoints for state sync, users, tasks, docs, activities, settings, AI | M1 |
| 4 | Real-Time Socket.io Server | Real-time bi-directional synchronization, room joins, live updates, presence | M1 |
| 5 | AI Service & Fallback Engine | OpenAI integration, rich offline heuristic engine, atomic credit tracking | M1 |
| 6 | Root Build & Tooling Setup | package.json, tsconfig.json, vite/express scripts, test runner setup | M1 |

## Interface Contracts
- See `PROJECT.md § Interface Contracts` for detailed REST API payloads and Socket.io event schemas.
