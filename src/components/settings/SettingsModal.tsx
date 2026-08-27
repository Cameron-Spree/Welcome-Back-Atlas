import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Key, Sparkles, PlusCircle, CheckCircle, Wifi, Share2, Globe, Users, Copy } from 'lucide-react';

export const SettingsModal: React.FC = () => {
  const { isSettingsOpen, setIsSettingsOpen, settings, updateSettings, topUpCredits, isConnected } = useApp();
  const [apiKeyInput, setApiKeyInput] = useState(settings.geminiApiKey || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'ai' | 'network'>('network');
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isSettingsOpen) return null;

  const handleSaveApiKey = async () => {
    await updateSettings({ geminiApiKey: apiKeyInput.trim() });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const localOrigin = window.location.origin;

  const copyShareLink = () => {
    navigator.clipboard.writeText(localOrigin);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="glass-panel-elevated rounded-3xl max-w-lg w-full p-6 lg:p-7 space-y-5 shadow-2xl relative border border-white">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200/70 pb-3.5">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Share2 className="w-4 h-4" />
            </span>
            <h2 className="text-base font-extrabold text-slate-900">Multiplayer & Settings</h2>
          </div>
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Tab Switcher */}
        <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/70 text-xs">
          <button
            onClick={() => setActiveModalTab('network')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center space-x-1.5 ${
              activeModalTab === 'network'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Multiplayer & Friends</span>
          </button>

          <button
            onClick={() => setActiveModalTab('ai')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center space-x-1.5 ${
              activeModalTab === 'ai'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>AI Credits & Gemini Key</span>
          </button>
        </div>

        {/* Tab 1: Multiplayer & Friends Collaboration */}
        {activeModalTab === 'network' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-white/80 border border-slate-200/80 rounded-2xl p-4 space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Wifi className="w-4 h-4 text-emerald-500" /> Real-Time Sync Status
                </span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {isConnected ? 'Connected & Live' : 'Connecting...'}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Changes to roadmap tasks, checklists, and guides sync instantaneously across all open browsers and connected peers.
              </p>
            </div>

            {/* How to share with Liam and Alex */}
            <div className="glass-panel p-4 rounded-2xl space-y-3">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-600" />
                <span>How to collaborate with friends</span>
              </h3>

              <div className="space-y-2 text-xs text-slate-600">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                  <p className="font-bold text-slate-800">1. Same Wi-Fi / Local Network:</p>
                  <p className="text-[11px] text-slate-500">
                    Find your computer&apos;s local IP address (e.g. <code className="bg-slate-200 px-1 rounded text-slate-800">ipconfig</code> on Windows &rarr; <code className="bg-slate-200 px-1 rounded text-slate-800">192.168.x.x</code>). Liam & Alex can browse to:
                  </p>
                  <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-indigo-700 font-mono text-[11px] mt-1 font-bold">
                    <span>http://&lt;your-local-ip&gt;:5173</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                  <p className="font-bold text-slate-800">2. Over the Internet (Anywhere):</p>
                  <p className="text-[11px] text-slate-500">
                    Run a free tunnel like <code className="bg-slate-200 px-1 rounded text-slate-800">npx localtunnel --port 5173</code> or <code className="bg-slate-200 px-1 rounded text-slate-800">ngrok http 5173</code> to get an instant public URL to share with your friends.
                  </p>
                </div>
              </div>

              <button
                onClick={copyShareLink}
                className="w-full flex items-center justify-center space-x-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-2 rounded-xl text-xs transition border border-indigo-200/80"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedLink ? 'Current URL Copied!' : 'Copy Local App URL'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Gemini API Key & Credits */}
        {activeModalTab === 'ai' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Gemini API Key Section */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span>Google Gemini API Key</span>
              </label>
              <p className="text-xs text-slate-500 font-medium">
                Connect your Gemini key for AI guides and automatic roadmap generation.
              </p>

              <input
                type="password"
                placeholder="AIzaSy..."
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="w-full glass-input rounded-2xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
              />

              <div className="flex items-center justify-between pt-1">
                {savedSuccess ? (
                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> Stored successfully!
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400 font-medium">Saved to project config</span>
                )}

                <button
                  onClick={handleSaveApiKey}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-1.5 rounded-xl text-xs shadow-sm transition"
                >
                  Save Key
                </button>
              </div>
            </div>

            {/* AI Credits Top-Up */}
            <div className="bg-gradient-to-br from-amber-50/90 to-orange-50/90 border border-amber-200/80 rounded-2xl p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-amber-900">AI Credit Balance</span>
                </div>
                <span className="text-xl font-extrabold text-amber-600">{settings.aiCredits} Credits</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  onClick={() => topUpCredits(50)}
                  className="bg-white hover:bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-xs font-bold text-amber-800 flex items-center justify-center space-x-1.5 transition shadow-xs"
                >
                  <PlusCircle className="w-4 h-4 text-amber-500" />
                  <span>+50 Credits</span>
                </button>

                <button
                  onClick={() => topUpCredits(100)}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold p-2.5 rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-sm transition hover:opacity-95"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>+100 Credits</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-1 border-t border-slate-200/60">
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
