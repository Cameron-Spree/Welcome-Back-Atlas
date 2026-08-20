import React, { useState } from 'react';
import { Task, UserRole, TaskStatus, TaskPriority } from '../../types';
import { X, Calendar, User, Tag, CheckSquare, BookOpen, Trash2, Save, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface Props {
  task: Task;
  onClose: () => void;
}

export const ProjectDetailOverlay: React.FC<Props> = ({ task, onClose }) => {
  const { updateTask, deleteTask, setActiveTab, setSelectedDocId, docs } = useApp();
  const [editedTask, setEditedTask] = useState<Task>({ ...task });
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

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

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 lg:p-8 space-y-6 shadow-2xl relative">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2">
            <span className="text-xs bg-indigo-500/10 text-indigo-400 font-bold px-2.5 py-1 rounded border border-indigo-500/20">
              Project Details Overlay
            </span>
            <span className="text-xs text-slate-500">ID: {task.id}</span>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Task Title & Description Input */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Project / Task Title</label>
            <input
              type="text"
              value={editedTask.title}
              onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-bold text-lg mt-1 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Description</label>
            <textarea
              rows={3}
              value={editedTask.description}
              onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm mt-1 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Grid Properties: Assignee, Status, Dates, Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
          
          <div>
            <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mb-1">
              <User className="w-3 h-3 text-indigo-400" /> Assignee
            </label>
            <select
              value={editedTask.assignee}
              onChange={(e) => setEditedTask({ ...editedTask, assignee: e.target.value as UserRole })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
            >
              <option value="Cam">Cam</option>
              <option value="Liam">Liam</option>
              <option value="Alex">Alex</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mb-1">
              <Tag className="w-3 h-3 text-indigo-400" /> Status
            </label>
            <select
              value={editedTask.status}
              onChange={(e) => setEditedTask({ ...editedTask, status: e.target.value as TaskStatus })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
            >
              <option value="Backlog">Backlog</option>
              <option value="In Progress">In Progress</option>
              <option value="In Review">In Review</option>
              <option value="Done">Done</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mb-1">
              <Calendar className="w-3 h-3 text-indigo-400" /> Start Date
            </label>
            <input
              type="date"
              value={editedTask.startDate}
              onChange={(e) => setEditedTask({ ...editedTask, startDate: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mb-1">
              <Calendar className="w-3 h-3 text-indigo-400" /> End Date
            </label>
            <input
              type="date"
              value={editedTask.endDate}
              onChange={(e) => setEditedTask({ ...editedTask, endDate: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
            />
          </div>

        </div>

        {/* Subtasks / Checklist */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <CheckSquare className="w-4 h-4 text-cyan-400" />
            <span>Task Deliverables & Subtasks</span>
          </h4>

          <div className="space-y-2">
            {(editedTask.subtasks || []).map((sub) => (
              <div
                key={sub.id}
                onClick={() => toggleSubtask(sub.id)}
                className="flex items-center space-x-3 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60 cursor-pointer hover:bg-slate-950 transition text-xs"
              >
                <input
                  type="checkbox"
                  checked={sub.completed}
                  onChange={() => toggleSubtask(sub.id)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                />
                <span className={`flex-1 ${sub.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
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
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
            <button
              onClick={addSubtask}
              className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-xl text-xs font-semibold"
            >
              Add
            </button>
          </div>
        </div>

        {/* Direct Link to Learn Documentation */}
        {matchingDoc && (
          <div className="bg-indigo-950/50 border border-indigo-500/30 rounded-2xl p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-indigo-300">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Attached Learning Guide</span>
              </div>
              <p className="text-xs text-indigo-200 font-semibold">{matchingDoc.title}</p>
            </div>
            <button
              onClick={() => {
                setSelectedDocId(matchingDoc.id);
                setActiveTab('learn');
                onClose();
              }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 transition"
            >
              Open in Learn Tab
            </button>
          </div>
        )}

        {/* Action Buttons: Save & Delete */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
          <button
            onClick={handleDelete}
            className="flex items-center space-x-1.5 text-rose-400 hover:text-rose-300 text-xs font-semibold px-3 py-2 rounded-xl hover:bg-rose-500/10 transition"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Project</span>
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/20 transition"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
