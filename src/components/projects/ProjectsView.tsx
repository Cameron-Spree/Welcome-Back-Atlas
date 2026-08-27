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
    { title: 'Backlog', status: 'Backlog', headerBg: 'bg-slate-100/90 text-slate-700', cardBorder: 'border-slate-200/80' },
    { title: 'In Progress', status: 'In Progress', headerBg: 'bg-indigo-50/90 text-indigo-700', cardBorder: 'border-indigo-200/70' },
    { title: 'In Review', status: 'In Review', headerBg: 'bg-purple-50/90 text-purple-700', cardBorder: 'border-purple-200/70' },
    { title: 'Completed', status: 'Done', headerBg: 'bg-emerald-50/90 text-emerald-700', cardBorder: 'border-emerald-200/70' },
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
      <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Clock className="w-4 h-4 text-indigo-600" />
            <span>Interactive Multi-User Roadmap</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Project Roadmap & Gantt Planner</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Real-time collaborative timeline for Cam, Liam, and Alex. Click any item to inspect or edit.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* View Switcher: Calendar Gantt (Default) vs Kanban */}
          <div className="flex items-center space-x-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/70">
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'calendar'
                  ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Timeline</span>
            </button>

            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
          </div>

          {/* Assignee Filter */}
          <div className="flex items-center space-x-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/70 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-0.5" />
            {(['All', 'Cam', 'Liam', 'Alex'] as const).map((u) => (
              <button
                key={u}
                onClick={() => setFilterUser(u)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  filterUser === u
                    ? 'bg-white text-indigo-600 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {u}
              </button>
            ))}
          </div>

          {/* AI Roadmap & New Task Buttons */}
          <button
            onClick={() => setShowPromptInput(!showPromptInput)}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm hover:opacity-95 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Plan</span>
          </button>

          <button
            onClick={handleCreateNewTask}
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>

        </div>
      </div>

      {/* AI Roadmap Generator Prompt Drawer */}
      {showPromptInput && (
        <div className="glass-panel-elevated rounded-3xl p-6 space-y-3 animate-fadeIn border border-amber-200/80 shadow-lg">
          <div className="flex items-center space-x-2 text-amber-700 font-bold text-xs">
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
            <span>Gemini Multi-Agent Roadmap Generator</span>
          </div>
          <p className="text-xs text-slate-600">
            Describe what you need built (e.g., &quot;Build social media templates and launch marketing campaign for client&quot;) and Gemini will generate collaborative tasks for Cam, Liam, and Alex in real time!
          </p>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Enter project goal prompt..."
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              className="flex-1 glass-input rounded-2xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
            />
            <button
              onClick={handleRunAiRoadmap}
              disabled={isAiGenerating}
              className="bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 px-4 py-2.5 rounded-2xl text-xs font-bold transition shadow-sm hover:opacity-95 disabled:opacity-50"
            >
              {isAiGenerating ? 'Generating...' : 'Generate Roadmap (15 Credits)'}
            </button>
          </div>
        </div>
      )}

      {/* DEFAULT VIEW: Timeline / Gantt Calendar View */}
      {viewMode === 'calendar' && (
        <div className="glass-panel rounded-3xl p-6 space-y-6 overflow-x-auto shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
          
          <div className="flex items-center justify-between border-b border-slate-200/70 pb-3">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Multiplayer Gantt Timeline</span>
            <div className="flex items-center space-x-5 text-xs font-semibold text-slate-600">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Cam</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Liam</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Alex</span>
            </div>
          </div>

          <div className="space-y-3.5 min-w-[650px]">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm font-medium">
                No tasks match current filter. Click &quot;Add Task&quot; above to create one!
              </div>
            ) : (
              filteredTasks.map((t) => {
                const color =
                  t.assignee === 'Cam'
                    ? 'from-blue-500 to-indigo-600'
                    : t.assignee === 'Liam'
                    ? 'from-emerald-500 to-teal-600'
                    : 'from-purple-500 to-pink-600';

                return (
                  <div
                    key={t.id}
                    onClick={() => setActiveOverlayTask(t)}
                    className="glass-card p-4 rounded-2xl cursor-pointer transition-all space-y-2.5 group"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white bg-gradient-to-r ${color} shadow-xs`}>
                          {t.assignee}
                        </span>
                        <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                          {t.title}
                        </h3>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/80">
                          {t.status}
                        </span>
                      </div>
                      <span className="text-slate-500 font-semibold text-[11px]">{t.startDate} &bull; {t.endDate}</span>
                    </div>

                    {/* Gantt Timeline Bar Representation */}
                    <div className="w-full bg-slate-100/90 h-3 rounded-full overflow-hidden relative border border-slate-200/80">
                      <div
                        className={`h-full bg-gradient-to-r ${color} rounded-full transition-all`}
                        style={{ width: `${Math.max(t.progress || 35, 12)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                      <span className="line-clamp-1 text-slate-500">{t.description || 'No description provided.'}</span>
                      <span className="text-indigo-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                        Details & Checklist <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SWITCHABLE VIEW: Kanban Board */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {kanbanColumns.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.status);
            return (
              <div key={col.status} className="glass-panel p-4 rounded-3xl space-y-3.5 shadow-sm">
                <div className={`flex items-center justify-between p-2.5 rounded-2xl ${col.headerBg} border border-slate-200/60`}>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider">{col.title}</h3>
                  <span className="text-xs bg-white text-slate-700 px-2 py-0.5 rounded-full font-bold shadow-xs">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {colTasks.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 rounded-2xl border border-dashed border-slate-200">
                      Empty column
                    </div>
                  ) : (
                    colTasks.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => setActiveOverlayTask(t)}
                        className="glass-card p-3.5 rounded-2xl cursor-pointer transition shadow-xs space-y-2 group"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-md font-bold text-[10px]">
                            {t.assignee}
                          </span>
                          <span className="text-slate-400 font-medium">{t.endDate}</span>
                        </div>

                        <h4 className="font-bold text-slate-900 text-xs group-hover:text-indigo-600 transition-colors">
                          {t.title}
                        </h4>

                        <p className="text-[11px] text-slate-500 line-clamp-2">{t.description}</p>
                      </div>
                    ))
                  )}
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
