import React from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { Sparkles, Settings, Users, BookOpen, LayoutGrid, TrendingUp, Home, Wifi, WifiOff } from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    setCurrentUser,
    activeTab,
    setActiveTab,
    settings,
    setIsSettingsOpen,
    isConnected,
  } = useApp();

  const users: { name: UserRole; avatar: string; color: string }[] = [
    { name: 'Cam', avatar: '⚡', color: 'from-blue-500 to-indigo-600' },
    { name: 'Liam', avatar: '🚀', color: 'from-emerald-500 to-teal-600' },
    { name: 'Alex', avatar: '🎨', color: 'from-purple-500 to-pink-600' },
  ];

  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-4 lg:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand Logo & Connection Status */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('home')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-violet-600 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 text-lg">A</span>
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-bold text-white text-lg tracking-tight">ATLAS</h1>
              <span className="text-[10px] font-semibold tracking-widest px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase">
                PRO
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              {isConnected ? (
                <>
                  <Wifi className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Live Sync</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-amber-400" />
                  <span className="text-amber-400">Connecting...</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Center Main Navigation Bar */}
        <nav className="flex items-center space-x-1 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'home'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>
          
          <button
            onClick={() => setActiveTab('learn')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'learn'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Learn</span>
          </button>

          <button
            onClick={() => setActiveTab('projects')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'projects'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Projects</span>
          </button>

          <button
            onClick={() => setActiveTab('progress')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'progress'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Progress</span>
          </button>
        </nav>

        {/* Right Tools: 1-Click User Profile Switcher & AI Credits */}
        <div className="flex items-center space-x-3">
          
          {/* AI Credits Pill */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-300 hover:border-amber-400 transition"
            title="AI Credit Balance"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>{settings.aiCredits} Credits</span>
          </button>

          {/* User Profile Switcher */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 space-x-1">
            {users.map((u) => {
              const isActive = currentUser === u.name;
              return (
                <button
                  key={u.name}
                  onClick={() => setCurrentUser(u.name)}
                  className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? `bg-gradient-to-r ${u.color} text-white shadow-md`
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                  title={`Switch profile to ${u.name}`}
                >
                  <span className="text-sm">{u.avatar}</span>
                  <span>{u.name}</span>
                </button>
              );
            })}
          </div>

          {/* Settings Modal Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800 rounded-xl border border-slate-800 transition"
            title="Settings & Gemini API Key"
          >
            <Settings className="w-4 h-4" />
          </button>

        </div>
      </div>
    </header>
  );
};
