import React from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { Settings, BookOpen, LayoutGrid, TrendingUp, Home } from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    setCurrentUser,
    activeTab,
    setActiveTab,
    setIsSettingsOpen,
  } = useApp();

  const users: UserRole[] = ['Cam', 'Liam', 'Alex'];

  return (
    <header className="sticky top-0 z-40 px-4 lg:px-8 py-3 transition-all duration-300">
      <div className="max-w-7xl mx-auto glass-panel-elevated liquid-shimmer rounded-2xl px-5 py-2.5 flex items-center justify-between gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">
        
        {/* Brand Logo */}
        <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setActiveTab('home')}>
          <div className="w-8 h-8 rounded-xl bg-black p-0.5 shadow-md shadow-black/10 group-hover:scale-105 transition-transform flex items-center justify-center">
            <span className="font-black text-white text-sm tracking-tighter">A</span>
          </div>
          <div>
            <h1 className="font-black text-zinc-950 text-sm tracking-tight">ATLAS</h1>
          </div>
        </div>

        {/* Center Main Navigation Bar */}
        <nav className="flex items-center space-x-1 bg-white/90 p-1 rounded-xl border border-zinc-200/90 shadow-2xs backdrop-blur-md">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'home'
                ? 'bg-black text-white shadow-sm'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
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
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
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
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
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
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Progress</span>
          </button>
        </nav>

        {/* Right Tools: Clean Text User Profile Switcher & Settings */}
        <div className="flex items-center space-x-2">
          
          {/* Minimalist Text-Only User Profile Switcher */}
          <div className="flex items-center bg-white/90 p-1 rounded-xl border border-zinc-200/90 shadow-2xs space-x-1">
            {users.map((userName) => {
              const isActive = currentUser === userName;
              return (
                <button
                  key={userName}
                  onClick={() => setCurrentUser(userName)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-black text-white shadow-sm'
                      : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
                  }`}
                  title={`Switch to ${userName}`}
                >
                  {userName}
                </button>
              );
            })}
          </div>

          {/* Settings Modal Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-zinc-600 hover:text-zinc-950 bg-white/90 hover:bg-white rounded-xl border border-zinc-200/90 shadow-2xs transition"
            title="Settings & AI Configuration"
          >
            <Settings className="w-4 h-4" />
          </button>

        </div>
      </div>
    </header>
  );
};

