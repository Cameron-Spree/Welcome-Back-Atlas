import { Server, Socket } from 'socket.io';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  TaskItem,
  LearningDoc,
  ActivityLogItem,
  UserProfile,
} from './socketEvents.js';
import { userRepository } from '../db/repositories/userRepository.js';
import { taskRepository } from '../db/repositories/taskRepository.js';
import { docRepository } from '../db/repositories/docRepository.js';
import { activityRepository } from '../db/repositories/activityRepository.js';

export const ATLAS_ROOM = 'atlas-room';

export type AtlasSocketServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export type AtlasSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

let globalIo: AtlasSocketServer | null = null;

// Broadcast helper utilities (callable by REST route controllers and internal services)
export const broadcastHelpers = {
  broadcastUserStatusChanged(io: AtlasSocketServer | null, user: UserProfile) {
    const targetIo = io || globalIo;
    if (!targetIo) return;
    const payload = {
      userId: user.id,
      status: user.status,
      statusMessage: user.status_message || user.statusMessage || '',
      status_message: user.status_message || user.statusMessage || '',
      updatedAt: user.updated_at,
      user,
    };
    targetIo.emit('user:status_changed', payload);
  },

  broadcastTaskCreated(io: AtlasSocketServer | null, task: TaskItem, activity?: ActivityLogItem) {
    const targetIo = io || globalIo;
    if (!targetIo) return;
    targetIo.emit('task:created', { task, activity });
    if (activity) {
      targetIo.emit('activity:new', { activity });
    }
  },

  broadcastTaskUpdated(io: AtlasSocketServer | null, task: TaskItem, activity?: ActivityLogItem) {
    const targetIo = io || globalIo;
    if (!targetIo) return;
    targetIo.emit('task:updated', { task, activity });
    if (activity) {
      targetIo.emit('activity:new', { activity });
    }
  },

  broadcastTaskMoved(io: AtlasSocketServer | null, task: TaskItem, activity?: ActivityLogItem) {
    const targetIo = io || globalIo;
    if (!targetIo) return;
    targetIo.emit('task:moved', { task, activity });
    if (activity) {
      targetIo.emit('activity:new', { activity });
    }
  },

  broadcastTaskDeleted(io: AtlasSocketServer | null, taskId: string, activity?: ActivityLogItem) {
    const targetIo = io || globalIo;
    if (!targetIo) return;
    targetIo.emit('task:deleted', { taskId, activity });
    if (activity) {
      targetIo.emit('activity:new', { activity });
    }
  },

  broadcastDocCreated(io: AtlasSocketServer | null, doc: LearningDoc, activity?: ActivityLogItem) {
    const targetIo = io || globalIo;
    if (!targetIo) return;
    targetIo.emit('doc:created', { doc, activity });
    if (activity) {
      targetIo.emit('activity:new', { activity });
    }
  },

  broadcastDocStepToggled(
    io: AtlasSocketServer | null,
    docId: string,
    stepNumber: number,
    completed: boolean,
    doc?: LearningDoc,
    activity?: ActivityLogItem
  ) {
    const targetIo = io || globalIo;
    if (!targetIo) return;
    targetIo.emit('doc:step_toggled', {
      docId,
      stepNumber,
      completed,
      doc,
      activity,
    });
    if (activity) {
      targetIo.emit('activity:new', { activity });
    }
  },

  broadcastCreditsUpdated(
    io: AtlasSocketServer | null,
    creditBalance: number,
    delta: number,
    reason?: string,
    userId?: string,
    activity?: ActivityLogItem
  ) {
    const targetIo = io || globalIo;
    if (!targetIo) return;
    targetIo.emit('credits:updated', {
      creditBalance,
      delta,
      reason: reason || 'Credits adjusted',
      userId: userId || 'user-cam',
    });
    if (activity) {
      targetIo.emit('activity:new', { activity });
    }
  },

  broadcastActivity(io: AtlasSocketServer | null, activity: ActivityLogItem) {
    const targetIo = io || globalIo;
    if (!targetIo) return;
    targetIo.emit('activity:new', { activity });
  },
};

export function setupSocketHandlers(io: AtlasSocketServer) {
  globalIo = io;

  io.on('connection', (socket: AtlasSocket) => {
    const userId = (socket.handshake.auth?.userId as string) || 'user-cam';
    socket.data.userId = userId;
    socket.data.connectedAt = new Date().toISOString();

    // Automatically join the shared Atlas collaborative room
    socket.join(ATLAS_ROOM);

    // Room join/leave commands
    socket.on('join_room', (room: string) => {
      socket.join(room);
    });

    socket.on('leave_room', (room: string) => {
      socket.leave(room);
    });

    // 1. User Status Update
    socket.on('user:update_status', (payload, callback) => {
      try {
        const { userId, status, statusMessage, status_message } = payload;
        const msg = statusMessage !== undefined ? statusMessage : status_message;
        const updatedUser = userRepository.updateStatus(userId, status, msg);

        if (!updatedUser) {
          callback?.({ success: false, error: 'User not found' });
          return;
        }

        const activity = activityRepository.logActivity({
          user_id: updatedUser.id,
          action_type: 'user_status_changed',
          target_type: 'user',
          target_id: updatedUser.id,
          target_title: updatedUser.name,
          details: { status: updatedUser.status, statusMessage: msg },
        });

        broadcastHelpers.broadcastUserStatusChanged(io, updatedUser);
        broadcastHelpers.broadcastActivity(io, activity);

        callback?.({ success: true, user: updatedUser });
      } catch (err: any) {
        callback?.({ success: false, error: err.message });
      }
    });

    // 2. Task Creation
    socket.on('task:create', (payload, callback) => {
      try {
        const { task, userId } = payload;
        const activeUser = userId || task.created_by || socket.data.userId || 'user-cam';
        const createdTask = taskRepository.create({
          ...task,
          created_by: activeUser,
        });

        const activity = activityRepository.logActivity({
          user_id: activeUser,
          action_type: 'task_created',
          target_type: 'task',
          target_id: createdTask.id,
          target_title: createdTask.title,
          details: { status: createdTask.status, priority: createdTask.priority },
        });

        broadcastHelpers.broadcastTaskCreated(io, createdTask, activity);
        callback?.({ success: true, task: createdTask });
      } catch (err: any) {
        callback?.({ success: false, error: err.message });
      }
    });

    // 3. Task Update
    socket.on('task:update', (payload, callback) => {
      try {
        const { taskId, updates, userId } = payload;
        const activeUser = userId || socket.data.userId || 'user-cam';
        const updatedTask = taskRepository.update(taskId, updates);

        if (!updatedTask) {
          callback?.({ success: false, error: 'Task not found' });
          return;
        }

        const activity = activityRepository.logActivity({
          user_id: activeUser,
          action_type: 'task_updated',
          target_type: 'task',
          target_id: updatedTask.id,
          target_title: updatedTask.title,
          details: { updates },
        });

        broadcastHelpers.broadcastTaskUpdated(io, updatedTask, activity);
        callback?.({ success: true, task: updatedTask });
      } catch (err: any) {
        callback?.({ success: false, error: err.message });
      }
    });

    // 4. Task Move
    socket.on('task:move', (payload, callback) => {
      try {
        const { taskId, status, start_date, end_date, userId } = payload;
        const activeUser = userId || socket.data.userId || 'user-cam';
        const movedTask = taskRepository.moveTask(taskId, { status, start_date, end_date });

        if (!movedTask) {
          callback?.({ success: false, error: 'Task not found' });
          return;
        }

        const activity = activityRepository.logActivity({
          user_id: activeUser,
          action_type: 'task_moved',
          target_type: 'task',
          target_id: movedTask.id,
          target_title: movedTask.title,
          details: { status: movedTask.status, start_date: movedTask.start_date, end_date: movedTask.end_date },
        });

        broadcastHelpers.broadcastTaskMoved(io, movedTask, activity);
        callback?.({ success: true, task: movedTask });
      } catch (err: any) {
        callback?.({ success: false, error: err.message });
      }
    });

    // 5. Task Delete
    socket.on('task:delete', (payload, callback) => {
      try {
        const { taskId, userId } = payload;
        const activeUser = userId || socket.data.userId || 'user-cam';
        const task = taskRepository.getById(taskId);
        const taskTitle = task ? task.title : `Task ${taskId}`;

        const deleted = taskRepository.delete(taskId);
        if (!deleted) {
          callback?.({ success: false, error: 'Task not found or could not be deleted' });
          return;
        }

        const activity = activityRepository.logActivity({
          user_id: activeUser,
          action_type: 'task_deleted',
          target_type: 'task',
          target_id: taskId,
          target_title: taskTitle,
          details: { taskId },
        });

        broadcastHelpers.broadcastTaskDeleted(io, taskId, activity);
        callback?.({ success: true, taskId });
      } catch (err: any) {
        callback?.({ success: false, error: err.message });
      }
    });

    // 6. Doc Step Checklist Toggle
    socket.on('doc:step_toggle', (payload, callback) => {
      try {
        const { docId, stepNumber, completed, userId } = payload;
        const activeUser = userId || socket.data.userId || 'user-cam';
        const updatedDoc = docRepository.toggleStep(docId, stepNumber, completed);

        if (!updatedDoc) {
          callback?.({ success: false, error: 'Document not found' });
          return;
        }

        const step = updatedDoc.steps.find((s) => s.stepNumber === stepNumber);
        const stepTitle = step ? step.title : `Step ${stepNumber}`;

        const activity = activityRepository.logActivity({
          user_id: activeUser,
          action_type: 'doc_step_toggled',
          target_type: 'doc',
          target_id: docId,
          target_title: updatedDoc.title,
          details: { stepNumber, stepTitle, completed },
        });

        broadcastHelpers.broadcastDocStepToggled(io, docId, stepNumber, completed, updatedDoc, activity);
        callback?.({ success: true, doc: updatedDoc });
      } catch (err: any) {
        callback?.({ success: false, error: err.message });
      }
    });
  });
}

export const socketHandler = {
  init(io: AtlasSocketServer) {
    setupSocketHandlers(io);
  },
  broadcast(event: string, payload: any) {
    if (globalIo) {
      globalIo.emit(event as any, payload);
    }
  },
  getIo() {
    return globalIo;
  },
};

export default socketHandler;
