import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { HomeView } from './components/home/HomeView';
import { LearnView } from './components/learn/LearnView';
import { ProjectsView } from './components/projects/ProjectsView';
import { ProgressView } from './components/progress/ProgressView';
import { SettingsModal } from './components/settings/SettingsModal';

const MainContent: React.FC = () => {
  const { activeTab } = useApp();

  return (
    <div className="min-h-screen apple-bg-mesh text-slate-800 font-sans flex flex-col relative overflow-hidden">
      {/* Decorative ambient glowing backdrops for liquid glass effects */}
      <div className="absolute top-[-10%] left-[-5%] w-[450px] h-[450px] rounded-full bg-gradient-to-tr from-indigo-200/50 via-purple-100/40 to-cyan-100/40 blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-[30%] right-[-5%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-pink-100/50 via-rose-100/40 to-amber-100/30 blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-cyan-100/50 via-blue-100/40 to-indigo-100/30 blur-3xl pointer-events-none -z-10" />

      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 flex flex-col">
        {activeTab === 'home' && <HomeView />}
        {activeTab === 'learn' && <LearnView />}
        {activeTab === 'projects' && <ProjectsView />}
        {activeTab === 'progress' && <ProgressView />}
      </main>

      <footer className="border-t border-slate-200/60 bg-white/40 backdrop-blur-md py-4 text-center text-xs text-slate-500">
        <p className="font-medium tracking-wide">
          Welcome Back Atlas &bull; Apple Liquid Glass &bull; Real-Time Multi-User Project Suite
        </p>
      </footer>

      <SettingsModal />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
};

export default App;
