import { Router, Request, Response, NextFunction } from 'express';
import { userRepository } from '../db/repositories/userRepository.js';
import { activityRepository } from '../db/repositories/activityRepository.js';
import { broadcastHelpers } from '../sockets/socketHandler.js';

export const userRouter = Router();

// GET /api/users
userRouter.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = userRepository.getAll();
    res.json(users);
  } catch (err) {
    next(err);
  }
});

// GET /api/users/:id
userRouter.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = userRepository.getById(req.params.id);
    if (!user) {
      res.status(404).json({ error: 'UserNotFound', message: `User with id ${req.params.id} not found.` });
      return;
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/users/:id/status
userRouter.patch('/:id/status', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, statusMessage, status_message } = req.body;
    const msg = statusMessage !== undefined ? statusMessage : status_message;

    if (!status || !['Online', 'Focused', 'Away'].includes(status)) {
      res.status(400).json({ error: 'InvalidStatus', message: 'Status must be Online, Focused, or Away.' });
      return;
    }

    const updatedUser = userRepository.updateStatus(req.params.id, status, msg);
    if (!updatedUser) {
      res.status(404).json({ error: 'UserNotFound', message: `User with id ${req.params.id} not found.` });
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

    const io = req.app.locals.io || null;
    broadcastHelpers.broadcastUserStatusChanged(io, updatedUser);
    broadcastHelpers.broadcastActivity(io, activity);

    res.json(updatedUser);
  } catch (err) {
    next(err);
  }
});

export default userRouter;
