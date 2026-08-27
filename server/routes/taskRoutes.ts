import { Router, Request, Response, NextFunction } from 'express';
import { taskRepository } from '../db/repositories/taskRepository.js';
import { activityRepository } from '../db/repositories/activityRepository.js';
import { broadcastHelpers } from '../sockets/socketHandler.js';

export const taskRouter = Router();

// GET /api/tasks
taskRouter.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { assignee, assignee_id, status, category, priority, search, startDate, endDate } = req.query;
    const tasks = taskRepository.filterTasks({
      assignee: (assignee || assignee_id) as string,
      status: status as any,
      category: category as string,
      priority: priority as any,
      search: search as string,
      startDate: startDate as string,
      endDate: endDate as string,
    });
    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

// GET /api/tasks/:id
taskRouter.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const task = taskRepository.getById(req.params.id);
    if (!task) {
      res.status(404).json({ error: 'TaskNotFound', message: `Task ${req.params.id} not found.` });
      return;
    }
    res.json(task);
  } catch (err) {
    next(err);
  }
});

// POST /api/tasks
taskRouter.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      id,
      title,
      description,
      assignee_id,
      assigneeId,
      assignee,
      status,
      priority,
      start_date,
      startDate,
      end_date,
      endDate,
      color,
      category,
      tags,
      checklist,
      subtasks,
      doc_id,
      docId,
      userId,
      progress_pct,
      progress,
    } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      res.status(400).json({ error: 'ValidationError', message: 'Task title is required.' });
      return;
    }

    let rawAssignee = assignee_id || assigneeId || assignee || 'user-cam';
    if (['Cam', 'Liam', 'Alex'].includes(rawAssignee)) {
      rawAssignee = `user-${rawAssignee.toLowerCase()}`;
    }

    let effectiveStartDate = start_date || startDate || new Date().toISOString().split('T')[0];
    let effectiveEndDate = end_date || endDate || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0];

    // Normalize inverted dates
    if (effectiveStartDate > effectiveEndDate) {
      const temp = effectiveStartDate;
      effectiveStartDate = effectiveEndDate;
      effectiveEndDate = temp;
    }

    // Map subtasks to checklist if provided
    let effectiveChecklist = checklist || [];
    if (subtasks && Array.isArray(subtasks)) {
      effectiveChecklist = subtasks.map((s: any) => ({
        id: s.id || `sub-${Date.now()}`,
        text: s.title || s.text || '',
        completed: Boolean(s.completed || s.isCompleted),
      }));
    }

    const createdTask = taskRepository.create({
      id,
      title: title.trim(),
      description: description || '',
      assignee_id: rawAssignee,
      status: (status || 'in_progress').toLowerCase().replace(' ', '_') as any,
      priority: (priority || 'medium').toLowerCase() as any,
      start_date: effectiveStartDate,
      end_date: effectiveEndDate,
      progress_pct: progress_pct ?? progress ?? 0,
      color: color || '#6366f1',
      category: category || 'Engineering',
      tags: tags || ['roadmap'],
      checklist: effectiveChecklist,
      doc_id: doc_id || docId || null,
      created_by: userId || 'user-cam',
    });

    const activity = activityRepository.logActivity({
      user_id: userId || 'user-cam',
      action_type: 'task_created',
      target_type: 'task',
      target_id: createdTask.id,
      target_title: createdTask.title,
      details: { status: createdTask.status, priority: createdTask.priority },
    });

    const io = req.app.locals.io || null;
    broadcastHelpers.broadcastTaskCreated(io, createdTask, activity);

    res.status(201).json(createdTask);
  } catch (err) {
    next(err);
  }
});

// Helper for task updates
function handleTaskUpdate(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, user, subtasks, startDate, endDate, progress, docId, assignee, ...rest } = req.body;
    const updates: any = { ...rest };

    if (startDate) updates.start_date = startDate;
    if (endDate) updates.end_date = endDate;
    if (progress !== undefined) updates.progress_pct = progress;
    if (docId !== undefined) updates.doc_id = docId;
    if (assignee) {
      updates.assignee_id = ['Cam', 'Liam', 'Alex'].includes(assignee)
        ? `user-${assignee.toLowerCase()}`
        : assignee;
    }
    if (updates.status) {
      updates.status = updates.status.toLowerCase().replace(' ', '_');
    }
    if (updates.priority) {
      updates.priority = updates.priority.toLowerCase();
    }
    if (subtasks && Array.isArray(subtasks)) {
      updates.checklist = subtasks.map((s: any) => ({
        id: s.id || `sub-${Date.now()}`,
        text: s.title || s.text || '',
        completed: Boolean(s.completed || s.isCompleted),
      }));
    }

    if (updates.start_date && updates.end_date && updates.start_date > updates.end_date) {
      const temp = updates.start_date;
      updates.start_date = updates.end_date;
      updates.end_date = temp;
    }

    const updatedTask = taskRepository.update(req.params.id, updates);
    if (!updatedTask) {
      res.status(404).json({ error: 'TaskNotFound', message: `Task ${req.params.id} not found.` });
      return;
    }

    const activeUser = userId || user || 'user-cam';
    const activity = activityRepository.logActivity({
      user_id: activeUser.startsWith('user-') ? activeUser : `user-${activeUser.toLowerCase()}`,
      action_type: 'task_updated',
      target_type: 'task',
      target_id: updatedTask.id,
      target_title: updatedTask.title,
      details: { updates },
    });

    const io = req.app.locals.io || null;
    broadcastHelpers.broadcastTaskUpdated(io, updatedTask, activity);

    res.json(updatedTask);
  } catch (err) {
    next(err);
  }
}

// PUT /api/tasks/:id
taskRouter.put('/:id', handleTaskUpdate);

// PATCH /api/tasks/:id
taskRouter.patch('/:id', handleTaskUpdate);

// POST /api/tasks/:id/move
taskRouter.post('/:id/move', (req: Request, res: Response, next: NextFunction) => {
  try {
    let { status, start_date, end_date, userId } = req.body;

    if (start_date && end_date && start_date > end_date) {
      const temp = start_date;
      start_date = end_date;
      end_date = temp;
    }

    const movedTask = taskRepository.moveTask(req.params.id, { status, start_date, end_date });
    if (!movedTask) {
      res.status(404).json({ error: 'TaskNotFound', message: `Task ${req.params.id} not found.` });
      return;
    }

    const activity = activityRepository.logActivity({
      user_id: userId || 'user-cam',
      action_type: 'task_moved',
      target_type: 'task',
      target_id: movedTask.id,
      target_title: movedTask.title,
      details: { status: movedTask.status, start_date: movedTask.start_date, end_date: movedTask.end_date },
    });

    const io = req.app.locals.io || null;
    broadcastHelpers.broadcastTaskMoved(io, movedTask, activity);

    res.json(movedTask);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/tasks/:id
taskRouter.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.body || {};
    const task = taskRepository.getById(req.params.id);
    const taskTitle = task ? task.title : `Task ${req.params.id}`;

    const deleted = taskRepository.delete(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'TaskNotFound', message: `Task ${req.params.id} not found.` });
      return;
    }

    const activity = activityRepository.logActivity({
      user_id: userId || 'user-cam',
      action_type: 'task_deleted',
      target_type: 'task',
      target_id: req.params.id,
      target_title: taskTitle,
      details: { taskId: req.params.id },
    });

    const io = req.app.locals.io || null;
    broadcastHelpers.broadcastTaskDeleted(io, req.params.id, activity);

    res.json({ success: true, id: req.params.id });
  } catch (err) {
    next(err);
  }
});

export default taskRouter;
