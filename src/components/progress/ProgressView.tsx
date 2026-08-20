import React from 'react';
import { useApp } from '../../context/AppContext';
import { TrendingUp, Award, CheckCircle2, BookOpen, Sparkles, ShieldCheck } from 'lucide-react';

export const ProgressView: React.FC = () => {
  const { tasks, docs, settings } = useApp();

  const users = ['Cam', 'Liam', 'Alex'] as const;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'Done').length;
  const overallPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Header */}
      <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-1">
        <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
          <TrendingUp className="w-4 h-4" />
          <span>Velocity & Analytics</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Team Progress & Achievement Streaks</h1>
        <p className="text-xs text-slate-400">
          Tracking milestone velocity, task completion burn-up, and learning mastery for Cam, Liam, and Alex.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Overall Roadmap Completion</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-white">{overallPercentage}%</p>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
            <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${overallPercentage}%` }} />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Tasks Finished</span>
            <Award className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-3xl font-black text-white">{completedTasks} / {totalTasks}</p>
          <p className="text-[11px] text-indigo-300">Across all 4 project sprints</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Learning Docs Mastered</span>
            <BookOpen className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-3xl font-black text-white">{docs.filter((d) => d.completed).length} / {docs.length}</p>
          <p className="text-[11px] text-cyan-300">Individualized guides completed</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>AI Credits Remaining</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-black text-amber-300">{settings.aiCredits}</p>
          <p className="text-[11px] text-amber-400 font-semibold">Gemini API active</p>
        </div>

      </div>

      {/* Individual Breakdown for Cam, Liam, and Alex */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
        <h2 className="text-lg font-bold text-white flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-indigo-400" />
          <span>Individual Productivity Breakdown</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {users.map((u) => {
            const uTasks = tasks.filter((t) => t.assignee === u);
            const uDone = uTasks.filter((t) => t.status === 'Done').length;
            const uPercent = uTasks.length > 0 ? Math.round((uDone / uTasks.length) * 100) : 0;

            return (
              <div key={u} className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-base">{u}</h3>
                  <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded font-bold border border-indigo-500/20">
                    {uDone} / {uTasks.length} Tasks
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Task Burn-Up Rate</span>
                    <span className="font-bold text-white">{uPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full rounded-full transition-all"
                      style={{ width: `${uPercent}%` }}
                    />
                  </div>
                </div>

                <div className="text-xs text-slate-400 space-y-1 border-t border-slate-800/80 pt-3">
                  <p>• Recent active task: <strong className="text-slate-200">{uTasks[0]?.title || 'None'}</strong></p>
                  <p>• Learning streak: <strong className="text-emerald-400">{docs.filter((d) => d.assignee === u && d.completed).length} docs mastered</strong></p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
