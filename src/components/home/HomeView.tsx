import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles, ArrowRight, LayoutGrid, BookOpen, TrendingUp, Plus, ChevronDown, ChevronUp, CheckCircle2, Clock } from 'lucide-react';

export const HomeView: React.FC = () => {
  const {
    currentUser,
    tasks,
    docs,
    activities,
    setActiveTab,
    setSelectedTaskId,
    createTask,
    generateAiRoadmap,
  } = useApp();

  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showQuickSnapshot, setShowQuickSnapshot] = useState(false);

  const userTasks = tasks.filter((t) => t.assignee === currentUser);
  const activeTasks = userTasks.filter((t) => t.status === 'In Progress' || t.status === 'Backlog');

  const handlePromptSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    await generateAiRoadmap(prompt.trim());
    setIsGenerating(false);
    setPrompt('');
    setActiveTab('projects');
  };

  const handleQuickNewTask = async () => {
    const today = new Date().toISOString().split('T')[0];
    await createTask({
      title: 'New Collaboration Task',
      description: 'Defined via Quick Launch',
      assignee: currentUser,
      status: 'In Progress',
      priority: 'Medium',
      startDate: today,
      endDate: today,
      progress: 0,
      tags: ['quick-start'],
    });
    setActiveTab('projects');
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[75vh] max-w-4xl mx-auto w-full px-4 animate-fadeIn">
      
      {/* Centerpiece Hero Greeting (Gemini Tab Style) */}
      <div className="text-center space-y-4 mb-8">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/70 backdrop-blur-xl border border-white/90 shadow-sm text-xs font-semibold text-slate-600 mb-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Multiplayer Session Active &bull; Atlas PRO</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
          Welcome back,{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500">
            {currentUser}
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-500 font-normal max-w-lg mx-auto">
          What would you like to build with Liam and Alex today?
        </p>
      </div>

      {/* Floating Liquid Glass Omnibar */}
      <div className="w-full max-w-2xl">
        <form
          onSubmit={handlePromptSubmit}
          className="glass-panel-elevated rounded-3xl p-2.5 sm:p-3 shadow-[0_15px_40px_rgba(0,0,0,0.06)] border border-white flex items-center space-x-3 transition-all duration-300 focus-within:shadow-[0_20px_50px_rgba(99,102,241,0.18)] focus-within:border-indigo-300"
        >
          <div className="pl-2.5 text-indigo-500">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>

          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask Gemini to plan a feature, or type a new goal..."
            className="flex-1 bg-transparent text-slate-800 placeholder-slate-400 text-sm sm:text-base font-medium focus:outline-none px-2"
          />

          <button
            type="submit"
            disabled={isGenerating || !prompt.trim()}
            className={`p-3 rounded-2xl font-semibold text-white transition-all flex items-center justify-center ${
              prompt.trim()
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 shadow-md shadow-indigo-500/25 scale-100'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
            title="Generate AI Roadmap"
          >
            {isGenerating ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
          </button>
        </form>

        {/* Minimalist Floating Quick-Launch Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mt-6">
          <button
            onClick={() => setActiveTab('projects')}
            className="glass-pill px-4 py-2 rounded-2xl text-xs font-semibold text-slate-700 flex items-center space-x-2 shadow-sm hover:text-indigo-600"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-indigo-500" />
            <span>Open Roadmap</span>
          </button>

          <button
            onClick={handleQuickNewTask}
            className="glass-pill px-4 py-2 rounded-2xl text-xs font-semibold text-slate-700 flex items-center space-x-2 shadow-sm hover:text-indigo-600"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-500" />
            <span>Add Task</span>
          </button>

          <button
            onClick={() => setActiveTab('learn')}
            className="glass-pill px-4 py-2 rounded-2xl text-xs font-semibold text-slate-700 flex items-center space-x-2 shadow-sm hover:text-indigo-600"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
            <span>Learning Guides ({docs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('progress')}
            className="glass-pill px-4 py-2 rounded-2xl text-xs font-semibold text-slate-700 flex items-center space-x-2 shadow-sm hover:text-indigo-600"
          >
            <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
            <span>Progress & Metrics</span>
          </button>
        </div>
      </div>

      {/* Subdued Collapsible Team Status Glance */}
      <div className="mt-12 w-full max-w-2xl">
        <div className="flex justify-center">
          <button
            onClick={() => setShowQuickSnapshot(!showQuickSnapshot)}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-white/50 backdrop-blur-md border border-slate-200/60 shadow-sm transition"
          >
            <span>{activeTasks.length} active task{activeTasks.length === 1 ? '' : 's'} assigned to you</span>
            {showQuickSnapshot ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {showQuickSnapshot && (
          <div className="mt-4 glass-panel rounded-3xl p-5 space-y-3 animate-fadeIn border border-white/80 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-200/70 pb-2.5">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" /> Your Current Focus
              </span>
              <button
                onClick={() => setActiveTab('projects')}
                className="text-[11px] text-indigo-600 font-semibold hover:underline"
              >
                View in Roadmap &rarr;
              </button>
            </div>

            {activeTasks.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-2">
                All clear! No pending tasks right now.
              </p>
            ) : (
              <div className="space-y-2">
                {activeTasks.slice(0, 3).map((t) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      setSelectedTaskId(t.id);
                      setActiveTab('projects');
                    }}
                    className="p-3 rounded-2xl bg-white/70 hover:bg-white border border-slate-200/60 flex items-center justify-between cursor-pointer transition shadow-sm group"
                  >
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                        {t.title}
                      </h4>
                      <p className="text-[11px] text-slate-500">{t.startDate} &bull; {t.status}</p>
                    </div>
                    <span className="text-xs font-semibold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                      &rarr;
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};
