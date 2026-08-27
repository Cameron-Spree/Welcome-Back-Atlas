export type UserRole = 'Cam' | 'Liam' | 'Alex';

export interface UserProfile {
  id: string;
  name: UserRole;
  avatar: string;
  status: 'Online' | 'Focused' | 'Away';
  credits: number;
}

export type TaskStatus = 'Backlog' | 'In Progress' | 'In Review' | 'Done';
export type TaskPriority = 'Low' | 'Medium' | 'High';

export interface Task {
  id: string;
  title: string;
  description: string;
  assignee: UserRole;
  status: TaskStatus;
  priority: TaskPriority;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  progress: number;  // 0 - 100
  tags: string[];
  docId?: string;
  subtasks?: { id: string; title: string; completed: boolean }[];
}

export interface LearnDoc {
  id: string;
  title: string;
  taskId: string;
  taskTitle: string;
  assignee: UserRole;
  previewUrl?: string;
  previewImage?: string;
  relevanceExplanation: string;
  content: string;
  resources: { title: string; url: string; type: 'doc' | 'video' | 'article' }[];
  completed: boolean;
}

export interface ActivityFeedItem {
  id: string;
  user: UserRole;
  action: string;
  target: string;
  timestamp: string;
}

export interface AppSettings {
  geminiApiKey: string;
  geminiModel?: string;
  aiCredits: number;
  theme: 'dark' | 'light';
}

