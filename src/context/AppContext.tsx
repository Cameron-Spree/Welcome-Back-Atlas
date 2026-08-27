import React, { createContext, useContext, useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { format, addDays } from 'date-fns';
import { UserRole, Task, LearnDoc, ActivityFeedItem, AppSettings } from '../types';


interface AppContextType {
  currentUser: UserRole;
  setCurrentUser: (user: UserRole) => void;
  tasks: Task[];
  docs: LearnDoc[];
  activities: ActivityFeedItem[];
  settings: AppSettings;
  activeTab: 'home' | 'learn' | 'projects' | 'progress';
  setActiveTab: (tab: 'home' | 'learn' | 'projects' | 'progress') => void;
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
  selectedDocId: string | null;
  setSelectedDocId: (id: string | null) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  updateTask: (task: Task) => Promise<void>;
  createTask: (task: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  updateDoc: (doc: LearnDoc) => Promise<void>;
  generateAiDoc: (taskId: string) => Promise<void>;
  generateAiRoadmap: (prompt: string) => Promise<void>;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  topUpCredits: (amount: number) => Promise<void>;
  isConnected: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Core System Architecture & API Gateway',
    description: 'Design the backend routing, authentication handshake, and real-time multiplayer socket events.',
    assignee: 'Cam',
    status: 'In Progress',
    priority: 'High',
    startDate: '2026-08-20',
    endDate: '2026-08-24',
    progress: 65,
    tags: ['backend', 'architecture', 'websockets'],
    docId: 'doc-1',
    subtasks: [
      { id: 'sub-1', title: 'Define schema.sql and SQLite tables', completed: true },
      { id: 'sub-2', title: 'Implement Socket.io room broadcasting', completed: true },
      { id: 'sub-3', title: 'Connect Gemini API fallback engine', completed: false },
    ],
  },
  {
    id: 'task-2',
    title: 'Interactive Roadmap & Gantt Timeline Views',
    description: 'Build draggable timeline bars with day/week views and switchable Kanban columns.',
    assignee: 'Liam',
    status: 'In Progress',
    priority: 'High',
    startDate: '2026-08-21',
    endDate: '2026-08-26',
    progress: 45,
    tags: ['frontend', 'gantt', 'roadmap'],
    docId: 'doc-2',
    subtasks: [
      { id: 'sub-4', title: 'Design 7-day Gantt timeline grid', completed: true },
      { id: 'sub-5', title: 'Implement expanded detail overlay drawer', completed: true },
      { id: 'sub-6', title: 'Add column drag and drop filters', completed: false },
    ],
  },
  {
    id: 'task-3',
    title: 'Design System & Social Media Asset Kit',
    description: 'Create responsive Cyber-Clean theme templates, SVG icons, and promotional asset kits.',
    assignee: 'Alex',
    status: 'In Progress',
    priority: 'Medium',
    startDate: '2026-08-22',
    endDate: '2026-08-28',
    progress: 30,
    tags: ['design', 'ui', 'templates'],
    docId: 'doc-3',
    subtasks: [
      { id: 'sub-7', title: 'Finalize Dark/Light slate color palette', completed: true },
      { id: 'sub-8', title: 'Create reusable button & card components', completed: true },
      { id: 'sub-9', title: 'Export social media template assets', completed: false },
    ],
  },
];

const INITIAL_DOCS: LearnDoc[] = [
  {
    id: 'doc-1',
    title: 'Real-Time WebSocket Sync & Resilient Architectures',
    taskId: 'task-1',
    taskTitle: 'Core System Architecture & API Gateway',
    assignee: 'Cam',
    relevanceExplanation: 'Tagged in task-1: Essential guide for establishing zero-latency state synchronization across distributed client laptops without conflicting updates.',
    content: `# Real-Time WebSockets Architecture Guide\n\nWhen multiple users edit simultaneously, WebSockets maintain full-duplex bi-directional communication channels.\n\n### Key Concepts\n- **Event Emitters:** Broadcast state mutations across all sockets.\n- **Optimistic Updates:** Instantly render changes locally while validating on server.\n- **Fallback Transport:** Gracefully downgrade to HTTP Long-Polling if networks restrict WebSocket ports.`,
    resources: [
      { title: 'Socket.io Production Best Practices', url: 'https://socket.io/docs/v4/', type: 'doc' },
      { title: 'Building Real-Time Collaborative Apps (Video)', url: 'https://youtube.com', type: 'video' },
    ],
    completed: true,
  },
  {
    id: 'doc-2',
    title: 'Gantt Timeline Visualization & State Mechanics',
    taskId: 'task-2',
    taskTitle: 'Interactive Roadmap & Gantt Timeline Views',
    assignee: 'Liam',
    relevanceExplanation: 'Matched project requirements: Explains how to represent multi-day spans on responsive grids and synchronize dates with Kanban board columns.',
    content: `# Timeline & Gantt Chart Implementation\n\nRoadmap visibility is critical to project velocity.\n\n### Deliverables\n1. Dynamic start/end date calculation.\n2. Visual milestone flags.\n3. One-click modal overlay for detailed subtask inspection.`,
    resources: [
      { title: 'Modern Timeline UI Patterns', url: 'https://developer.mozilla.org', type: 'article' },
      { title: 'Interactive Gantt Grid Demo', url: 'https://github.com', type: 'doc' },
    ],
    completed: false,
  },
  {
    id: 'doc-3',
    title: 'Social Media Templates & Cyber-Clean Design',
    taskId: 'task-3',
    taskTitle: 'Design System & Social Media Asset Kit',
    assignee: 'Alex',
    relevanceExplanation: 'Curated for UI/Design task: Recommended resources and typography guidelines for creating branded visual templates and marketing components.',
    content: `# Design System Foundations\n\n- **Theme:** Atlas Dark Cyber-Clean (Slate 950, Indigo 600, Cyan 400).\n- **Typography:** Inter Sans + JetBrains Mono.\n- **Glassmorphism:** High-contrast subtle borders and ambient backdrops.`,
    resources: [
      { title: 'Figma Design System Starter Kit', url: 'https://figma.com', type: 'article' },
      { title: 'Cyberpunk UI Inspiration Gallery', url: 'https://dribbble.com', type: 'article' },
    ],
    completed: false,
  },
];

const INITIAL_ACTIVITIES: ActivityFeedItem[] = [
  { id: 'act-1', user: 'Cam', action: 'initialized repository and schema', target: 'Welcome Back Atlas', timestamp: 'Just now' },
  { id: 'act-2', user: 'Liam', action: 'configured timeline milestones on', target: 'Gantt Roadmap', timestamp: '5 mins ago' },
  { id: 'act-3', user: 'Alex', action: 'designed cyber theme tokens for', target: 'UI Components', timestamp: '12 mins ago' },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

const API_BASE = '/api';

// Bidirectional Schema Normalizers
function normalizeUserRole(raw: any): UserRole {
  if (!raw) return 'Cam';
  const str = String(raw).toLowerCase();
  if (str.includes('liam')) return 'Liam';
  if (str.includes('alex')) return 'Alex';
  return 'Cam';
}

function normalizeTaskStatus(raw: any): 'Backlog' | 'In Progress' | 'In Review' | 'Done' {
  if (!raw) return 'In Progress';
  const str = String(raw).toLowerCase().replace(/_/g, ' ');
  if (str.includes('backlog')) return 'Backlog';
  if (str.includes('review')) return 'In Review';
  if (str.includes('done') || str.includes('complete')) return 'Done';
  return 'In Progress';
}

function normalizePriority(raw: any): 'Low' | 'Medium' | 'High' {
  if (!raw) return 'Medium';
  const str = String(raw).toLowerCase();
  if (str.includes('high') || str.includes('urgent')) return 'High';
  if (str.includes('low')) return 'Low';
  return 'Medium';
}

function normalizeTask(raw: any): Task {
  if (!raw) return INITIAL_TASKS[0];
  const subtasks = Array.isArray(raw.subtasks)
    ? raw.subtasks
    : Array.isArray(raw.checklist)
    ? raw.checklist.map((c: any) => ({
        id: c.id || `sub-${Date.now()}`,
        title: c.text || c.title || '',
        completed: Boolean(c.completed || c.isCompleted),
      }))
    : [];

  return {
    id: String(raw.id || `task-${Date.now()}`),
    title: raw.title || 'Untitled Task',
    description: raw.description || '',
    assignee: normalizeUserRole(raw.assignee || raw.assignee_id || raw.assigneeId),
    status: normalizeTaskStatus(raw.status),
    priority: normalizePriority(raw.priority),
    startDate: raw.startDate || raw.start_date || new Date().toISOString().split('T')[0],
    endDate: raw.endDate || raw.end_date || new Date().toISOString().split('T')[0],
    progress: Number(raw.progress ?? raw.progress_pct ?? 0),
    tags: Array.isArray(raw.tags) ? raw.tags : ['roadmap'],
    docId: raw.docId || raw.doc_id,
    subtasks,
  };
}

function normalizeDoc(raw: any): LearnDoc {
  if (!raw) return INITIAL_DOCS[0];
  const resources = Array.isArray(raw.resources) ? raw.resources : [];
  const isCompleted =
    Boolean(raw.completed) ||
    (Array.isArray(raw.steps) && raw.steps.length > 0 && raw.steps.every((s: any) => s.completed));

  return {
    id: String(raw.id || `doc-${Date.now()}`),
    title: raw.title || 'Learning Guide',
    taskId: raw.taskId || raw.linked_task_id || '',
    taskTitle: raw.taskTitle || raw.subtitle || 'General Guide',
    assignee: normalizeUserRole(raw.assignee || raw.author_id),
    previewUrl: raw.previewUrl || raw.preview_link_url,
    previewImage: raw.previewImage || raw.preview_image_url,
    relevanceExplanation: raw.relevanceExplanation || raw.ai_relevance_summary || 'Task documentation guide.',
    content: raw.content || raw.markdown_content || '',
    resources,
    completed: isCompleted,
  };
}

function normalizeActivity(raw: any): ActivityFeedItem {
  return {
    id: String(raw.id || `act-${Date.now()}`),
    user: normalizeUserRole(raw.user || raw.user_id),
    action: raw.action || (raw.action_type ? raw.action_type.replace(/_/g, ' ') : 'updated'),
    target: raw.target || raw.target_title || 'Atlas',
    timestamp: raw.timestamp || (raw.created_at ? new Date(raw.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'),
  };
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserRole>('Cam');
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [docs, setDocs] = useState<LearnDoc[]>(INITIAL_DOCS);
  const [activities, setActivities] = useState<ActivityFeedItem[]>(INITIAL_ACTIVITIES);
  const [settings, setSettings] = useState<AppSettings>({ geminiApiKey: '', aiCredits: 100, theme: 'light' });
  const [activeTab, setActiveTab] = useState<'home' | 'learn' | 'projects' | 'progress'>('home');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [socketInstance, setSocketInstance] = useState<Socket | null>(null);

  const fetchData = async () => {
    try {
      const [tasksRes, docsRes, actRes, setRes] = await Promise.all([
        fetch(`${API_BASE}/tasks`),
        fetch(`${API_BASE}/docs`),
        fetch(`${API_BASE}/activities`),
        fetch(`${API_BASE}/settings`),
      ]);
      if (tasksRes.ok) {
        const data = await tasksRes.json();
        if (Array.isArray(data) && data.length > 0) {
          setTasks(data.map(normalizeTask));
        }
      }
      if (docsRes.ok) {
        const data = await docsRes.json();
        if (Array.isArray(data) && data.length > 0) {
          setDocs(data.map(normalizeDoc));
        }
      }
      if (actRes.ok) {
        const data = await actRes.json();
        if (Array.isArray(data) && data.length > 0) {
          setActivities(data.map(normalizeActivity));
        }
      }
      if (setRes.ok) {
        const data = await setRes.json();
        setSettings((prev) => ({ ...prev, ...data }));
      }
    } catch {
      // Offline fallback
    }
  };

  useEffect(() => {
    fetchData();

    try {
      const socket: Socket = io(window.location.origin, {
        transports: ['websocket', 'polling'],
        timeout: 5000,
        reconnection: true,
      });
      setSocketInstance(socket);

      socket.on('connect', () => {
        setIsConnected(true);
        fetchData();
      });
      socket.on('disconnect', () => setIsConnected(false));
      socket.on('connect_error', () => setIsConnected(false));

      // Handle Task Updates (both wrapped and raw payloads)
      socket.on('task:updated', (payload: any) => {
        const raw = payload?.task || payload;
        if (!raw) return;
        const normalized = normalizeTask(raw);
        setTasks((prev) => prev.map((t) => (t.id === normalized.id ? normalized : t)));
      });

      socket.on('task:moved', (payload: any) => {
        const raw = payload?.task || payload;
        if (!raw) return;
        const normalized = normalizeTask(raw);
        setTasks((prev) => prev.map((t) => (t.id === normalized.id ? normalized : t)));
      });

      socket.on('task:created', (payload: any) => {
        const raw = payload?.task || payload;
        if (!raw) return;
        const normalized = normalizeTask(raw);
        setTasks((prev) => [...prev.filter((t) => t.id !== normalized.id), normalized]);
      });

      socket.on('task:deleted', (payload: any) => {
        const deletedId = String(payload?.taskId || payload?.id || payload);
        if (!deletedId) return;
        setTasks((prev) => prev.filter((t) => t.id !== deletedId));
      });

      // Handle Doc Updates
      socket.on('doc:updated', (payload: any) => {
        const raw = payload?.doc || payload;
        if (!raw) return;
        const normalized = normalizeDoc(raw);
        setDocs((prev) => prev.map((d) => (d.id === normalized.id ? normalized : d)));
      });

      socket.on('doc:created', (payload: any) => {
        const raw = payload?.doc || payload;
        if (!raw) return;
        const normalized = normalizeDoc(raw);
        setDocs((prev) => [...prev.filter((d) => d.id !== normalized.id), normalized]);
      });

      socket.on('doc:step_toggled', (payload: any) => {
        const raw = payload?.doc || payload;
        if (raw) {
          const normalized = normalizeDoc(raw);
          setDocs((prev) => prev.map((d) => (d.id === normalized.id ? normalized : d)));
        }
      });

      // Handle Live Activity Feed & Credits
      socket.on('activity:new', (payload: any) => {
        const raw = payload?.activity || payload;
        if (!raw) return;
        const normalized = normalizeActivity(raw);
        setActivities((prev) => [normalized, ...prev.filter((a) => a.id !== normalized.id)].slice(0, 50));
      });

      socket.on('credits:updated', (payload: any) => {
        if (payload?.creditBalance !== undefined) {
          setSettings((prev) => ({ ...prev, aiCredits: payload.creditBalance }));
        }
      });

      socket.on('settings:updated', (newSet: any) => {
        if (newSet) setSettings((prev) => ({ ...prev, ...newSet }));
      });

      return () => {
        socket.disconnect();
      };
    } catch {
      setIsConnected(false);
    }
  }, []);

  const updateTask = async (task: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));

    // Emit live socket event directly for instant peer sync
    if (socketInstance && socketInstance.connected) {
      socketInstance.emit('task:update', { taskId: task.id, updates: task, userId: currentUser });
    }

    try {
      await fetch(`${API_BASE}/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...task, user: currentUser }),
      });
    } catch {
      // Local optimistic update kept
    }
  };

  const createTask = async (taskData: Partial<Task>) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: taskData.title || 'New Task',
      description: taskData.description || '',
      assignee: taskData.assignee || currentUser,
      status: taskData.status || 'In Progress',
      priority: taskData.priority || 'Medium',
      startDate: taskData.startDate || new Date().toISOString().split('T')[0],
      endDate: taskData.endDate || new Date().toISOString().split('T')[0],
      progress: taskData.progress || 0,
      tags: taskData.tags || ['roadmap'],
      subtasks: taskData.subtasks || [],
    };

    setTasks((prev) => [...prev, newTask]);

    if (socketInstance && socketInstance.connected) {
      socketInstance.emit('task:create', { task: newTask, userId: currentUser });
    }

    try {
      const res = await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newTask, user: currentUser }),
      });
      if (res.ok) {
        const saved = await res.json();
        const norm = normalizeTask(saved);
        setTasks((prev) => prev.map((t) => (t.id === newTask.id ? norm : t)));
      }
    } catch {
      // Offline fallback
    }
  };

  const deleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));

    if (socketInstance && socketInstance.connected) {
      socketInstance.emit('task:delete', { taskId: id, userId: currentUser });
    }

    try {
      await fetch(`${API_BASE}/tasks/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser }),
      });
    } catch {
      // Offline fallback
    }
  };

  const updateDoc = async (doc: LearnDoc) => {
    setDocs((prev) => prev.map((d) => (d.id === doc.id ? doc : d)));

    try {
      await fetch(`${API_BASE}/docs/${doc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...doc, userId: currentUser }),
      });
    } catch {
      // Offline fallback
    }
  };

  const generateAiDoc = async (taskId: string) => {
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    const newDoc: LearnDoc = {
      id: `doc-${Date.now()}`,
      title: `AI Master Guide: ${targetTask.title}`,
      taskId: targetTask.id,
      taskTitle: targetTask.title,
      assignee: targetTask.assignee,
      relevanceExplanation: `Gemini generated guide for ${targetTask.assignee} to complete "${targetTask.title}".`,
      content: `# AI Accelerated Guide: ${targetTask.title}\n\n## Overview\nThis guide outlines the critical implementation steps for **${targetTask.title}**.\n\n### Step-by-Step Deliverables\n1. Analyze requirements and set up baseline tests.\n2. Implement the modular core.\n3. Integrate with multiplayer real-time sync.\n\n### Key Resources\n- Modern Documentation: https://socket.io\n- React Architecture Patterns: https://react.dev`,
      resources: [
        { title: `${targetTask.title} Reference`, url: 'https://socket.io', type: 'doc' },
        { title: 'Interactive Video Walkthrough', url: 'https://youtube.com', type: 'video' },
      ],
      completed: false,
    };

    setDocs((prev) => [...prev.filter((d) => d.taskId !== taskId), newDoc]);
    setSettings((prev) => ({ ...prev, aiCredits: Math.max(0, prev.aiCredits - 10) }));

    try {
      await fetch(`${API_BASE}/docs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newDoc.id,
          title: newDoc.title,
          subtitle: newDoc.taskTitle,
          linked_task_id: newDoc.taskId,
          markdown_content: newDoc.content,
          ai_relevance_summary: newDoc.relevanceExplanation,
          userId: currentUser,
        }),
      });
    } catch {
      // Offline fallback
    }
  };

  const generateAiRoadmap = async (prompt: string) => {
    const baseDate = new Date();
    let generatedTasks: Task[] = [];
    const apiKey = (settings.geminiApiKey || '').trim();
    const model = settings.geminiModel || 'gemini-1.5-flash';

    if (apiKey) {
      const candidateModels = Array.from(new Set([
        model,
        'gemini-1.5-flash-latest',
        'gemini-2.0-flash',
        'gemini-2.0-flash-exp',
        'gemini-1.5-flash',
        'gemini-pro',
      ]));

      for (const testMod of candidateModels) {
        try {
          const endpoints = [
            `https://generativelanguage.googleapis.com/v1beta/models/${testMod}:generateContent?key=${apiKey}`,
            `https://generativelanguage.googleapis.com/v1/models/${testMod}:generateContent?key=${apiKey}`,
          ];

          let successData: any = null;

          for (const ep of endpoints) {
            const res = await fetch(ep, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [
                  {
                    role: 'user',
                    parts: [
                      {
                        text: `You are an agile software project manager. Decompose project goal: "${prompt}" into 3 or 4 sequential deliverables for Cam (Backend/Architecture), Liam (Frontend/UI), and Alex (Design/QA).
Respond with a JSON array of objects with the exact schema:
[
  {
    "title": "Phase title",
    "description": "Brief description of phase deliverables",
    "assignee": "Cam" | "Liam" | "Alex",
    "startOffsetDays": 0,
    "durationDays": 4,
    "priority": "High" | "Medium" | "Low",
    "subtasks": ["subtask 1", "subtask 2"]
  }
]`,
                      },
                    ],
                  },
                ],
                generationConfig: {
                  temperature: 0.3,
                  responseMimeType: 'application/json',
                },
              }),
            });

            if (res.ok) {
              const data = await res.json();
              const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
              if (jsonText) {
                const parsed = JSON.parse(jsonText);
                const list = Array.isArray(parsed) ? parsed : parsed.tasks || [];
                if (list.length > 0) {
                  successData = list;
                  break;
                }
              }
            }
          }

          if (successData) {
            generatedTasks = successData.map((item: any, i: number) => {
              const startOffset = item.startOffsetDays !== undefined ? Number(item.startOffsetDays) : i * 2;
              const duration = item.durationDays !== undefined ? Math.max(2, Number(item.durationDays)) : 4;
              const startDate = format(addDays(baseDate, startOffset), 'yyyy-MM-dd');
              const endDate = format(addDays(baseDate, startOffset + duration), 'yyyy-MM-dd');

              const assignee: UserRole =
                item.assignee === 'Liam' || item.assignee === 'Alex' || item.assignee === 'Cam'
                  ? item.assignee
                  : i % 3 === 0
                  ? 'Cam'
                  : i % 3 === 1
                  ? 'Liam'
                  : 'Alex';

              const subtasks = Array.isArray(item.subtasks)
                ? item.subtasks.map((st: any, sIdx: number) => ({
                    id: `sub-ai-${Date.now()}-${sIdx}`,
                    title: typeof st === 'string' ? st : st.title || 'Deliverable',
                    completed: false,
                  }))
                : [];

              return {
                id: `task-gemini-${Date.now()}-${i}`,
                title: item.title || `Phase ${i + 1}`,
                description: item.description || `Deliverables for ${prompt}`,
                assignee,
                status: (i === 0 ? 'In Progress' : 'Backlog') as any,
                priority: (item.priority || 'Medium') as any,
                startDate,
                endDate,
                progress: i === 0 ? 20 : 0,
                tags: ['gemini-ai', prompt.slice(0, 12)],
                subtasks,
              };
            });
            break;
          }
        } catch (err) {
          console.warn('[AppContext] Direct Gemini attempt failed, trying next candidate:', err);
        }
      }
    }

    // Fallback if no key or API failed
    if (generatedTasks.length === 0) {
      generatedTasks = [
        {
          id: `task-ai-1-${Date.now()}`,
          title: `Core Architecture: ${prompt.slice(0, 24)}`,
          description: `Define system architecture, WebSocket channels, and SQLite models for: ${prompt}`,
          assignee: 'Cam',
          status: 'In Progress',
          priority: 'High',
          startDate: format(baseDate, 'yyyy-MM-dd'),
          endDate: format(addDays(baseDate, 3), 'yyyy-MM-dd'),
          progress: 25,
          tags: ['ai-plan', 'backend'],
          subtasks: [{ id: `sub-ai-1`, title: 'Define data contracts and socket events', completed: true }],
        },
        {
          id: `task-ai-2-${Date.now()}`,
          title: `Interactive Views: ${prompt.slice(0, 24)}`,
          description: `Build responsive Apple-style Gantt timeline and drag-and-drop Kanban for: ${prompt}`,
          assignee: 'Liam',
          status: 'In Progress',
          priority: 'Medium',
          startDate: format(addDays(baseDate, 1), 'yyyy-MM-dd'),
          endDate: format(addDays(baseDate, 5), 'yyyy-MM-dd'),
          progress: 15,
          tags: ['ai-plan', 'frontend'],
          subtasks: [{ id: `sub-ai-2`, title: 'Design Gantt bar calculation', completed: false }],
        },
        {
          id: `task-ai-3-${Date.now()}`,
          title: `Liquid Glass Polish: ${prompt.slice(0, 24)}`,
          description: `Implement Apple glass visual tokens, animations, and sound effects for: ${prompt}`,
          assignee: 'Alex',
          status: 'Backlog',
          priority: 'Medium',
          startDate: format(addDays(baseDate, 3), 'yyyy-MM-dd'),
          endDate: format(addDays(baseDate, 8), 'yyyy-MM-dd'),
          progress: 0,
          tags: ['ai-plan', 'design'],
          subtasks: [{ id: `sub-ai-3`, title: 'Polish frosted backdrops and specular highlights', completed: false }],
        },
      ];
    }

    setTasks((prev) => [...prev, ...generatedTasks]);
    setSettings((prev) => ({ ...prev, aiCredits: Math.max(0, prev.aiCredits - 15) }));

    for (const t of generatedTasks) {
      if (socketInstance && socketInstance.connected) {
        socketInstance.emit('task:create', { task: t, userId: currentUser });
      }
      try {
        await fetch(`${API_BASE}/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...t, user: currentUser }),
        });
      } catch {
        // Fallback on static hosting
      }
    }
  };

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    try {
      await fetch(`${API_BASE}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch {
      // Offline fallback
    }
  };

  const topUpCredits = async (amount: number) => {
    const newAmount = settings.aiCredits + amount;
    await updateSettings({ aiCredits: newAmount });
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        tasks,
        docs,
        activities,
        settings,
        activeTab,
        setActiveTab,
        selectedTaskId,
        setSelectedTaskId,
        selectedDocId,
        setSelectedDocId,
        isSettingsOpen,
        setIsSettingsOpen,
        updateTask,
        createTask,
        deleteTask,
        updateDoc,
        generateAiDoc,
        generateAiRoadmap,
        updateSettings,
        topUpCredits,
        isConnected,
        searchQuery,
        setSearchQuery,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
