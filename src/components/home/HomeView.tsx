import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Task, LearnDoc, UserRole } from '../../types';
import { Sparkles, ArrowRight, LayoutGrid, BookOpen, TrendingUp, Plus, ChevronDown, ChevronUp, Clock, Check, Edit3, Trash2, ExternalLink } from 'lucide-react';

export const HomeView: React.FC = () => {
  const {
    currentUser,
    tasks,
    docs,
    setActiveTab,
    setSelectedTaskId,
    setSelectedDocId,
    createTask,
    generatePlanWithGuides,
    commitPlan,
  } = useApp();

  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showQuickSnapshot, setShowQuickSnapshot] = useState(false);

  // Interactive Plan Review State
  const [draftPlan, setDraftPlan] = useState<{ tasks: Task[]; docs: LearnDoc[] } | null>(null);
  const [activePlanPrompt, setActivePlanPrompt] = useState('');
  const [planConfirmed, setPlanConfirmed] = useState(false);

  const userTasks = tasks.filter((t) => t.assignee === currentUser);
  const activeTasks = userTasks.filter((t) => t.status === 'In Progress' || t.status === 'Backlog');

  const handlePromptSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) return;

    const currentPrompt = prompt.trim();
    setIsGenerating(true);
    setPlanConfirmed(false);

    try {
      const plan = await generatePlanWithGuides(currentPrompt);
      setDraftPlan(plan);
      setActivePlanPrompt(currentPrompt);
      setPrompt('');
    } catch (err) {
      console.error('Plan generation failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateDraftTask = (index: number, updates: Partial<Task>) => {
    if (!draftPlan) return;
    const updatedTasks = [...draftPlan.tasks];
    updatedTasks[index] = { ...updatedTasks[index], ...updates };

    // Also sync assignee/title to matching doc
    const updatedDocs = [...draftPlan.docs];
    if (updatedDocs[index]) {
      if (updates.title) updatedDocs[index].taskTitle = updates.title;
      if (updates.assignee) updatedDocs[index].assignee = updates.assignee;
    }

    setDraftPlan({ tasks: updatedTasks, docs: updatedDocs });
  };

  const handleApprovePlan = async () => {
    if (!draftPlan) return;
    await commitPlan(draftPlan.tasks, draftPlan.docs);
    setPlanConfirmed(true);
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
    <div className="flex-1 flex flex-col items-center justify-center min-h-[75vh] max-w-4xl mx-auto w-full px-4 animate-fadeIn py-6">
      
      {/* Centerpiece Hero Greeting (Gemini Tab Style) */}
      <div className="text-center space-y-3 mb-8">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/70 backdrop-blur-xl border border-white/90 shadow-sm text-xs font-semibold text-slate-600 mb-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Multiplayer Session Active &bull; Atlas AI Connected</span>
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
            placeholder="e.g. Make a social media planner for Atlas..."
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
            title="Generate AI Plan & Literature"
          >
            {isGenerating ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
          </button>
        </form>

        {/* Minimalist Floating Quick-Launch Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mt-5">
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

      {/* INTERACTIVE PLAN REVIEW DRAWER */}
      {draftPlan && !planConfirmed && (
        <div className="w-full max-w-3xl mt-8 glass-panel-elevated rounded-3xl p-6 space-y-5 animate-fadeIn border border-indigo-200/80 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200/70 pb-3.5">
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <span className="p-1 rounded-lg bg-indigo-50 text-indigo-600">
                  <Sparkles className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Proposed Plan: {activePlanPrompt}
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Review and edit deliverables, assign teammates, and explore attached learning literature.
              </p>
            </div>

            <button
              onClick={() => setDraftPlan(null)}
              className="text-xs text-slate-400 hover:text-slate-700 font-bold px-2 py-1 rounded-lg transition"
            >
              Discard
            </button>
          </div>

          {/* Phase Cards */}
          <div className="space-y-3.5">
            {draftPlan.tasks.map((t, idx) => {
              const matchingDoc = draftPlan.docs[idx];
              return (
                <div key={t.id} className="bg-white/90 rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    
                    {/* Editable Title */}
                    <div className="flex-1">
                      <input
                        type="text"
                        value={t.title}
                        onChange={(e) => handleUpdateDraftTask(idx, { title: e.target.value })}
                        className="w-full font-bold text-xs sm:text-sm text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none py-0.5"
                      />
                    </div>

                    {/* Assignee & Dates */}
                    <div className="flex items-center space-x-2 shrink-0">
                      <select
                        value={t.assignee}
                        onChange={(e) => handleUpdateDraftTask(idx, { assignee: e.target.value as UserRole })}
                        className="text-xs font-bold bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-slate-800 focus:outline-none"
                      >
                        <option value="Cam">Cam (Backend)</option>
                        <option value="Liam">Liam (Frontend)</option>
                        <option value="Alex">Alex (Design/QA)</option>
                      </select>

                      <span className="text-[11px] text-slate-400 font-medium font-mono">
                        {t.startDate} &rarr; {t.endDate}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600">{t.description}</p>

                  {/* Subtasks Checklist Preview */}
                  {t.subtasks && t.subtasks.length > 0 && (
                    <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Key Deliverables ({t.subtasks.length})
                      </span>
                      <ul className="text-xs text-slate-700 space-y-1">
                        {t.subtasks.map((st) => (
                          <li key={st.id} className="flex items-center space-x-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            <span>{st.title}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Attached Learning Literature Preview */}
                  {matchingDoc && (
                    <div className="bg-gradient-to-br from-indigo-50/70 to-purple-50/70 p-3 rounded-xl border border-indigo-100/80 flex items-start space-x-2.5">
                      <BookOpen className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      <div className="text-xs space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-indigo-950">{matchingDoc.title}</span>
                          <span className="text-[10px] bg-white text-indigo-700 px-1.5 py-0.2 rounded font-semibold border border-indigo-100">
                            For {t.assignee}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          {matchingDoc.relevanceExplanation}
                        </p>
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>

          {/* Plan Action Bar */}
          <div className="flex items-center justify-between border-t border-slate-200/70 pt-3.5">
            <span className="text-xs text-slate-500 font-medium">
              Will plot <strong>{draftPlan.tasks.length} projects</strong> on Calendar & generate <strong>{draftPlan.docs.length} learning guides</strong>.
            </span>

            <button
              onClick={handleApprovePlan}
              className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 text-white font-extrabold px-6 py-2.5 rounded-2xl text-xs shadow-lg shadow-indigo-500/25 flex items-center space-x-2 transition scale-100 hover:scale-[1.02]"
            >
              <Check className="w-4 h-4" />
              <span>Okay cool, Launch Plan! 🚀</span>
            </button>
          </div>

        </div>
      )}

      {/* SUCCESS CONFIRMATION HERO */}
      {planConfirmed && draftPlan && (
        <div className="w-full max-w-2xl mt-8 glass-panel-elevated rounded-3xl p-6 text-center space-y-4 animate-fadeIn border border-emerald-200 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
            <Check className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-extrabold text-slate-900">
              Okay cool! Plan Launched Successfully!
            </h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              <strong>{draftPlan.tasks.length} tasks</strong> are now plotted on your Day Calendar Roadmap, and <strong>{draftPlan.docs.length} learning guides</strong> have been linked for Cam, Liam, and Alex.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setActiveTab('projects')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm transition flex items-center space-x-1.5"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>View Calendar Roadmap</span>
            </button>

            <button
              onClick={() => setActiveTab('learn')}
              className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold px-4 py-2 rounded-xl text-xs shadow-xs transition flex items-center space-x-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>View Learning Guides</span>
            </button>

            <button
              onClick={() => {
                setDraftPlan(null);
                setPlanConfirmed(false);
              }}
              className="text-slate-500 hover:text-slate-800 font-bold px-3 py-2 rounded-xl text-xs transition"
            >
              Plan Another Goal &rarr;
            </button>
          </div>
        </div>
      )}

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
