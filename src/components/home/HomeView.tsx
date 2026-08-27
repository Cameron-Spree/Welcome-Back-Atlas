import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Task, LearnDoc, UserRole } from '../../types';
import {
  Sparkles,
  ArrowRight,
  LayoutGrid,
  BookOpen,
  TrendingUp,
  Plus,
  Check,
  RotateCcw,
  User,
  Send,
  Calendar,
  MessageSquare,
  Zap,
  Clock,
  Layers,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

export const HomeView: React.FC = () => {
  const {
    currentUser,
    tasks,
    docs,
    setActiveTab,
    setSelectedDocId,
    commitPlan,
    chatMessages,
    sendChatMessage,
    clearChatHistory,
  } = useApp();

  const [inputPrompt, setInputPrompt] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [committedPlanIds, setCommittedPlanIds] = useState<Set<string>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const hasActiveConversation = chatMessages.some((m) => m.sender === 'user') || isSending;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (hasActiveConversation) {
      scrollToBottom();
    }
  }, [chatMessages, isSending, hasActiveConversation]);

  const handleSendMessage = async (e?: React.FormEvent, overrideText?: string) => {
    if (e) e.preventDefault();
    const textToSend = (overrideText || inputPrompt).trim();
    if (!textToSend || isSending) return;

    setInputPrompt('');
    setIsSending(true);

    try {
      await sendChatMessage(textToSend);
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleCommitPlanFromMessage = async (msgId: string, planTasks: Task[], planDocs: LearnDoc[]) => {
    await commitPlan(planTasks, planDocs);
    setCommittedPlanIds((prev) => new Set(prev).add(msgId));
  };

  // 1. ZERO-CLUTTER INITIAL LANDING VIEW
  if (!hasActiveConversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[75vh] max-w-2xl mx-auto w-full px-4 animate-fadeIn">
        
        {/* Clean Centered Greeting */}
        <div className="text-center space-y-3 mb-8">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-zinc-950 leading-tight">
            Welcome back,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-black via-zinc-800 to-zinc-600">
              {currentUser}
            </span>
          </h1>
        </div>

        {/* Center Floating Liquid Glass Omnibar */}
        <form
          onSubmit={handleSendMessage}
          className="w-full glass-panel-elevated liquid-shimmer rounded-3xl p-3 shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-white flex items-center space-x-3 transition-all duration-300 focus-within:shadow-[0_25px_60px_rgba(0,0,0,0.15)] focus-within:border-black"
        >
          <div className="pl-2.5 text-zinc-900">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>

          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="e.g. Make a social media planner for Atlas..."
            className="flex-1 bg-transparent text-zinc-950 placeholder-zinc-400 text-sm sm:text-base font-semibold focus:outline-none px-2"
            autoFocus
          />

          <button
            type="submit"
            disabled={!inputPrompt.trim()}
            className={`p-3 rounded-2xl font-bold text-white transition-all flex items-center justify-center ${
              inputPrompt.trim()
                ? 'bg-black hover:bg-zinc-800 shadow-md shadow-black/20 scale-100'
                : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
            }`}
            title="Send to Atlas Gemini"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Clean Quick Launch Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mt-6 text-xs">
          <button
            onClick={() => setActiveTab('projects')}
            className="bg-white hover:bg-zinc-50 text-zinc-800 border border-zinc-200/90 px-4 py-2 rounded-2xl font-bold shadow-2xs transition flex items-center space-x-2"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-zinc-900" />
            <span>Roadmap Calendar</span>
          </button>

          <button
            onClick={() => setActiveTab('learn')}
            className="bg-white hover:bg-zinc-50 text-zinc-800 border border-zinc-200/90 px-4 py-2 rounded-2xl font-bold shadow-2xs transition flex items-center space-x-2"
          >
            <BookOpen className="w-3.5 h-3.5 text-zinc-900" />
            <span>Learning Guides ({docs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('progress')}
            className="bg-white hover:bg-zinc-50 text-zinc-800 border border-zinc-200/90 px-4 py-2 rounded-2xl font-bold shadow-2xs transition flex items-center space-x-2"
          >
            <TrendingUp className="w-3.5 h-3.5 text-zinc-900" />
            <span>Velocity</span>
          </button>
        </div>

      </div>
    );
  }

  // 2. ACTIVE CONVERSATION & PLAN PROBING VIEW (Shown dynamically after sending first prompt)
  return (
    <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-2 sm:px-4 animate-fadeIn pb-12">
      
      {/* Top Header Bar */}
      <div className="flex items-center justify-between py-3 mb-3 border-b border-zinc-200/80">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-black flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-black text-zinc-950 tracking-tight flex items-center gap-1.5">
              Atlas Intelligence Chat
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
            </h2>
            <p className="text-[11px] text-zinc-500 font-medium">
              Multi-turn conversational planner for Cam, Liam, and Alex
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={clearChatHistory}
            className="flex items-center space-x-1 text-xs font-bold text-zinc-500 hover:text-zinc-900 bg-white hover:bg-zinc-100 border border-zinc-200 px-3 py-1.5 rounded-xl transition shadow-2xs"
            title="Start a new chat session"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
        </div>
      </div>

      {/* CONVERSATION THREAD STREAM */}
      <div className="flex-1 space-y-6 my-4 min-h-[300px]">
        {chatMessages
          .filter((msg) => msg.sender === 'user' || msg.id !== 'msg-welcome')
          .map((msg) => {
            const isUser = msg.sender === 'user';
            const isCommitted = committedPlanIds.has(msg.id) || msg.plan?.isCommitted;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-2 animate-fadeIn`}
              >
                {/* Message Header Label */}
                <div className="flex items-center space-x-1.5 text-[11px] font-bold text-zinc-400 px-1">
                  {isUser ? (
                    <>
                      <span>{msg.user || currentUser}</span>
                      <span>&bull;</span>
                      <span>{msg.timestamp}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-zinc-900 font-black flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Atlas Gemini
                      </span>
                      <span>&bull;</span>
                      <span>{msg.timestamp}</span>
                    </>
                  )}
                </div>

                {/* Message Bubble Body */}
                {isUser ? (
                  <div className="bg-black text-white px-5 py-3.5 rounded-3xl rounded-tr-sm shadow-md max-w-xl text-sm font-semibold leading-relaxed">
                    {msg.text}
                  </div>
                ) : (
                  <div className="bg-white/95 backdrop-blur-2xl border border-zinc-200/90 text-zinc-900 p-5 sm:p-6 rounded-3xl rounded-tl-sm shadow-[0_10px_35px_rgba(0,0,0,0.05)] w-full max-w-3xl space-y-4">
                    <p className="text-sm font-medium text-zinc-800 leading-relaxed">
                      {msg.text}
                    </p>

                    {/* EMBEDDED INTERACTIVE PLAN DRAFT */}
                    {msg.plan && (
                      <div className="mt-4 pt-4 border-t border-zinc-200/90 space-y-4">
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="p-1 rounded-lg bg-zinc-100 text-zinc-900 font-bold text-xs">
                              <Layers className="w-3.5 h-3.5" />
                            </span>
                            <span className="text-xs font-black text-zinc-950 uppercase tracking-wider">
                              Plan: {msg.plan.promptTitle}
                            </span>
                          </div>

                          {isCommitted ? (
                            <span className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-extrabold px-3 py-1 rounded-full flex items-center gap-1 shadow-2xs">
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Committed to Calendar</span>
                            </span>
                          ) : (
                            <span className="text-[11px] bg-zinc-100 text-zinc-800 border border-zinc-200 font-extrabold px-2.5 py-1 rounded-full">
                              Draft ({msg.plan.tasks.length} Phases)
                            </span>
                          )}
                        </div>

                        {/* Phase Cards */}
                        <div className="space-y-3">
                          {msg.plan.tasks.map((task, pIdx) => {
                            const doc = msg.plan?.docs[pIdx];
                            return (
                              <div
                                key={task.id}
                                className="bg-white rounded-2xl p-4 border border-zinc-200 shadow-2xs space-y-2.5"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                                  <div className="flex items-center space-x-2">
                                    <span
                                      className={`px-2 py-0.5 rounded-md text-[10px] font-black text-white ${
                                        task.assignee === 'Cam'
                                          ? 'bg-black'
                                          : task.assignee === 'Liam'
                                          ? 'bg-zinc-800'
                                          : 'bg-zinc-700'
                                      }`}
                                    >
                                      {task.assignee}
                                    </span>
                                    <h4 className="text-xs sm:text-sm font-black text-zinc-950">
                                      {task.title}
                                    </h4>
                                  </div>

                                  <span className="text-[11px] text-zinc-400 font-mono font-medium">
                                    {task.startDate} &rarr; {task.endDate}
                                  </span>
                                </div>

                                <p className="text-xs text-zinc-600 font-normal">
                                  {task.description}
                                </p>

                                {/* Deliverables Subtask Checklist */}
                                {task.subtasks && task.subtasks.length > 0 && (
                                  <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-100 space-y-1">
                                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">
                                      Key Deliverables:
                                    </span>
                                    <ul className="text-xs text-zinc-800 space-y-1 pl-1">
                                      {task.subtasks.map((st) => (
                                        <li key={st.id} className="flex items-center space-x-2">
                                          <span className="w-1.5 h-1.5 rounded-full bg-black shrink-0" />
                                          <span>{st.title}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Attached Learning Literature Guide Card */}
                                {doc && (
                                  <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200/80 flex items-start justify-between gap-3 text-xs">
                                    <div className="space-y-1 flex-1">
                                      <div className="flex items-center space-x-1.5 text-zinc-950 font-bold">
                                        <BookOpen className="w-3.5 h-3.5 text-zinc-900" />
                                        <span>{doc.title}</span>
                                      </div>
                                      <p className="text-[11px] text-zinc-600 leading-relaxed">
                                        {doc.relevanceExplanation}
                                      </p>
                                    </div>

                                    <button
                                      onClick={() => {
                                        setSelectedDocId(doc.id);
                                        setActiveTab('learn');
                                      }}
                                      className="bg-white hover:bg-zinc-100 text-zinc-900 border border-zinc-200 text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition shadow-2xs shrink-0 flex items-center space-x-1"
                                    >
                                      <span>Read Guide</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}

                              </div>
                            );
                          })}
                        </div>

                        {/* Action Bar */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2">
                          {isCommitted ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setActiveTab('projects')}
                                className="bg-black hover:bg-zinc-800 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm transition flex items-center space-x-1.5"
                              >
                                <LayoutGrid className="w-3.5 h-3.5" />
                                <span>View Calendar Roadmap</span>
                              </button>

                              <button
                                onClick={() => setActiveTab('learn')}
                                className="bg-white hover:bg-zinc-100 text-zinc-900 border border-zinc-300 font-bold px-4 py-2 rounded-xl text-xs shadow-2xs transition flex items-center space-x-1.5"
                              >
                                <BookOpen className="w-3.5 h-3.5 text-zinc-900" />
                                <span>Open Learning Guides</span>
                              </button>
                            </div>
                          ) : (
                            <>
                              <p className="text-[11px] text-zinc-500 font-medium self-center">
                                Satisfied? Launch to Calendar &amp; Docs, or query to refine above.
                              </p>

                              <button
                                onClick={() => handleCommitPlanFromMessage(msg.id, msg.plan!.tasks, msg.plan!.docs)}
                                className="bg-black hover:bg-zinc-800 text-white font-black px-6 py-2.5 rounded-2xl text-xs shadow-md shadow-black/15 flex items-center justify-center space-x-2 transition hover:scale-[1.01]"
                              >
                                <Check className="w-4 h-4 text-emerald-400" />
                                <span>Okay cool, Launch Plan! 🚀</span>
                              </button>
                            </>
                          )}
                        </div>

                      </div>
                    )}

                  </div>
                )}
              </div>
            );
          })}

        {/* Loading Indicator */}
        {isSending && (
          <div className="flex items-start space-x-2 animate-fadeIn">
            <div className="bg-white border border-zinc-200 p-4 rounded-3xl rounded-tl-sm shadow-sm flex items-center space-x-3 text-xs text-zinc-600 font-semibold">
              <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              <span>Atlas Gemini is formulating tasks &amp; learning literature...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Pinned Bottom Liquid Glass Omnibar Input */}
      <div className="sticky bottom-4 z-30 pt-2">
        <form
          onSubmit={handleSendMessage}
          className="bg-white/95 backdrop-blur-2xl rounded-3xl p-2.5 sm:p-3 shadow-[0_15px_40px_rgba(0,0,0,0.08)] border border-zinc-300/90 flex items-center space-x-3 transition-all duration-300 focus-within:shadow-[0_20px_50px_rgba(0,0,0,0.15)] focus-within:border-black"
        >
          <div className="pl-2.5 text-zinc-900">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>

          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="Ask Gemini, probe the plan (e.g. 'Add a billing step for Alex'), or enter a new goal..."
            className="flex-1 bg-transparent text-zinc-950 placeholder-zinc-400 text-sm font-semibold focus:outline-none px-2"
          />

          <button
            type="submit"
            disabled={isSending || !inputPrompt.trim()}
            className={`p-3 rounded-2xl font-bold text-white transition-all flex items-center justify-center ${
              inputPrompt.trim() && !isSending
                ? 'bg-black hover:bg-zinc-800 shadow-md shadow-black/20 scale-100'
                : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
            }`}
            title="Send to Atlas Gemini"
          >
            {isSending ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>

        {/* Floating Quick Jump Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-3 text-xs">
          <button
            onClick={() => setActiveTab('projects')}
            className="bg-white/90 hover:bg-white text-zinc-800 hover:text-black border border-zinc-200 px-3.5 py-1.5 rounded-full font-bold shadow-2xs transition flex items-center space-x-1.5"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-zinc-900" />
            <span>Open Calendar Roadmap ({tasks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('learn')}
            className="bg-white/90 hover:bg-white text-zinc-800 hover:text-black border border-zinc-200 px-3.5 py-1.5 rounded-full font-bold shadow-2xs transition flex items-center space-x-1.5"
          >
            <BookOpen className="w-3.5 h-3.5 text-zinc-900" />
            <span>Open Learning Guides ({docs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('progress')}
            className="bg-white/90 hover:bg-white text-zinc-800 hover:text-black border border-zinc-200 px-3.5 py-1.5 rounded-full font-bold shadow-2xs transition flex items-center space-x-1.5"
          >
            <TrendingUp className="w-3.5 h-3.5 text-zinc-900" />
            <span>Velocity &amp; Progress</span>
          </button>
        </div>
      </div>

    </div>
  );
};
