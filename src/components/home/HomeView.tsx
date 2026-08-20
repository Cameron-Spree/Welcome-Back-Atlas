import React from 'react';
import { useApp } from '../../context/AppContext';
import { Search, Sparkles, CheckCircle2, Clock, BookOpen, ArrowRight, UserCheck } from 'lucide-react';

export const HomeView: React.FC = () => {
  const {
    currentUser,
    tasks,
    docs,
    activities,
    setActiveTab,
    setSelectedTaskId,
    searchQuery,
    setSearchQuery,
  } = useApp();

  const userTasks = tasks.filter((t) => t.assignee === currentUser);
  const inProgressTasks = userTasks.filter((t) => t.status === 'In Progress' || t.status === 'Backlog');
  const userDocs = docs.filter((d) => d.assignee === currentUser);

  const filteredTasks = tasks.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.assignee.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Wireframe First Screen / Greeting Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div className="absolute -right-10 -top-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-6">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Active Profile: {currentUser}</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
                Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-300 to-pink-400">{currentUser}</span>
              </h1>
              <p className="text-slate-400 text-sm mt-2 max-w-xl">
                Here is your team dashboard for <strong className="text-slate-200">Atlas</strong>. You have {inProgressTasks.length} active roadmap task{inProgressTasks.length === 1 ? '' : 's'} assigned to you today.
              </p>
            </div>

            {/* User Status / Search Bar */}
            <div className="w-full md:w-80 space-y-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search tasks, docs, team..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>Team: Cam, Liam, Alex</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                  3 Online
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Search Filter Alert if active */}
      {searchQuery && (
        <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-2xl p-4 flex items-center justify-between">
          <p className="text-sm text-indigo-200">
            Showing results matching &quot;<span className="font-semibold text-white">{searchQuery}</span>&quot; ({filteredTasks.length} tasks found)
          </p>
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs text-indigo-400 hover:text-indigo-300 underline font-medium"
          >
            Clear Search
          </button>
        </div>
      )}

      {/* Grid: Assigned Tasks & Learning Quick Jump */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Assigned Tasks */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Clock className="w-5 h-5 text-indigo-400" />
              <span>Your Assigned Roadmap Tasks</span>
            </h2>
            <button
              onClick={() => setActiveTab('projects')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1"
            >
              <span>View Full Roadmap</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {userTasks.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
                No active tasks assigned to {currentUser}. Switch views or create a task!
              </div>
            ) : (
              userTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => {
                    setSelectedTaskId(t.id);
                    setActiveTab('projects');
                  }}
                  className="bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 p-5 rounded-2xl cursor-pointer transition-all space-y-3 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border ${
                          t.status === 'Done'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : t.status === 'In Progress'
                            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {t.status}
                      </span>
                      <h3 className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                        {t.title}
                      </h3>
                    </div>
                    <span className="text-xs text-slate-500">{t.startDate} - {t.endDate}</span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2">{t.description}</p>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
                    <div className="flex items-center space-x-2">
                      {t.tags.map((tag) => (
                        <span key={tag} className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <span className="text-indigo-400 font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                      Details & Timeline <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Learning Guides & Team Activity */}
        <div className="space-y-8">
          
          {/* Quick Learning Card */}
          <div className="bg-gradient-to-b from-indigo-950/50 to-slate-900 border border-indigo-500/20 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <span>Assigned Learning Guides</span>
              </h3>
              <button
                onClick={() => setActiveTab('learn')}
                className="text-xs text-cyan-400 hover:underline font-semibold"
              >
                Go to Learn
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Interactive documentation & AI recommendations for your tasks:
            </p>

            <div className="space-y-2">
              {userDocs.slice(0, 3).map((d) => (
                <div
                  key={d.id}
                  onClick={() => setActiveTab('learn')}
                  className="bg-slate-950/80 hover:bg-slate-900 border border-slate-800 p-3 rounded-xl cursor-pointer transition flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-semibold text-white">{d.title}</h4>
                    <p className="text-[11px] text-slate-400">Re: {d.taskTitle}</p>
                  </div>
                  <CheckCircle2 className={`w-4 h-4 ${d.completed ? 'text-emerald-400' : 'text-slate-600'}`} />
                </div>
              ))}
            </div>
          </div>

          {/* Team Activity Stream */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Live Team Stream</span>
            </h3>

            <div className="space-y-3">
              {activities.slice(0, 5).map((act) => (
                <div key={act.id} className="flex items-start space-x-3 text-xs border-b border-slate-800/50 pb-2.5 last:border-0 last:pb-0">
                  <div className="w-6 h-6 rounded-full bg-indigo-900/60 border border-indigo-500/30 flex items-center justify-center font-bold text-[10px] text-indigo-300 shrink-0">
                    {act.user[0]}
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-slate-300">
                      <strong className="text-white">{act.user}</strong> {act.action} <span className="text-indigo-400">{act.target}</span>
                    </p>
                    <span className="text-[10px] text-slate-500">{act.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
