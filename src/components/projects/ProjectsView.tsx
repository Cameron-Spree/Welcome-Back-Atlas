import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Task, TaskStatus } from '../../types';
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
  GripVertical,
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
    updateTask,
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
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

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

  const kanbanColumns: { title: string; status: TaskStatus; headerBg: string }[] = [
    { title: 'Backlog', status: 'Backlog', headerBg: 'bg-zinc-100 text-zinc-800' },
    { title: 'In Progress', status: 'In Progress', headerBg: 'bg-black text-white' },
    { title: 'In Review', status: 'In Review', headerBg: 'bg-zinc-800 text-white' },
    { title: 'Completed', status: 'Done', headerBg: 'bg-emerald-600 text-white' },
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
      <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
        <div>
          <div className="flex items-center space-x-2 text-zinc-900 text-xs font-black uppercase tracking-wider mb-1">
            <CalendarIcon className="w-4 h-4 text-zinc-900" />
            <span>Calendar Schedule &amp; Duration Matrix</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">Project Calendar Roadmap</h1>
          <p className="text-xs text-zinc-500 mt-0.5 font-medium">
            Visual day-by-day schedule. View project start dates, durations, and days remaining at a single glance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center space-x-1 bg-zinc-100/90 p-1 rounded-xl border border-zinc-200/80">
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'calendar'
                  ? 'bg-black text-white shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Day Calendar</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'kanban'
                  ? 'bg-black text-white shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
          </div>

          <div className="flex items-center space-x-1 bg-zinc-100/90 p-1 rounded-xl border border-zinc-200/80 text-xs">
            <Filter className="w-3.5 h-3.5 text-zinc-400 ml-1.5 mr-0.5" />
            {(['All', 'Cam', 'Liam', 'Alex'] as const).map((u) => (
              <button
                key={u}
                onClick={() => setFilterUser(u)}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  filterUser === u
                    ? 'bg-black text-white shadow-sm'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                {u}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowPromptInput(!showPromptInput)}
            className="flex items-center space-x-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-300 px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-zinc-900" />
            <span>AI Plan</span>
          </button>

          <button
            onClick={handleCreateNewTask}
            className="flex items-center space-x-1.5 bg-black hover:bg-zinc-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-md shadow-black/15 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Project</span>
          </button>
        </div>
      </div>

      {/* AI Roadmap Generator Prompt Drawer */}
      {showPromptInput && (
        <div className="glass-panel-elevated rounded-3xl p-6 space-y-3 animate-fadeIn border border-zinc-300 shadow-xl">
          <div className="flex items-center space-x-2 text-zinc-950 font-black text-xs">
            <Sparkles className="w-4 h-4 text-zinc-900 animate-pulse" />
            <span>Atlas Gemini AI Roadmap Planner</span>
          </div>
          <p className="text-xs text-zinc-600 font-normal">
            Enter your project goal and Gemini will generate collaborative tasks for Cam, Liam, and Alex mapped onto the calendar timeline.
          </p>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Enter project goal prompt..."
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              className="flex-1 glass-input rounded-2xl px-4 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none"
            />
            <button
              onClick={handleRunAiRoadmap}
              disabled={isAiGenerating || !promptText.trim()}
              className="bg-black hover:bg-zinc-800 text-white font-bold px-4 py-2 rounded-2xl text-xs shadow-sm transition disabled:opacity-50 flex items-center space-x-1.5"
            >
              {isAiGenerating ? (
                <span>Planning...</span>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* MAIN VIEW 1: DAY-BY-DAY CALENDAR MATRIX (Default) */}
      {viewMode === 'calendar' && (
        <div className="glass-panel p-5 lg:p-6 rounded-3xl space-y-4 shadow-sm border border-white/80">
          
          {/* Calendar Controls: Navigation + Today */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200/80 pb-4">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black text-zinc-950">
                Timeline: {format(daysArray[0], 'MMM d, yyyy')} &ndash; {format(daysArray[daysArray.length - 1], 'MMM d, yyyy')}
              </span>
              <span className="text-[10px] bg-zinc-100 text-zinc-800 font-extrabold px-2 py-0.5 rounded-full border border-zinc-200">
                {numDaysToShow} Days Matrix
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCalendarStartDate((prev) => subDays(prev, 7))}
                className="flex items-center space-x-1 bg-white hover:bg-zinc-100 text-zinc-700 font-bold px-2.5 py-1.5 rounded-xl text-xs border border-zinc-200 shadow-2xs transition"
                title="Pan 7 days back"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev 7d</span>
              </button>

              <button
                onClick={() => setCalendarStartDate(subDays(startOfDay(new Date()), 1))}
                className="bg-black hover:bg-zinc-800 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow-xs transition"
              >
                Today
              </button>

              <button
                onClick={() => setCalendarStartDate((prev) => addDays(prev, 7))}
                className="flex items-center space-x-1 bg-white hover:bg-zinc-100 text-zinc-700 font-bold px-2.5 py-1.5 rounded-xl text-xs border border-zinc-200 shadow-2xs transition"
                title="Pan 7 days forward"
              >
                <span>Next 7d</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[950px]">
              <div className="grid grid-cols-[260px_1fr] gap-3 mb-2">
                <div className="text-[11px] font-black text-zinc-500 uppercase tracking-wider pl-2 flex items-center">
                  Projects &amp; Team Deliverables
                </div>
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
                            ? 'bg-black text-white shadow-md shadow-black/15 font-black'
                            : isWeekend
                            ? 'bg-zinc-100/60 text-zinc-400 font-medium'
                            : 'bg-white/90 text-zinc-800 border border-zinc-200/80 font-bold'
                        }`}
                      >
                        <div className="text-[10px] uppercase font-extrabold opacity-80">
                          {format(day, 'EEE')}
                        </div>
                        <div className="text-xs font-black">
                          {format(day, 'd')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              {filteredTasks.length === 0 ? (
                <div className="text-center py-16 text-zinc-400 text-sm font-medium">
                  No projects scheduled. Click &quot;Add Project&quot; or &quot;AI Plan&quot; to populate your calendar.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredTasks.map((t) => {
                    const pos = getTaskGridPosition(t);
                    const remainingText = getTimeRemainingText(t);
                    const colorBg = t.assignee === 'Cam' ? 'bg-zinc-950 border-zinc-700' : t.assignee === 'Liam' ? 'bg-zinc-800 border-zinc-600' : 'bg-zinc-700 border-zinc-500';
                    const isDone = t.status === 'Done';
                    return (
                      <div
                        key={t.id}
                        onClick={() => setActiveOverlayTask(t)}
                        className="grid grid-cols-[260px_1fr] gap-3 items-center p-2 rounded-2xl glass-card hover:bg-white transition cursor-pointer group shadow-2xs"
                      >
                        <div className="pr-2 space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black text-white ${t.assignee === 'Cam' ? 'bg-black' : t.assignee === 'Liam' ? 'bg-zinc-800' : 'bg-zinc-700'}`}>
                              {t.assignee}
                            </span>
                            <h4 className="font-extrabold text-zinc-900 text-xs truncate group-hover:text-black transition-colors">
                              {t.title}
                            </h4>
                          </div>
                          <div className="flex items-center space-x-2 text-[10px] text-zinc-500">
                            <span className="flex items-center gap-1 font-bold text-zinc-800 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">
                              <Timer className="w-3 h-3 text-zinc-900" />
                              {remainingText}
                            </span>
                            <span className="text-zinc-400 truncate font-mono">
                              {format(parseISO(t.startDate), 'MMM d')} &ndash; {format(parseISO(t.endDate), 'MMM d')}
                            </span>
                          </div>
                        </div>
                        <div
                          className="grid gap-1 relative h-10 items-center bg-zinc-50/80 rounded-xl p-1 border border-zinc-200/60"
                          style={{ gridTemplateColumns: `repeat(${numDaysToShow}, minmax(0, 1fr))` }}
                        >
                          {daysArray.map((day) => {
                            const isCurrentDay = isSameDay(day, today);
                            return (
                              <div
                                key={day.toISOString()}
                                className={`h-full rounded-sm ${isCurrentDay ? 'bg-zinc-200/60 border-r border-zinc-400' : 'border-r border-zinc-200/40'}`}
                              />
                            );
                          })}
                          {pos ? (
                            <div
                              style={{ gridColumnStart: pos.gridColumnStart, gridColumnEnd: pos.gridColumnEnd }}
                              className={`h-8 rounded-lg ${colorBg} text-white px-2.5 flex items-center justify-between text-xs font-bold shadow-sm transition-transform group-hover:scale-[1.01] overflow-hidden relative border ${isDone ? 'opacity-60' : ''}`}
                            >
                              <div className="absolute left-0 top-0 bottom-0 bg-white/15" style={{ width: `${t.progress || (isDone ? 100 : 35)}%` }} />
                              <span className="truncate relative z-10 text-[11px] flex items-center gap-1.5 font-bold">
                                <span>{t.title}</span>
                              </span>
                              <span className="text-[10px] font-mono shrink-0 pl-1 relative z-10 bg-black/40 px-1.5 py-0.5 rounded-full">
                                {pos.durationDays}d ({remainingText})
                              </span>
                            </div>
                          ) : (
                            <div className="col-span-full text-center text-[10px] text-zinc-400 font-medium italic">
                              Scheduled outside current 18-day calendar view
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

      {/* SWITCHABLE VIEW: Kanban Board with Drag and Drop */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 animate-fadeIn">
          {kanbanColumns.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.status);
            const isTarget = dragOverCol === col.status;

            return (
              <div
                key={col.status}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  if (dragOverCol !== col.status) {
                    setDragOverCol(col.status);
                  }
                }}
                onDragLeave={(e) => {
                  if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                  setDragOverCol(null);
                }}
                onDrop={async (e) => {
                  e.preventDefault();
                  setDragOverCol(null);
                  const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
                  if (taskId) {
                    const taskToMove = tasks.find((t) => t.id === taskId);
                    if (taskToMove && taskToMove.status !== col.status) {
                      await updateTask({ ...taskToMove, status: col.status });
                    }
                  }
                  setDraggedTaskId(null);
                }}
                className={`glass-panel p-4 rounded-3xl space-y-3.5 shadow-sm transition-all duration-200 ${
                  isTarget ? 'ring-2 ring-black bg-zinc-50 scale-[1.01]' : ''
                }`}
              >
                {/* Column Header */}
                <div className={`flex items-center justify-between p-2.5 rounded-2xl ${col.headerBg} border border-zinc-200/90 shadow-2xs`}>
                  <h3 className="text-xs font-black uppercase tracking-wider">{col.title}</h3>
                  <span className="text-xs bg-white text-zinc-950 px-2 py-0.5 rounded-full font-black shadow-2xs">
                    {colTasks.length}
                  </span>
                </div>

                {/* Column Task Cards */}
                <div className="space-y-2.5 min-h-[160px]">
                  {colTasks.length === 0 ? (
                    <div className="p-6 text-center text-xs text-zinc-400 rounded-2xl border-2 border-dashed border-zinc-200 font-medium">
                      Drag tasks here
                    </div>
                  ) : (
                    colTasks.map((t) => {
                      const isDraggingThis = draggedTaskId === t.id;

                      return (
                        <div
                          key={t.id}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', t.id);
                            e.dataTransfer.effectAllowed = 'move';
                            setDraggedTaskId(t.id);
                          }}
                          onDragEnd={() => {
                            setDraggedTaskId(null);
                            setDragOverCol(null);
                          }}
                          onClick={() => setActiveOverlayTask(t)}
                          className={`glass-card p-3.5 rounded-2xl cursor-grab active:cursor-grabbing transition-all shadow-2xs space-y-2 group border border-white ${
                            isDraggingThis
                              ? 'opacity-30 scale-95 border-dashed border-zinc-400'
                              : 'hover:scale-[1.01] hover:border-black'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <div className="flex items-center space-x-1.5">
                              <GripVertical className="w-3.5 h-3.5 text-zinc-400 group-hover:text-black transition" />
                              <span
                                className={`px-2 py-0.5 rounded-md font-black text-[10px] text-white ${
                                  t.assignee === 'Cam'
                                    ? 'bg-black'
                                    : t.assignee === 'Liam'
                                    ? 'bg-zinc-800'
                                    : 'bg-zinc-700'
                                }`}
                              >
                                {t.assignee}
                              </span>
                            </div>
                            <span className="text-zinc-400 font-mono text-[10px]">{t.endDate}</span>
                          </div>

                          <h4 className="font-bold text-zinc-950 text-xs group-hover:text-black transition-colors">
                            {t.title}
                          </h4>

                          <p className="text-[11px] text-zinc-600 line-clamp-2 font-normal">
                            {t.description}
                          </p>

                          {/* Subtasks Count indicator */}
                          {t.subtasks && t.subtasks.length > 0 && (
                            <div className="text-[10px] font-bold text-zinc-500 bg-zinc-50 px-2 py-1 rounded-lg border border-zinc-100 flex items-center justify-between">
                              <span>Deliverables:</span>
                              <span className="text-zinc-900 font-mono">
                                {t.subtasks.filter((s) => s.completed).length}/{t.subtasks.length}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })
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
