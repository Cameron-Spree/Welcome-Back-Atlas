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

const AppContext = createContext<AppContextType | undefined>(undefined);

const API_BASE = '/api';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserRole>('Cam');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [docs, setDocs] = useState<LearnDoc[]>([]);
  const [activities, setActivities] = useState<ActivityFeedItem[]>([]);
  const [settings, setSettings] = useState<AppSettings>({ geminiApiKey: '', aiCredits: 100, theme: 'dark' });
  const [activeTab, setActiveTab] = useState<'home' | 'learn' | 'projects' | 'progress'>('home');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Initial Data Fetch
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
    } catch (err) {
      console.warn('Backend server connecting...', err);
    }
  };

  useEffect(() => {
    fetchData();

    // Socket.io Real-Time Connection
    const socket: Socket = io('/', { transports: ['websocket', 'polling'] });

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Real-time synchronization events
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
  }, []);

  const updateTask = async (task: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
    try {
      await fetch(`${API_BASE}/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...task, user: currentUser }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const createTask = async (taskData: Partial<Task>) => {
    try {
      const res = await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...taskData, user: currentUser }),
      });
      if (res.ok) {
        const newTask = await res.json();
        setTasks((prev) => [...prev, newTask]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await fetch(`${API_BASE}/tasks/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error(e);
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
    } catch (e) {
      console.error(e);
    }
  };

  const generateAiDoc = async (taskId: string) => {
    try {
      const res = await fetch(`${API_BASE}/ai/generate-doc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, user: currentUser }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.doc) setDocs((prev) => [...prev.filter((d) => d.id !== data.doc.id), data.doc]);
        if (data.remainingCredits !== undefined) {
          setSettings((prev) => ({ ...prev, aiCredits: data.remainingCredits }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const generateAiRoadmap = async (prompt: string) => {
    try {
      const res = await fetch(`${API_BASE}/ai/generate-roadmap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, user: currentUser }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.tasks) {
          setTasks((prev) => [...prev, ...data.tasks]);
        }
        if (data.remainingCredits !== undefined) {
          setSettings((prev) => ({ ...prev, aiCredits: data.remainingCredits }));
        }
      }
    } catch (e) {
      console.error(e);
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
    } catch (e) {
      console.error(e);
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
