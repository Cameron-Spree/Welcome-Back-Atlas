import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Task, UserRole } from '../../types';
import { ProjectDetailOverlay } from './ProjectDetailOverlay';
import { Calendar, LayoutGrid, Plus, Sparkles, Filter, Clock, ChevronRight } from 'lucide-react';

export const ProjectsView: React.FC = () => {
  const {
    currentUser,
    tasks,
    createTask,
    generateAiRoadmap,
    selectedTaskId,
    setSelectedTaskId,
  } = useApp();

  const [viewMode, setViewMode] = useState<'calendar' | 'kanban'>('calendar');
  const [filterUser, setFilterUser] = useState<'All' | 'Cam' | 'Liam' | 'Alex'>('All');
  const [activeOverlayTask, setActiveOverlayTask] = useState<Task | null>(
    tasks.find((t) => t.id === selectedTaskId) || null
  );
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [promptText, setPromptText] = useState('');
  const [showPromptInput, setShowPromptInput] = useState(false);

  const filteredTasks = tasks.filter((t) =>
    filterUser === 'All' ? true : t.assignee === filterUser
  );

  const kanbanColumns = [
    { title: 'Backlog', status: 'Backlog', color: 'border-slate-700 bg-slate-900/40' },
    { title: 'In Progress', status: 'In Progress', color: 'border-indigo-500/30 bg-indigo-950/20' },
    { title: 'In Review', status: 'In Review', color: 'border-purple-500/30 bg-purple-950/20' },
    { title: 'Completed', status: 'Done', color: 'border-emerald-500/30 bg-emerald-950/20' },
  ];

  const handleCreateNewTask = async () => {
    const today = new Date().toISOString().split('T')[0];
    const newT: Partial<Task> = {
      title: 'New Roadmap Task',
      description: 'Enter task details and requirements...',
      assignee: currentUser,
      status: 'In Progress',
      priority: 'Medium',
      startDate: today,
      endDate: today,
      progress: 0,
      tags: ['roadmap'],
      subtasks: [],
    };
    await createTask(newT);
  };

  const handleRunAiRoadmap = async () => {
    if (!promptText.trim()) return;
    setIsAiGenerating(true);
    await generateAiRoadmap(promptText.trim());
    setIsAiGenerating(false);
    setShowPromptInput(false);
    setPromptText('');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Top Header Controls: View Switcher (Calendar Gantt Default / Kanban) & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>Atlas Interactive Roadmap</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Project Roadmap & Gantt Planner</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Click any project bar or card to open the expanded detail overlay.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          
          {/* View Switcher: Calendar Gantt (Default) vs Kanban */}
          <div className="flex items-center space-x-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'calendar'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Calendar Timeline</span>
            </button>

            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'kanban'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kanban Board</span>
            </button>
          </div>

          {/* Assignee Filter */}
          <div className="flex items-center space-x-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500 ml-1" />
            {(['All', 'Cam', 'Liam', 'Alex'] as const).map((u) => (
              <button
                key={u}
                onClick={() => setFilterUser(u)}
                className={`px-2.5 py-1 rounded-md font-semibold transition ${
                  filterUser === u
                    ? 'bg-slate-800 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {u}
              </button>
            ))}
          </div>

          {/* AI Roadmap & New Task Buttons */}
          <button
            onClick={() => setShowPromptInput(!showPromptInput)}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 px-3.5 py-2 rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 hover:opacity-95 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Auto-Roadmap</span>
          </button>

          <button
            onClick={handleCreateNewTask}
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>

        </div>
      </div>

      {/* AI Roadmap Generator Prompt Modal/Drawer */}
      {showPromptInput && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-amber-500/30 rounded-2xl p-5 space-y-3 animate-fadeIn">
          <div className="flex items-center space-x-2 text-amber-300 font-bold text-xs">
            <Sparkles className="w-4 h-4" />
            <span>Gemini Roadmap Generator</span>
          </div>
          <p className="text-xs text-slate-300">
            Describe your project goal (e.g., &quot;Build social media templates and launch marketing campaign for client&quot;) and Gemini will generate a structured timeline for Cam, Liam, and Alex!
          </p>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Enter project goal prompt..."
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
            <button
              onClick={handleRunAiRoadmap}
              disabled={isAiGenerating}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition disabled:opacity-50"
            >
              {isAiGenerating ? 'Generating Roadmap...' : 'Generate (15 Credits)'}
            </button>
          </div>
        </div>
      )}

      {/* DEFAULT VIEW: Timeline / Gantt Calendar View */}
      {viewMode === 'calendar' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6 overflow-x-auto">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Project Timeline (Gantt View)</span>
            <div className="flex items-center space-x-6 text-xs text-slate-400">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Cam</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Liam</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Alex</span>
            </div>
          </div>

          <div className="space-y-4 min-w-[700px]">
            {filteredTasks.map((t) => {
              const color =
                t.assignee === 'Cam'
                  ? 'from-blue-600 to-indigo-600 border-blue-400/40'
                  : t.assignee === 'Liam'
                  ? 'from-emerald-600 to-teal-600 border-emerald-400/40'
                  : 'from-purple-600 to-pink-600 border-purple-400/40';

              return (
                <div
                  key={t.id}
                  onClick={() => setActiveOverlayTask(t)}
                  className="bg-slate-950/80 hover:bg-slate-950 p-4 rounded-xl border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-all space-y-2 group"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white bg-gradient-to-r ${color}`}>
                        {t.assignee}
                      </span>
                      <h3 className="font-bold text-white text-sm group-hover:text-indigo-300 transition-colors">
                        {t.title}
                      </h3>
                    </div>
                    <span className="text-slate-400 font-medium text-[11px]">{t.startDate} ➔ {t.endDate}</span>
                  </div>

                  {/* Gantt Timeline Bar Representation */}
                  <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden relative border border-slate-800">
                    <div
                      className={`h-full bg-gradient-to-r ${color} rounded-full transition-all`}
                      style={{ width: `${Math.max(t.progress || 35, 15)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span className="line-clamp-1 text-slate-400">{t.description}</span>
                    <span className="text-indigo-400 font-medium group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                      Expanded Info <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SWITCHABLE VIEW: Kanban Board */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kanbanColumns.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.status);
            return (
              <div key={col.status} className={`p-4 rounded-2xl border ${col.color} space-y-4`}>
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">{col.title}</h3>
                  <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-semibold">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {colTasks.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setActiveOverlayTask(t)}
                      className="bg-slate-900/90 hover:bg-slate-800 p-4 rounded-xl border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition shadow-md space-y-2 group"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded font-semibold">
                          {t.assignee}
                        </span>
                        <span className="text-slate-500">{t.endDate}</span>
                      </div>

                      <h4 className="font-bold text-white text-xs group-hover:text-indigo-300 transition-colors">
                        {t.title}
                      </h4>

                      <p className="text-[11px] text-slate-400 line-clamp-2">{t.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Expanded Project Overlay Drawer Layer */}
      {activeOverlayTask && (
        <ProjectDetailOverlay
          task={activeOverlayTask}
          onClose={() => {
            setActiveOverlayTask(null);
            setSelectedTaskId(null);
          }}
        />
      )}

    </div>
  );
};
