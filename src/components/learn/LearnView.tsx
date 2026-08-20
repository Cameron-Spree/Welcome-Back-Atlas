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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span>Task-Driven Learning Engine</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Learn & Documentation Hub</h1>
          <p className="text-xs text-slate-400 mt-1">
            Individualized documentation, client specs, and AI relevance guides tailored to your tasks.
          </p>
        </div>

        {/* User Filter Switcher */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-500 px-2 font-medium">Filter Task Docs:</span>
          {(['Cam', 'Liam', 'Alex', 'All'] as const).map((user) => (
            <button
              key={user}
              onClick={() => setSelectedUserFilter(user)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedUserFilter === user
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              {user}
            </button>
          ))}
        </div>
      </div>

      {/* Wireframe 2-Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        
        {/* Left Pane: Task List (✓ Task 1, ✓ Task 2...) */}
        <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 px-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Assigned Tasks</h2>
              <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">
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
                    className={`p-3.5 rounded-xl cursor-pointer transition-all border flex items-start justify-between space-x-3 ${
                      isSelected
                        ? 'bg-indigo-950/60 border-indigo-500/50 shadow-lg shadow-indigo-950/50'
                        : 'bg-slate-950/50 hover:bg-slate-800/50 border-slate-800/80 text-slate-400'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-white">{doc.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1">Re: {doc.taskTitle}</p>
                      <div className="flex items-center space-x-2 pt-1">
                        <span className="text-[10px] bg-slate-800 text-indigo-300 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <User className="w-2.5 h-2.5" />
                          {doc.assignee}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleComplete(doc);
                      }}
                      className="text-slate-500 hover:text-emerald-400 transition"
                      title={doc.completed ? 'Mark incomplete' : 'Mark complete'}
                    >
                      {doc.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-600" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Helper Banner */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
            <div className="flex items-center space-x-2 text-amber-400 font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Need fresh learning docs?</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Use Gemini API to generate custom tutorials, reference docs, and video recommendations for any task.
            </p>
          </div>
        </div>

        {/* Right Pane: Preview + AI Relevance + Documentation */}
        <div className="lg:col-span-8 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-6">
          {currentDoc ? (
            <div className="space-y-6">
              
              {/* Header Title & Actions */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded font-semibold border border-indigo-500/20">
                      Task Doc
                    </span>
                    <span className="text-xs text-slate-400">Assigned to {currentDoc.assignee}</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white mt-1">{currentDoc.title}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Task Reference: {currentDoc.taskTitle}</p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleAiGenerate}
                    disabled={isGenerating}
                    className="flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isGenerating ? 'Generating...' : 'AI Refresh Guide (10 Credits)'}</span>
                  </button>

                  <button
                    onClick={() => handleToggleComplete(currentDoc)}
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                      currentDoc.completed
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{currentDoc.completed ? 'Completed' : 'Mark Done'}</span>
                  </button>
                </div>
              </div>

              {/* Wireframe Preview Section */}
              <div className="bg-slate-950 rounded-xl border border-slate-800 p-5 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold border-b border-slate-800/80 pb-2">
                  <span className="flex items-center space-x-2 text-cyan-400">
                    <PlayCircle className="w-4 h-4" />
                    <span>Interactive Preview & Demo Assets</span>
                  </span>
                  <span>{currentDoc.resources?.length || 0} Resources Attached</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {currentDoc.resources?.map((res, i) => (
                    <a
                      key={i}
                      href={res.url}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-slate-900/90 hover:bg-slate-800 p-3 rounded-lg border border-slate-800 flex items-center justify-between text-xs text-indigo-300 hover:text-white transition group"
                    >
                      <div className="flex items-center space-x-2">
                        {res.type === 'video' ? (
                          <PlayCircle className="w-4 h-4 text-pink-400" />
                        ) : res.type === 'article' ? (
                          <FileText className="w-4 h-4 text-cyan-400" />
                        ) : (
                          <BookOpen className="w-4 h-4 text-indigo-400" />
                        )}
                        <span className="font-semibold">{res.title}</span>
                      </div>
                      <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-white transition" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Wireframe AI Relevance Section */}
              <div className="bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-500/30 rounded-xl p-4 space-y-2">
                <div className="flex items-center space-x-2 text-xs font-bold text-amber-300">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  <span>AI Relevance Engine Insight</span>
                </div>
                <p className="text-xs text-indigo-200 leading-relaxed">
                  {currentDoc.relevanceExplanation}
                </p>
              </div>

              {/* Documentation Body */}
              <div className="bg-slate-950/40 rounded-xl p-5 border border-slate-800/60 prose prose-invert prose-xs max-w-none text-slate-300">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {currentDoc.content}
                </ReactMarkdown>
              </div>

            </div>
          ) : (
            <div className="text-center text-slate-500 py-20">No documentation selected.</div>
          )}
        </div>

      </div>

    </div>
  );
};
