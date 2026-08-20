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
      status,
      priority,
      start_date,
      end_date,
      color,
      category,
      tags,
      checklist,
      doc_id,
      userId,
      progress_pct,
    } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      res.status(400).json({ error: 'ValidationError', message: 'Task title is required.' });
      return;
    }

    let effectiveStartDate = start_date || new Date().toISOString().split('T')[0];
    let effectiveEndDate = end_date || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0];

    // Normalize inverted dates
    if (effectiveStartDate > effectiveEndDate) {
      const temp = effectiveStartDate;
      effectiveStartDate = effectiveEndDate;
      effectiveEndDate = temp;
    }

    const createdTask = taskRepository.create({
      id,
      title: title.trim(),
      description: description || '',
      assignee_id: assignee_id || assigneeId || 'user-cam',
      status: status || 'backlog',
      priority: priority || 'medium',
      start_date: effectiveStartDate,
      end_date: effectiveEndDate,
      progress_pct: progress_pct ?? 0,
      color: color || '#10b981',
      category: category || 'Engineering',
      tags: tags || [],
      checklist: checklist || [],
      doc_id: doc_id || null,
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

// PATCH /api/tasks/:id
taskRouter.patch('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, ...updates } = req.body;

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

    const activity = activityRepository.logActivity({
      user_id: userId || 'user-cam',
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
});

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
