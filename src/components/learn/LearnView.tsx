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
          <div className="flex items-center space-x-2 text-zinc-900 text-xs font-black uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4 text-zinc-900" />
            <span>Task-Driven Learning Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">Learn &amp; Documentation Hub</h1>
          <p className="text-xs text-zinc-500 mt-1 font-medium">
            AI-curated best practices, architecture blueprints, and interactive guides for your assigned tasks.
          </p>
        </div>

        {/* User Filter Switcher */}
        <div className="flex items-center space-x-1 bg-zinc-100/90 p-1 rounded-xl border border-zinc-200/80">
          <span className="text-xs text-zinc-500 px-2 font-medium">Filter:</span>
          {(['Cam', 'Liam', 'Alex', 'All'] as const).map((user) => (
            <button
              key={user}
              onClick={() => setSelectedUserFilter(user)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedUserFilter === user
                  ? 'bg-black text-white shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-950'
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
            <div className="flex items-center justify-between border-b border-zinc-200/80 pb-3 px-1">
              <h2 className="text-xs font-black uppercase tracking-wider text-zinc-500">Curated Guides</h2>
              <span className="text-xs bg-zinc-100 text-zinc-900 px-2.5 py-0.5 rounded-full font-bold border border-zinc-200">
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
                        ? 'bg-white border-zinc-900 shadow-md shadow-black/5'
                        : 'bg-white/60 hover:bg-white/90 border-zinc-200/80 text-zinc-600'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs font-bold ${isSelected ? 'text-zinc-950 font-black' : 'text-zinc-800'}`}>
                          {doc.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 line-clamp-1">Re: {doc.taskTitle}</p>
                      <div className="flex items-center space-x-2 pt-1">
                        <span className="text-[10px] bg-zinc-100 text-zinc-800 font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                          <User className="w-2.5 h-2.5 text-zinc-700" />
                          {doc.assignee}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleComplete(doc);
                      }}
                      className="text-zinc-300 hover:text-zinc-900 transition mt-0.5"
                      title={doc.completed ? 'Mark incomplete' : 'Mark complete'}
                    >
                      {doc.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-zinc-900" />
                      ) : (
                        <Circle className="w-5 h-5 text-zinc-300" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Helper Banner */}
          <div className="bg-zinc-100/90 p-4 rounded-2xl border border-zinc-200 text-xs space-y-1.5">
            <div className="flex items-center space-x-1.5 text-zinc-950 font-bold">
              <Sparkles className="w-3.5 h-3.5 text-zinc-900 animate-pulse" />
              <span>Need custom learning docs?</span>
            </div>
            <p className="text-zinc-600 text-[11px] leading-relaxed">
              Use Gemini AI to generate step-by-step guides, architecture diagrams, and curated resources for any task.
            </p>
          </div>
        </div>

        {/* Right Pane: Preview + AI Relevance + Documentation */}
        <div className="lg:col-span-8 glass-panel rounded-3xl p-6 lg:p-8 flex flex-col justify-between space-y-6 shadow-sm">
          {currentDoc ? (
            <div className="space-y-6">
              
              {/* Header Title & Actions */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200/80 pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-zinc-100 text-zinc-900 px-2.5 py-0.5 rounded-full font-bold border border-zinc-200">
                      Task Guide
                    </span>
                    <span className="text-xs text-zinc-500 font-medium">Assigned to {currentDoc.assignee}</span>
                  </div>
                  <h2 className="text-2xl font-black text-zinc-950 mt-1">{currentDoc.title}</h2>
                  <p className="text-xs text-zinc-500 mt-0.5 font-medium">Task Reference: {currentDoc.taskTitle}</p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleAiGenerate}
                    disabled={isGenerating}
                    className="flex items-center space-x-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-300 px-3.5 py-2 rounded-xl text-xs font-bold shadow-2xs transition disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-zinc-900" />
                    <span>{isGenerating ? 'Generating...' : 'AI Refresh'}</span>
                  </button>

                  <button
                    onClick={() => handleToggleComplete(currentDoc)}
                    className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
                      currentDoc.completed
                        ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                        : 'bg-white text-zinc-800 border-zinc-200 hover:bg-zinc-50 shadow-xs'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{currentDoc.completed ? 'Completed' : 'Mark Done'}</span>
                  </button>
                </div>
              </div>

              {/* Resources & Demo Links */}
              {currentDoc.resources && currentDoc.resources.length > 0 && (
                <div className="bg-zinc-50/90 rounded-2xl border border-zinc-200/80 p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs text-zinc-500 font-bold border-b border-zinc-200/60 pb-2">
                    <span className="flex items-center space-x-2 text-zinc-900">
                      <PlayCircle className="w-4 h-4 text-zinc-900" />
                      <span>Interactive References &amp; Resources</span>
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
                        className="bg-white hover:bg-zinc-50 p-3 rounded-xl border border-zinc-200 flex items-center justify-between text-xs text-zinc-800 hover:text-black transition shadow-2xs group"
                      >
                        <div className="flex items-center space-x-2">
                          {res.type === 'video' ? (
                            <PlayCircle className="w-4 h-4 text-zinc-700" />
                          ) : res.type === 'article' ? (
                            <FileText className="w-4 h-4 text-zinc-700" />
                          ) : (
                            <BookOpen className="w-4 h-4 text-zinc-700" />
                          )}
                          <span className="font-bold">{res.title}</span>
                        </div>
                        <ExternalLink className="w-3 h-3 text-zinc-400 group-hover:text-black transition" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Relevance Insight */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 space-y-1.5 shadow-2xs">
                <div className="flex items-center space-x-2 text-xs font-black text-zinc-950">
                  <Lightbulb className="w-4 h-4 text-zinc-900" />
                  <span>AI Relevance Engine Insight</span>
                </div>
                <p className="text-xs text-zinc-700 leading-relaxed font-medium">
                  {currentDoc.relevanceExplanation}
                </p>
              </div>

              {/* Documentation Body */}
              <div className="bg-white/80 rounded-2xl p-6 border border-zinc-200/80 text-zinc-800 prose prose-zinc max-w-none text-xs leading-relaxed shadow-2xs">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {currentDoc.content}
                </ReactMarkdown>
              </div>

            </div>
          ) : (
            <div className="text-center text-zinc-400 py-20 font-medium">No documentation selected.</div>
          )}
        </div>

      </div>

    </div>
  );
};
