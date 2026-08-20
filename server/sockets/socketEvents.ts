export type UserStatus = 'Online' | 'Focused' | 'Away';
export type TaskStatus = 'backlog' | 'in_progress' | 'in_review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  assignee_id: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
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
  subtitle?: string;
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

export interface UserProfile {
  id: string;
  name: string;
  role?: string;
  role_title?: string;
  avatarColor?: string;
  color_theme?: string;
  avatarUrl?: string;
  avatar_url?: string;
  status: UserStatus;
  statusMessage?: string;
  status_message?: string;
  streakDays?: number;
  learning_streak_days?: number;
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

// Client-to-Server Event Map
export interface ClientToServerEvents {
  'user:update_status': (
    payload: { userId: string; status: UserStatus; statusMessage?: string; status_message?: string },
    callback?: (response: { success: boolean; user?: UserProfile; error?: string }) => void
  ) => void;

  'task:create': (
    payload: { task: any; userId?: string },
    callback?: (response: { success: boolean; task?: TaskItem; error?: string }) => void
  ) => void;

  'task:update': (
    payload: { taskId: string; updates: Partial<TaskItem>; userId?: string },
    callback?: (response: { success: boolean; task?: TaskItem; error?: string }) => void
  ) => void;

  'task:move': (
    payload: { taskId: string; status?: TaskStatus; start_date?: string; end_date?: string; userId?: string },
    callback?: (response: { success: boolean; task?: TaskItem; error?: string }) => void
  ) => void;

  'task:delete': (
    payload: { taskId: string; userId?: string },
    callback?: (response: { success: boolean; taskId?: string; error?: string }) => void
  ) => void;

  'doc:step_toggle': (
    payload: { docId: string; stepNumber: number; completed: boolean; userId?: string },
    callback?: (response: { success: boolean; doc?: LearningDoc; error?: string }) => void
  ) => void;

  'join_room': (room: string) => void;
  'leave_room': (room: string) => void;
}

// Server-to-Client Event Map
export interface ServerToClientEvents {
  'user:status_changed': (payload: {
    userId: string;
    status: UserStatus;
    statusMessage?: string;
    status_message?: string;
    updatedAt: string;
    user?: UserProfile;
  }) => void;

  'task:created': (payload: { task: TaskItem; activity?: ActivityLogItem }) => void;
  'task:updated': (payload: { task: TaskItem; activity?: ActivityLogItem }) => void;
  'task:moved': (payload: { task: TaskItem; activity?: ActivityLogItem }) => void;
  'task:deleted': (payload: { taskId: string; activity?: ActivityLogItem }) => void;

  'doc:created': (payload: { doc: LearningDoc; activity?: ActivityLogItem }) => void;
  'doc:step_toggled': (payload: {
    docId: string;
    stepNumber: number;
    completed: boolean;
    doc?: LearningDoc;
    activity?: ActivityLogItem;
  }) => void;

  'credits:updated': (payload: {
    creditBalance: number;
    delta: number;
    reason?: string;
    userId?: string;
  }) => void;

  'activity:new': (payload: { activity: ActivityLogItem }) => void;

  'sync:state_refreshed': (payload: { timestamp: string }) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId?: string;
  connectedAt: string;
}
