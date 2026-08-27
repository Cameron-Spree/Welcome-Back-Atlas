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
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl space-y-1 shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
        <div className="flex items-center space-x-2 text-zinc-900 text-xs font-black uppercase tracking-wider">
          <TrendingUp className="w-4 h-4" />
          <span>Velocity &amp; Real-Time Analytics</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">Team Progress &amp; Achievement Streaks</h1>
        <p className="text-xs text-zinc-500 font-medium">
          Tracking milestone velocity, completion burn-up, and learning mastery for Cam, Liam, and Alex.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="glass-card p-5 rounded-3xl space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-500 font-bold">
            <span>Roadmap Completion</span>
            <CheckCircle2 className="w-4 h-4 text-zinc-900" />
          </div>
          <p className="text-3xl font-black text-zinc-950">{overallPercentage}%</p>
          <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden border border-zinc-200">
            <div className="bg-black h-full rounded-full transition-all" style={{ width: `${overallPercentage}%` }} />
          </div>
        </div>

        <div className="glass-card p-5 rounded-3xl space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-500 font-bold">
            <span>Tasks Finished</span>
            <Award className="w-4 h-4 text-zinc-900" />
          </div>
          <p className="text-3xl font-black text-zinc-950">{completedTasks} / {totalTasks}</p>
          <p className="text-[11px] text-zinc-600 font-medium">Across all team sprints</p>
        </div>

        <div className="glass-card p-5 rounded-3xl space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-500 font-bold">
            <span>Guides Mastered</span>
            <BookOpen className="w-4 h-4 text-zinc-900" />
          </div>
          <p className="text-3xl font-black text-zinc-950">{docs.filter((d) => d.completed).length} / {docs.length}</p>
          <p className="text-[11px] text-zinc-600 font-medium">Learning checklists completed</p>
        </div>

        <div className="glass-card p-5 rounded-3xl space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-500 font-bold">
            <span>AI Credits Remaining</span>
            <Sparkles className="w-4 h-4 text-zinc-900" />
          </div>
          <p className="text-3xl font-black text-zinc-950">{settings.aiCredits}</p>
          <p className="text-[11px] text-zinc-600 font-medium">Atlas Gemini Engine Active</p>
        </div>

      </div>

      {/* Individual Breakdown for Cam, Liam, and Alex */}
      <div className="glass-panel rounded-3xl p-6 lg:p-8 space-y-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
        <h2 className="text-lg font-black text-zinc-950 flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-zinc-900" />
          <span>Individual Productivity Breakdown</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {users.map((u) => {
            const uTasks = tasks.filter((t) => t.assignee === u);
            const uDone = uTasks.filter((t) => t.status === 'Done').length;
            const uPercent = uTasks.length > 0 ? Math.round((uDone / uTasks.length) * 100) : 0;
            const bgClass =
              u === 'Cam'
                ? 'bg-black'
                : u === 'Liam'
                ? 'bg-zinc-800'
                : 'bg-zinc-700';

            return (
              <div key={u} className="bg-white/90 p-5 rounded-2xl border border-zinc-200 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`w-3 h-3 rounded-full ${bgClass}`} />
                    <h3 className="font-black text-zinc-950 text-base">{u}</h3>
                  </div>
                  <span className="text-xs bg-zinc-100 text-zinc-900 px-2.5 py-0.5 rounded-full font-bold border border-zinc-200">
                    {uDone} / {uTasks.length} Tasks
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-zinc-500 font-bold">
                    <span>Task Burn-Up Rate</span>
                    <span className="font-black text-zinc-950">{uPercent}%</span>
                  </div>
                  <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden border border-zinc-200/60">
                    <div
                      className={`${bgClass} h-full rounded-full transition-all`}
                      style={{ width: `${uPercent}%` }}
                    />
                  </div>
                </div>

                <div className="text-xs text-zinc-500 space-y-1.5 border-t border-zinc-100 pt-3 font-medium">
                  <p>&bull; Active task: <strong className="text-zinc-900">{uTasks[0]?.title || 'All caught up'}</strong></p>
                  <p>&bull; Learning streak: <strong className="text-zinc-900">{docs.filter((d) => d.assignee === u && d.completed).length} guides mastered</strong></p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
