## 2026-08-20T16:41:34Z
<USER_REQUEST>
You are explorer_m1_1 (Database & Schema Specialist) for Milestone 1.
Your working directory: /Users/admin/Documents/Apps n stuff/Welcome Back Atlas/.agents/sub_orch_m1/explorer_1

Scope & Objective:
Read:
1. /Users/admin/Documents/Apps n stuff/Welcome Back Atlas/ORIGINAL_REQUEST.md
2. /Users/admin/Documents/Apps n stuff/Welcome Back Atlas/PROJECT.md
3. /Users/admin/Documents/Apps n stuff/Welcome Back Atlas/.agents/sub_orch_m1/SCOPE.md
4. /Users/admin/Documents/Apps n stuff/Welcome Back Atlas/.agents/explorer_survey_3/handoff.md

Design the exact database layer implementation specifications:
- SQLite connection & pragmas with better-sqlite3 in WAL mode, foreign keys ON, auto directory/file creation (`data/atlas.sqlite`), and error handling in `server/db/database.ts`.
- Complete SQL DDL schema in `server/db/schema.sql` with tables: `users`, `learning_docs`, `tasks`, `activity_logs`, `app_settings`, `ai_prompt_history`, plus all indexes.
- Rich seed generator in `server/db/seed.ts` providing realistic pre-populated data for Cam, Liam, Alex, 6 tasks across users, 4 rich learning guides with steps, 6 activity logs, and default settings (100 starter credits).
- Type-safe repository methods in `server/db/repositories/`:
  - `userRepository.ts`: getAll, getById, updateStatus, updateStreak
  - `taskRepository.ts`: getAll, getById, create, update, delete, moveTask, filterTasks
  - `docRepository.ts`: getAll, getById, create, update, toggleStep
  - `activityRepository.ts`: getRecent, logActivity
  - `settingsRepository.ts`: getSetting, setSetting, getAllSettings, getCredits, updateCredits

Write your detailed design and implementation recommendations to handoff.md in your working directory and notify the parent.
</USER_REQUEST>
