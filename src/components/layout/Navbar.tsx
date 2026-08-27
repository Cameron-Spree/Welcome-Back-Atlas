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

  const users: { name: UserRole; avatar: string; activeClass: string }[] = [
    { name: 'Cam', avatar: '⚡', activeClass: 'bg-black text-white shadow-sm' },
    { name: 'Liam', avatar: '🚀', activeClass: 'bg-zinc-800 text-white shadow-sm' },
    { name: 'Alex', avatar: '🎨', activeClass: 'bg-zinc-700 text-white shadow-sm' },
  ];

  return (
    <header className="sticky top-0 z-40 px-4 lg:px-8 py-3 transition-all duration-300">
      <div className="max-w-7xl mx-auto glass-panel-elevated rounded-2xl px-5 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        
        {/* Brand Logo & Connection Status */}
        <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setActiveTab('home')}>
          <div className="w-9 h-9 rounded-xl bg-black p-0.5 shadow-md shadow-black/10 group-hover:scale-105 transition-transform flex items-center justify-center">
            <span className="font-black text-white text-base tracking-tighter">A</span>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="font-extrabold text-zinc-950 text-base tracking-tight">ATLAS</h1>
              <span className="text-[9px] font-extrabold tracking-wider px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-900 border border-zinc-200 uppercase">
                Glass
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 flex items-center gap-1.5 font-medium">
              {isConnected ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-zinc-900 animate-pulse inline-block" />
                  <span className="text-zinc-800 font-semibold">Live Real-Time Sync</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-zinc-400 inline-block" />
                  <span className="text-zinc-500">Connecting peers...</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Center Main Navigation Bar */}
        <nav className="flex items-center space-x-1 bg-zinc-100/90 p-1 rounded-xl border border-zinc-200/80 backdrop-blur-md">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'home'
                ? 'bg-black text-white shadow-sm'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-white/80'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>
          
          <button
            onClick={() => setActiveTab('projects')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'projects'
                ? 'bg-black text-white shadow-sm'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-white/80'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Roadmap</span>
          </button>

          <button
            onClick={() => setActiveTab('learn')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'learn'
                ? 'bg-black text-white shadow-sm'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-white/80'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Learn</span>
          </button>

          <button
            onClick={() => setActiveTab('progress')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'progress'
                ? 'bg-black text-white shadow-sm'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-white/80'
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
            className="flex items-center space-x-1.5 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200/90 px-3 py-1.5 rounded-xl text-xs font-bold text-zinc-900 shadow-xs transition"
            title="AI Credit Balance & API Key"
          >
            <Sparkles className="w-3.5 h-3.5 text-zinc-900" />
            <span>{settings.aiCredits} Credits</span>
          </button>

          {/* User Profile Switcher */}
          <div className="flex items-center bg-zinc-100/90 p-1 rounded-xl border border-zinc-200/80 space-x-1">
            {users.map((u) => {
              const isActive = currentUser === u.name;
              return (
                <button
                  key={u.name}
                  onClick={() => setCurrentUser(u.name)}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? u.activeClass
                      : 'text-zinc-600 hover:text-zinc-950 hover:bg-white/80'
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
