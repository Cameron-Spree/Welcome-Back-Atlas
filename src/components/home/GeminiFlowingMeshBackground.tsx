import React from 'react';

export const GeminiFlowingMeshBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-white">
      {/* Dynamic Animated Ambient Glow Orbs */}
      <div
        className="absolute top-[-10%] left-[10%] w-[650px] h-[650px] rounded-full bg-gradient-to-tr from-sky-400/25 via-indigo-400/20 to-purple-300/25 blur-[120px] animate-pulse"
        style={{ animationDuration: '6s' }}
      />
      <div
        className="absolute top-[35%] right-[-5%] w-[550px] h-[550px] rounded-full bg-gradient-to-br from-purple-400/25 via-pink-400/20 to-sky-300/20 blur-[130px] animate-pulse"
        style={{ animationDuration: '8s' }}
      />
      <div
        className="absolute bottom-[-10%] left-[25%] w-[700px] h-[700px] rounded-full bg-gradient-to-t from-cyan-400/20 via-sky-300/15 to-transparent blur-[140px]"
      />
      {/* Subtle Grid Accent */}
      <div 
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #000 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }}
      />
    </div>
  );
};
