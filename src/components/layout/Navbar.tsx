import React from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { Sparkles, Settings, BookOpen, LayoutGrid, TrendingUp, Home, Wifi, WifiOff, Share2 } from 'lucide-react';

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

  const users: { name: UserRole; avatar: string; gradient: string; activeClass: string }[] = [
    { name: 'Cam', avatar: '⚡', gradient: 'from-blue-500 to-indigo-600', activeClass: 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' },
    { name: 'Liam', avatar: '🚀', gradient: 'from-emerald-500 to-teal-600', activeClass: 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20' },
    { name: 'Alex', avatar: '🎨', gradient: 'from-purple-500 to-pink-600', activeClass: 'bg-purple-600 text-white shadow-md shadow-purple-500/20' },
  ];

  return (
    <header className="sticky top-0 z-40 px-4 lg:px-8 py-3 transition-all duration-300">
      <div className="max-w-7xl mx-auto glass-panel-elevated rounded-2xl px-5 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        
        {/* Brand Logo & Connection Status */}
        <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setActiveTab('home')}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
              <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 text-base">A</span>
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="font-bold text-slate-900 text-base tracking-tight">ATLAS</h1>
              <span className="text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase">
                Glass
              </span>
            </div>
            <p className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
              {isConnected ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                  <span className="text-emerald-700 font-semibold">Live Real-Time Sync</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                  <span className="text-amber-700">Connecting peers...</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Center Main Navigation Bar */}
        <nav className="flex items-center space-x-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/70 backdrop-blur-md">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'home'
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>
          
          <button
            onClick={() => setActiveTab('projects')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'projects'
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Roadmap</span>
          </button>

          <button
            onClick={() => setActiveTab('learn')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'learn'
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Learn</span>
          </button>

          <button
            onClick={() => setActiveTab('progress')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'progress'
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Progress</span>
          </button>
        </nav>

        {/* Right Tools: 1-Click User Profile Switcher & AI Credits */}
        <div className="flex items-center space-x-2.5">
          
          {/* AI Credits Pill */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-amber-800 hover:border-amber-300 shadow-sm transition"
            title="AI Credit Balance & API Key"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span>{settings.aiCredits} Credits</span>
          </button>

          {/* User Profile Switcher */}
          <div className="flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/70 space-x-1">
            {users.map((u) => {
              const isActive = currentUser === u.name;
              return (
                <button
                  key={u.name}
                  onClick={() => setCurrentUser(u.name)}
                  className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? u.activeClass
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                  }`}
                  title={`Switch profile to ${u.name}`}
                >
                  <span className="text-xs">{u.avatar}</span>
                  <span>{u.name}</span>
                </button>
              );
            })}
          </div>

          {/* Multiplayer Share / Friends Invite Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center space-x-1 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100/90 border border-indigo-200/80 rounded-xl transition shadow-sm"
            title="Multiplayer Network Share with Liam & Alex"
          >
            <Share2 className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Multiplayer</span>
          </button>

          {/* Settings Modal Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-slate-500 hover:text-slate-800 bg-white/70 hover:bg-white rounded-xl border border-slate-200/70 shadow-sm transition"
            title="Settings & Network"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>

        </div>
      </div>
    </header>
  );
};
