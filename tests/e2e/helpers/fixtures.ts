/**
 * Test Fixtures & Factories for Welcome Back Atlas E2E Test Suite
 */

export interface UserProfile {
  id: string;
  name: string;
  role_title: string;
  avatar_url: string;
  color_theme: 'emerald' | 'indigo' | 'amber' | 'purple' | 'blue';
  status: 'Online' | 'Focused' | 'Away';
  status_message: string;
  learning_streak_days: number;
  created_at: string;
  updated_at: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export type TaskStatus = 'backlog' | 'in_progress' | 'in_review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  assignee_id: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  start_date: string;
  end_date: string;
  progress_pct: number;
  color?: string;
  category: string;
  tags: string[];
  checklist: ChecklistItem[];
  doc_id?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocStep {
  stepNumber: number;
  title: string;
  description: string;
  completed: boolean;
}

export interface LearningDoc {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  tags: string[];
  preview_image_url: string;
  preview_link_url: string;
  ai_relevance_summary: string;
  ai_relevance_score: number;
  markdown_content: string;
  steps: DocStep[];
  linked_task_id?: string | null;
  author_id?: string | null;
  is_ai_generated: boolean;
  created_at: string;
  updated_at: string;
}

export interface ActivityLogItem {
  id: string;
  user_id: string;
  action_type: string;
  target_type: string;
  target_id?: string | null;
  target_title: string;
  details: Record<string, any>;
  timestamp: string;
}

export interface AppSettings {
  team_credits: number;
  gemini_api_key?: string;
  ai_model: string;
}

// Canonical Seed Users
export const SEED_USERS: UserProfile[] = [
  {
    id: 'user-cam',
    name: 'Cam',
    role_title: 'Lead Architect & Backend',
    avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Cam',
    color_theme: 'emerald',
    status: 'Online',
    status_message: 'Architecting SQLite WAL & Event Bus',
    learning_streak_days: 12,
    created_at: '2026-08-01T10:00:00Z',
    updated_at: '2026-08-20T12:00:00Z',
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
    created_at: '2026-08-01T10:00:00Z',
    updated_at: '2026-08-20T12:00:00Z',
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
    created_at: '2026-08-01T10:00:00Z',
    updated_at: '2026-08-20T12:00:00Z',
  },
];

// Factories for creating dynamic test entities
export function createMockUser(overrides: Partial<UserProfile> = {}): UserProfile {
  const id = overrides.id || `user-test-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  return {
    id,
    name: overrides.name || `User ${id}`,
    role_title: overrides.role_title || 'Software Engineer',
    avatar_url: overrides.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${id}`,
    color_theme: overrides.color_theme || 'emerald',
    status: overrides.status || 'Online',
    status_message: overrides.status_message ?? 'Working on Atlas',
    learning_streak_days: overrides.learning_streak_days ?? 5,
    created_at: overrides.created_at || new Date().toISOString(),
    updated_at: overrides.updated_at || new Date().toISOString(),
  };
}

export function createMockTask(overrides: Partial<TaskItem> = {}): TaskItem {
  const id = overrides.id || `task-test-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  return {
    id,
    title: overrides.title || 'Dynamic Test Task',
    description: overrides.description || 'Detailed test task description for verification.',
    assignee_id: overrides.assignee_id !== undefined ? overrides.assignee_id : 'user-cam',
    status: overrides.status || 'in_progress',
    priority: overrides.priority || 'medium',
    start_date: overrides.start_date || today,
    end_date: overrides.end_date || nextWeek,
    progress_pct: overrides.progress_pct ?? 25,
    color: overrides.color || '#10b981',
    category: overrides.category || 'Engineering',
    tags: overrides.tags || ['backend', 'sqlite'],
    checklist: overrides.checklist || [
      { id: 'sub-1', text: 'Initialize module tests', completed: true },
      { id: 'sub-2', text: 'Verify event broadcasting', completed: false },
    ],
    doc_id: overrides.doc_id ?? null,
    created_by: overrides.created_by || 'user-cam',
    created_at: overrides.created_at || new Date().toISOString(),
    updated_at: overrides.updated_at || new Date().toISOString(),
  };
}

export function createMockDoc(overrides: Partial<LearningDoc> = {}): LearningDoc {
  const id = overrides.id || `doc-test-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  return {
    id,
    title: overrides.title || 'Comprehensive System Architecture Guide',
    subtitle: overrides.subtitle || 'Step-by-step technical documentation',
    category: overrides.category || 'Architecture',
    tags: overrides.tags || ['architecture', 'websockets', 'performance'],
    preview_image_url: overrides.preview_image_url || 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31',
    preview_link_url: overrides.preview_link_url || 'https://example.com/docs/architecture',
    ai_relevance_summary:
      overrides.ai_relevance_summary ||
      'AI Curated Match: Highly relevant to real-time synchronization requirements.',
    ai_relevance_score: overrides.ai_relevance_score ?? 95,
    markdown_content:
      overrides.markdown_content ||
      '# Architecture Overview\n\nThis guide covers multi-client broadcast protocols.',
    steps: overrides.steps || [
      { stepNumber: 1, title: 'Configure WebSocket Server', description: 'Bind Socket.io instance', completed: true },
      { stepNumber: 2, title: 'Implement Event Handlers', description: 'Listen for client mutations', completed: false },
    ],
    linked_task_id: overrides.linked_task_id ?? null,
    author_id: overrides.author_id || 'user-cam',
    is_ai_generated: overrides.is_ai_generated ?? false,
    created_at: overrides.created_at || new Date().toISOString(),
    updated_at: overrides.updated_at || new Date().toISOString(),
  };
}

export function createMockActivity(overrides: Partial<ActivityLogItem> = {}): ActivityLogItem {
  const id = overrides.id || `act-test-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  return {
    id,
    user_id: overrides.user_id || 'user-cam',
    action_type: overrides.action_type || 'task_updated',
    target_type: overrides.target_type || 'task',
    target_id: overrides.target_id || 'task-1',
    target_title: overrides.target_title || 'Architect SQLite WAL & Socket.io Event Bus',
    details: overrides.details || { field: 'status', from: 'in_progress', to: 'done' },
    timestamp: overrides.timestamp || new Date().toISOString(),
  };
}
