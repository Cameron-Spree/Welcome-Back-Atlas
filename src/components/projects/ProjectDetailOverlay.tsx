import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Task, UserRole, TaskStatus, TaskPriority } from '../../types';
import { X, Calendar, User, Tag, CheckSquare, BookOpen, Trash2, Save, Sparkles, ExternalLink, FileText, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface Props {
  task: Task;
  onClose: () => void;
}

export const ProjectDetailOverlay: React.FC<Props> = ({ task, onClose }) => {
  const { updateTask, deleteTask, setActiveTab, setSelectedDocId, docs, generateAiDoc } = useApp();
  const [editedTask, setEditedTask] = useState<Task>({ ...task });
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);

  const matchingDoc = docs.find((d) => d.taskId === task.id || d.id === task.docId);

  const handleSave = async () => {
    await updateTask(editedTask);
    onClose();
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete "${task.title}"?`)) {
      await deleteTask(task.id);
      onClose();
    }
  };

  const toggleSubtask = (subId: string) => {
    const updatedSub = (editedTask.subtasks || []).map((s) =>
      s.id === subId ? { ...s, completed: !s.completed } : s
    );
    setEditedTask({ ...editedTask, subtasks: updatedSub });
  };

  const addSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    const newSub = { id: `sub-${Date.now()}`, title: newSubtaskTitle.trim(), completed: false };
    setEditedTask({
      ...editedTask,
      subtasks: [...(editedTask.subtasks || []), newSub],
    });
    setNewSubtaskTitle('');
  };

  const handleGenerateDoc = async () => {
    setIsGeneratingDoc(true);
    await generateAiDoc(task.id);
    setIsGeneratingDoc(false);
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 lg:p-6 overflow-y-auto animate-fadeIn">
      <div className="glass-panel-elevated rounded-3xl max-w-3xl lg:max-w-4xl w-full p-6 lg:p-8 space-y-6 shadow-2xl relative border border-white max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200/70 pb-4">
          <div className="flex items-center space-x-2.5">
            <span className="text-xs bg-indigo-50 text-indigo-700 font-extrabold px-3 py-1 rounded-full border border-indigo-200/80">
              Project Inspector &amp; Literature
            </span>
            <span className="text-xs text-slate-400 font-mono">ID: {task.id}</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Task Title & Description Input */}
        <div className="space-y-3.5">
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Project / Task Title</label>
            <input
              type="text"
              value={editedTask.title}
              onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
              className="w-full glass-input rounded-2xl px-4 py-2.5 text-slate-900 font-bold text-base sm:text-lg mt-1 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Project Objective &amp; Details</label>
            <textarea
              rows={2}
              value={editedTask.description}
              onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
              className="w-full glass-input rounded-2xl px-4 py-2 text-slate-700 text-xs sm:text-sm mt-1 focus:outline-none"
            />
          </div>
        </div>

        {/* Grid Properties: Assignee, Status, Dates, Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/60">
          
          <div>
            <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 mb-1 uppercase">
              <User className="w-3 h-3 text-indigo-500" /> Assignee
            </label>
            <select
              value={editedTask.assignee}
              onChange={(e) => setEditedTask({ ...editedTask, assignee: e.target.value as UserRole })}
              className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none"
            >
              <option value="Cam">Cam (Backend)</option>
              <option value="Liam">Liam (Frontend)</option>
              <option value="Alex">Alex (Design/QA)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 mb-1 uppercase">
              <Tag className="w-3 h-3 text-indigo-500" /> Status
            </label>
            <select
              value={editedTask.status}
              onChange={(e) => setEditedTask({ ...editedTask, status: e.target.value as TaskStatus })}
              className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none"
            >
              <option value="Backlog">Backlog</option>
              <option value="In Progress">In Progress</option>
              <option value="In Review">In Review</option>
              <option value="Done">Done</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 mb-1 uppercase">
              <Calendar className="w-3 h-3 text-indigo-500" /> Start Date
            </label>
            <input
              type="date"
              value={editedTask.startDate}
              onChange={(e) => setEditedTask({ ...editedTask, startDate: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-800 font-medium focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 mb-1 uppercase">
              <Calendar className="w-3 h-3 text-indigo-500" /> End Date
            </label>
            <input
              type="date"
              value={editedTask.endDate}
              onChange={(e) => setEditedTask({ ...editedTask, endDate: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-800 font-medium focus:outline-none"
            />
          </div>

        </div>

        {/* Subtasks / Checklist */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <CheckSquare className="w-4 h-4 text-indigo-600" />
            <span>Task Deliverables &amp; Subtasks ({(editedTask.subtasks || []).filter(s => s.completed).length}/{(editedTask.subtasks || []).length})</span>
          </h4>

          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {(editedTask.subtasks || []).map((sub) => (
              <div
                key={sub.id}
                onClick={() => toggleSubtask(sub.id)}
                className="flex items-center space-x-3 bg-white/90 p-2.5 rounded-xl border border-slate-200/70 cursor-pointer hover:bg-white transition text-xs shadow-2xs"
              >
                <input
                  type="checkbox"
                  checked={sub.completed}
                  onChange={() => toggleSubtask(sub.id)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-0 cursor-pointer"
                />
                <span className={`flex-1 ${sub.completed ? 'line-through text-slate-400 font-normal' : 'text-slate-800 font-medium'}`}>
                  {sub.title}
                </span>
              </div>
            ))}
          </div>

          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Add subtask deliverable..."
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
              className="flex-1 glass-input rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
            />
            <button
              onClick={addSubtask}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold transition"
            >
              Add
            </button>
          </div>
        </div>

        {/* Assigned Learning Guide & Literature Card */}
        <div className="bg-gradient-to-br from-indigo-50/90 via-purple-50/70 to-pink-50/60 border border-indigo-200/80 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="p-1 rounded-lg bg-indigo-100 text-indigo-700">
                <BookOpen className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-xs font-extrabold text-indigo-950">
                  Assigned Learning Guide &amp; Literature
                </h4>
                <p className="text-[11px] text-indigo-700">
                  Curated documentation so <strong>{editedTask.assignee}</strong> can read up on what to do.
                </p>
              </div>
            </div>

            {matchingDoc ? (
              <button
                onClick={() => {
                  setSelectedDocId(matchingDoc.id);
                  setActiveTab('learn');
                  onClose();
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm transition flex items-center space-x-1.5 shrink-0"
              >
                <span>Read Guide</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleGenerateDoc}
                disabled={isGeneratingDoc}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm transition flex items-center space-x-1.5 shrink-0 disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isGeneratingDoc ? 'Generating...' : 'Generate Guide'}</span>
              </button>
            )}
          </div>

          {matchingDoc ? (
            <div className="bg-white/90 rounded-xl p-3.5 border border-indigo-100 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">{matchingDoc.title}</span>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-semibold">
                  For {matchingDoc.assignee}
                </span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                {matchingDoc.relevanceExplanation}
              </p>

              {matchingDoc.resources && matchingDoc.resources.length > 0 && (
                <div className="pt-1.5 flex flex-wrap gap-2">
                  {matchingDoc.resources.map((res, rIdx) => (
                    <a
                      key={rIdx}
                      href={res.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1 text-[10px] font-semibold bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 px-2 py-1 rounded-md transition"
                    >
                      <FileText className="w-3 h-3 text-indigo-500" />
                      <span>{res.title}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-[11px] text-slate-500 italic">
              No learning literature attached yet. Click &quot;Generate Guide&quot; to auto-create learning resources for {editedTask.assignee}.
            </p>
          )}
        </div>

        {/* Action Buttons: Save & Delete */}
        <div className="flex items-center justify-between border-t border-slate-200/70 pt-4">
          <button
            onClick={handleDelete}
            className="flex items-center space-x-1.5 text-rose-600 hover:text-rose-700 text-xs font-semibold px-3 py-2 rounded-xl hover:bg-rose-50 transition"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Project</span>
          </button>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={onClose}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md shadow-indigo-500/25 hover:opacity-95 transition"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );

  return typeof document !== 'undefined' ? ReactDOM.createPortal(modalContent, document.body) : null;
};
