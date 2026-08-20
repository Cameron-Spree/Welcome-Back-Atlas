import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Key, Sparkles, PlusCircle, CheckCircle, ShieldAlert } from 'lucide-react';

export const SettingsModal: React.FC = () => {
  const { isSettingsOpen, setIsSettingsOpen, settings, updateSettings, topUpCredits } = useApp();
  const [apiKeyInput, setApiKeyInput] = useState(settings.geminiApiKey || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isSettingsOpen) return null;

  const handleSaveApiKey = async () => {
    await updateSettings({ geminiApiKey: apiKeyInput.trim() });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl relative">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2">
            <Key className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">Settings & AI Credits</h2>
          </div>
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="p-1 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Gemini API Key Section */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <span>Link Google Gemini API Key</span>
          </label>
          <p className="text-xs text-slate-400">
            Connect your Gemini API Key to enable real AI doc generation & auto-roadmaps. (If left empty, Atlas uses intelligent built-in fallback engine).
          </p>

          <input
            type="password"
            placeholder="AIzaSy..."
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:border-amber-400 focus:outline-none"
          />

          <div className="flex items-center justify-between pt-1">
            {savedSuccess ? (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> API Key saved successfully!
              </span>
            ) : (
              <span className="text-[11px] text-slate-500">Stored locally in app settings</span>
            )}

            <button
              onClick={handleSaveApiKey}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-4 py-1.5 rounded-xl text-xs shadow-md transition"
            >
              Save Key
            </button>
          </div>
        </div>

        {/* Pay / Top Up Credits Section */}
        <div className="bg-gradient-to-br from-amber-950/40 via-slate-950 to-slate-950 border border-amber-500/20 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-white">AI Credit Balance</span>
            </div>
            <span className="text-xl font-black text-amber-300">{settings.aiCredits} Credits</span>
          </div>

          <p className="text-xs text-slate-400">
            Credits are spent when generating custom learning guides (10 credits) or full project roadmaps (15 credits).
          </p>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => topUpCredits(50)}
              className="bg-slate-900 hover:bg-slate-800 border border-amber-500/30 p-3 rounded-xl text-xs font-semibold text-amber-300 flex items-center justify-center space-x-1.5 transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+50 Credits ($5)</span>
            </button>

            <button
              onClick={() => topUpCredits(100)}
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold p-3 rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-md transition hover:opacity-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>+100 Credits ($9)</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-2">
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="text-xs text-slate-400 hover:text-white underline font-semibold"
          >
            Close Settings
          </button>
        </div>

      </div>
    </div>
  );
};
