import React, { createContext, useContext, useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
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

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserRole>('Cam');
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [docs, setDocs] = useState<LearnDoc[]>(INITIAL_DOCS);
  const [activities, setActivities] = useState<ActivityFeedItem[]>(INITIAL_ACTIVITIES);
  const [settings, setSettings] = useState<AppSettings>({ geminiApiKey: '', aiCredits: 100, theme: 'dark' });
  const [activeTab, setActiveTab] = useState<'home' | 'learn' | 'projects' | 'progress'>('home');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchData = async () => {
    try {
      const [tasksRes, docsRes, actRes, setRes] = await Promise.all([
        fetch(`${API_BASE}/tasks`),
        fetch(`${API_BASE}/docs`),
        fetch(`${API_BASE}/activities`),
        fetch(`${API_BASE}/settings`),
      ]);
      if (tasksRes.ok) setTasks(await tasksRes.json());
      if (docsRes.ok) setDocs(await docsRes.json());
      if (actRes.ok) setActivities(await actRes.json());
      if (setRes.ok) setSettings(await setRes.json());
    } catch {
      // In standalone frontend or Vercel static mode, defaults remain active
    }
  };

  useEffect(() => {
    fetchData();

    try {
      const socket: Socket = io('/', { transports: ['websocket', 'polling'], timeout: 3000 });

      socket.on('connect', () => setIsConnected(true));
      socket.on('disconnect', () => setIsConnected(false));
      socket.on('connect_error', () => setIsConnected(false));

      socket.on('task:updated', (updatedTask: Task) => {
        setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
      });

      socket.on('task:created', (newTask: Task) => {
        setTasks((prev) => [...prev.filter((t) => t.id !== newTask.id), newTask]);
      });

      socket.on('task:deleted', (deletedId: string) => {
        setTasks((prev) => prev.filter((t) => t.id !== deletedId));
      });

      socket.on('doc:updated', (updatedDoc: LearnDoc) => {
        setDocs((prev) => prev.map((d) => (d.id === updatedDoc.id ? updatedDoc : d)));
      });

      socket.on('activity:new', (newAct: ActivityFeedItem) => {
        setActivities((prev) => [newAct, ...prev]);
      });

      socket.on('settings:updated', (newSet: AppSettings) => {
        setSettings(newSet);
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
    try {
      await fetch(`${API_BASE}/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...task, user: currentUser }),
      });
    } catch {
      // Standalone mode handled
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

    try {
      await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...taskData, user: currentUser }),
      });
    } catch {
      // Standalone mode
    }
  };

  const deleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await fetch(`${API_BASE}/tasks/${id}`, { method: 'DELETE' });
    } catch {
      // Standalone mode
    }
  };

  const updateDoc = async (doc: LearnDoc) => {
    setDocs((prev) => prev.map((d) => (d.id === doc.id ? doc : d)));
    try {
      await fetch(`${API_BASE}/docs/${doc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doc),
      });
    } catch {
      // Standalone mode
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
      relevanceExplanation: `Gemini generated insight: Custom curated guide specifically for ${targetTask.assignee} to complete "${targetTask.title}" using recommended industry best practices.`,
      content: `# AI Accelerated Guide: ${targetTask.title}\n\n## Overview\nThis guide outlines the critical implementation steps for **${targetTask.title}**.\n\n### Step-by-Step Deliverables\n1. Analyze requirements and set up baseline tests.\n2. Implement the modular core.\n3. Integrate with group real-time feed.\n\n### Key Resources\n- Documentation: https://antigravity.google\n- Tutorials: Curated online documentation`,
      resources: [
        { title: `${targetTask.title} Reference`, url: 'https://google.com', type: 'doc' },
        { title: 'Video Walkthrough', url: 'https://youtube.com', type: 'video' },
      ],
      completed: false,
    };

    setDocs((prev) => [...prev.filter((d) => d.taskId !== taskId), newDoc]);
    setSettings((prev) => ({ ...prev, aiCredits: Math.max(0, prev.aiCredits - 10) }));

    try {
      await fetch(`${API_BASE}/ai/generate-doc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, user: currentUser }),
      });
    } catch {
      // Offline fallback
    }
  };

  const generateAiRoadmap = async (prompt: string) => {
    const today = new Date().toISOString().split('T')[0];
    const generatedTasks: Task[] = [
      {
        id: `task-ai-1-${Date.now()}`,
        title: `Research & Architecture: ${prompt.slice(0, 30)}`,
        description: `Define initial technical specs and setup pipeline for ${prompt}`,
        assignee: 'Cam',
        status: 'In Progress',
        priority: 'High',
        startDate: today,
        endDate: today,
        progress: 20,
        tags: ['ai-roadmap', 'architecture'],
        subtasks: [{ id: 'sub-ai-1', title: 'Review specs', completed: true }],
      },
      {
        id: `task-ai-2-${Date.now()}`,
        title: `Core Execution: ${prompt.slice(0, 30)}`,
        description: `Implement core features and interactive components`,
        assignee: 'Liam',
        status: 'In Progress',
        priority: 'Medium',
        startDate: today,
        endDate: today,
        progress: 10,
        tags: ['ai-roadmap', 'implementation'],
        subtasks: [{ id: 'sub-ai-2', title: 'Build modules', completed: false }],
      },
      {
        id: `task-ai-3-${Date.now()}`,
        title: `Design & Testing: ${prompt.slice(0, 30)}`,
        description: `Polish UI/UX and execute end-to-end verification`,
        assignee: 'Alex',
        status: 'Backlog',
        priority: 'Medium',
        startDate: today,
        endDate: today,
        progress: 0,
        tags: ['ai-roadmap', 'qa'],
        subtasks: [{ id: 'sub-ai-3', title: 'Verify UI & polish', completed: false }],
      },
    ];

    setTasks((prev) => [...prev, ...generatedTasks]);
    setSettings((prev) => ({ ...prev, aiCredits: Math.max(0, prev.aiCredits - 15) }));

    try {
      await fetch(`${API_BASE}/ai/generate-roadmap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, user: currentUser }),
      });
    } catch {
      // Offline fallback
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
      // Standalone mode
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
