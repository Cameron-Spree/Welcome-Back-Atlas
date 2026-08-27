import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Task } from '../../types';
import { ProjectDetailOverlay } from './ProjectDetailOverlay';
import {
  Calendar as CalendarIcon,
  LayoutGrid,
  Plus,
  Sparkles,
  Filter,
  Clock,
  ChevronLeft,
  ChevronRight,
  User,
  Timer,
} from 'lucide-react';
import {
  format,
  addDays,
  subDays,
  parseISO,
  isSameDay,
  isWithinInterval,
  differenceInCalendarDays,
  isValid,
  startOfDay,
} from 'date-fns';

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

  // Calendar Window Navigation (Default: 18 days centered around today)
  const [calendarStartDate, setCalendarStartDate] = useState<Date>(() => subDays(startOfDay(new Date()), 1));
  const numDaysToShow = 18;

  const today = useMemo(() => startOfDay(new Date()), []);

  const daysArray = useMemo(() => {
    return Array.from({ length: numDaysToShow }, (_, i) => addDays(calendarStartDate, i));
  }, [calendarStartDate, numDaysToShow]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => (filterUser === 'All' ? true : t.assignee === filterUser));
  }, [tasks, filterUser]);

  const kanbanColumns = [
    { title: 'Backlog', status: 'Backlog', headerBg: 'bg-slate-100/90 text-slate-700' },
    { title: 'In Progress', status: 'In Progress', headerBg: 'bg-indigo-50/90 text-indigo-700' },
    { title: 'In Review', status: 'In Review', headerBg: 'bg-purple-50/90 text-purple-700' },
    { title: 'Completed', status: 'Done', headerBg: 'bg-emerald-50/90 text-emerald-700' },
  ];

  const handleCreateNewTask = async () => {
    const start = format(new Date(), 'yyyy-MM-dd');
    const end = format(addDays(new Date(), 4), 'yyyy-MM-dd');
    const newT: Partial<Task> = {
      title: 'New Project Sprint',
      description: 'Enter task details and requirements...',
      assignee: currentUser,
      status: 'In Progress',
      priority: 'Medium',
      startDate: start,
      endDate: end,
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

  // Helper to calculate days remaining or start countdown
  const getTimeRemainingText = (task: Task) => {
    try {
      const start = parseISO(task.startDate);
      const end = parseISO(task.endDate);

      if (!isValid(start) || !isValid(end)) return 'Dates TBD';

      if (task.status === 'Done') return 'Completed';

      const daysUntilStart = differenceInCalendarDays(start, today);
      const daysUntilEnd = differenceInCalendarDays(end, today);

      if (daysUntilStart > 0) {
        return daysUntilStart === 1 ? 'Starts tomorrow' : `Starts in ${daysUntilStart}d`;
      }

      if (daysUntilEnd < 0) {
        return `${Math.abs(daysUntilEnd)}d overdue`;
      }

      if (daysUntilEnd === 0) {
        return 'Finishes today!';
      }

      return `${daysUntilEnd}d left`;
    } catch {
      return 'Dates TBD';
    }
  };

  // Helper to compute CSS grid column span for calendar bars
  const getTaskGridPosition = (task: Task) => {
    try {
      const taskStart = startOfDay(parseISO(task.startDate));
      const taskEnd = startOfDay(parseISO(task.endDate));

      if (!isValid(taskStart) || !isValid(taskEnd)) return null;

      const windowStart = daysArray[0];
      const windowEnd = daysArray[daysArray.length - 1];

      // If task is completely outside current calendar view
      if (taskEnd < windowStart || taskStart > windowEnd) {
        return null;
      }

      const startIndex = Math.max(0, differenceInCalendarDays(taskStart, windowStart));
      const endIndex = Math.min(numDaysToShow - 1, differenceInCalendarDays(taskEnd, windowStart));

      const span = Math.max(1, endIndex - startIndex + 1);

      return {
        gridColumnStart: startIndex + 1,
        gridColumnEnd: `span ${span}`,
        startsBeforeView: taskStart < windowStart,
        endsAfterView: taskEnd > windowEnd,
        durationDays: differenceInCalendarDays(taskEnd, taskStart) + 1,
      };
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Top Header Controls: View Switcher (Calendar Default / Kanban) & Navigation */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
            <CalendarIcon className="w-4 h-4 text-indigo-600" />
            <span>Calendar Schedule & Duration Matrix</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Project Calendar Roadmap</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Visual day-by-day schedule. View project start dates, durations, and days remaining at a single glance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* View Switcher: Calendar Matrix vs Kanban */}
          <div className="flex items-center space-x-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/70">
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'calendar'
                  ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Day Calendar</span>
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

          {/* AI Roadmap & Add Task */}
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
            <span>Add Project</span>
          </button>

        </div>
      </div>

      {/* AI Roadmap Generator Prompt Drawer */}
      {showPromptInput && (
        <div className="glass-panel-elevated rounded-3xl p-6 space-y-3 animate-fadeIn border border-amber-200/80 shadow-lg">
          <div className="flex items-center space-x-2 text-amber-700 font-bold text-xs">
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
            <span>Gemini AI Roadmap Planner</span>
          </div>
          <p className="text-xs text-slate-600">
            Enter your project goal (e.g. &quot;Build and ship MVP website with client booking in 7 days&quot;) and Gemini will generate collaborative tasks for Cam, Liam, and Alex mapped onto the calendar timeline.
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
              {isAiGenerating ? 'Planning...' : 'Generate Roadmap (15 Credits)'}
            </button>
          </div>
        </div>
      )}

      {/* DAY-BY-DAY CALENDAR MATRIX VIEW */}
      {viewMode === 'calendar' && (
        <div className="glass-panel rounded-3xl p-5 lg:p-6 space-y-4 shadow-[0_8px_30px_rgb(0,0,0,0.03)] overflow-hidden">
          
          {/* Calendar Top Navigation Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/70 pb-4">
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/70">
                <button
                  onClick={() => setCalendarStartDate(subDays(calendarStartDate, 7))}
                  className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition"
                  title="Previous 7 Days"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCalendarStartDate(subDays(startOfDay(new Date()), 1))}
                  className="px-2.5 py-1 text-xs font-bold bg-white text-indigo-600 rounded-lg shadow-xs border border-slate-200/60"
                >
                  Today
                </button>
                <button
                  onClick={() => setCalendarStartDate(addDays(calendarStartDate, 7))}
                  className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition"
                  title="Next 7 Days"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <span className="text-sm font-extrabold text-slate-800">
                {format(daysArray[0], 'MMMM yyyy')}
                {daysArray[0].getMonth() !== daysArray[daysArray.length - 1].getMonth() && (
                  <span> &ndash; {format(daysArray[daysArray.length - 1], 'MMMM yyyy')}</span>
                )}
              </span>
            </div>

            {/* Legend */}
            <div className="flex items-center space-x-4 text-xs font-semibold text-slate-600">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Cam</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Liam</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Alex</span>
            </div>
          </div>

          {/* Grid Container with Horizontal Scrolling */}
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[950px]">
              
              {/* Calendar Days Header Row */}
              <div className="grid grid-cols-[260px_1fr] gap-3 mb-2">
                
                {/* Left Header Title */}
                <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider pl-2 flex items-center">
                  Projects & Team Deliverables
                </div>

                {/* Day Header Columns */}
                <div
                  className="grid gap-1 text-center"
                  style={{ gridTemplateColumns: `repeat(${numDaysToShow}, minmax(0, 1fr))` }}
                >
                  {daysArray.map((day) => {
                    const isCurrentDay = isSameDay(day, today);
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                    return (
                      <div
                        key={day.toISOString()}
                        className={`py-2 px-1 rounded-xl transition-all ${
                          isCurrentDay
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 font-bold'
                            : isWeekend
                            ? 'bg-slate-100/60 text-slate-400 font-medium'
                            : 'bg-white/70 text-slate-700 border border-slate-200/60 font-semibold'
                        }`}
                      >
                        <div className="text-[10px] uppercase font-bold opacity-80">
                          {format(day, 'EEE')}
                        </div>
                        <div className="text-xs font-extrabold">
                          {format(day, 'd')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Project Rows (One below another) */}
              {filteredTasks.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-sm font-medium">
                  No projects scheduled. Click &quot;Add Project&quot; or &quot;AI Plan&quot; to populate your calendar.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredTasks.map((t) => {
                    const pos = getTaskGridPosition(t);
                    const remainingText = getTimeRemainingText(t);

                    const colorGradient =
                      t.assignee === 'Cam'
                        ? 'from-blue-500 to-indigo-600'
                        : t.assignee === 'Liam'
                        ? 'from-emerald-500 to-teal-600'
                        : 'from-purple-500 to-pink-600';

                    const borderAccent =
                      t.assignee === 'Cam'
                        ? 'border-blue-300'
                        : t.assignee === 'Liam'
                        ? 'border-emerald-300'
                        : 'border-purple-300';

                    const isDone = t.status === 'Done';

                    return (
                      <div
                        key={t.id}
                        onClick={() => setActiveOverlayTask(t)}
                        className="grid grid-cols-[260px_1fr] gap-3 items-center p-2 rounded-2xl glass-card hover:bg-white transition cursor-pointer group shadow-2xs"
                      >
                        {/* Left Column: Project Info & Countdown */}
                        <div className="pr-2 space-y-1">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold text-white bg-gradient-to-r ${colorGradient}`}
                            >
                              {t.assignee}
                            </span>
                            <h4 className="font-bold text-slate-900 text-xs truncate group-hover:text-indigo-600 transition-colors">
                              {t.title}
                            </h4>
                          </div>

                          <div className="flex items-center space-x-2 text-[10px] text-slate-500">
                            <span className="flex items-center gap-1 font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                              <Timer className="w-3 h-3" />
                              {remainingText}
                            </span>
                            <span className="text-slate-400 truncate">
                              {format(parseISO(t.startDate), 'MMM d')} &ndash; {format(parseISO(t.endDate), 'MMM d')}
                            </span>
                          </div>
                        </div>

                        {/* Right Column: Grid Calendar Gantt Bar */}
                        <div
                          className="grid gap-1 relative h-10 items-center bg-slate-50/70 rounded-xl p-1 border border-slate-200/50"
                          style={{ gridTemplateColumns: `repeat(${numDaysToShow}, minmax(0, 1fr))` }}
                        >
                          {/* Background Grid Guidelines */}
                          {daysArray.map((day) => {
                            const isCurrentDay = isSameDay(day, today);
                            return (
                              <div
                                key={day.toISOString()}
                                className={`h-full rounded-sm ${
                                  isCurrentDay ? 'bg-indigo-100/50 border-r border-indigo-300' : 'border-r border-slate-200/30'
                                }`}
                              />
                            );
                          })}

                          {/* Horizontal Timeline Span Bar */}
                          {pos ? (
                            <div
                              style={{
                                gridColumnStart: pos.gridColumnStart,
                                gridColumnEnd: pos.gridColumnEnd,
                              }}
                              className={`h-8 rounded-lg bg-gradient-to-r ${colorGradient} text-white px-2.5 flex items-center justify-between text-xs font-bold shadow-sm transition-transform group-hover:scale-[1.01] overflow-hidden relative border ${borderAccent} ${
                                isDone ? 'opacity-70' : ''
                              }`}
                            >
                              {/* Progress Fill Indicator */}
                              <div
                                className="absolute left-0 top-0 bottom-0 bg-white/20"
                                style={{ width: `${t.progress || (isDone ? 100 : 35)}%` }}
                              />

                              <span className="truncate relative z-10 text-[11px] flex items-center gap-1.5 font-bold">
                                <span>{t.title}</span>
                              </span>

                              <span className="text-[10px] font-mono shrink-0 pl-1 relative z-10 bg-black/20 px-1.5 py-0.5 rounded-full">
                                {pos.durationDays}d ({remainingText})
                              </span>
                            </div>
                          ) : (
                            <div className="col-span-full text-center text-[10px] text-slate-400 font-medium italic">
                              Scheduled outside current 18-day calendar view ({format(parseISO(t.startDate), 'MMM d')} &ndash; {format(parseISO(t.endDate), 'MMM d')})
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
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

      {/* Expanded Project Overlay Drawer */}
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
