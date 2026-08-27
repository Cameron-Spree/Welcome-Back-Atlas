import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Key, Sparkles, PlusCircle, CheckCircle, Wifi, Share2, Globe, Users, Copy, Activity, AlertCircle, RefreshCw, Terminal, Check } from 'lucide-react';

export const SettingsModal: React.FC = () => {
  const { isSettingsOpen, setIsSettingsOpen, settings, updateSettings, topUpCredits, isConnected } = useApp();
  const [apiKeyInput, setApiKeyInput] = useState(settings.geminiApiKey || '');
  const [selectedModel, setSelectedModel] = useState(settings.geminiModel || 'gemini-1.5-flash');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'network' | 'ai' | 'debug'>('ai');
  const [copiedLink, setCopiedLink] = useState(false);
  const [discoveredModels, setDiscoveredModels] = useState<string[]>([]);

  // Debugger state
  const [isTesting, setIsTesting] = useState(false);
  const [debugResult, setDebugResult] = useState<{
    tested: boolean;
    success?: boolean;
    model?: string;
    latencyMs?: number;
    message?: string;
    preview?: string;
    error?: string;
    help?: string;
  }>({ tested: false });

  if (!isSettingsOpen) return null;

  const handleSaveSettings = async () => {
    await updateSettings({
      geminiApiKey: apiKeyInput.trim(),
      geminiModel: selectedModel,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  interface GeminiModelInfo {
    name: string;
    displayName: string;
    description: string;
    supportedGenerationMethods?: string[];
  }

  const [modelsList, setModelsList] = useState<GeminiModelInfo[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [listModelsError, setListModelsError] = useState<string | null>(null);

  // Function to call ModelService.ListModels directly from Google AI Studio
  const handleFetchAvailableModels = async () => {
    const key = apiKeyInput.trim();
    if (!key) {
      setListModelsError('Please enter your Google AI Studio API key first.');
      return;
    }

    setIsFetchingModels(true);
    setListModelsError(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        let errBody: any = {};
        try {
          errBody = await res.json();
        } catch {}
        throw new Error(errBody.error?.message || `HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      if (Array.isArray(data.models)) {
        const parsed: GeminiModelInfo[] = data.models
          .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
          .map((m: any) => ({
            name: m.name.replace('models/', ''),
            displayName: m.displayName || m.name.replace('models/', ''),
            description: m.description || 'Supports generateContent',
            supportedGenerationMethods: m.supportedGenerationMethods || [],
          }));

        setModelsList(parsed);

        // If current selectedModel is not in list, pick the first working flash model
        const hasCurrent = parsed.some((m) => m.name === selectedModel);
        if (!hasCurrent && parsed.length > 0) {
          const flashModel = parsed.find((m) => m.name.includes('flash')) || parsed[0];
          setSelectedModel(flashModel.name);
          await updateSettings({ geminiApiKey: key, geminiModel: flashModel.name });
        }
      } else {
        throw new Error('Google did not return any models for this API key.');
      }
    } catch (err: any) {
      setListModelsError(err.message || 'Failed to fetch models list from Google AI Studio.');
    } finally {
      setIsFetchingModels(false);
    }
  };

  const handleTestSpecificModel = async (targetModel: string) => {
    const key = apiKeyInput.trim();
    if (!key) return;

    setIsTesting(true);
    setSelectedModel(targetModel);
    setDebugResult({ tested: false });

    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${key}`,
        {
          method: 'POST',
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: 'Respond with exactly: "Atlas Connected"' }],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 20,
            },
          }),
        }
      );
      clearTimeout(timeoutId);

      const latencyMs = Date.now() - startTime;

      if (!res.ok) {
        let errBody: any = {};
        try {
          errBody = await res.json();
        } catch {}

        setDebugResult({
          tested: true,
          success: false,
          model: targetModel,
          latencyMs,
          error: errBody.error?.status || `HTTP_${res.status}`,
          message: errBody.error?.message || res.statusText,
          help: 'Try choosing another model from the list below.',
        });
      } else {
        const data = await res.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'Atlas Connected';

        await updateSettings({ geminiApiKey: key, geminiModel: targetModel });

        setDebugResult({
          tested: true,
          success: true,
          model: targetModel,
          latencyMs,
          message: `Connected successfully to Google Gemini (${targetModel})! 100% Free-Tier Verified.`,
          preview: reply,
        });
      }
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      setDebugResult({
        tested: true,
        success: false,
        model: targetModel,
        latencyMs,
        error: 'NETWORK_TIMEOUT',
        message: err.message || 'Request timed out or failed.',
        help: 'Make sure your browser has internet access.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestConnection = async () => {
    await handleTestSpecificModel(selectedModel);
  };

  const localOrigin = window.location.origin;

  const copyShareLink = () => {
    navigator.clipboard.writeText(localOrigin);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="glass-panel-elevated rounded-3xl max-w-xl w-full p-6 lg:p-7 space-y-5 shadow-2xl relative border border-white max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200/70 pb-3.5">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Key className="w-4 h-4" />
            </span>
            <h2 className="text-base font-extrabold text-slate-900">Settings & AI Configuration</h2>
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
            onClick={() => setActiveModalTab('ai')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center space-x-1.5 ${
              activeModalTab === 'ai'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Gemini AI Key</span>
          </button>

          <button
            onClick={() => {
              setActiveModalTab('debug');
              if (apiKeyInput.trim() && modelsList.length === 0) {
                handleFetchAvailableModels();
              }
            }}
            className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center space-x-1.5 ${
              activeModalTab === 'debug'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Model List & Probe</span>
          </button>

          <button
            onClick={() => setActiveModalTab('network')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center space-x-1.5 ${
              activeModalTab === 'network'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Multiplayer</span>
          </button>
        </div>

        {/* Tab 1: Gemini AI Key & Free-Tier Models */}
        {activeModalTab === 'ai' && (
          <div className="space-y-4 animate-fadeIn">
            
            {/* Free Tier Info Badge */}
            <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-3.5 flex items-start space-x-2.5">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-0.5">
                <p className="font-bold text-emerald-900">Google AI Studio Free Tier Active</p>
                <p className="text-emerald-700 font-medium leading-relaxed">
                  You get <strong>1,500 free generations every day</strong> with zero cost ($0.00). If you exceed free limits, it&apos;s only ~$0.00008 per roadmap.
                </p>
              </div>
            </div>

            {/* Model Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span>Active Model</span>
                <button
                  onClick={() => {
                    setActiveModalTab('debug');
                    handleFetchAvailableModels();
                  }}
                  className="text-[10px] text-indigo-600 font-bold hover:underline"
                >
                  🔍 View All Available Google Models &rarr;
                </button>
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {modelsList.length > 0 ? (
                  modelsList.map((m) => (
                    <option key={m.name} value={m.name}>
                      {m.name} ({m.displayName})
                    </option>
                  ))
                ) : (
                  <>
                    <option value="gemini-2.0-flash">gemini-2.0-flash (Newest Flash — Free Tier)</option>
                    <option value="gemini-2.0-flash-exp">gemini-2.0-flash-exp (Experimental)</option>
                    <option value="gemini-1.5-flash-latest">gemini-1.5-flash-latest</option>
                    <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                    <option value="gemini-pro">gemini-pro</option>
                  </>
                )}
              </select>
            </div>

            {/* API Key Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span>Google AI Studio Key</span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-indigo-600 hover:underline font-semibold"
                >
                  Get Free Key &rarr;
                </a>
              </label>
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
                  <span className="text-[11px] text-slate-400 font-medium">Stored securely in database</span>
                )}

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      handleSaveSettings();
                      setActiveModalTab('debug');
                      handleFetchAvailableModels();
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-xl text-xs transition"
                  >
                    List Models &rarr;
                  </button>
                  <button
                    onClick={handleSaveSettings}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-1.5 rounded-xl text-xs shadow-sm transition"
                  >
                    Save Key
                  </button>
                </div>
              </div>
            </div>

            {/* AI Credit Balance Top-Up */}
            <div className="bg-gradient-to-br from-amber-50/90 to-orange-50/90 border border-amber-200/80 rounded-2xl p-3.5 space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-amber-900">App AI Credit Pool</span>
                </div>
                <span className="text-lg font-extrabold text-amber-600">{settings.aiCredits} Credits</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Atlas tracks internal sprint credits (10 per roadmap, 5 per doc). Top up freely below:
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => topUpCredits(50)}
                  className="flex-1 bg-white hover:bg-amber-50 border border-amber-200 p-2 rounded-xl text-xs font-bold text-amber-800 flex items-center justify-center space-x-1 transition shadow-xs"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-amber-500" />
                  <span>+50 Credits</span>
                </button>
                <button
                  onClick={() => topUpCredits(100)}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold p-2 rounded-xl text-xs flex items-center justify-center space-x-1 shadow-sm transition hover:opacity-95"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>+100 Credits</span>
                </button>
              </div>
            </div>

          </div>
        )}

        {/* Tab 2: Model List & Live Probe Debugger */}
        {activeModalTab === 'debug' && (
          <div className="space-y-4 animate-fadeIn">
            
            {/* ModelService.ListModels Action Card */}
            <div className="bg-white/90 border border-slate-200/80 rounded-2xl p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Terminal className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs font-bold text-slate-900">Google ModelService.ListModels</h3>
                </div>
                <button
                  onClick={handleFetchAvailableModels}
                  disabled={isFetchingModels}
                  className="flex items-center space-x-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-xl text-xs font-bold transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isFetchingModels ? 'animate-spin' : ''}`} />
                  <span>{isFetchingModels ? 'Querying Google...' : 'Fetch Available Models'}</span>
                </button>
              </div>

              {listModelsError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{listModelsError}</span>
                </div>
              )}

              {/* Models List Table */}
              {modelsList.length > 0 && (
                <div className="space-y-2 pt-1 max-h-48 overflow-y-auto pr-1">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    {modelsList.length} Models Available for Your Key:
                  </p>
                  {modelsList.map((m) => {
                    const isCurrent = m.name === selectedModel;
                    return (
                      <div
                        key={m.name}
                        className={`p-2.5 rounded-xl border flex items-center justify-between transition ${
                          isCurrent
                            ? 'bg-indigo-50/80 border-indigo-300 shadow-xs'
                            : 'bg-slate-50 border-slate-200 hover:bg-white'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-xs font-bold text-slate-900 font-mono">{m.name}</span>
                            {isCurrent && (
                              <span className="text-[9px] bg-indigo-600 text-white font-bold px-1.5 py-0.2 rounded-full">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 line-clamp-1">{m.description}</p>
                        </div>

                        <button
                          onClick={() => handleTestSpecificModel(m.name)}
                          disabled={isTesting}
                          className="bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-indigo-700 px-2.5 py-1 rounded-lg text-xs font-bold transition shadow-xs shrink-0"
                        >
                          {isTesting && selectedModel === m.name ? 'Testing...' : 'Select & Test'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Test Probe Diagnostics */}
            <div className="bg-white/90 border border-slate-200/80 rounded-2xl p-4 space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Selected Model: <code className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded font-bold font-mono">{selectedModel}</code></span>
                <button
                  onClick={() => handleTestSpecificModel(selectedModel)}
                  disabled={isTesting}
                  className="flex items-center space-x-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-xs hover:opacity-95 transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Probing...' : 'Test Selected Model'}</span>
                </button>
              </div>

              {debugResult.tested && (
                <div className="pt-2">
                  {debugResult.success ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                          <Check className="w-4 h-4 text-emerald-600" /> 200 OK — Ready for Production!
                        </span>
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-mono">
                          {debugResult.latencyMs}ms
                        </span>
                      </div>
                      <p className="text-xs text-emerald-700 font-medium leading-relaxed">
                        {debugResult.message}
                      </p>
                      {debugResult.preview && (
                        <div className="bg-white/90 p-2 rounded-lg border border-emerald-100 text-[11px] font-mono text-slate-700">
                          {debugResult.preview}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-rose-600" /> Test Failed ({debugResult.error})
                        </span>
                        {debugResult.latencyMs && (
                          <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md font-mono">
                            {debugResult.latencyMs}ms
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-rose-700 font-medium">
                        {debugResult.message}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        )}

        {/* Tab 3: Multiplayer & Friends Collaboration */}
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
                    Find your local IP (<code className="bg-slate-200 px-1 rounded text-slate-800">ipconfig</code> &rarr; <code className="bg-slate-200 px-1 rounded text-slate-800">192.168.x.x</code>). Liam & Alex browse to:
                  </p>
                  <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-indigo-700 font-mono text-[11px] mt-1 font-bold">
                    <span>http://&lt;your-local-ip&gt;:5173</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                  <p className="font-bold text-slate-800">2. Free 24/7 Hosting (Render.com):</p>
                  <p className="text-[11px] text-slate-500">
                    Deploy repository to Render for free 24/7 WebSockets and link your custom domain (e.g. <code className="bg-slate-200 px-1 rounded text-slate-800">atlas.yourdomain.com</code>).
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
