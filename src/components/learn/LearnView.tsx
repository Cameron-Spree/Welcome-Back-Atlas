import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LearnDoc } from '../../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BookOpen, Sparkles, ExternalLink, CheckCircle2, Circle, Lightbulb, PlayCircle, FileText, User } from 'lucide-react';

export const LearnView: React.FC = () => {
  const {
    currentUser,
    tasks,
    docs,
    updateDoc,
    generateAiDoc,
    settings,
  } = useApp();

  const [selectedUserFilter, setSelectedUserFilter] = useState<'All' | 'Cam' | 'Liam' | 'Alex'>(currentUser);
  const [activeDocId, setActiveDocId] = useState<string | null>(docs[0]?.id || null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const filteredDocs = docs.filter((d) =>
    selectedUserFilter === 'All' ? true : d.assignee === selectedUserFilter
  );

  const currentDoc: LearnDoc | undefined = docs.find((d) => d.id === activeDocId) || filteredDocs[0];

  const handleToggleComplete = async (doc: LearnDoc) => {
    await updateDoc({ ...doc, completed: !doc.completed });
  };

  const handleAiGenerate = async () => {
    if (!currentDoc) return;
    setIsGenerating(true);
    await generateAiDoc(currentDoc.taskId);
    setIsGenerating(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Top Header & User Filter */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span>Task-Driven Learning Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Learn & Documentation Hub</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            AI-curated best practices, architecture blueprints, and interactive guides for your assigned tasks.
          </p>
        </div>

        {/* User Filter Switcher */}
        <div className="flex items-center space-x-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/70">
          <span className="text-xs text-slate-500 px-2 font-medium">Filter:</span>
          {(['Cam', 'Liam', 'Alex', 'All'] as const).map((user) => (
            <button
              key={user}
              onClick={() => setSelectedUserFilter(user)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedUserFilter === user
                  ? 'bg-white text-indigo-600 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {user}
            </button>
          ))}
        </div>
      </div>

      {/* 2-Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        
        {/* Left Pane: Task List */}
        <div className="lg:col-span-4 glass-panel rounded-3xl p-5 flex flex-col justify-between space-y-4 shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/70 pb-3 px-1">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Curated Guides</h2>
              <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold border border-indigo-100">
                {filteredDocs.length} Guides
              </span>
            </div>

            <div className="space-y-2">
              {filteredDocs.map((doc) => {
                const isSelected = currentDoc?.id === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => setActiveDocId(doc.id)}
                    className={`p-3.5 rounded-2xl cursor-pointer transition-all border flex items-start justify-between space-x-3 ${
                      isSelected
                        ? 'bg-white border-indigo-300 shadow-md shadow-indigo-500/10'
                        : 'bg-white/50 hover:bg-white/80 border-slate-200/70 text-slate-600'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs font-bold ${isSelected ? 'text-indigo-600' : 'text-slate-800'}`}>
                          {doc.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1">Re: {doc.taskTitle}</p>
                      <div className="flex items-center space-x-2 pt-1">
                        <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                          <User className="w-2.5 h-2.5 text-indigo-500" />
                          {doc.assignee}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleComplete(doc);
                      }}
                      className="text-slate-300 hover:text-emerald-500 transition mt-0.5"
                      title={doc.completed ? 'Mark incomplete' : 'Mark complete'}
                    >
                      {doc.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Helper Banner */}
          <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-100 text-xs space-y-1.5">
            <div className="flex items-center space-x-1.5 text-indigo-700 font-bold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
              <span>Need custom learning docs?</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Use Gemini AI to generate step-by-step guides, architecture diagrams, and curated resources for any task.
            </p>
          </div>
        </div>

        {/* Right Pane: Preview + AI Relevance + Documentation */}
        <div className="lg:col-span-8 glass-panel rounded-3xl p-6 lg:p-8 flex flex-col justify-between space-y-6 shadow-sm">
          {currentDoc ? (
            <div className="space-y-6">
              
              {/* Header Title & Actions */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/70 pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold border border-indigo-100">
                      Task Guide
                    </span>
                    <span className="text-xs text-slate-500 font-medium">Assigned to {currentDoc.assignee}</span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-slate-900 mt-1">{currentDoc.title}</h2>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">Task Reference: {currentDoc.taskTitle}</p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleAiGenerate}
                    disabled={isGenerating}
                    className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition hover:opacity-95 disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isGenerating ? 'Generating...' : 'AI Refresh (10 Credits)'}</span>
                  </button>

                  <button
                    onClick={() => handleToggleComplete(currentDoc)}
                    className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
                      currentDoc.completed
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-xs'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{currentDoc.completed ? 'Completed' : 'Mark Done'}</span>
                  </button>
                </div>
              </div>

              {/* Resources & Demo Links */}
              {currentDoc.resources && currentDoc.resources.length > 0 && (
                <div className="bg-slate-50/80 rounded-2xl border border-slate-200/70 p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-bold border-b border-slate-200/60 pb-2">
                    <span className="flex items-center space-x-2 text-indigo-600">
                      <PlayCircle className="w-4 h-4" />
                      <span>Interactive References & Resources</span>
                    </span>
                    <span>{currentDoc.resources.length} Links</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                    {currentDoc.resources.map((res, i) => (
                      <a
                        key={i}
                        href={res.url}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-white hover:bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs text-slate-800 hover:text-indigo-600 transition shadow-xs group"
                      >
                        <div className="flex items-center space-x-2">
                          {res.type === 'video' ? (
                            <PlayCircle className="w-4 h-4 text-pink-500" />
                          ) : res.type === 'article' ? (
                            <FileText className="w-4 h-4 text-cyan-500" />
                          ) : (
                            <BookOpen className="w-4 h-4 text-indigo-500" />
                          )}
                          <span className="font-semibold">{res.title}</span>
                        </div>
                        <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 transition" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Relevance Insight */}
              <div className="bg-gradient-to-r from-indigo-50/90 to-purple-50/90 border border-indigo-100 rounded-2xl p-4 space-y-1.5 shadow-xs">
                <div className="flex items-center space-x-2 text-xs font-extrabold text-indigo-900">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <span>AI Relevance Engine Insight</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {currentDoc.relevanceExplanation}
                </p>
              </div>

              {/* Documentation Body */}
              <div className="bg-white/70 rounded-2xl p-6 border border-slate-200/70 text-slate-800 prose prose-slate max-w-none text-xs leading-relaxed shadow-xs">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {currentDoc.content}
                </ReactMarkdown>
              </div>

            </div>
          ) : (
            <div className="text-center text-slate-400 py-20 font-medium">No documentation selected.</div>
          )}
        </div>

      </div>

    </div>
  );
};
