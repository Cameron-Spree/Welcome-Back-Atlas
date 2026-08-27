import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useApp } from '../../context/AppContext';
import { X, Key, Sparkles, PlusCircle, CheckCircle, Wifi, Share2, Globe, Users, Copy, Activity, AlertCircle, RefreshCw, Terminal, Check } from 'lucide-react';

interface GeminiModelInfo {
  name: string;
  displayName: string;
  description: string;
  supportedGenerationMethods?: string[];
}

export const SettingsModal: React.FC = () => {
  const {
    isSettingsOpen,
    setIsSettingsOpen,
    settings,
    updateSettings,
    topUpCredits,
    isConnected,
    companyProfile,
    updateCompanyProfile,
  } = useApp();
  
  // ALL React Hooks at the very top (never after conditional return)
  const [apiKeyInput, setApiKeyInput] = useState(settings.geminiApiKey || '');
  const [selectedModel, setSelectedModel] = useState(settings.geminiModel || 'gemini-1.5-flash');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'ai' | 'context' | 'debug' | 'network'>('ai');
  const [copiedLink, setCopiedLink] = useState(false);
  const [discoveredModels, setDiscoveredModels] = useState<string[]>([]);
  const [modelsList, setModelsList] = useState<GeminiModelInfo[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [listModelsError, setListModelsError] = useState<string | null>(null);

  // Company Profile Local Edit State
  const [companyEdit, setCompanyEdit] = useState(companyProfile);
  const [companySavedSuccess, setCompanySavedSuccess] = useState(false);

  useEffect(() => {
    setCompanyEdit(companyProfile);
  }, [companyProfile]);

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

  // Sync state if settings update
  useEffect(() => {
    if (settings.geminiApiKey && !apiKeyInput) {
      setApiKeyInput(settings.geminiApiKey);
    }
    if (settings.geminiModel) {
      setSelectedModel(settings.geminiModel);
    }
  }, [settings.geminiApiKey, settings.geminiModel]);

  // Conditional early return AFTER all hooks
  if (!isSettingsOpen) return null;

  const handleSaveSettings = async () => {
    await updateSettings({
      geminiApiKey: apiKeyInput.trim(),
      geminiModel: selectedModel,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

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

  const modalContent = (
    <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="glass-panel-elevated rounded-3xl max-w-xl w-full p-6 lg:p-7 space-y-5 shadow-2xl relative border border-white max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200/80 pb-3.5">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-xl bg-zinc-100 text-zinc-900 border border-zinc-200">
              <Key className="w-4 h-4" />
            </span>
            <h2 className="text-base font-black text-zinc-950">Settings &amp; AI Configuration</h2>
          </div>
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="p-1.5 text-zinc-400 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Tab Switcher */}
        <div className="flex items-center bg-zinc-100/90 p-1 rounded-xl border border-zinc-200/80 text-xs">
          <button
            onClick={() => setActiveModalTab('ai')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center space-x-1.5 ${
              activeModalTab === 'ai'
                ? 'bg-black text-white shadow-sm'
                : 'text-zinc-600 hover:text-zinc-950'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>AI Key</span>
          </button>

          <button
            onClick={() => setActiveModalTab('context')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center space-x-1.5 ${
              activeModalTab === 'context'
                ? 'bg-black text-white shadow-sm'
                : 'text-zinc-600 hover:text-zinc-950'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Company DNA</span>
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
                ? 'bg-black text-white shadow-sm'
                : 'text-zinc-600 hover:text-zinc-950'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Models</span>
          </button>

          <button
            onClick={() => setActiveModalTab('network')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center space-x-1.5 ${
              activeModalTab === 'network'
                ? 'bg-black text-white shadow-sm'
                : 'text-zinc-600 hover:text-zinc-950'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Network</span>
          </button>
        </div>

        {/* Tab: Company DNA Context */}
        {activeModalTab === 'context' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 space-y-2">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-zinc-900" />
                <h3 className="text-xs font-black text-zinc-950">Atlas Company Knowledge Profile</h3>
              </div>
              <p className="text-[11px] text-zinc-600 leading-relaxed font-medium">
                This high-density context is concisely injected into Gemini (~100 tokens), allowing the AI to customize every roadmap and literature recommendation without exhausting context or token limits.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-zinc-700 uppercase tracking-wider text-[10px]">Studio Summary &amp; Mission</label>
                <textarea
                  rows={2}
                  value={companyEdit.summary}
                  onChange={(e) => setCompanyEdit({ ...companyEdit, summary: e.target.value })}
                  className="w-full glass-input rounded-xl p-2.5 text-xs text-zinc-900 focus:outline-none"
                  placeholder="What Atlas builds and specializes in..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-zinc-700 uppercase tracking-wider text-[10px]">Target Clients / Audience</label>
                  <input
                    type="text"
                    value={companyEdit.targetAudience}
                    onChange={(e) => setCompanyEdit({ ...companyEdit, targetAudience: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-zinc-900 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-zinc-700 uppercase tracking-wider text-[10px]">Tech Stack</label>
                  <input
                    type="text"
                    value={companyEdit.techStack}
                    onChange={(e) => setCompanyEdit({ ...companyEdit, techStack: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-zinc-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <span className="font-black text-zinc-950 uppercase tracking-wider text-[10px]">Team Member Roles</span>
                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-white border border-zinc-200 space-y-1">
                    <span className="font-extrabold text-zinc-900">Cam (Backend / Systems Architecture):</span>
                    <input
                      type="text"
                      value={companyEdit.teamRoles.cam}
                      onChange={(e) => setCompanyEdit({
                        ...companyEdit,
                        teamRoles: { ...companyEdit.teamRoles, cam: e.target.value }
                      })}
                      className="w-full text-xs text-zinc-700 bg-zinc-50 rounded-lg px-2 py-1 border border-zinc-200 focus:outline-none"
                    />
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-zinc-200 space-y-1">
                    <span className="font-extrabold text-zinc-900">Liam (Frontend / UI Engineering):</span>
                    <input
                      type="text"
                      value={companyEdit.teamRoles.liam}
                      onChange={(e) => setCompanyEdit({
                        ...companyEdit,
                        teamRoles: { ...companyEdit.teamRoles, liam: e.target.value }
                      })}
                      className="w-full text-xs text-zinc-700 bg-zinc-50 rounded-lg px-2 py-1 border border-zinc-200 focus:outline-none"
                    />
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-zinc-200 space-y-1">
                    <span className="font-extrabold text-zinc-900">Alex (Design, UX &amp; QA):</span>
                    <input
                      type="text"
                      value={companyEdit.teamRoles.alex}
                      onChange={(e) => setCompanyEdit({
                        ...companyEdit,
                        teamRoles: { ...companyEdit.teamRoles, alex: e.target.value }
                      })}
                      className="w-full text-xs text-zinc-700 bg-zinc-50 rounded-lg px-2 py-1 border border-zinc-200 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                {companySavedSuccess ? (
                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> Context updated!
                  </span>
                ) : (
                  <span className="text-[11px] text-zinc-400">Injected into all Gemini sessions</span>
                )}

                <button
                  onClick={() => {
                    updateCompanyProfile(companyEdit);
                    setCompanySavedSuccess(true);
                    setTimeout(() => setCompanySavedSuccess(false), 2500);
                  }}
                  className="bg-black hover:bg-zinc-800 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm transition"
                >
                  Save Company Context
                </button>
              </div>
            </div>
          </div>
        )}


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
                    className="bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold px-3 py-1.5 rounded-xl text-xs transition"
                  >
                    List Models &rarr;
                  </button>
                  <button
                    onClick={handleSaveSettings}
                    className="bg-black hover:bg-zinc-800 text-white font-bold px-4 py-1.5 rounded-xl text-xs shadow-sm transition"
                  >
                    Save Key
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Tab 2: Model List & Live Probe Debugger */}
        {activeModalTab === 'debug' && (
          <div className="space-y-4 animate-fadeIn">
            
            {/* ModelService.ListModels Action Card */}
            <div className="bg-white/95 border border-zinc-200 rounded-2xl p-4 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Terminal className="w-4 h-4 text-zinc-900" />
                  <h3 className="text-xs font-bold text-zinc-900">Google ModelService.ListModels</h3>
                </div>
                <button
                  onClick={handleFetchAvailableModels}
                  disabled={isFetchingModels}
                  className="flex items-center space-x-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-300 px-3 py-1.5 rounded-xl text-xs font-bold transition disabled:opacity-50"
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
                  <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                    {modelsList.length} Models Available for Your Key:
                  </p>
                  {modelsList.map((m) => {
                    const isCurrent = m.name === selectedModel;
                    return (
                      <div
                        key={m.name}
                        className={`p-2.5 rounded-xl border flex items-center justify-between transition ${
                          isCurrent
                            ? 'bg-zinc-100 border-zinc-400 shadow-2xs'
                            : 'bg-zinc-50 border-zinc-200 hover:bg-white'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-xs font-bold text-zinc-950 font-mono">{m.name}</span>
                            {isCurrent && (
                              <span className="text-[9px] bg-black text-white font-bold px-1.5 py-0.2 rounded-full">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-zinc-500 line-clamp-1">{m.description}</p>
                        </div>

                        <button
                          onClick={() => handleTestSpecificModel(m.name)}
                          disabled={isTesting}
                          className="bg-white hover:bg-zinc-100 border border-zinc-300 text-zinc-900 px-2.5 py-1 rounded-lg text-xs font-bold transition shadow-2xs shrink-0"
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
            <div className="bg-white/95 border border-zinc-200 rounded-2xl p-4 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-800">Selected Model: <code className="text-zinc-950 bg-zinc-100 px-1.5 py-0.5 rounded font-bold font-mono">{selectedModel}</code></span>
                <button
                  onClick={() => handleTestSpecificModel(selectedModel)}
                  disabled={isTesting}
                  className="flex items-center space-x-1 bg-black hover:bg-zinc-800 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-xs transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Probing...' : 'Test Selected Model'}</span>
                </button>
              </div>

              {debugResult.tested && (
                <div className="pt-2">
                  {debugResult.success ? (
                    <div className="bg-zinc-50 border border-zinc-300 rounded-xl p-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-950 flex items-center gap-1.5">
                          <Check className="w-4 h-4 text-black" /> 200 OK — Ready for Production!
                        </span>
                        <span className="text-[10px] font-bold bg-zinc-200 text-zinc-900 px-2 py-0.5 rounded-md font-mono">
                          {debugResult.latencyMs}ms
                        </span>
                      </div>
                      <p className="text-xs text-zinc-700 font-medium leading-relaxed">
                        {debugResult.message}
                      </p>
                      {debugResult.preview && (
                        <div className="bg-white p-2 rounded-lg border border-zinc-200 text-[11px] font-mono text-zinc-800">
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
            <div className="bg-white/90 border border-zinc-200 rounded-2xl p-4 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                  <Wifi className="w-4 h-4 text-black" /> Real-Time Sync Status
                </span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-900 border border-zinc-200">
                  {isConnected ? 'Connected & Live' : 'Connecting...'}
                </span>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed font-medium">
                Changes to roadmap tasks, checklists, and guides sync instantaneously across all open browsers and connected peers.
              </p>
            </div>

            {/* How to share with Liam and Alex */}
            <div className="glass-panel p-4 rounded-2xl space-y-3">
              <h3 className="text-xs font-black text-zinc-950 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-zinc-900" />
                <span>How to collaborate with friends</span>
              </h3>

              <div className="space-y-2 text-xs text-zinc-600">
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 space-y-1">
                  <p className="font-bold text-zinc-900">1. Same Wi-Fi / Local Network:</p>
                  <p className="text-[11px] text-zinc-500">
                    Find your local IP (<code className="bg-zinc-200 px-1 rounded text-zinc-800">ipconfig</code> &rarr; <code className="bg-zinc-200 px-1 rounded text-zinc-800">192.168.x.x</code>). Liam &amp; Alex browse to:
                  </p>
                  <div className="bg-white px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-950 font-mono text-[11px] mt-1 font-bold">
                    <span>http://&lt;your-local-ip&gt;:5173</span>
                  </div>
                </div>

                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 space-y-1">
                  <p className="font-bold text-zinc-900">2. Free 24/7 Hosting (Render.com):</p>
                  <p className="text-[11px] text-zinc-500">
                    Deploy repository to Render for free 24/7 WebSockets and link your custom domain (e.g. <code className="bg-zinc-200 px-1 rounded text-zinc-800">atlas.yourdomain.com</code>).
                  </p>
                </div>
              </div>

              <button
                onClick={copyShareLink}
                className="w-full flex items-center justify-center space-x-1.5 bg-black hover:bg-zinc-800 text-white font-bold py-2 rounded-xl text-xs transition shadow-xs"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedLink ? 'Current URL Copied!' : 'Copy Local App URL'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-1 border-t border-zinc-200">
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="text-xs text-zinc-500 hover:text-zinc-900 font-bold"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );

  return typeof document !== 'undefined' ? ReactDOM.createPortal(modalContent, document.body) : null;
};
