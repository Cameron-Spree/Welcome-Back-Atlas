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

-- 2. Learning Docs Table (must exist before tasks foreign key doc_id)
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
  action_type TEXT NOT NULL, -- 'task_created', 'task_updated', 'task_moved', 'task_deleted', 'user_status_changed', 'doc_created', 'doc_step_toggled', 'credits_topup', 'ai_generated'
  target_type TEXT NOT NULL, -- 'task', 'doc', 'user', 'settings', 'ai', 'system'
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
  prompt_type TEXT NOT NULL, -- 'GUIDE', 'ROADMAP', etc.
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
