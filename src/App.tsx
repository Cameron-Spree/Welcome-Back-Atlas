import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { HomeView } from './components/home/HomeView';
import { LearnView } from './components/learn/LearnView';
import { ProjectsView } from './components/projects/ProjectsView';
import { ProgressView } from './components/progress/ProgressView';
import { SettingsModal } from './components/settings/SettingsModal';
import { GeminiFlowingMeshBackground } from './components/home/GeminiFlowingMeshBackground';

const MainContent: React.FC = () => {
  const { activeTab } = useApp();

  return (
    <div className="min-h-screen apple-bg-mesh text-zinc-900 font-sans flex flex-col relative overflow-hidden">
      {/* Animated Flowing Digital Waves & Ambient Glow (Gemini Style) */}
      <GeminiFlowingMeshBackground />

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
